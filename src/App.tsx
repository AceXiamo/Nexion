import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ConnectionsView } from '@/views/ConnectionsView'
import { SettingsView } from '@/views/SettingsView'
import { StatsView } from '@/views/StatsView'
import { AboutView } from '@/views/AboutView'
import { SingleTerminalView } from '@/views/SingleTerminalView'

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // 根据当前路径确定活跃的tab
  const getActiveTab = () => {
    const path = location.pathname
    if (path.startsWith('/terminal/')) return 'terminal'
    if (path.startsWith('/connections')) return 'connections'
    if (path.startsWith('/settings')) return 'settings'
    if (path.startsWith('/stats')) return 'stats'
    if (path.startsWith('/about')) return 'about'
    return 'connections'
  }

  return (
    <Layout activeTab={getActiveTab()} onTabChange={(tab) => {
      // 使用React Router导航
      if (tab !== 'terminal') {
        navigate(`/${tab}`)
      }
    }}>
      <Routes>
        <Route path="/" element={<Navigate to="/connections" replace />} />
        <Route path="/connections" element={<ConnectionsView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/stats" element={<StatsView />} />
        <Route path="/about" element={<AboutView />} />
        <Route path="/terminal/:configId" element={<SingleTerminalView />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
