import { Client, ClientChannel } from 'ssh2'
import { EventEmitter } from 'events'
import type { DecryptedSSHConfig } from '../src/types/ssh'

export interface SSHSession {
  id: string
  name: string
  configId: string
  configName: string
  config: DecryptedSSHConfig
  connection?: Client
  stream?: ClientChannel
  isActive: boolean
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  error?: string
  createdAt: Date
  lastActivity: Date
  // 新增字段
  reconnectAttempts: number
  maxReconnectAttempts: number
  connectionTime?: number
  bytesTransferred: number
}

export interface SSHSessionData {
  id: string
  name: string
  configId: string
  configName: string
  status: SSHSession['status']
  error?: string
  isActive: boolean
  createdAt: Date
  lastActivity: Date
  reconnectAttempts: number
  connectionTime?: number
  bytesTransferred: number
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
   * 生成唯一的会话ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `ssh_${timestamp}_${random}`
  }

  /**
   * 生成智能会话名称
   * 同一配置的多个会话会自动编号：Config-1, Config-2, Config-3...
   */
  private generateSessionName(config: DecryptedSSHConfig): string {
    const existingSessions = Array.from(this.sessions.values())
      .filter(session => session.configId === config.id)
    
    const sessionCount = existingSessions.length + 1
    return `${config.name}-${sessionCount}`
  }

  /**
   * 创建新的 SSH 会话
   */
  async createSession(config: DecryptedSSHConfig): Promise<string> {
    const sessionId = this.generateSessionId()
    const sessionName = this.generateSessionName(config)

    const session: SSHSession = {
      id: sessionId,
      name: sessionName,
      configId: config.id,
      configName: config.name,
      config,
      isActive: false,
      status: 'connecting',
      createdAt: new Date(),
      lastActivity: new Date(),
      reconnectAttempts: 0,
      maxReconnectAttempts: 3,
      bytesTransferred: 0,
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
      const startTime = Date.now()

      const timeout = setTimeout(() => {
        conn.end()
        session.status = 'error'
        session.error = '连接超时'
        this.emit('session-error', sessionId, '连接超时')
        reject(new Error('连接超时'))
      }, 15000)

      conn.on('ready', () => {
        clearTimeout(timeout)
        session.connection = conn
        session.status = 'connected'
        session.lastActivity = new Date()
        session.connectionTime = Date.now() - startTime
        session.reconnectAttempts = 0 // 重置重连计数

        // 创建 shell 会话
        conn.shell((err: Error | undefined, stream: ClientChannel) => {
          if (err) {
            reject(err)
            return
          }

          // 保存 stream 引用
          session.stream = stream

          // 监听终端数据
          stream.on('data', (data: Buffer) => {
            session.lastActivity = new Date()
            session.bytesTransferred += data.length
            this.emit('session-data', sessionId, data.toString())
          })

          stream.stderr.on('data', (data: Buffer) => {
            session.lastActivity = new Date()
            session.bytesTransferred += data.length
            this.emit('session-data', sessionId, data.toString())
          })

          stream.on('close', () => {
            session.status = 'disconnected'
            this.emit('session-disconnected', sessionId)
            
            // 尝试自动重连（如果在重连次数限制内）
            if (session.reconnectAttempts < session.maxReconnectAttempts) {
              this.scheduleReconnect(sessionId)
            }
          })

          console.log('session-connected', sessionId)
          this.emit('session-connected', sessionId)
          resolve()
        })
      })

      conn.on('error', (err: Error) => {
        clearTimeout(timeout)
        session.status = 'error'
        session.error = this.categorizeError(err)
        this.emit('session-error', sessionId, session.error)
        
        // 根据错误类型决定是否重连
        if (this.shouldRetryConnection(err) && session.reconnectAttempts < session.maxReconnectAttempts) {
          this.scheduleReconnect(sessionId)
        }
        
        reject(err)
      })

      conn.on('close', () => {
        // 如果不是主动关闭，尝试重连
        if (session.status !== 'disconnected') {
          session.status = 'disconnected'
          this.emit('session-disconnected', sessionId)
          
          if (session.reconnectAttempts < session.maxReconnectAttempts) {
            this.scheduleReconnect(sessionId)
          }
        }
      })

      // 建立连接
      const connectionConfig: Record<string, unknown> = {
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
    session.bytesTransferred += Buffer.byteLength(command, 'utf8')
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

    session.stream.setWindow(rows, cols, 0, 0)
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
      configId: session.configId,
      configName: session.configName,
      status: session.status,
      error: session.error,
      isActive: session.isActive,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      reconnectAttempts: session.reconnectAttempts,
      connectionTime: session.connectionTime,
      bytesTransferred: session.bytesTransferred,
    }
  }

  /**
   * 计划重连
   */
  private scheduleReconnect(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.reconnectAttempts++
    session.status = 'connecting'
    
    // 指数退避算法：1s, 2s, 4s, 8s...
    const delay = Math.min(1000 * Math.pow(2, session.reconnectAttempts - 1), 10000)
    
    this.emit('session-reconnecting', sessionId, session.reconnectAttempts, delay)
    
    setTimeout(() => {
      this.connectSession(sessionId).catch((error) => {
        console.error(`Reconnect attempt ${session.reconnectAttempts} failed for session ${sessionId}:`, error)
        
        // 如果达到最大重连次数，标记为错误状态
        if (session.reconnectAttempts >= session.maxReconnectAttempts) {
          session.status = 'error'
          session.error = `重连失败 (已尝试 ${session.maxReconnectAttempts} 次)`
          this.emit('session-error', sessionId, session.error)
        }
      })
    }, delay)
  }

  /**
   * 分类错误信息
   */
  private categorizeError(error: Error): string {
    const message = error.message || error.toString()
    
    if (message.includes('ENOTFOUND') || message.includes('getaddrinfo')) {
      return '主机名解析失败，请检查网络连接和主机地址'
    }
    
    if (message.includes('ECONNREFUSED')) {
      return '连接被拒绝，请检查端口是否正确或服务是否运行'
    }
    
    if (message.includes('ETIMEDOUT')) {
      return '连接超时，请检查网络连接'
    }
    
    if (message.includes('Authentication')) {
      return '认证失败，请检查用户名、密码或密钥'
    }
    
    if (message.includes('Permission denied')) {
      return '权限被拒绝，请检查用户权限'
    }
    
    if (message.includes('Host key verification failed')) {
      return '主机密钥验证失败，可能是安全风险'
    }
    
    // 默认返回原始错误信息
    return message
  }

  /**
   * 判断是否应该重试连接
   */
  private shouldRetryConnection(error: Error): boolean {
    const message = error.message || error.toString()
    
    // 不重试的错误类型
    const nonRetryableErrors = [
      'Authentication',
      'Permission denied',
      'Host key verification failed',
      'EACCES', // 权限错误
    ]
    
    return !nonRetryableErrors.some(errorType => message.includes(errorType))
  }

  /**
   * 手动重连会话
   */
  async reconnectSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    // 关闭现有连接
    if (session.connection) {
      session.connection.end()
    }

    // 重置状态
    session.reconnectAttempts = 0
    session.status = 'connecting'
    session.error = undefined

    // 重新连接
    await this.connectSession(sessionId)
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
