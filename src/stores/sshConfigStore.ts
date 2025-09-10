import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { electronPersist } from './electronPersist'
import type { SSHConfigInput, DecryptedSSHConfig, SSHConfig } from '@/types/ssh'

export interface SSHConfigState {
  // Data state
  configs: DecryptedSSHConfig[]
  isLoading: boolean
  isDecrypting: boolean
  lastFetchedAccount: string | null
  lastFetchTime: number | null
  error: string | null
  
  // Statistics
  totalConfigs: number
  activeConfigs: number
  
  // Operation state
  isAdding: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Actions
  fetchConfigs: (
    account: string,
    fetchFn: (account: string) => Promise<SSHConfig[]>,
    decryptFn: (configs: SSHConfig[]) => Promise<DecryptedSSHConfig[]>,
    force?: boolean
  ) => Promise<void>
  addConfig: (config: SSHConfigInput, addFn: (config: SSHConfigInput) => Promise<void>) => Promise<void>
  updateConfig: (
    configId: string,
    config: SSHConfigInput,
    updateFn: (configId: string, config: SSHConfigInput) => Promise<void>
  ) => Promise<void>
  deleteConfig: (configId: string, deleteFn: (configId: string) => Promise<void>) => Promise<void>
  clearConfigCache: (account?: string) => Promise<void>
  setConfigs: (configs: DecryptedSSHConfig[]) => void
  clearError: () => void
}

