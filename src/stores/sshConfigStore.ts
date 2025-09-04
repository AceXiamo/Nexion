import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { SSHConfigInput, DecryptedSSHConfig, SSHConfig } from '@/types/ssh'

export interface SSHConfigState {
  // 数据状态
  configs: DecryptedSSHConfig[]
  isLoading: boolean
  isDecrypting: boolean
  lastFetchedAccount: string | null
  lastFetchTime: number | null
  error: string | null
  
  // 统计信息
  totalConfigs: number
  activeConfigs: number
  
  // 操作状态
  isAdding: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // 动作
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
  clearConfigCache: (account?: string) => void
  setConfigs: (configs: DecryptedSSHConfig[]) => void
  clearError: () => void
}

export const useSSHConfigStore = create<SSHConfigState>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    configs: [],
    isLoading: false,
    isDecrypting: false,
    lastFetchedAccount: null,
    lastFetchTime: null,
    error: null,
    
    // 统计信息
    totalConfigs: 0,
    activeConfigs: 0,
    
    // 操作状态
    isAdding: false,
    isUpdating: false,
    isDeleting: false,
    
    // 获取配置（带缓存）
    fetchConfigs: async (
      account: string,
      fetchFn: (account: string) => Promise<SSHConfig[]>,
      decryptFn: (configs: SSHConfig[]) => Promise<DecryptedSSHConfig[]>,
      force = false
    ) => {
      const { lastFetchedAccount, configs, lastFetchTime } = get()
      
      // 如果是相同账户且有缓存数据且不强制刷新，直接返回
      if (
        !force &&
        lastFetchedAccount === account &&
        configs.length > 0 &&
        lastFetchTime &&
        Date.now() - lastFetchTime < 5 * 60 * 1000 // 5分钟缓存
      ) {
        console.log('Using cached SSH configs for account:', account, configs.length)
        return
      }
      
      // 如果账户不同，清空现有数据
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
        
        // 1. 从链上获取加密数据
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
        
        // 2. 解密配置数据
        const decryptedConfigs = await decryptFn(rawConfigs)
        console.log(`Successfully decrypted ${decryptedConfigs.length} configs`)
        
        // 3. 过滤活跃配置
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
        const errorMessage = error instanceof Error ? error.message : '获取配置失败'
        set({
          isLoading: false,
          isDecrypting: false,
          error: errorMessage
        })
        console.error('Failed to fetch SSH configs:', error)
        
        // 如果是用户取消签名，不抛出错误，保持静默
        if (errorMessage.includes('用户取消') || errorMessage.includes('User rejected')) {
          return
        }
        
        throw error
      }
    },
    
    // 添加配置
    addConfig: async (config: SSHConfigInput, addFn: (config: SSHConfigInput) => Promise<void>) => {
      set({ isAdding: true, error: null })
      
      try {
        await addFn(config)
        // 添加成功后不立即更新本地状态，等待后续的refetch
        console.log('SSH config added successfully')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '添加配置失败'
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
    
    // 更新配置
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
        const errorMessage = error instanceof Error ? error.message : '更新配置失败'
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
    
    // 删除配置
    deleteConfig: async (configId: string, deleteFn: (configId: string) => Promise<void>) => {
      set({ isDeleting: true, error: null })
      
      try {
        await deleteFn(configId)
        
        // 从本地状态中移除配置
        const { configs } = get()
        const updatedConfigs = configs.filter(config => config.id !== configId)
        set({
          configs: updatedConfigs,
          activeConfigs: updatedConfigs.length,
          totalConfigs: updatedConfigs.length
        })
        
        console.log('SSH config deleted successfully')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '删除配置失败'
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
    
    // 清空配置缓存
    clearConfigCache: (account?: string) => {
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
    },
    
    // 直接设置配置数据
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
    
    // 清除错误
    clearError: () => {
      set({ error: null })
    }
  }))
)

// 计算选择器
export const useSSHConfigSelectors = () => {
  const state = useSSHConfigStore()
  
  return {
    // 是否有缓存数据
    hasCachedConfigs: state.configs.length > 0 && state.lastFetchTime !== null,
    // 是否应该显示加载状态
    shouldShowLoading: state.isLoading && state.configs.length === 0,
    // 是否应该显示解密状态
    shouldShowDecrypting: state.isDecrypting,
    // 是否有任何操作进行中
    isProcessing: state.isLoading || state.isDecrypting || state.isAdding || state.isUpdating || state.isDeleting,
    // 是否可以进行操作
    canPerformAction: !state.isLoading && !state.isDecrypting,
    // 缓存时间信息
    cacheAge: state.lastFetchTime ? Date.now() - state.lastFetchTime : null,
    isCacheValid: state.lastFetchTime ? Date.now() - state.lastFetchTime < 5 * 60 * 1000 : false
  }
}