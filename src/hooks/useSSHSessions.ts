import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { SSHSessionData } from '@/types/electron'
import type { DecryptedSSHConfig } from '@/types/ssh'
import { sessionStore } from '@/store/session-store'
import '@/types/electron'

export function useSSHSessions() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sessions, setSessions] = useState<SSHSessionData[]>(() => sessionStore.getAllSessions())
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(() => sessionStore.getActiveSessionId())
  const [loading, setLoading] = useState(false)

  // Get all sessions
  const loadSessions = useCallback(async () => {
    if (!window.ipcRenderer?.ssh) return

    try {
      const result = await window.ipcRenderer.ssh.getAllSessions()
      if (result.success && result.sessions) {
        // Sync with global state
        sessionStore.updateSessions(result.sessions)

        // If there's no active session but sessions exist, get the active session
        if (!sessionStore.getActiveSessionId() && result.sessions.length > 0) {
          const activeResult = await window.ipcRenderer.ssh.getActiveSession()
          if (activeResult.success && activeResult.sessionId) {
            sessionStore.setActiveSession(activeResult.sessionId)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load SSH sessions:', error)
    }
  }, [])

  // Create new session
  const createSession = useCallback(async (config: DecryptedSSHConfig): Promise<boolean> => {
    if (!window.ipcRenderer?.ssh) return false

    setLoading(true)
    try {
      const result = await window.ipcRenderer.ssh.createSession(config)
      if (result.success && result.sessionId) {
        // Navigate to the new session's terminal page
        navigate(`/terminal/${result.sessionId}`)
        // Session created successfully, state will be updated by event listener
        return true
      } else {
        console.error('Failed to create SSH session:', result.error)
        return false
      }
    } catch (error) {
      console.error('Failed to create SSH session:', error)
      return false
    } finally {
      setLoading(false)
    }
  }, [navigate])

  // Close session
  const closeSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!window.ipcRenderer?.ssh) return false

    try {
      const result = await window.ipcRenderer.ssh.closeSession(sessionId)
      if (result.success) {
        // If we're closing the current active session, navigate appropriately
        const currentPath = location.pathname
        const isCurrentSession = currentPath === `/terminal/${sessionId}`
        
        if (isCurrentSession) {
          // Find other sessions to switch to
          const otherSessions = sessions.filter(s => s.id !== sessionId)
          if (otherSessions.length > 0) {
            // Switch to the first available session
            navigate(`/terminal/${otherSessions[0].id}`)
          } else {
            // No other sessions, go back to connections
            navigate('/connections')
          }
        }
        
        // Session closed successfully, state will be updated by event listener
        return true
      } else {
        console.error('Failed to close SSH session:', result.error)
        return false
      }
    } catch (error) {
      console.error('Failed to close SSH session:', error)
      return false
    }
  }, [sessions, location, navigate])

  // Switch session
  const switchSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!window.ipcRenderer?.ssh) return false

    // Check if session exists
    const sessionExists = sessions.some(s => s.id === sessionId)
    if (!sessionExists) {
      console.error('Session does not exist:', sessionId)
      return false
    }

    try {
      const result = await window.ipcRenderer.ssh.switchSession(sessionId)
      if (result.success) {
        // Navigate to the terminal page for this session
        navigate(`/terminal/${sessionId}`)
        // Switch successful, state will be updated by event listener
        return true
      } else {
        console.error('Failed to switch SSH session:', result.error)
        return false
      }
    } catch (error) {
      console.error('Failed to switch SSH session:', error)
      return false
    }
  }, [sessions, navigate])

  // Send command to active session
  const sendCommand = useCallback(
    async (command: string): Promise<boolean> => {
      if (!window.ipcRenderer?.ssh || !activeSessionId) return false

      try {
        const result = await window.ipcRenderer.ssh.sendCommand(activeSessionId, command)
        return result.success
      } catch (error) {
        console.error('Failed to send command:', error)
        return false
      }
    },
    [activeSessionId],
  )

  // Resize terminal
  const resizeTerminal = useCallback(
    async (cols: number, rows: number): Promise<boolean> => {
      if (!window.ipcRenderer?.ssh || !activeSessionId) return false

      try {
        const result = await window.ipcRenderer.ssh.resizeSession(activeSessionId, cols, rows)
        return result.success
      } catch (error) {
        console.error('Failed to resize terminal:', error)
        return false
      }
    },
    [activeSessionId],
  )

  // Reconnect session
  const reconnectSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!window.ipcRenderer?.ssh) return false

    try {
      const result = await window.ipcRenderer.ssh.reconnectSession(sessionId)
      if (result.success) {
        // Reconnect successful, state will be updated by event listener
        return true
      } else {
        console.error('Failed to reconnect SSH session:', result.error)
        return false
      }
    } catch (error) {
      console.error('Failed to reconnect SSH session:', error)
      return false
    }
  }, [])

  // Subscribe to global session state
  useEffect(() => {
    const unsubscribe = sessionStore.subscribe((sessions) => {
      setSessions(sessions)
      setActiveSessionId(sessionStore.getActiveSessionId())
    })

    return unsubscribe
  }, [])

  // Listen to main process events and sync with global state
  useEffect(() => {
    if (!window.ipcRenderer) return

    const handleSessionCreated = (_event: unknown, sessionData: SSHSessionData) => {
      sessionStore.updateSession(sessionData)
      // If it's the first session, automatically set it as active
      if (sessionStore.getSessionCount() === 1) {
        sessionStore.setActiveSession(sessionData.id)
      }
    }

    const handleSessionClosed = (_event: unknown, sessionId: string) => {
      sessionStore.removeSession(sessionId)
    }

    const handleActiveSessionChanged = (_event: unknown, sessionId: string) => {
      sessionStore.setActiveSession(sessionId)
    }

    const handleSessionConnected = (_event: unknown, sessionId: string) => {
      const session = sessionStore.getSession(sessionId)
      if (session) {
        sessionStore.updateSession({ ...session, status: 'connected' })
      }
    }

    const handleSessionDisconnected = (_event: unknown, sessionId: string) => {
      const session = sessionStore.getSession(sessionId)
      if (session) {
        sessionStore.updateSession({ ...session, status: 'disconnected' })
      }
    }

    const handleSessionError = (_event: unknown, sessionId: string, error: string) => {
      const session = sessionStore.getSession(sessionId)
      if (session) {
        sessionStore.updateSession({ ...session, status: 'error', error })
      }
    }

    const handleSessionReconnecting = (_event: unknown, sessionId: string, attempt: number, delay: number) => {
      const session = sessionStore.getSession(sessionId)
      if (session) {
        sessionStore.updateSession({
          ...session,
          status: 'connecting',
          error: `Reconnecting (attempt ${attempt}, in ${Math.round(delay / 1000)}s)`,
        })
      }
    }

    // Register event listeners
    window.ipcRenderer.on('ssh-session-created', handleSessionCreated)
    window.ipcRenderer.on('ssh-session-closed', handleSessionClosed)
    window.ipcRenderer.on('ssh-active-session-changed', handleActiveSessionChanged)
    window.ipcRenderer.on('ssh-session-connected', handleSessionConnected)
    window.ipcRenderer.on('ssh-session-disconnected', handleSessionDisconnected)
    window.ipcRenderer.on('ssh-session-error', handleSessionError)
    window.ipcRenderer.on('ssh-session-reconnecting', handleSessionReconnecting)

    // Initial session load
    loadSessions()

    return () => {
      window.ipcRenderer?.off('ssh-session-created', handleSessionCreated)
      window.ipcRenderer?.off('ssh-session-closed', handleSessionClosed)
      window.ipcRenderer?.off('ssh-active-session-changed', handleActiveSessionChanged)
      window.ipcRenderer?.off('ssh-session-connected', handleSessionConnected)
      window.ipcRenderer?.off('ssh-session-disconnected', handleSessionDisconnected)
      window.ipcRenderer?.off('ssh-session-error', handleSessionError)
      window.ipcRenderer?.off('ssh-session-reconnecting', handleSessionReconnecting)
    }
  }, [loadSessions])

  // Get current session ID from URL
  const getCurrentSessionId = useCallback(() => {
    const currentPath = location.pathname
    if (currentPath.startsWith('/terminal/')) {
      return currentPath.split('/terminal/')[1]
    }
    return undefined
  }, [location])

  // Switch to session by index (for Ctrl+1-9 shortcuts)
  const switchToSessionByIndex = useCallback(async (index: number): Promise<boolean> => {
    if (index >= 0 && index < sessions.length) {
      return await switchSession(sessions[index].id)
    }
    return false
  }, [sessions, switchSession])

  // Switch to next session (for Ctrl+Tab)
  const switchToNextSession = useCallback(async (): Promise<boolean> => {
    if (sessions.length <= 1) return false
    const currentSessionId = getCurrentSessionId()
    const currentIndex = sessions.findIndex(s => s.id === currentSessionId)
    if (currentIndex === -1) return false
    const nextIndex = (currentIndex + 1) % sessions.length
    return await switchSession(sessions[nextIndex].id)
  }, [sessions, getCurrentSessionId, switchSession])

  // Switch to previous session (for Ctrl+Shift+Tab)
  const switchToPreviousSession = useCallback(async (): Promise<boolean> => {
    if (sessions.length <= 1) return false
    const currentSessionId = getCurrentSessionId()
    const currentIndex = sessions.findIndex(s => s.id === currentSessionId)
    if (currentIndex === -1) return false
    const prevIndex = currentIndex === 0 ? sessions.length - 1 : currentIndex - 1
    return await switchSession(sessions[prevIndex].id)
  }, [sessions, getCurrentSessionId, switchSession])

  // Close current session (for Ctrl+W)
  const closeCurrentSession = useCallback(async (): Promise<boolean> => {
    const currentSessionId = getCurrentSessionId()
    if (currentSessionId) {
      return await closeSession(currentSessionId)
    }
    return false
  }, [getCurrentSessionId, closeSession])

  // Duplicate current session (for Ctrl+Shift+T)
  const duplicateCurrentSession = useCallback(async (): Promise<boolean> => {
    const currentSessionId = getCurrentSessionId()
    if (currentSessionId) {
      const currentSession = sessions.find(s => s.id === currentSessionId)
      if (currentSession?.configId) {
        // TODO: Implement fetching config by configId for duplication
        console.warn('Duplicate session needs config data, not just configId')
        return false
      }
    }
    return false
  }, [getCurrentSessionId, sessions, createSession])

  return {
    sessions,
    activeSessionId,
    loading,
    createSession,
    closeSession,
    switchSession,
    sendCommand,
    resizeTerminal,
    // Keyboard shortcut helpers
    getCurrentSessionId,
    switchToSessionByIndex,
    switchToNextSession,
    switchToPreviousSession,
    closeCurrentSession,
    duplicateCurrentSession,
    reconnectSession,
    refreshSessions: loadSessions,
  }
}
