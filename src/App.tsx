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
import { useKeyboardShortcuts, useShortcutHandler } from '@/hooks/useKeyboardShortcuts'
import { useSSHSessions } from '@/hooks/useSSHSessions'

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()

  // 处理根路径重定向
  useEffect(() => {
    if (location.pathname === '/') {
      console.log('Redirecting from / to /connections')
      navigate('/connections', { replace: true })
    }
  }, [location.pathname, navigate])

  // 初始化键盘快捷键管理器
  useKeyboardShortcuts()

  // 获取SSH会话信息用于全局快捷键处理
  const { activeSessionId, closeSession } = useSSHSessions()

  // 全局 closeSession 快捷键处理
  const handleGlobalCloseShortcut = () => {
    if (activeSessionId) {
      // 有活跃会话时关闭当前会话
      closeSession(activeSessionId)
    } else {
      // 没有活跃会话时关闭窗口
      if (window.electronAPI && typeof window.electronAPI === 'object' && 'closeWindow' in window.electronAPI) {
        ;(window.electronAPI as any).closeWindow()
      } else {
        // 如果没有closeWindow API，尝试其他方式
        window.close()
      }
    }
  }

  // 注册全局快捷键
  useShortcutHandler('closeSession', handleGlobalCloseShortcut, [activeSessionId, closeSession])

  // 初始化全局SSH事件分发器和会话状态管理
  useEffect(() => {
    console.log('🚀 初始化应用，启动SSH事件分发器')

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
        {/* 移除根路径的 Navigate，直接处理 /connections */}
        <Route path="/connections" element={<ConnectionsView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/stats" element={<StatsView />} />
        <Route path="/about" element={<AboutView />} />
        <Route path="/terminal/:sessionId" element={<TerminalContainer />} />
        <Route path="/terminal" element={<TerminalContainer />} />
        {/* 添加一个通配符路由作为后备 */}
        <Route path="*" element={<Navigate to="/connections" replace />} />
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
