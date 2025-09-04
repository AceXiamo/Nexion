import { Client, ClientChannel, SFTPWrapper } from 'ssh2'
import { EventEmitter } from 'events'
import type { DecryptedSSHConfig } from '../src/types/ssh'
import type { WebContents } from 'electron'
import fs from 'node:fs'
import path from 'node:path'

export interface SSHSession {
  id: string
  name: string
  configId: string
  configName: string
  config: DecryptedSSHConfig
  connection?: Client
  stream?: ClientChannel
  sftp?: SFTPWrapper
  isActive: boolean
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  error?: string
  createdAt: Date
  lastActivity: Date
  // Additional fields
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
 * SSH Session Manager - Manages all SSH connections and terminal sessions in the main process
 */
export class SSHSessionManager extends EventEmitter {
  private sessions = new Map<string, SSHSession>()
  private activeSessionId?: string
  private webContents?: WebContents
  private lastProgressUpdate = new Map<string, number>()
  private readonly PROGRESS_UPDATE_INTERVAL = 1000 // Update every 1000ms

  constructor(webContents?: WebContents) {
    super()
    this.webContents = webContents
    // Increase max listeners to avoid warnings
    this.setMaxListeners(20)
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `ssh_${timestamp}_${random}`
  }

  /**
   * Generate smart session name
   * Multiple sessions from the same config will be automatically numbered: Config-1, Config-2, Config-3...
   */
  private generateSessionName(config: DecryptedSSHConfig): string {
    const existingSessions = Array.from(this.sessions.values()).filter((session) => session.configId === config.id)

    const sessionCount = existingSessions.length + 1
    return `${config.name}-${sessionCount}`
  }

  /**
   * Create new SSH session
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

    // Set as active if it's the first session
    if (this.sessions.size === 1) {
      this.setActiveSession(sessionId)
    }

    // Emit session creation event
    this.emit('session-created', this.getSessionData(session))

    // Establish connection asynchronously
    this.connectSession(sessionId).catch((error) => {
      console.error(`Failed to connect session ${sessionId}:`, error)
      session.status = 'error'
      session.error = error.message
      this.emit('session-error', sessionId, error.message)
    })

    return sessionId
  }

  /**
   * Establish SSH connection
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
        session.error = 'Connection timeout'
        this.emit('session-error', sessionId, 'Connection timeout')
        reject(new Error('Connection timeout'))
      }, 15000)

      conn.on('ready', () => {
        clearTimeout(timeout)
        session.connection = conn
        session.status = 'connected'
        session.lastActivity = new Date()
        session.connectionTime = Date.now() - startTime
        session.reconnectAttempts = 0 // Reset reconnect counter

        // Create shell session
        conn.shell((err: Error | undefined, stream: ClientChannel) => {
          if (err) {
            reject(err)
            return
          }

          // Save stream reference
          session.stream = stream

          // Listen for terminal data
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

            // Attempt automatic reconnection (if within reconnect limit)
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

        // Decide whether to reconnect based on error type
        if (this.shouldRetryConnection(err) && session.reconnectAttempts < session.maxReconnectAttempts) {
          this.scheduleReconnect(sessionId)
        }

        reject(err)
      })

      conn.on('close', () => {
        // If not actively closed, attempt reconnection
        if (session.status !== 'disconnected') {
          session.status = 'disconnected'
          this.emit('session-disconnected', sessionId)

          if (session.reconnectAttempts < session.maxReconnectAttempts) {
            this.scheduleReconnect(sessionId)
          }
        }
      })

      // Establish connection
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
   * Send command to specified session
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
   * Resize session terminal
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
   * Close specified session
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return
    }

    // Close connection
    if (session.connection) {
      session.connection.end()
    }

    // If this is the active session, switch to another session
    if (this.activeSessionId === sessionId) {
      const remainingSessions = Array.from(this.sessions.keys()).filter((id) => id !== sessionId)

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
   * Set active session
   */
  setActiveSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return false
    }

    // Deactivate previous active session
    if (this.activeSessionId) {
      const prevActive = this.sessions.get(this.activeSessionId)
      if (prevActive) {
        prevActive.isActive = false
      }
    }

    // Set new active session
    session.isActive = true
    this.activeSessionId = sessionId

