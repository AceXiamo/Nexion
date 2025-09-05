import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ConnectionsView } from '@/views/ConnectionsView'
import { SettingsView } from '@/views/SettingsView'
import { StatsView } from '@/views/StatsView'
import { AboutView } from '@/views/AboutView'
import { TerminalContainer } from '@/components/TerminalContainer'
import { sshEventDispatcher } from '@/services/ssh-event-dispatcher'
import { sessionStore } from '@/store/session-store'
import { terminalPersistenceManager } from '@/services/terminal-persistence-manager'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useUserRegistrationStore } from '@/stores/userRegistrationStore'

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // 初始化键盘快捷键管理器
  useKeyboardShortcuts()

  // 初始化全局SSH事件分发器和会话状态管理
  useEffect(() => {
    console.log('🚀 初始化应用，启动SSH事件分发器')
    
    // 应用启动时清理所有store状态，防止缓存污染
    console.log('🧹 应用启动时清理 userRegistrationStore 缓存')
    useUserRegistrationStore.getState().clearRegistrationCache()
    
    sshEventDispatcher.initialize()

    // 应用退出时清理
    return () => {
      console.log('🧹 应用退出，清理全局状态')
      sshEventDispatcher.cleanup()
      sessionStore.clear()
      terminalPersistenceManager.clear()
    }
  }, [])

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
    <Layout
      activeTab={getActiveTab()}
      onTabChange={(tab) => {
        // 使用React Router导航
        if (tab !== 'terminal') {
          navigate(`/${tab}`)
        }
      }}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/connections" replace />} />
        <Route path="/connections" element={<ConnectionsView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/stats" element={<StatsView />} />
        <Route path="/about" element={<AboutView />} />
        <Route path="/terminal/:sessionId" element={<TerminalContainer />} />
        <Route path="/terminal" element={<TerminalContainer />} />
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
