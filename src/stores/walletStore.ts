import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { walletConnect, ConnectionState, WalletInfo } from '@/lib/walletconnect-native'

export interface WalletState {
  // Connection state
  isConnected: boolean
  isConnecting: boolean
  account: string | null
  chainId: number | null
  uri: string | null
  error: string | null
  
  // UI state
  showQrCode: boolean
  showWalletSelector: boolean
  selectedWallet: string | null
  
  // Supported wallets
  supportedWallets: WalletInfo[]
  
  // Actions
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  openWallet: (walletId: string) => void
  signMessage: (message: string | { message: string }) => Promise<string>
  sendTransaction: (transaction: any) => Promise<string>
  cancelConnection: () => void
  
  // UI actions
  setShowQrCode: (show: boolean) => void
  setShowWalletSelector: (show: boolean) => void
  setSelectedWallet: (walletId: string | null) => void
  
  // State management
  updateConnectionState: (state: Partial<ConnectionState>) => void
  clearError: () => void
}

export const useWalletStore = create<WalletState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isConnected: false,
    isConnecting: false,
    account: null,
    chainId: null,
    uri: null,
    error: null,
    
    // UI state
    showQrCode: false,
    showWalletSelector: false,
    selectedWallet: null,
    
    // Supported wallets
    supportedWallets: walletConnect.getSupportedWallets(),
    
    // Actions
    connect: async () => {
      try {
        set({ isConnecting: true, error: null })
        const result = await walletConnect.connect()
        
        // 只处理已有session的情况，新连接通过事件处理
        if (result) {
          set({
            isConnected: true,
            isConnecting: false,
            account: result.account,
            chainId: result.chainId,
            showQrCode: false,
            showWalletSelector: false
          })
        }
      } catch (error) {
        set({
          isConnecting: false,
          error: error instanceof Error ? error.message : 'Failed to connect wallet'
        })
        throw error
      }
    },
    
    disconnect: async () => {
      try {
        const currentAccount = get().account
        
        console.log('🔌 开始断开钱包连接，清理所有用户数据')
        
        // 1. 断开钱包连接
        await walletConnect.disconnect()
        
        // 2. 清理所有缓存和会话数据
        await clearAllUserData(currentAccount)
        
        // 3. 重置钱包状态
        set({
          isConnected: false,
          isConnecting: false,
          account: null,
          chainId: null,
          uri: null,
          error: null,
          showQrCode: false,
          showWalletSelector: false,
          selectedWallet: null
        })
        
        console.log('✅ 钱包断开连接完成，所有用户数据已清理')
      } catch (error) {
        console.error('Error disconnecting wallet:', error)
      }
    },
    
    
    openWallet: async (walletId: string) => {
      try {
        await walletConnect.openWallet(walletId)
        set({ selectedWallet: walletId })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to open wallet'
        })
      }
    },
    
    signMessage: async (message: string | { message: string }) => {
      try {
        set({ error: null })
        // 支持两种格式：直接字符串或对象格式
        const messageStr = typeof message === 'string' ? message : message.message
        return await walletConnect.signMessage(messageStr)
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to sign message'
        })
        throw error
      }
    },
    
    sendTransaction: async (transaction: any) => {
      try {
        set({ error: null })
        return await walletConnect.sendTransaction(transaction)
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to send transaction'
        })
        throw error
      }
    },

    cancelConnection: () => {
      walletConnect.cancelConnection()
      set({
        isConnecting: false,
        showQrCode: false,
        uri: null,
        error: null
      })
    },
    
    // UI actions
    setShowQrCode: (show: boolean) => {
      set({ showQrCode: show })
    },
    
    setShowWalletSelector: (show: boolean) => {
      set({ showWalletSelector: show })
    },
    
    setSelectedWallet: (walletId: string | null) => {
      set({ selectedWallet: walletId })
    },
    
    // State management
    updateConnectionState: (state: Partial<ConnectionState>) => {
      set((current) => ({
        ...current,
        ...state
      }))
    },
    
    clearError: () => {
      set({ error: null })
    }
  }))
)

/**
 * 清理所有用户相关数据和缓存
 * 在钱包断开连接时调用，确保数据安全和一致性
 */
