// Electron IPC 类型定义
export interface SSHSessionData {
  id: string
  name: string
  configId: string
  configName: string
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  error?: string
  isActive: boolean
  createdAt: Date
  lastActivity: Date
  reconnectAttempts: number
  connectionTime?: number
  bytesTransferred: number
  currentWorkingDirectory?: string
}

export interface SSHIPCResponse<T = any> {
  success: boolean
  error?: string
  sessionId?: string
  sessions?: SSHSessionData[]
  data?: T
}

declare global {
  interface Window {
    ipcRenderer: {
      on: (channel: string, listener: (...args: any[]) => void) => void
      off: (channel: string, listener: (...args: any[]) => void) => void
      send: (channel: string, ...args: any[]) => void
      invoke: (channel: string, ...args: any[]) => Promise<any>

      ssh: {
        createSession: (config: any) => Promise<SSHIPCResponse>
        closeSession: (sessionId: string) => Promise<SSHIPCResponse>
        switchSession: (sessionId: string) => Promise<SSHIPCResponse>
        sendCommand: (sessionId: string, command: string) => Promise<SSHIPCResponse>
        resizeSession: (sessionId: string, cols: number, rows: number) => Promise<SSHIPCResponse>
        getAllSessions: () => Promise<SSHIPCResponse<SSHSessionData[]>>
        getActiveSession: () => Promise<SSHIPCResponse<{ sessionId: string | null }>>
        getCurrentDirectory: (sessionId: string) => Promise<SSHIPCResponse<{ directory: string }>>
        reconnectSession: (sessionId: string) => Promise<SSHIPCResponse>
        testConnection: (config: any) => Promise<any>
      }

      sftp: {
        connect: (sessionId: string) => Promise<void>
        disconnect: (sessionId: string) => void
        listFiles: (sessionId: string, path: string) => Promise<any[]>
        uploadFile: (sessionId: string, localPath: string, remotePath: string, onProgress?: (progress: number) => void) => Promise<void>
        downloadFile: (sessionId: string, remotePath: string, localPath: string, onProgress?: (progress: number) => void) => Promise<void>
        createDirectory: (sessionId: string, path: string) => Promise<void>
        deleteFile: (sessionId: string, path: string) => Promise<void>
        deleteDirectory: (sessionId: string, path: string) => Promise<void>
      }

      system: {
        getUserHomeDirectory: () => Promise<{ success: boolean; homeDir?: string; error?: string }>
      }

      store: {
        get: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>
        set: (key: string, value: any) => Promise<{ success: boolean; error?: string }>
        delete: (key: string) => Promise<{ success: boolean; error?: string }>
        clear: () => Promise<{ success: boolean; error?: string }>
      }

      window: {
        close: () => Promise<{ success: boolean; error?: string }>
        minimize: () => Promise<{ success: boolean; error?: string }>
        maximize: () => Promise<{ success: boolean; isMaximized?: boolean; error?: string }>
        isMaximized: () => Promise<{ success: boolean; isMaximized?: boolean; error?: string }>
      }
    }
    
    walletDebug?: {
      checkWalletAvailability: () => any
      logWalletProviders: () => void
    }
  }
}

export {}
