import { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
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

export function PageStatusProvider({ children }) {
  const [pageStatuses, setPageStatuses] = useState({})

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'pageStatus'), (snap) => {
      if (snap.exists()) {
        setPageStatuses(snap.data().pages || {})
      }
    })
    return unsub
  }, [])

  function isPageLive(slug) {
    return pageStatuses[slug] !== 'construction'
  }

  async function updatePageStatus(slug, status) {
    const updated = { ...pageStatuses, [slug]: status }
    await setDoc(doc(db, 'config', 'pageStatus'), { pages: updated }, { merge: true })
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
