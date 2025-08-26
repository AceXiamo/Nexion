// Electron IPC 类型定义
export interface SSHSessionData {
  id: string
  name: string
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  error?: string
  isActive: boolean
  createdAt: Date
  lastActivity: Date
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
        testConnection: (config: any) => Promise<any>
      }
    }
    
    walletDebug: {
      checkWalletAvailability: () => any
      logWalletProviders: () => void
    }
  }
}

export {}