export const useSSHConfigStore = create<SSHConfigState>()(
  electronPersist(
    subscribeWithSelector((set, get) => ({
    // Initial state
    configs: [],
    isLoading: false,
    isDecrypting: false,
    lastFetchedAccount: null,
    lastFetchTime: null,
    error: null,
    
    // Statistics
    totalConfigs: 0,
    activeConfigs: 0,
    
    // Operation state
    isAdding: false,
    isUpdating: false,
    isDeleting: false,
    
    // Get configurations (with cache)
    fetchConfigs: async (
      account: string,
      fetchFn: (account: string) => Promise<SSHConfig[]>,
      decryptFn: (configs: SSHConfig[]) => Promise<DecryptedSSHConfig[]>,
      force = false
    ) => {
      const { lastFetchedAccount, configs, lastFetchTime } = get()
      
      // If same account with cached data and not forced refresh, return directly
      if (
        !force &&
        lastFetchedAccount === account &&
        configs.length > 0 &&
        lastFetchTime &&
        Date.now() - lastFetchTime < 5 * 60 * 1000 // 5 minute cache
      ) {
        console.log('Using cached SSH configs for account:', account, configs.length)
        return
      }
      
      // If different account, clear existing data
      if (lastFetchedAccount !== account) {
        set({
          configs: [],
          lastFetchedAccount: account,
          lastFetchTime: null,
          error: null,
          totalConfigs: 0,
          activeConfigs: 0
        })
      }
      
      set({ isLoading: true, error: null })
      
      try {
        console.log('Fetching SSH configs from blockchain for account:', account)
        
        // 1. Get encrypted data from blockchain
        const rawConfigs = await fetchFn(account)
        console.log(`Fetched ${rawConfigs.length} raw configs from blockchain`)
        
        if (rawConfigs.length === 0) {
          set({
            configs: [],
            isLoading: false,
            lastFetchTime: Date.now(),
            totalConfigs: 0,
            activeConfigs: 0
          })
          return
        }
        
        set({ isDecrypting: true })
        
        // 2. Decrypt configuration data
        const decryptedConfigs = await decryptFn(rawConfigs)
        console.log(`Successfully decrypted ${decryptedConfigs.length} configs`)
        
        // 3. Filter active configurations
        const activeConfigs = decryptedConfigs.filter(config => config.isActive)
        
        set({
          configs: activeConfigs,
          isLoading: false,
          isDecrypting: false,
          lastFetchTime: Date.now(),
          totalConfigs: decryptedConfigs.length,
          activeConfigs: activeConfigs.length,
          error: null
        })
        
        console.log('SSH configs updated:', {
          total: decryptedConfigs.length,
          active: activeConfigs.length,
          account
        })
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get configuration'
        set({
          isLoading: false,
          isDecrypting: false,
          error: errorMessage
        })
        console.error('Failed to fetch SSH configs:', error)
        
        // If user cancelled signature, don't throw error, remain silent
        if (errorMessage.includes('用户取消') || errorMessage.includes('User rejected')) {
          return
        }
        
        throw error
      }
    },
    
    // Add configuration
    addConfig: async (config: SSHConfigInput, addFn: (config: SSHConfigInput) => Promise<void>) => {
      set({ isAdding: true, error: null })
      
      try {
        await addFn(config)
        // Don't immediately update local state after successful addition, wait for subsequent refetch
        console.log('SSH config added successfully')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add configuration'
        set({
          error: errorMessage,
          isAdding: false
        })
        console.error('Failed to add SSH config:', error)
        throw error
      } finally {
        set({ isAdding: false })
      }
    },
    
    // Update configuration
    updateConfig: async (
      configId: string,
      config: SSHConfigInput,
      updateFn: (configId: string, config: SSHConfigInput) => Promise<void>
    ) => {
      set({ isUpdating: true, error: null })
      
      try {
        await updateFn(configId, config)
        console.log('SSH config updated successfully')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update configuration'
        set({
          error: errorMessage,
          isUpdating: false
        })
        console.error('Failed to update SSH config:', error)
        throw error
      } finally {
        set({ isUpdating: false })
      }
    },
    
    // Delete configuration
    deleteConfig: async (configId: string, deleteFn: (configId: string) => Promise<void>) => {
      set({ isDeleting: true, error: null })
      
      try {
        await deleteFn(configId)
        
        // Remove configuration from local state
        const { configs } = get()
        const updatedConfigs = configs.filter(config => config.id !== configId)
        set({
          configs: updatedConfigs,
          activeConfigs: updatedConfigs.length,
          totalConfigs: updatedConfigs.length
        })
        
        console.log('SSH config deleted successfully')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete configuration'
        set({
          error: errorMessage,
          isDeleting: false
        })
        console.error('Failed to delete SSH config:', error)
        throw error
      } finally {
        set({ isDeleting: false })
      }
    },
    
    // Clear configuration cache
    clearConfigCache: async (account?: string) => {
      if (account) {
        const { lastFetchedAccount } = get()
        if (lastFetchedAccount === account) {
          set({
            configs: [],
            lastFetchTime: null,
            error: null,
            totalConfigs: 0,
            activeConfigs: 0
          })
          console.log('Cleared SSH config cache for account:', account)
        }
      } else {
        set({
          configs: [],
          lastFetchedAccount: null,
          lastFetchTime: null,
          error: null,
          totalConfigs: 0,
          activeConfigs: 0
        })
        console.log('Cleared all SSH config cache')
      }
      
      // Clear persistent storage
      try {
        if (window.ipcRenderer?.store) {
          await window.ipcRenderer.store.delete('ssh-config-store')
        }
      } catch (error) {
        console.error('Failed to clear SSH config cache from electron-store:', error)
      }
    },
    
    // Directly set configuration data
    setConfigs: (configs: DecryptedSSHConfig[]) => {
      const activeConfigs = configs.filter(config => config.isActive)
      set({
        configs: activeConfigs,
        totalConfigs: configs.length,
        activeConfigs: activeConfigs.length,
        lastFetchTime: Date.now(),
        error: null
      })
    },
    
    // Clear error
    clearError: () => {
      set({ error: null })
    }
  })),
  {
    name: 'ssh-config-store',
    partialize: (state) => ({
      configs: state.configs,
      lastFetchedAccount: state.lastFetchedAccount,
      lastFetchTime: state.lastFetchTime,
      totalConfigs: state.totalConfigs,
      activeConfigs: state.activeConfigs,
    }),
  }
))

// Computed selectors
export const useSSHConfigSelectors = () => {
  const state = useSSHConfigStore()
  console.log('state', state)
  
  return {
    // Whether there is cached data
    hasCachedConfigs: state.configs.length > 0 && state.lastFetchTime !== null,
    // Whether loading state should be displayed
    shouldShowLoading: state.isLoading && state.configs.length === 0,
    // Whether decryption state should be displayed
    shouldShowDecrypting: state.isDecrypting,
    // Whether any operation is in progress
    isProcessing: state.isLoading || state.isDecrypting || state.isAdding || state.isUpdating || state.isDeleting,
    // Whether operations can be performed
    canPerformAction: !state.isLoading && !state.isDecrypting,
    // Cache time information
    cacheAge: state.lastFetchTime ? Date.now() - state.lastFetchTime : null,
    isCacheValid: state.lastFetchTime ? Date.now() - state.lastFetchTime < 5 * 60 * 1000 : false
  }
}