async function clearAllUserData(currentAccount: string | null) {
  console.log('🧹 开始清理所有用户数据...')
  
  // 1. 清理用户注册状态缓存
  try {
    const { useUserRegistrationStore } = await import('./userRegistrationStore')
    useUserRegistrationStore.getState().clearRegistrationCache()
    console.log('✅ 已清理用户注册状态缓存')
  } catch (error) {
    console.error('清理用户注册状态缓存失败:', error)
  }
  
  // 2. 清理SSH配置缓存
  try {
    const { useSSHConfigStore } = await import('./sshConfigStore')
    useSSHConfigStore.getState().clearConfigCache()
    console.log('✅ 已清理SSH配置缓存')
  } catch (error) {
    console.error('清理SSH配置缓存失败:', error)
  }
  
  // 3. 清理SSH会话数据
  try {
    const { sessionStore } = await import('@/store/session-store')
    sessionStore.clear()
    console.log('✅ 已清理SSH会话数据')
  } catch (error) {
    console.error('清理SSH会话数据失败:', error)
  }
  
  // 4. 清理加密密钥缓存
  if (currentAccount) {
    try {
      const { WalletBasedEncryptionService } = await import('@/services/encryption')
      WalletBasedEncryptionService.clearMasterKeyCache(currentAccount)
      console.log('✅ 已清理加密密钥缓存')
    } catch (error) {
      console.error('清理加密密钥缓存失败:', error)
    }
  }
  
  // 5. 清理文件传输状态
  try {
    const { useFileTransferStore } = await import('@/store/file-transfer-store')
    const store = useFileTransferStore.getState()
    // 关闭文件传输模态框并清理传输任务
    store.closeModal()
    store.clearCompletedTasks()
    console.log('✅ 已清理文件传输状态')
  } catch (error) {
    console.error('清理文件传输状态失败:', error)
  }
  
  // 6. 通知Electron主进程关闭所有SSH会话
  try {
    if (window.ipcRenderer?.ssh) {
      // 获取所有会话并逐个关闭
      const sessionsResult = await window.ipcRenderer.ssh.getAllSessions()
      if (sessionsResult.success && sessionsResult.sessions) {
        const closePromises = sessionsResult.sessions.map((session: any) => 
          window.ipcRenderer.ssh.closeSession(session.id)
        )
        await Promise.all(closePromises)
        console.log('✅ 已通知主进程关闭所有SSH会话')
      }
    }
  } catch (error) {
    console.error('通知主进程关闭SSH会话失败:', error)
  }
  
  console.log('🎯 用户数据清理完成')
}

// Initialize wallet event listeners
const initializeWalletListeners = () => {
  const store = useWalletStore.getState()
  
  walletConnect.on('uri', (uri: string) => {
    store.updateConnectionState({ uri })
  })
  
  walletConnect.on('connect', async (data: any) => {
    // 连接成功后清理所有相关缓存，确保重新查询状态
    console.log('🧹 钱包连接成功，清理缓存以确保数据一致性')
    
    // 清理用户注册状态缓存
    try {
      const { useUserRegistrationStore } = await import('./userRegistrationStore')
      useUserRegistrationStore.getState().clearRegistrationCache()
      console.log('✅ 已清理 userRegistrationStore 缓存')
    } catch (error) {
      console.error('清理 userRegistrationStore 缓存失败:', error)
    }
    
    // 清理SSH配置缓存
    try {
      const { useSSHConfigStore } = await import('./sshConfigStore')
      useSSHConfigStore.getState().clearConfigCache()
      console.log('✅ 已清理 sshConfigStore 缓存')
    } catch (error) {
      console.error('清理 sshConfigStore 缓存失败:', error)
    }
    
    store.updateConnectionState({
      isConnected: true,
      isConnecting: false,
      account: data.account,
      chainId: data.chainId,
      uri: undefined
    })
    // Close QR code modal on successful connection
    store.setShowQrCode(false)
  })
  
  walletConnect.on('disconnect', async () => {
    console.log('🔌 钱包连接意外断开，清理所有用户数据')
    const currentAccount = useWalletStore.getState().account
    
    // 清理所有缓存和会话数据
    await clearAllUserData(currentAccount)
    
    store.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      account: undefined,
      chainId: undefined,
      uri: undefined
    })
    
    console.log('✅ 钱包断开处理完成，所有用户数据已清理')
  })
  
  walletConnect.on('accountsChanged', async (accounts: string[]) => {
    const newAccount = accounts[0] || undefined
    const currentAccount = useWalletStore.getState().account
    
    // 如果账户发生变化，清理缓存
    if (newAccount !== currentAccount && newAccount) {
      console.log('🧹 钱包账户切换，清理缓存以确保数据一致性', { from: currentAccount, to: newAccount })
      
      // 清理用户注册状态缓存
      try {
        const { useUserRegistrationStore } = await import('./userRegistrationStore')
        useUserRegistrationStore.getState().clearRegistrationCache()
        console.log('✅ 已清理 userRegistrationStore 缓存')
      } catch (error) {
        console.error('清理 userRegistrationStore 缓存失败:', error)
      }
      
      // 清理SSH配置缓存
      try {
        const { useSSHConfigStore } = await import('./sshConfigStore')
        useSSHConfigStore.getState().clearConfigCache()
        console.log('✅ 已清理 sshConfigStore 缓存')
      } catch (error) {
        console.error('清理 sshConfigStore 缓存失败:', error)
      }
    }
    
    store.updateConnectionState({
      account: newAccount
    })
  })
  
  walletConnect.on('chainChanged', (chainId: number) => {
    store.updateConnectionState({
      chainId
    })
  })
  
  walletConnect.on('connecting', () => {
    store.updateConnectionState({
      isConnecting: true,
      error: undefined
    })
  })
  
  walletConnect.on('error', (error: any) => {
    store.updateConnectionState({
      isConnecting: false,
      error: error instanceof Error ? error.message : 'Connection error'
    })
  })

  walletConnect.on('cancelled', () => {
    store.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      uri: undefined,
      error: undefined
    })
    store.setShowQrCode(false)
  })
}

// Computed selectors
export const useWalletSelectors = () => {
  const state = useWalletStore()
  
  return {
    isReady: state.isConnected && state.account,
    shortAddress: state.account ? `${state.account.slice(0, 6)}...${state.account.slice(-4)}` : null,
    canConnect: !state.isConnecting && !state.isConnected,
    canDisconnect: state.isConnected
  }
}

// Initialize listeners when store is created
if (typeof window !== 'undefined') {
  initializeWalletListeners()
}