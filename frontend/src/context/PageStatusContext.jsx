import { createContext, useContext, useEffect, useState } from 'react'
import { doc, getDoc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const PageStatusContext = createContext({ pageStatuses: {}, isPageLive: () => true, updatePageStatus: async () => {} })

// All toggleable pages with display names
export const TOGGLEABLE_PAGES = [
  { slug: 'lead-scrubbing', label: 'Finding Leads' },
  { slug: 'agent-finder', label: 'Find Agent Emails' },
  { slug: 'loi-sender', label: 'LOI Sender' },
  { slug: 'bird-dog', label: 'Bird Dogging' },
  { slug: 'website-explainer', label: 'Subject-To Explainer' },
  { slug: 'offer-comparison', label: 'Offer Comparison' },
  { slug: 'underwriting', label: 'Free Underwriting' },
  { slug: 'contract-generator', label: 'Contract Generator' },
  { slug: 'find-buyers', label: 'Find Buyers' },
  { slug: 'buy-boxes', label: 'Buy Boxes' },
  { slug: 'boots-on-ground', label: 'Boots on Ground' },
  { slug: 'live-deals', label: 'Active Deals' },
  { slug: 'scripts', label: 'Scripts & Objections' },
  { slug: 'direct-agent', label: 'DTA Process' },
  { slug: 'call-recordings', label: 'Call Recordings' },
  { slug: 'community', label: 'Message Board' },
]

const PAGE_STATUS_REF = () => doc(db, 'config', 'pageStatus')

export function PageStatusProvider({ children }) {
  const [pageStatuses, setPageStatuses] = useState({})

  useEffect(() => {
    const unsub = onSnapshot(
      PAGE_STATUS_REF(),
      (snap) => {
        if (snap.exists()) {
          setPageStatuses(snap.data().pages || {})
        } else {
          setPageStatuses({})
        }
      },
      (err) => {
        console.error('[PageStatus] listener error:', err.code, err.message)
      }
    )
    return unsub
  }, [])

  function isPageLive(slug) {
    return pageStatuses[slug] !== 'construction'
  }

  async function updatePageStatus(slug, status) {
    const ref = PAGE_STATUS_REF()
    try {
      const snap = await getDoc(ref)
      if (snap.exists()) {
        await updateDoc(ref, { [`pages.${slug}`]: status })
      } else {
        await setDoc(ref, { pages: { [slug]: status } })
      }
    } catch (err) {
      console.error('[PageStatus] write failed:', err.code, err.message)
    }
  }

  return (
    <PageStatusContext.Provider value={{ pageStatuses, isPageLive, updatePageStatus }}>
      {children}
    </PageStatusContext.Provider>
  )
}

export function usePageStatus() {
  return useContext(PageStatusContext)
}
