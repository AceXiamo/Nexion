import { SSHSessionData } from '@/types/electron'

/**
 * Global session state manager
 * Solves session history loss issue by maintaining session state in memory
 */
class SessionStore {
  private static instance: SessionStore
  private sessions = new Map<string, SSHSessionData>()
  private listeners: Set<(sessions: SSHSessionData[]) => void> = new Set()
  private activeSessionId: string | undefined

  private constructor() {}

  static getInstance(): SessionStore {
    if (!this.instance) {
      this.instance = new SessionStore()
    }
    return this.instance
  }

  /**
   * Subscribe to session state changes
   */
  subscribe(listener: (sessions: SSHSessionData[]) => void): () => void {
    this.listeners.add(listener)

    // Immediately trigger callback once, passing current state
    listener(this.getAllSessions())

    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    const sessions = this.getAllSessions()
    this.listeners.forEach((listener) => {
      try {
        listener(sessions)
      } catch (error) {
        console.error('SessionStore listener error:', error)
      }
    })
  }

  /**
   * Add or update session
   */
  updateSession(sessionData: SSHSessionData) {
    console.log('🔄 SessionStore: Updating session', sessionData.id, sessionData.status)
    this.sessions.set(sessionData.id, sessionData)
    this.notifyListeners()
  }

  /**
   * Batch update sessions
   */
  updateSessions(sessions: SSHSessionData[]) {
    console.log('🔄 SessionStore: Batch updating sessions', sessions.length)
    sessions.forEach((session) => {
      this.sessions.set(session.id, session)
    })
    this.notifyListeners()
  }

  /**
   * Remove session
   */
  removeSession(sessionId: string) {
    console.log('🗑️ SessionStore: Removing session', sessionId)
    this.sessions.delete(sessionId)

    // If removing the active session, clear active state
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = undefined
    }

    this.notifyListeners()
  }

  /**
   * Set active session
   */
  setActiveSession(sessionId: string | undefined) {
    console.log('🎯 SessionStore: Setting active session', sessionId)

    // Update active state
    const oldActiveId = this.activeSessionId
    this.activeSessionId = sessionId

    // Update session's isActive state
    this.sessions.forEach((session, id) => {
      if (id === oldActiveId && session.isActive) {
        this.sessions.set(id, { ...session, isActive: false })
      }
      if (id === sessionId) {
        this.sessions.set(id, { ...session, isActive: true })
      }
    })

    this.notifyListeners()
  }

  /**
   * Get active session ID
   */
  getActiveSessionId(): string | undefined {
    return this.activeSessionId
  }

  /**
   * Get all sessions
   */
  getAllSessions(): SSHSessionData[] {
    return Array.from(this.sessions.values()).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  /**
   * Get specified session
   */
  getSession(sessionId: string): SSHSessionData | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Check if session exists
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId)
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size
  }

  /**
   * Get connection status statistics
   */
  getConnectionStats() {
    const sessions = this.getAllSessions()
    return {
      total: sessions.length,
      connected: sessions.filter((s) => s.status === 'connected').length,
      connecting: sessions.filter((s) => s.status === 'connecting').length,
      error: sessions.filter((s) => s.status === 'error').length,
      disconnected: sessions.filter((s) => s.status === 'disconnected').length,
    }
  }

  /**
   * Clear all sessions (called when application exits)
   */
  clear() {
    console.log('🧹 SessionStore: Clearing all sessions')
    this.sessions.clear()
    this.activeSessionId = undefined
    this.notifyListeners()
  }

  /**
   * Debug information
   */
  getDebugInfo() {
    return {
      sessionCount: this.sessions.size,
      activeSessionId: this.activeSessionId,
      listenerCount: this.listeners.size,
      sessionIds: Array.from(this.sessions.keys()),
    }
  }
}

export const sessionStore = SessionStore.getInstance()
export { SessionStore }
