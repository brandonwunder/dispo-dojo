import { FileText, Download } from 'lucide-react'
import { useState } from 'react'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AttachmentPreview({ attachment }) {
  const [lightbox, setLightbox] = useState(false)
  const isImage = attachment.type?.startsWith('image/')

  if (isImage) {
    return (
      <>
        <button
          onClick={() => setLightbox(true)}
          className="max-w-[260px] overflow-hidden rounded-sm border border-[rgba(246,196,69,0.08)] transition-opacity hover:opacity-80"
        >
          <img
            src={attachment.url}
            alt={attachment.name}
            className="w-full rounded-sm"
            loading="lazy"
          />
        </button>
        {lightbox && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setLightbox(false)}
          >
            <img
              src={attachment.url}
              alt={attachment.name}
              className="max-h-[85vh] max-w-[90vw] rounded-sm"
            />
          </div>
        )}
      </>
    )
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-sm border border-[rgba(246,196,69,0.1)] bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.06]"
    >
      <FileText className="h-5 w-5 text-text-dim/40" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-parchment">{attachment.name}</p>
        <p className="text-[10px] text-text-dim/30">{formatSize(attachment.size)}</p>
      </div>
      <Download className="h-3.5 w-3.5 text-text-dim/30" />
    </a>
  )
}
