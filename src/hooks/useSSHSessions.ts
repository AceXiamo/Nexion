import { useState, useEffect, useCallback } from 'react'
import type { SSHSessionData } from '@/types/electron'
import type { DecryptedSSHConfig } from '@/types/ssh'
import { sessionStore } from '@/store/session-store'
import '@/types/electron'

export function useSSHSessions() {
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
  }, [])

  // Close session
  const closeSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!window.ipcRenderer?.ssh) return false

    try {
      const result = await window.ipcRenderer.ssh.closeSession(sessionId)
      if (result.success) {
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
  }, [])

  // Switch session
  const switchSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!window.ipcRenderer?.ssh) return false

    try {
      const result = await window.ipcRenderer.ssh.switchSession(sessionId)
      if (result.success) {
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
  }, [])

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

  return {
    sessions,
    activeSessionId,
    loading,
    createSession,
    closeSession,
    switchSession,
    sendCommand,
    resizeTerminal,
    reconnectSession,
    refreshSessions: loadSessions,
  }
}
