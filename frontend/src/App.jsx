import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { PageStatusProvider, usePageStatus } from './context/PageStatusContext'
import UnderConstruction from './components/UnderConstruction'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import AgentFinder from './pages/AgentFinder'
import FindBuyers from './pages/FindBuyers'
import Community from './pages/Community'
import NinjaProfile from './pages/NinjaProfile'
import LeadScrubbing from './pages/LeadScrubbing'
import Underwriting from './pages/Underwriting'
import LOISender from './pages/LOISender'
import ContractGenerator from './pages/ContractGenerator'
import DirectAgent from './pages/DirectAgent'
import Scripts from './pages/Scripts'
import WebsiteExplainer from './pages/WebsiteExplainer'
import BirdDog from './pages/BirdDog'
import BootsOnGround from './pages/BootsOnGround'
import OfferComparison from './pages/OfferComparison'
import CallRecordings from './pages/CallRecordings'
import LiveDeals from './pages/LiveDeals'
import BuyBoxes from './pages/BuyBoxes'

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  return children
}

function AdminRoute({ children }) {
  const { isAdmin } = useAuth()
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }
  return children
}

function PageGate({ slug, children }) {
  const { isPageLive } = usePageStatus()
  if (!isPageLive(slug)) {
    return <UnderConstruction />
  }
  return children
}

function App() {
  return (
    <AuthProvider>
      <PageStatusProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="agent-finder" element={<PageGate slug="agent-finder"><AgentFinder /></PageGate>} />
              <Route path="find-buyers" element={<PageGate slug="find-buyers"><FindBuyers /></PageGate>} />
              <Route path="lead-scrubbing" element={<PageGate slug="lead-scrubbing"><LeadScrubbing /></PageGate>} />
              <Route path="underwriting" element={<PageGate slug="underwriting"><Underwriting /></PageGate>} />
              <Route path="loi-sender" element={<PageGate slug="loi-sender"><LOISender /></PageGate>} />
              <Route path="contract-generator" element={<PageGate slug="contract-generator"><ContractGenerator /></PageGate>} />
              <Route path="direct-agent" element={<PageGate slug="direct-agent"><DirectAgent /></PageGate>} />
              <Route path="scripts" element={<PageGate slug="scripts"><Scripts /></PageGate>} />
              <Route path="website-explainer" element={<PageGate slug="website-explainer"><WebsiteExplainer /></PageGate>} />
              <Route path="community" element={<PageGate slug="community"><Community /></PageGate>} />
              <Route path="ninja-profile" element={<NinjaProfile />} />
              <Route path="ninja-profile/:uid" element={<NinjaProfile />} />
              <Route path="community/profile/:uid" element={<Navigate to="/ninja-profile" replace />} />
              <Route path="bird-dog" element={<PageGate slug="bird-dog"><BirdDog /></PageGate>} />
              <Route path="boots-on-ground" element={<PageGate slug="boots-on-ground"><BootsOnGround /></PageGate>} />
              <Route path="offer-comparison" element={<PageGate slug="offer-comparison"><OfferComparison /></PageGate>} />
              <Route path="call-recordings" element={<PageGate slug="call-recordings"><CallRecordings /></PageGate>} />
              <Route path="live-deals" element={<PageGate slug="live-deals"><LiveDeals /></PageGate>} />
              <Route path="buy-boxes" element={<PageGate slug="buy-boxes"><BuyBoxes /></PageGate>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PageStatusProvider>
    </AuthProvider>
  )
}

export default App
