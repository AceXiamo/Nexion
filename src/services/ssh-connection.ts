import type { DecryptedSSHConfig } from '@/types/ssh'

// 声明 Electron IPC 接口
declare global {
  interface Window {
    ipcRenderer: {
      invoke: (channel: string, ...args: any[]) => Promise<any>
    }
  }
}

export interface SSHConnectionResult {
  success: boolean
  message: string
  error?: Error
  connectionTime?: number
  serverInfo?: {
    hostname?: string
    username?: string
    serverVersion?: string
  }
}

export interface SSHConnectionStatus {
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  lastConnected?: Date
  error?: string
}

/**
 * SSH 连接服务
 * 用于测试 SSH 配置的连接性和管理连接状态
 */
export class SSHConnectionService {
  private static connections = new Map<string, Client>()
  private static connectionStates = new Map<string, SSHConnectionStatus>()

  /**
   * 测试 SSH 连接（通过主进程）
   */
  static async testConnection(config: DecryptedSSHConfig): Promise<SSHConnectionResult> {
    try {
      // 检查是否在 Electron 环境中
      if (typeof window !== 'undefined' && window.ipcRenderer) {
        // 通过 IPC 调用主进程的 SSH 功能
        const result = await window.ipcRenderer.invoke('ssh-test-connection', {
          host: config.host,
          port: config.port,
          username: config.username,
          authType: config.authType,
          password: config.password,
          privateKey: config.privateKey,
          passphrase: config.passphrase,
        })
        return result
      } else {
        // 非 Electron 环境（例如 Web），返回模拟结果
        return {
          success: false,
          message: 'SSH 连接功能需要在桌面应用中使用',
          connectionTime: 0,
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error: error instanceof Error ? error : new Error(String(error)),
        connectionTime: 0,
      }
    }
  }

  /**
   * 建立持久连接
   */
  static async connect(config: DecryptedSSHConfig): Promise<SSHConnectionResult> {
    const configId = config.id
    
    // 如果已经存在连接，先关闭它
    if (this.connections.has(configId)) {
      await this.disconnect(configId)
    }

    // 更新连接状态为连接中
    this.connectionStates.set(configId, {
      status: 'connecting',
    })

    return new Promise((resolve) => {
      const conn = new Client()
      const startTime = Date.now()

      const timeout = setTimeout(() => {
        conn.end()
        this.connectionStates.set(configId, {
          status: 'error',
          error: '连接超时',
        })
        resolve({
          success: false,
          message: '连接超时',
          connectionTime: Date.now() - startTime,
        })
      }, 15000) // 15秒超时

      conn.on('ready', () => {
        clearTimeout(timeout)
        const connectionTime = Date.now() - startTime
        
        // 保存连接
        this.connections.set(configId, conn)
        this.connectionStates.set(configId, {
          status: 'connected',
          lastConnected: new Date(),
        })

        resolve({
          success: true,
          message: `连接成功！耗时 ${connectionTime}ms`,
          connectionTime,
          serverInfo: {
            hostname: config.host,
            username: config.username,
          },
        })
      })

      conn.on('error', (err) => {
        clearTimeout(timeout)
        this.connectionStates.set(configId, {
          status: 'error',
          error: err.message,
        })
        
        resolve({
          success: false,
          message: `连接失败: ${err.message}`,
          error: err,
          connectionTime: Date.now() - startTime,
        })
      })

      conn.on('close', () => {
        this.connections.delete(configId)
        this.connectionStates.set(configId, {
          status: 'disconnected',
        })
      })

      try {
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
      } catch (error) {
        clearTimeout(timeout)
        this.connectionStates.set(configId, {
          status: 'error',
          error: error instanceof Error ? error.message : '未知错误',
        })
        
        resolve({
          success: false,
          message: `配置错误: ${error instanceof Error ? error.message : '未知错误'}`,
          error: error instanceof Error ? error : new Error(String(error)),
          connectionTime: Date.now() - startTime,
        })
      }
    })
  }

  /**
   * 断开连接
   */
  static async disconnect(configId: string): Promise<void> {
    const conn = this.connections.get(configId)
    if (conn) {
      conn.end()
      this.connections.delete(configId)
    }
    
    this.connectionStates.set(configId, {
      status: 'disconnected',
    })
  }

  /**
   * 获取连接状态
   */
  static getConnectionStatus(configId: string): SSHConnectionStatus {
    return this.connectionStates.get(configId) || { status: 'disconnected' }
  }

  /**
   * 获取所有连接状态
   */
  static getAllConnectionStates(): Record<string, SSHConnectionStatus> {
    const states: Record<string, SSHConnectionStatus> = {}
    this.connectionStates.forEach((state, id) => {
      states[id] = state
    })
    return states
  }

  /**
   * 检查连接是否活跃
   */
  static isConnected(configId: string): boolean {
    const conn = this.connections.get(configId)
    const state = this.connectionStates.get(configId)
    return !!(conn && state?.status === 'connected')
  }

  /**
   * 执行 SSH 命令（仅在已连接时可用）
   */
  static async executeCommand(
    configId: string,
    command: string
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    const conn = this.connections.get(configId)
    
    if (!conn || !this.isConnected(configId)) {
      return {
        success: false,
        error: '连接未建立',
      }
    }

    return new Promise((resolve) => {
      conn.exec(command, (err, stream) => {
        if (err) {
          resolve({
            success: false,
            error: err.message,
          })
          return
        }

        let output = ''
        let errorOutput = ''

        stream.on('data', (data: Buffer) => {
          output += data.toString()
        }).stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString()
        }).on('close', (code: number) => {
          resolve({
            success: code === 0,
            output: output.trim(),
            error: errorOutput.trim() || undefined,
          })
        })
      })
    })
  }

  /**
   * 清理所有连接
   */
  static cleanup(): void {
    this.connections.forEach((conn) => {
      conn.end()
    })
    this.connections.clear()
    this.connectionStates.clear()
  }
}