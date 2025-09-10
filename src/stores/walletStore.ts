import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { electronPersist } from './electronPersist'
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
  connect: (isAutoReconnect?: boolean) => Promise<void>
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
  electronPersist(
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
          set({
            isConnecting: true,
            error: null,
          })
          const result = await walletConnect.connect()

          // Only handle existing session cases, new connections are handled through events
          if (result) {
            set({
              isConnected: true,
              isConnecting: false,
              account: result.account,
              chainId: result.chainId,
              showQrCode: false,
              showWalletSelector: false,
            })
          }
        } catch (error) {
          set({
            isConnecting: false,
            error: error instanceof Error ? error.message : 'Failed to connect wallet',
          })
          throw error
        }
      },

      disconnect: async () => {
        try {
          const currentAccount = get().account

          console.log('🔌 Starting wallet disconnection, cleaning all user data')

          // 1. Disconnect wallet connection
          await walletConnect.disconnect()

          // 2. Clear all cache and session data
          await clearAllUserData(currentAccount)

          // 3. Reset wallet state
          set({
            isConnected: false,
            isConnecting: false,
            account: null,
            chainId: null,
            uri: null,
            error: null,
            showQrCode: false,
            showWalletSelector: false,
            selectedWallet: null,
          })

          // 4. Clear persisted wallet state
          try {
            if (window.ipcRenderer?.store) {
              await window.ipcRenderer.store.delete('wallet-store')
              console.log('✅ Wallet persistent state cleared')
            }
          } catch (error) {
            console.error('Failed to clear wallet persistent state:', error)
          }

          console.log('✅ Wallet disconnection completed, all user data cleared')
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
            error: error instanceof Error ? error.message : 'Failed to open wallet',
          })
        }
      },

      signMessage: async (message: string | { message: string }) => {
        try {
          set({ error: null })
          // Support two formats: direct string or object format
          const messageStr = typeof message === 'string' ? message : message.message
          return await walletConnect.signMessage(messageStr)
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to sign message',
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
            error: error instanceof Error ? error.message : 'Failed to send transaction',
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
          error: null,
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
          ...state,
        }))
      },

      clearError: () => {
        set({ error: null })
      },
    })),
    {
      name: 'wallet-store',
      partialize: (state) => ({
        isConnected: state.isConnected,
        account: state.account,
        chainId: state.chainId,
      }),
    }
  )
)

/**
 * Clear all user-related data and cache
 * Called when wallet disconnects to ensure data security and consistency
 */
async function clearAllUserData(currentAccount: string | null) {
  console.log('🧹 Starting to clear all user data...')

  // 1. Clear user registration status cache
  try {
    const { useUserRegistrationStore } = await import('./userRegistrationStore')
    await useUserRegistrationStore.getState().clearRegistrationCache()
    console.log('✅ User registration status cache cleared')
  } catch (error) {
    console.error('Failed to clear user registration status cache:', error)
  }

  // 2. Clear SSH configuration cache
  try {
    const { useSSHConfigStore } = await import('./sshConfigStore')
    await useSSHConfigStore.getState().clearConfigCache()
    console.log('✅ SSH configuration cache cleared')
  } catch (error) {
    console.error('Failed to clear SSH configuration cache:', error)
  }

  // 3. Clear SSH session data
  try {
    const { sessionStore } = await import('@/store/session-store')
    sessionStore.clear()
    console.log('✅ SSH session data cleared')
  } catch (error) {
    console.error('Failed to clear SSH session data:', error)
  }

  // 4. Clear encryption key cache
  if (currentAccount) {
    try {
      const { WalletBasedEncryptionService } = await import('@/services/encryption')
      WalletBasedEncryptionService.clearMasterKeyCache(currentAccount)
      console.log('✅ Encryption key cache cleared')
    } catch (error) {
      console.error('Failed to clear encryption key cache:', error)
    }
  }

  // 5. Clear file transfer status
  try {
    const { useFileTransferStore } = await import('@/store/file-transfer-store')
    const store = useFileTransferStore.getState()
    // Close file transfer modal and clear transfer tasks
    store.closeModal()
    store.clearCompletedTasks()
    console.log('✅ File transfer status cleared')
  } catch (error) {
    console.error('Failed to clear file transfer status:', error)
  }

  // 6. Notify Electron main process to close all SSH sessions
  try {
    if (window.ipcRenderer?.ssh) {
      // Get all sessions and close them one by one
      const sessionsResult = await window.ipcRenderer.ssh.getAllSessions()
      if (sessionsResult.success && sessionsResult.sessions) {
        const closePromises = sessionsResult.sessions.map((session: any) => window.ipcRenderer.ssh.closeSession(session.id))
        await Promise.all(closePromises)
        console.log('✅ Notified main process to close all SSH sessions')
      }
    }
  } catch (error) {
    console.error('Failed to notify main process to close SSH sessions:', error)
  }

  console.log('🎯 User data cleanup completed')
}