    this.emit('active-session-changed', sessionId)
    return true
  }

  /**
   * Get active session ID
   */
  getActiveSessionId(): string | undefined {
    return this.activeSessionId
  }

  /**
   * Get basic information of all sessions
   */
  getAllSessions(): SSHSessionData[] {
    return Array.from(this.sessions.values()).map((session) => this.getSessionData(session))
  }

  /**
   * Get specified session information
   */
  getSession(sessionId: string): SSHSessionData | undefined {
    const session = this.sessions.get(sessionId)
    return session ? this.getSessionData(session) : undefined
  }

  /**
   * Extract secure session data (excluding sensitive information)
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
   * Schedule reconnection
   */
  private scheduleReconnect(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.reconnectAttempts++
    session.status = 'connecting'

    // Exponential backoff algorithm: 1s, 2s, 4s, 8s...
    const delay = Math.min(1000 * Math.pow(2, session.reconnectAttempts - 1), 10000)

    this.emit('session-reconnecting', sessionId, session.reconnectAttempts, delay)

    setTimeout(() => {
      this.connectSession(sessionId).catch((error) => {
        console.error(`Reconnect attempt ${session.reconnectAttempts} failed for session ${sessionId}:`, error)

        // If maximum reconnect attempts reached, mark as error state
        if (session.reconnectAttempts >= session.maxReconnectAttempts) {
          session.status = 'error'
          session.error = `Reconnection failed (attempted ${session.maxReconnectAttempts} times)`
          this.emit('session-error', sessionId, session.error)
        }
      })
    }, delay)
  }

  /**
   * Categorize error messages
   */
  private categorizeError(error: Error): string {
    const message = error.message || error.toString()

    if (message.includes('ENOTFOUND') || message.includes('getaddrinfo')) {
      return 'Hostname resolution failed, please check network connection and host address'
    }

    if (message.includes('ECONNREFUSED')) {
      return 'Connection refused, please check if port is correct or service is running'
    }

    if (message.includes('ETIMEDOUT')) {
      return 'Connection timeout, please check network connection'
    }

    if (message.includes('Authentication')) {
      return 'Authentication failed, please check username, password or key'
    }

    if (message.includes('Permission denied')) {
      return 'Permission denied, please check user permissions'
    }

    if (message.includes('Host key verification failed')) {
      return 'Host key verification failed, possible security risk'
    }

    // Return original error message by default
    return message
  }

  /**
   * Determine whether connection should be retried
   */
  private shouldRetryConnection(error: Error): boolean {
    const message = error.message || error.toString()

    // Error types that should not be retried
    const nonRetryableErrors = [
      'Authentication',
      'Permission denied',
      'Host key verification failed',
      'EACCES', // Permission error
    ]

    return !nonRetryableErrors.some((errorType) => message.includes(errorType))
  }

  /**
   * Manually reconnect session
   */
  async reconnectSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    // Close existing connection
    if (session.connection) {
      session.connection.end()
    }

    // Reset state
    session.reconnectAttempts = 0
    session.status = 'connecting'
    session.error = undefined

    // Reconnect
    await this.connectSession(sessionId)
  }

  /**
   * Clean up all sessions
   */
  cleanup(): void {
    for (const [sessionId] of this.sessions) {
      this.closeSession(sessionId).catch(console.error)
    }
    this.sessions.clear()
    this.activeSessionId = undefined
    // Clear all progress tracking
    this.lastProgressUpdate.clear()
  }

  /**
   * Get session object by ID (internal use)
   */
  getSessionObject(sessionId: string): SSHSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Send throttled progress update to renderer process
   */
  private sendProgressUpdate(taskId: string, progress: number, transferred: number): void {
    if (!this.webContents) return

    const now = Date.now()
    const lastUpdate = this.lastProgressUpdate.get(taskId) || 0
    
    // Only send update if enough time has passed since last update, or if progress is 100%
    if (now - lastUpdate >= this.PROGRESS_UPDATE_INTERVAL || progress === 100) {
      this.lastProgressUpdate.set(taskId, now)
      
      this.webContents.send('file-transfer-progress', {
        taskId,
        progress,
        transferred
      })

      // Clean up progress tracking when transfer is complete
      if (progress === 100) {
        this.lastProgressUpdate.delete(taskId)
      }
    }
  }

  /**
   * Get or create SFTP connection for session
   */
  private async getSFTP(sessionId: string): Promise<SFTPWrapper> {
    const session = this.getSessionObject(sessionId)
    if (!session || !session.connection || session.status !== 'connected') {
      throw new Error('SSH session not connected')
    }

    if (session.sftp) {
      return session.sftp
    }

    return new Promise((resolve, reject) => {
      session.connection!.sftp((err, sftp) => {
        if (err) {
          reject(err)
          return
        }
        session.sftp = sftp
        resolve(sftp)
      })
    })
  }

  /**
   * List files in remote directory
   */
  async listFiles(sessionId: string, remotePath: string): Promise<any[]> {
    const sftp = await this.getSFTP(sessionId)

    return new Promise((resolve, reject) => {
      sftp.readdir(remotePath, (err, list) => {
        if (err) {
          reject(err)
          return
        }

        const files = list.map((item: any) => ({
          name: item.filename,
          type: item.attrs.isDirectory() ? 'directory' : 'file',
          size: item.attrs.size,
          modifiedAt: new Date(item.attrs.mtime * 1000).toISOString(),
          permissions: item.attrs.mode,
          isHidden: item.filename.startsWith('.'),
          path: path.posix.join(remotePath, item.filename),
        }))

        resolve(files)
      })
    })
  }

  /**
   * Create remote directory
   */
  async createDirectory(sessionId: string, remotePath: string): Promise<void> {
    const sftp = await this.getSFTP(sessionId)

    return new Promise((resolve, reject) => {
      sftp.mkdir(remotePath, (err) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  }

  /**
   * Delete remote file
   */
  async deleteFile(sessionId: string, remotePath: string): Promise<void> {
    const sftp = await this.getSFTP(sessionId)

    return new Promise((resolve, reject) => {
      sftp.unlink(remotePath, (err) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  }

  /**
   * Delete remote directory
   */
  async deleteDirectory(sessionId: string, remotePath: string): Promise<void> {
    const sftp = await this.getSFTP(sessionId)

    return new Promise((resolve, reject) => {
      sftp.rmdir(remotePath, (err) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  }

  /**
   * Upload file to remote server
   */
  async uploadFile(sessionId: string, localPath: string, remotePath: string, taskId: string): Promise<void> {
    const sftp = await this.getSFTP(sessionId)

    return new Promise((resolve, reject) => {
      // 获取本地文件大小
      let totalSize: number
      try {
        const stats = fs.statSync(localPath)
        totalSize = stats.size
      } catch (error) {
        reject(error)
        return
      }

      let uploadedSize = 0
      const readStream = fs.createReadStream(localPath)
      const writeStream = sftp.createWriteStream(remotePath)

      writeStream.on('error', reject)
      writeStream.on('close', resolve)
      readStream.on('error', reject)

      // 监听数据传输来计算进度
      readStream.on('data', (chunk) => {
        uploadedSize += chunk.length
        const progress = Math.round((uploadedSize / totalSize) * 100)
        const transferred = uploadedSize
        
        // 发送节流的进度事件到渲染进程
        this.sendProgressUpdate(taskId, progress, transferred)
      })

      readStream.pipe(writeStream)
    })
  }

  /**
   * Download file from remote server
   */
  async downloadFile(sessionId: string, remotePath: string, localPath: string, taskId: string): Promise<void> {
    const sftp = await this.getSFTP(sessionId)

    return new Promise((resolve, reject) => {
      // 先获取远程文件大小
      sftp.stat(remotePath, (err: any, stats: any) => {
        if (err) {
          reject(err)
          return
        }

        const totalSize = stats.size
        let downloadedSize = 0

        const readStream = sftp.createReadStream(remotePath)
        const writeStream = fs.createWriteStream(localPath)

        readStream.on('error', reject)
        writeStream.on('error', reject)
        writeStream.on('close', resolve)

        // 监听数据传输来计算进度
        readStream.on('data', (chunk: any) => {
          downloadedSize += chunk.length
          const progress = Math.round((downloadedSize / totalSize) * 100)
          const transferred = downloadedSize
          
          // 发送节流的进度事件到渲染进程
          this.sendProgressUpdate(taskId, progress, transferred)
        })

        readStream.pipe(writeStream)
      })
    })
  }
}
