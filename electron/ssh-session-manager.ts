import { Client } from 'ssh2'
import { EventEmitter } from 'events'
import type { DecryptedSSHConfig } from '../src/types/ssh'

export interface SSHSession {
  id: string
  name: string
  config: DecryptedSSHConfig
  connection?: Client
  stream?: any
  isActive: boolean
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  error?: string
  createdAt: Date
  lastActivity: Date
}

export interface SSHSessionData {
  id: string
  name: string
  status: SSHSession['status']
  error?: string
  isActive: boolean
  createdAt: Date
  lastActivity: Date
}

/**
 * SSH 会话管理器 - 在主进程中管理所有 SSH 连接和终端会话
 */
export class SSHSessionManager extends EventEmitter {
  private sessions = new Map<string, SSHSession>()
  private activeSessionId?: string

  constructor() {
    super()
  }

  /**
   * 创建新的 SSH 会话
   */
  async createSession(config: DecryptedSSHConfig): Promise<string> {
    const sessionId = `ssh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const sessionName = `${config.username}@${config.host}:${config.port}`

    const session: SSHSession = {
      id: sessionId,
      name: sessionName,
      config,
      isActive: false,
      status: 'connecting',
      createdAt: new Date(),
      lastActivity: new Date(),
    }

    this.sessions.set(sessionId, session)

    // 如果是第一个会话，设置为活跃
    if (this.sessions.size === 1) {
      this.setActiveSession(sessionId)
    }

    // 发出会话创建事件
    this.emit('session-created', this.getSessionData(session))

    // 异步建立连接
    this.connectSession(sessionId).catch((error) => {
      console.error(`Failed to connect session ${sessionId}:`, error)
      session.status = 'error'
      session.error = error.message
      this.emit('session-error', sessionId, error.message)
    })

    return sessionId
  }

  /**
   * 建立 SSH 连接
   */
  private async connectSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    return new Promise((resolve, reject) => {
      const { config } = session
      const conn = new Client()

      const timeout = setTimeout(() => {
        conn.end()
        reject(new Error('连接超时'))
      }, 15000)

      conn.on('ready', () => {
        clearTimeout(timeout)
        session.connection = conn
        session.status = 'connected'
        session.lastActivity = new Date()

        // 创建 shell 会话
        conn.shell((err, stream) => {
          if (err) {
            reject(err)
            return
          }

          // 保存 stream 引用
          session.stream = stream

          // 监听终端数据
          stream.on('data', (data: Buffer) => {
            session.lastActivity = new Date()
            this.emit('session-data', sessionId, data.toString())
          })

          stream.stderr.on('data', (data: Buffer) => {
            session.lastActivity = new Date()
            this.emit('session-data', sessionId, data.toString())
          })

          stream.on('close', () => {
            session.status = 'disconnected'
            this.emit('session-disconnected', sessionId)
          })

          this.emit('session-connected', sessionId)
          resolve()
        })
      })

      conn.on('error', (err) => {
        clearTimeout(timeout)
        session.status = 'error'
        session.error = err.message
        this.emit('session-error', sessionId, err.message)
        reject(err)
      })

      conn.on('close', () => {
        session.status = 'disconnected'
        this.emit('session-disconnected', sessionId)
      })

      // 建立连接
      const connectionConfig: any = {
        host: config.host,
        port: config.port,
        username: config.username,
        readyTimeout: 15000,
        keepaliveInterval: 30000,
      }

      if (config.authType === 'password') {
        connectionConfig.password = config.password
      } else {
        connectionConfig.privateKey = config.privateKey
        if (config.passphrase) {
          connectionConfig.passphrase = config.passphrase
        }
      }

      conn.connect(connectionConfig)
    })
  }

  /**
   * 向指定会话发送命令
   */
  sendCommand(sessionId: string, command: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session || !session.stream || session.status !== 'connected') {
      return false
    }

    session.stream.write(command)
    session.lastActivity = new Date()
    return true
  }

  /**
   * 调整会话终端大小
   */
  resizeSession(sessionId: string, cols: number, rows: number): boolean {
    const session = this.sessions.get(sessionId)
    if (!session || !session.stream || session.status !== 'connected') {
      return false
    }

    session.stream.setWindow(rows, cols)
    return true
  }

  /**
   * 关闭指定会话
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return
    }

    // 关闭连接
    if (session.connection) {
      session.connection.end()
    }

    // 如果这是活跃会话，需要切换到其他会话
    if (this.activeSessionId === sessionId) {
      const remainingSessions = Array.from(this.sessions.keys()).filter(
        (id) => id !== sessionId
      )
      
      if (remainingSessions.length > 0) {
        this.setActiveSession(remainingSessions[0])
      } else {
        this.activeSessionId = undefined
      }
    }

    this.sessions.delete(sessionId)
    this.emit('session-closed', sessionId)
  }

  /**
   * 设置活跃会话
   */
  setActiveSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return false
    }

    // 取消之前的活跃会话
    if (this.activeSessionId) {
      const prevActive = this.sessions.get(this.activeSessionId)
      if (prevActive) {
        prevActive.isActive = false
      }
    }

    // 设置新的活跃会话
    session.isActive = true
    this.activeSessionId = sessionId
    
    this.emit('active-session-changed', sessionId)
    return true
  }

  /**
   * 获取活跃会话ID
   */
  getActiveSessionId(): string | undefined {
    return this.activeSessionId
  }

  /**
   * 获取所有会话的基本信息
   */
  getAllSessions(): SSHSessionData[] {
    return Array.from(this.sessions.values()).map(session => 
      this.getSessionData(session)
    )
  }

  /**
   * 获取指定会话信息
   */
  getSession(sessionId: string): SSHSessionData | undefined {
    const session = this.sessions.get(sessionId)
    return session ? this.getSessionData(session) : undefined
  }

  /**
   * 提取会话的安全数据（不包含敏感信息）
   */
  private getSessionData(session: SSHSession): SSHSessionData {
    return {
      id: session.id,
      name: session.name,
      status: session.status,
      error: session.error,
      isActive: session.isActive,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
    }
  }

  /**
   * 清理所有会话
   */
  cleanup(): void {
    for (const [sessionId] of this.sessions) {
      this.closeSession(sessionId).catch(console.error)
    }
    this.sessions.clear()
    this.activeSessionId = undefined
  }
}