// Initialize wallet event listeners
const initializeWalletListeners = () => {
  const store = useWalletStore.getState()

  walletConnect.on('uri', (uri: string) => {
    store.updateConnectionState({ uri })
  })

  walletConnect.on('connect', async (data: any) => {
    console.log('🎉 Wallet connected successfully')

    store.updateConnectionState({
      isConnected: true,
      isConnecting: false,
      account: data.account,
      chainId: data.chainId,
      uri: undefined,
    })
    // Close QR code modal on successful connection
    store.setShowQrCode(false)
  })

  walletConnect.on('disconnect', async () => {
    console.log('🔌 Wallet connection unexpectedly disconnected, clearing all user data')
    const currentAccount = useWalletStore.getState().account

    // Clear all cache and session data
    await clearAllUserData(currentAccount)

    store.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      account: undefined,
      chainId: undefined,
      uri: undefined,
    })

    console.log('✅ Wallet disconnection handling completed, all user data cleared')
  })

  walletConnect.on('accountsChanged', async (accounts: string[]) => {
    const newAccount = accounts[0] || undefined
    const currentAccount = useWalletStore.getState().account

    // If account changes, clear cache
    if (newAccount !== currentAccount && newAccount) {
      console.log('🧹 Wallet account switched, clearing cache to ensure data consistency', { from: currentAccount, to: newAccount })

      // Clear user registration status cache
      try {
        const { useUserRegistrationStore } = await import('./userRegistrationStore')
        await useUserRegistrationStore.getState().clearRegistrationCache()
        console.log('✅ userRegistrationStore cache cleared')
      } catch (error) {
        console.error('Failed to clear userRegistrationStore cache:', error)
      }

      // Clear SSH configuration cache
      try {
        const { useSSHConfigStore } = await import('./sshConfigStore')
        await useSSHConfigStore.getState().clearConfigCache()
        console.log('✅ sshConfigStore cache cleared')
      } catch (error) {
        console.error('Failed to clear sshConfigStore cache:', error)
      }
    }

    store.updateConnectionState({
      account: newAccount,
    })
  })

  walletConnect.on('chainChanged', (chainId: number) => {
    store.updateConnectionState({
      chainId,
    })
  })

  walletConnect.on('connecting', () => {
    store.updateConnectionState({
      isConnecting: true,
      error: undefined,
    })
  })

  walletConnect.on('error', (error: any) => {
    store.updateConnectionState({
      isConnecting: false,
      error: error instanceof Error ? error.message : 'Connection error',
    })
  })

  walletConnect.on('cancelled', () => {
    store.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      uri: undefined,
      error: undefined,
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
    canDisconnect: state.isConnected,
  }
}

// Initialize listeners when store is created
if (typeof window !== 'undefined') {
  initializeWalletListeners()

  // Automatically attempt to restore wallet connection on app startup
  setTimeout(async () => {
    const store = useWalletStore.getState()

    // If persistent state shows connected, attempt to restore connection
    if (store.isConnected && store.account) {
      console.log('🔄 Detected persistent wallet state, attempting to restore connection...')
      try {
        await store.connect()
        console.log('✅ Wallet connection restored')
      } catch (error) {
        console.warn('⚠️ Automatic wallet connection restore failed, user needs to manually reconnect:', error)
        // Clear invalid state
        store.updateConnectionState({
          isConnected: false,
          account: undefined,
          chainId: undefined,
        })
      }
    }
  }, 1000) // Delay 1 second to let the application fully initialize
}
