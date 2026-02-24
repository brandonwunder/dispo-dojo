import { useState, useCallback } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../lib/firebase'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export default function useFileUpload(channelId) {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const upload = useCallback(async (file) => {
    if (!file) return null

    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB.`)
      return null
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('File type not supported.')
      return null
    }

    setUploading(true)
    setProgress(0)
    setError(null)

    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storageRef = ref(storage, `community/${channelId}/${timestamp}-${safeName}`)

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100))
        },
        (err) => {
          setError('Upload failed')
          setUploading(false)
          console.error('Upload error:', err)
          reject(err)
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          const attachment = {
            url,
            name: file.name,
            type: file.type,
            size: file.size,
          }
          setUploading(false)
          setProgress(100)
          resolve(attachment)
        },
      )
    })
  }, [channelId])

  const clearError = useCallback(() => setError(null), [])

  return { upload, progress, uploading, error, clearError }
}
