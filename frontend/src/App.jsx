import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import AgentFinder from './pages/AgentFinder'
import FSBOFinder from './pages/FSBOFinder'
import LeadScrubbing from './pages/LeadScrubbing'
import Underwriting from './pages/Underwriting'
import LOIGenerator from './pages/LOIGenerator'
import ContractGenerator from './pages/ContractGenerator'
import DirectAgent from './pages/DirectAgent'
import Scripts from './pages/Scripts'
import WebsiteExplainer from './pages/WebsiteExplainer'
import DispoProcess from './pages/DispoProcess'

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

function App() {
  return (
    <AuthProvider>
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
            <Route path="agent-finder" element={<AgentFinder />} />
            <Route path="fsbo-finder" element={<FSBOFinder />} />
            <Route path="lead-scrubbing" element={<LeadScrubbing />} />
            <Route path="underwriting" element={<Underwriting />} />
            <Route path="loi-generator" element={<LOIGenerator />} />
            <Route path="contract-generator" element={<ContractGenerator />} />
            <Route path="direct-agent" element={<DirectAgent />} />
            <Route path="scripts" element={<Scripts />} />
            <Route path="website-explainer" element={<WebsiteExplainer />} />
            <Route path="dispo-process" element={<DispoProcess />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
