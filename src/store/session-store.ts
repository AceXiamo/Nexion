import { SSHSessionData } from '@/types/electron'

/**
 * 全局会话状态管理器
 * 解决会话历史记录丢失问题，在内存中维护会话状态
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
   * 订阅会话状态变化
   */
  subscribe(listener: (sessions: SSHSessionData[]) => void): () => void {
    this.listeners.add(listener)

    // 立即触发一次回调，传递当前状态
    listener(this.getAllSessions())

    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * 通知所有监听器
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
   * 添加或更新会话
   */
  updateSession(sessionData: SSHSessionData) {
    console.log('🔄 SessionStore: 更新会话', sessionData.id, sessionData.status)
    this.sessions.set(sessionData.id, sessionData)
    this.notifyListeners()
  }

  /**
   * 批量更新会话
   */
  updateSessions(sessions: SSHSessionData[]) {
    console.log('🔄 SessionStore: 批量更新会话', sessions.length)
    sessions.forEach((session) => {
      this.sessions.set(session.id, session)
    })
    this.notifyListeners()
  }

  /**
   * 移除会话
   */
  removeSession(sessionId: string) {
    console.log('🗑️ SessionStore: 删除会话', sessionId)
    this.sessions.delete(sessionId)

    // 如果删除的是活跃会话，清空活跃状态
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = undefined
    }

    this.notifyListeners()
  }

  /**
   * 设置活跃会话
   */
  setActiveSession(sessionId: string | undefined) {
    console.log('🎯 SessionStore: 设置活跃会话', sessionId)

    // 更新活跃状态
    const oldActiveId = this.activeSessionId
    this.activeSessionId = sessionId

    // 更新会话的isActive状态
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
   * 获取活跃会话ID
   */
  getActiveSessionId(): string | undefined {
    return this.activeSessionId
  }

  /**
   * 获取所有会话
   */
  getAllSessions(): SSHSessionData[] {
    return Array.from(this.sessions.values()).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  /**
   * 获取指定会话
   */
  getSession(sessionId: string): SSHSessionData | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * 检查会话是否存在
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId)
  }

  /**
   * 获取会话数量
   */
  getSessionCount(): number {
    return this.sessions.size
  }

  /**
   * 获取连接状态统计
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
   * 清空所有会话（应用退出时调用）
   */
  clear() {
    console.log('🧹 SessionStore: 清空所有会话')
    this.sessions.clear()
    this.activeSessionId = undefined
    this.notifyListeners()
  }

  /**
   * 调试信息
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
