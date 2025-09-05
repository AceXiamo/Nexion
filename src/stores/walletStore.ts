import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { walletConnect, ConnectionState, WalletInfo } from '@/lib/walletconnect-native'
import { xLayerTestnet } from '@/lib/web3-config'

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
  switchChain: (chainId: number) => Promise<void>
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
        
        if (result) {
          // 连接成功后清理注册缓存，确保重新查询注册状态
          console.log('🧹 钱包连接成功，清理 userRegistrationStore 缓存')
          const { useUserRegistrationStore } = await import('./userRegistrationStore')
          useUserRegistrationStore.getState().clearRegistrationCache()
          
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
        await walletConnect.disconnect()
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
      } catch (error) {
        console.error('Error disconnecting wallet:', error)
      }
    },
    
    switchChain: async (chainId: number) => {
      try {
        set({ error: null })
        await walletConnect.switchChain(chainId)
        set({ chainId })
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to switch chain'
        })
        throw error
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

// Initialize wallet event listeners
const initializeWalletListeners = () => {
  const store = useWalletStore.getState()
  
  walletConnect.on('uri', (uri: string) => {
    store.updateConnectionState({ uri })
  })
  
  walletConnect.on('connect', (data: any) => {
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
  
  walletConnect.on('disconnect', () => {
    store.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      account: undefined,
      chainId: undefined,
      uri: undefined
    })
  })
  
  walletConnect.on('accountsChanged', (accounts: string[]) => {
    store.updateConnectionState({
      account: accounts[0] || undefined
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
    isWrongNetwork: state.isConnected && state.chainId !== xLayerTestnet.id,
    isReady: state.isConnected && state.account && state.chainId,
    shortAddress: state.account ? `${state.account.slice(0, 6)}...${state.account.slice(-4)}` : null,
    canConnect: !state.isConnecting && !state.isConnected,
    canDisconnect: state.isConnected,
    needsNetworkSwitch: state.isConnected && state.chainId !== xLayerTestnet.id
  }
}

// Initialize listeners when store is created
if (typeof window !== 'undefined') {
  initializeWalletListeners()
}