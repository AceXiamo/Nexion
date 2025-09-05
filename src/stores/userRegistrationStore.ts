import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface UserRegistrationState {
  // 状态
  isRegistered: boolean | null // null=未知, false=未注册, true=已注册
  isLoading: boolean
  lastCheckedAccount: string | null
  showRegistrationPrompt: boolean
  
  // 注册操作状态
  isRegistering: boolean
  registrationConfirmed: boolean
  error: string | null
  
  // 动作
  checkRegistrationStatus: (account: string, checkFn: (account: string) => Promise<boolean>) => Promise<void>
  setRegistrationStatus: (status: boolean) => void
  clearRegistrationCache: () => void
  setShowRegistrationPrompt: (show: boolean) => void
  handleRegister: (registerFn: () => Promise<void>) => Promise<void>
  setRegistrationConfirmed: (confirmed: boolean) => void
  clearError: () => void
}

export const useUserRegistrationStore = create<UserRegistrationState>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    isRegistered: null,
    isLoading: false,
    lastCheckedAccount: null,
    showRegistrationPrompt: false,
    
    // 注册操作状态
    isRegistering: false,
    registrationConfirmed: false,
    error: null,
    
    // 检查注册状态（带缓存）
    checkRegistrationStatus: async (account: string, checkFn: (account: string) => Promise<boolean>) => {
      const { lastCheckedAccount, isRegistered } = get()
      
      // 如果是相同账户且已有缓存结果，直接返回
      // if (lastCheckedAccount === account && isRegistered !== null) {
      //   console.log('Using cached registration status for account:', account, isRegistered)
      //   return
      // }
      
      // 如果账户不同，重置状态
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
          showRegistrationPrompt: !status, // 未注册时显示提示
        })
        
        console.log('Registration status updated:', { account, status })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '检查注册状态失败'
        set({
          isLoading: false,
          error: errorMessage,
          showRegistrationPrompt: false
        })
        console.error('Failed to check registration status:', error)
      }
    },
    
    // 直接设置注册状态
    setRegistrationStatus: (status: boolean) => {
      console.log('setRegistrationStatus', status)
      set({
        isRegistered: status,
        showRegistrationPrompt: !status,
        error: null
      })
    },
    
    // 清空注册缓存
    clearRegistrationCache: () => {
      set({
        isRegistered: null,
        lastCheckedAccount: null,
        showRegistrationPrompt: false,
        error: null
      })
    },
    
    // 设置注册提示显示状态
    setShowRegistrationPrompt: (show: boolean) => {
      set({ showRegistrationPrompt: show })
    },
    
    // 处理注册操作
    handleRegister: async (registerFn: () => Promise<void>) => {
      set({ isRegistering: true, error: null })
      
      try {
        await registerFn()
        console.log('Registration initiated successfully')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '注册失败'
        set({
          error: errorMessage,
          isRegistering: false
        })
        console.error('Registration failed:', error)
        throw error
      }
    },
    
    // 设置注册确认状态
    setRegistrationConfirmed: (confirmed: boolean) => {
      set({
        registrationConfirmed: confirmed,
        isRegistering: false
      })
      
      if (confirmed) {
        // 注册确认后，清空缓存以便重新查询状态
        set({
          isRegistered: null,
          showRegistrationPrompt: false
        })
      }
    },
    
    // 清除错误
    clearError: () => {
      set({ error: null })
    }
  }))
)

// 计算选择器
export const useUserRegistrationSelectors = () => {
  const state = useUserRegistrationStore()
  
  return {
    // 是否已知注册状态（不是null）
    hasRegistrationStatus: state.isRegistered !== null,
    // 是否应该显示加载状态
    shouldShowLoading: state.isLoading && state.isRegistered === null,
    // 是否应该显示注册提示
    shouldShowRegistrationPrompt: state.showRegistrationPrompt && state.isRegistered === false,
    // 操作状态
    isProcessing: state.isLoading || state.isRegistering
  }
}
