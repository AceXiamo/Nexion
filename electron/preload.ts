import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  removeListener(...args: Parameters<typeof ipcRenderer.removeListener>) {
    const [channel, listener] = args
    return ipcRenderer.removeListener(channel, listener)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // SSH Tab 相关方法
  ssh: {
    createSession: (config: any) => ipcRenderer.invoke('ssh-create-session', config),
    closeSession: (sessionId: string) => ipcRenderer.invoke('ssh-close-session', sessionId),
    switchSession: (sessionId: string) => ipcRenderer.invoke('ssh-switch-session', sessionId),
    sendCommand: (sessionId: string, command: string) => ipcRenderer.invoke('ssh-send-command', sessionId, command),
    resizeSession: (sessionId: string, cols: number, rows: number) => ipcRenderer.invoke('ssh-resize-session', sessionId, cols, rows),
    getAllSessions: () => ipcRenderer.invoke('ssh-get-all-sessions'),
    getActiveSession: () => ipcRenderer.invoke('ssh-get-active-session'),
    getCurrentDirectory: (sessionId: string) => ipcRenderer.invoke('ssh-get-current-directory', sessionId),
    reconnectSession: (sessionId: string) => ipcRenderer.invoke('ssh-reconnect-session', sessionId),
    testConnection: (config: any) => ipcRenderer.invoke('ssh-test-connection', config),
  },

  // File System 相关方法
  fs: {
    readdir: (dirPath: string) => ipcRenderer.invoke('fs:readdir', dirPath),
    stat: (filePath: string) => ipcRenderer.invoke('fs:stat', filePath),
    mkdir: (dirPath: string) => ipcRenderer.invoke('fs:mkdir', dirPath),
    unlink: (filePath: string) => ipcRenderer.invoke('fs:unlink', filePath),
    rmdir: (dirPath: string) => ipcRenderer.invoke('fs:rmdir', dirPath),
  },

  // SFTP 相关方法
  sftp: {
    connect: (sessionId: string) => ipcRenderer.invoke('sftp:connect', sessionId),
    disconnect: (sessionId: string) => ipcRenderer.invoke('sftp:disconnect', sessionId),
    listFiles: (sessionId: string, path: string) => ipcRenderer.invoke('sftp:listFiles', sessionId, path),
    uploadFile: (sessionId: string, localPath: string, remotePath: string, taskId: string) => ipcRenderer.invoke('sftp:uploadFile', sessionId, localPath, remotePath, taskId),
    downloadFile: (sessionId: string, remotePath: string, localPath: string, taskId: string) => ipcRenderer.invoke('sftp:downloadFile', sessionId, remotePath, localPath, taskId),
    createDirectory: (sessionId: string, path: string) => ipcRenderer.invoke('sftp:mkdir', sessionId, path),
    deleteFile: (sessionId: string, path: string) => ipcRenderer.invoke('sftp:unlink', sessionId, path),
    deleteDirectory: (sessionId: string, path: string) => ipcRenderer.invoke('sftp:rmdir', sessionId, path),
  },

  // System 相关方法
  system: {
    getUserHomeDirectory: () => ipcRenderer.invoke('system:getUserHomeDirectory'),
  },

  // 数据存储相关方法
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store:delete', key),
    clear: () => ipcRenderer.invoke('store:clear'),
    has: (key: string) => ipcRenderer.invoke('store:has', key),
  },
})

// Expose ElectronAPI for WalletConnect
contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url: string) => ipcRenderer.invoke('wallet:openExternal', url),
  closeWindow: () => ipcRenderer.invoke('window:close'),
})

// Expose wallet detection and debugging utilities
contextBridge.exposeInMainWorld('walletDebug', {
  checkWalletAvailability: () => {
    const result = {
      ethereum: typeof window.ethereum !== 'undefined',
      okxwallet: typeof window.okxwallet !== 'undefined',
      userAgent: navigator.userAgent,
      isElectron: typeof process !== 'undefined' && process.type === 'renderer'
    }
    console.log('Wallet availability check:', result)
    return result
  },
  
  logWalletProviders: () => {
    console.log('All window properties containing "eth" or "wallet":', 
      Object.keys(window).filter(key => 
        key.toLowerCase().includes('eth') || key.toLowerCase().includes('wallet')
      )
    )
  }
})

// Try to simulate wallet injection for development
if (process.env.NODE_ENV === 'development') {
  // Mock wallet provider for testing if no real wallet is available
  setTimeout(() => {
    if (typeof window.ethereum === 'undefined' && typeof window.okxwallet === 'undefined') {
      console.warn('No wallet detected, injecting mock provider for development...')
      
      // Mock minimal Ethereum provider
      ;(window as any).ethereum = {
        isMetaMask: false,
        isOKXWallet: false,
        request: async ({ method, params }: any) => {
          console.log('Mock wallet request:', method, params)
          
          switch (method) {
            case 'eth_requestAccounts':
              // Return a test account
              return ['0x742d35Cc6635C0532925a3b8c2412A4B1B06B2B5']
            case 'eth_chainId':
              // Return X Layer testnet chain ID
              return '0x7A0' // 1952 in hex
            case 'eth_accounts':
              return ['0x742d35Cc6635C0532925a3b8c2412A4B1B06B2B5']
            default:
              throw new Error(`Mock wallet: Method ${method} not implemented`)
          }
        },
        on: (event: string) => {
          console.log('Mock wallet: Listening for', event)
        },
        removeListener: (event: string) => {
          console.log('Mock wallet: Removing listener for', event)
        }
      }
      
      console.log('Mock wallet provider injected')
    }
  }, 1000)
}
