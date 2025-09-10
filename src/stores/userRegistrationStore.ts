import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { electronPersist } from './electronPersist'

export interface UserRegistrationState {
  // State
  isRegistered: boolean | null // null=unknown, false=not registered, true=registered
  isLoading: boolean
  lastCheckedAccount: string | null
  showRegistrationPrompt: boolean
  
  // Registration operation state
  isRegistering: boolean
  registrationConfirmed: boolean
  error: string | null
  
  // Actions
  checkRegistrationStatus: (account: string, checkFn: (account: string) => Promise<boolean>) => Promise<void>
  setRegistrationStatus: (status: boolean) => void
  clearRegistrationCache: () => Promise<void>
  setShowRegistrationPrompt: (show: boolean) => void
  handleRegister: (registerFn: () => Promise<void>) => Promise<void>
  setRegistrationConfirmed: (confirmed: boolean) => void
  clearError: () => void
}

export const useUserRegistrationStore = create<UserRegistrationState>()(
  electronPersist(
    subscribeWithSelector((set, get) => ({
    // Initial state
    isRegistered: null,
    isLoading: false,
    lastCheckedAccount: null,
    showRegistrationPrompt: false,
    
    // Registration operation state
    isRegistering: false,
    registrationConfirmed: false,
    error: null,
    
    // Check registration status (with cache)
    checkRegistrationStatus: async (account: string, checkFn: (account: string) => Promise<boolean>) => {
      const { lastCheckedAccount, isRegistered } = get()
      
      // If same account with cached result, return directly
      if (lastCheckedAccount === account && isRegistered !== null) {
        console.log('Using cached registration status for account:', account, isRegistered)
        return
      }
      
      // If different account, reset state
      if (lastCheckedAccount !== account) {
        set({
          isRegistered: null,
          lastCheckedAccount: account,
          showRegistrationPrompt: false,
          error: null
        })
      }
      
      set({ isLoading: true, error: null })
      
      try {
        console.log('Checking registration status for account:', account)
        const status = await checkFn(account)
        
        set({
          isRegistered: status,
          lastCheckedAccount: account,
          isLoading: false,
          showRegistrationPrompt: !status, // Show prompt when not registered
        })
        
        console.log('Registration status updated:', { account, status })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to check registration status'
        set({
          isLoading: false,
          error: errorMessage,
          showRegistrationPrompt: false
        })
        console.error('Failed to check registration status:', error)
      }
    },
    
    // Directly set registration status
    setRegistrationStatus: (status: boolean) => {
      console.log('setRegistrationStatus', status)
      set({
        isRegistered: status,
        showRegistrationPrompt: !status,
        error: null
      })
    },
    
    // Clear registration cache
    clearRegistrationCache: async () => {
      set({
        isRegistered: null,
        lastCheckedAccount: null,
        showRegistrationPrompt: false,
        error: null
      })
      
      // Clear persistent storage
      try {
        if (window.ipcRenderer?.store) {
          await window.ipcRenderer.store.delete('user-registration-store')
        }
      } catch (error) {
        console.error('Failed to clear registration cache from electron-store:', error)
      }
    },
    
    // Set registration prompt display state
    setShowRegistrationPrompt: (show: boolean) => {
      set({ showRegistrationPrompt: show })
    },
    
    // Handle registration operation
    handleRegister: async (registerFn: () => Promise<void>) => {
      set({ isRegistering: true, error: null })
      
      try {
        await registerFn()
        console.log('Registration initiated successfully')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Registration failed'
        set({
          error: errorMessage,
          isRegistering: false
        })
        console.error('Registration failed:', error)
        throw error
      }
    },
    
    // Set registration confirmation state
    setRegistrationConfirmed: (confirmed: boolean) => {
      set({
        registrationConfirmed: confirmed,
        isRegistering: false
      })
      
      if (confirmed) {
        // After registration confirmation, clear cache to re-query status
        set({
          isRegistered: null,
          showRegistrationPrompt: false
        })
      }
    },
    
    // Clear error
    clearError: () => {
      set({ error: null })
    }
  })),
  {
    name: 'user-registration-store',
    partialize: (state) => ({
      isRegistered: state.isRegistered,
      lastCheckedAccount: state.lastCheckedAccount,
    }),
  }
))

// Computed selectors
export const useUserRegistrationSelectors = () => {
  const state = useUserRegistrationStore()
  
  return {
    // Whether registration status is known (not null)
    hasRegistrationStatus: state.isRegistered !== null,
    // Whether loading state should be displayed
    shouldShowLoading: state.isLoading && state.isRegistered === null,
    // Whether registration prompt should be displayed
    shouldShowRegistrationPrompt: state.showRegistrationPrompt && state.isRegistered === false,
    // Operation status
    isProcessing: state.isLoading || state.isRegistering
  }
}
