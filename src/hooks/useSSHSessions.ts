import { useState, useEffect, useCallback } from 'react'
import type { SSHSessionData } from '@/types/electron'
import type { DecryptedSSHConfig } from '@/types/ssh'
import '@/types/electron'

export function useSSHSessions() {
  const [sessions, setSessions] = useState<SSHSessionData[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  // 获取所有会话
  const loadSessions = useCallback(async () => {
    if (!window.ipcRenderer?.ssh) return

    try {
      const result = await window.ipcRenderer.ssh.getAllSessions()
      if (result.success && result.sessions) {
        setSessions(result.sessions)

        // 如果没有活跃会话但有会话存在，获取活跃会话
        if (!activeSessionId && result.sessions.length > 0) {
          const activeResult = await window.ipcRenderer.ssh.getActiveSession()
          if (activeResult.success && activeResult.data?.sessionId) {
            setActiveSessionId(activeResult.data.sessionId)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load SSH sessions:', error)
    }
  }, [activeSessionId])

  // 创建新会话
  const createSession = useCallback(async (config: DecryptedSSHConfig): Promise<boolean> => {
    if (!window.ipcRenderer?.ssh) return false

    setLoading(true)
    try {
      const result = await window.ipcRenderer.ssh.createSession(config)
      if (result.success && result.sessionId) {
        // 会话创建成功，通过事件监听器更新状态
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

  // 关闭会话
  const closeSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!window.ipcRenderer?.ssh) return false

    try {
      const result = await window.ipcRenderer.ssh.closeSession(sessionId)
      if (result.success) {
        // 会话关闭成功，通过事件监听器更新状态
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

  // 切换会话
  const switchSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!window.ipcRenderer?.ssh) return false

    try {
      const result = await window.ipcRenderer.ssh.switchSession(sessionId)
      if (result.success) {
        // 切换成功，通过事件监听器更新状态
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

  // 发送命令到活跃会话
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
    [activeSessionId]
  )

  // 调整终端大小
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
    [activeSessionId]
  )

  // 重连会话
  const reconnectSession = useCallback(async (sessionId: string): Promise<boolean> => {
    if (!window.ipcRenderer?.ssh) return false

    try {
      const result = await window.ipcRenderer.ssh.reconnectSession(sessionId)
      if (result.success) {
        // 重连成功，通过事件监听器更新状态
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

  // 监听主进程事件
  useEffect(() => {
    if (!window.ipcRenderer) return

    const handleSessionCreated = (_event: unknown, sessionData: SSHSessionData) => {
      setSessions((prev) => [...prev, sessionData])

      // 如果是第一个会话，自动设为活跃
      if (!activeSessionId) {
        setActiveSessionId(sessionData.id)
      }
    }

    const handleSessionClosed = (_event: unknown, sessionId: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))

      // 如果关闭的是活跃会话，清空活跃状态
      if (activeSessionId === sessionId) {
        setActiveSessionId(undefined)
      }
    }

    const handleActiveSessionChanged = (_event: unknown, sessionId: string) => {
      setActiveSessionId(sessionId)
      setSessions((prev) =>
        prev.map((session) => ({
          ...session,
          isActive: session.id === sessionId,
        }))
      )
    }

    const handleSessionConnected = (_event: unknown, sessionId: string) => {
      console.log('handleSessionConnected', sessionId)
      setSessions((prev) => prev.map((session) => (session.id === sessionId ? { ...session, status: 'connected' as const } : session)))
    }

    const handleSessionDisconnected = (_event: unknown, sessionId: string) => {
      setSessions((prev) => prev.map((session) => (session.id === sessionId ? { ...session, status: 'disconnected' as const } : session)))
    }

    const handleSessionError = (_event: unknown, sessionId: string, error: string) => {
      setSessions((prev) => prev.map((session) => (session.id === sessionId ? { ...session, status: 'error' as const, error } : session)))
    }

    const handleSessionReconnecting = (_event: unknown, sessionId: string, attempt: number, delay: number) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                status: 'connecting' as const,
                error: `重连中 (第${attempt}次尝试，${Math.round(delay / 1000)}s后)`,
              }
            : session
        )
      )
    }

    // 注册事件监听器
    window.ipcRenderer.on('ssh-session-created', handleSessionCreated)
    window.ipcRenderer.on('ssh-session-closed', handleSessionClosed)
    window.ipcRenderer.on('ssh-active-session-changed', handleActiveSessionChanged)
    window.ipcRenderer.on('ssh-session-connected', handleSessionConnected)
    window.ipcRenderer.on('ssh-session-disconnected', handleSessionDisconnected)
    window.ipcRenderer.on('ssh-session-error', handleSessionError)
    window.ipcRenderer.on('ssh-session-reconnecting', handleSessionReconnecting)

    // 初始加载会话
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
  }, [activeSessionId, loadSessions])

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
