import { useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
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
import { getPlatformClasses } from '@/lib/platform'

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()

  // Handle root path redirection for HashRouter
  useEffect(() => {
    // For HashRouter, check both pathname and hash
    if (location.pathname === '/' && (!location.hash || location.hash === '#/')) {
      console.log('Redirecting from root to /connections')
      navigate('/connections', { replace: true })
    }
  }, [location.pathname, location.hash, navigate])

  // Initialize keyboard shortcut manager
  useKeyboardShortcuts()

  // Get SSH session information for global shortcut handling
  const { activeSessionId, closeSession } = useSSHSessions()

  // Global closeSession shortcut handling
  const handleGlobalCloseShortcut = () => {
    if (activeSessionId) {
      // Close current session when there's an active session
      closeSession(activeSessionId)
    } else {
      // Close window when there's no active session
      if (window.electronAPI && typeof window.electronAPI === 'object' && 'closeWindow' in window.electronAPI) {
        (window.electronAPI as any).closeWindow()
      } else {
        // If no closeWindow API, try other methods
        window.close()
      }
    }
  }

  // Register global shortcuts
  useShortcutHandler('closeSession', handleGlobalCloseShortcut, [activeSessionId, closeSession])

  // Initialize global SSH event dispatcher and session state management
  useEffect(() => {
    console.log('🚀 Initializing application, starting SSH event dispatcher')

    sshEventDispatcher.initialize()

    // Add platform-specific classes to document body
    document.body.className = `${document.body.className} ${getPlatformClasses()}`.trim()

    // Clean up on application exit
    return () => {
      console.log('🧹 Application exit, cleaning up global state')
      sshEventDispatcher.cleanup()
      sessionStore.clear()
      terminalPersistenceManager.clear()
    }
  }, [])

  // Determine active tab based on current path (HashRouter compatible)
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
        // Use React Router navigation
        if (tab !== 'terminal') {
          navigate(`/${tab}`)
        }
      }}
    >
      <Routes>
        {/* Remove root path Navigate, handle /connections directly */}
        <Route path="/connections" element={<ConnectionsView />} />
        <Route path="/settings" element={<SettingsView />} />
        <Route path="/stats" element={<StatsView />} />
        <Route path="/about" element={<AboutView />} />
        <Route path="/terminal/:sessionId" element={<TerminalContainer />} />
        <Route path="/terminal" element={<TerminalContainer />} />
        {/* Add a wildcard route as fallback */}
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
