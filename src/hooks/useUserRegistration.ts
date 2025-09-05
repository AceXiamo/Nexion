import { useSSHContract } from './useSSHContract'
import { useWalletStore } from '@/stores/walletStore'
import { useUserRegistrationStore } from '@/stores/userRegistrationStore'
import { useEffect, useCallback, useRef } from 'react'

export function useUserRegistration() {
  const { account, isConnected } = useWalletStore()
  const { useIsRegistered, registerUser, isPending, isConfirmed } = useSSHContract()
  const { refetch } = useIsRegistered(account!)

  const { isRegistered, showRegistrationPrompt, isRegistering, registrationConfirmed, error, checkRegistrationStatus, handleRegister, setRegistrationConfirmed, clearRegistrationCache } =
    useUserRegistrationStore()

  // 使用ref来跟踪是否已经处理过注册确认
  const hasHandledConfirmation = useRef(false)

  // 稳定化的检查函数
  const stableCheckRegistration = useCallback(async (accountToCheck: string) => {
    console.log('Fetching registration status from contract for:', accountToCheck)
    const result = await refetch()
    console.log('------result', result)
    return result || false
  }, [refetch])

  // 检查注册状态，当账户连接时
  useEffect(() => {
    if (account && isConnected) {
      checkRegistrationStatus(account, stableCheckRegistration)
    } else if (!account || !isConnected) {
      // 钱包断开时清空缓存
      clearRegistrationCache()
      hasHandledConfirmation.current = false
    }
  }, [account, isConnected, stableCheckRegistration, checkRegistrationStatus, clearRegistrationCache])

  // 处理注册确认状态变化 - 只处理一次
  useEffect(() => {
    if (isConfirmed && !registrationConfirmed && !hasHandledConfirmation.current) {
      hasHandledConfirmation.current = true
      setRegistrationConfirmed(isConfirmed)
      
      if (account) {
        // 延迟重新检查状态，给区块链时间更新
        setTimeout(() => {
          checkRegistrationStatus(account, stableCheckRegistration)
        }, 2000) // 增加延迟到2秒
      }
    }
    
    // 重置标志当isConfirmed变为false时（新的交易开始）
    if (!isConfirmed && hasHandledConfirmation.current) {
      hasHandledConfirmation.current = false
    }
  }, [isConfirmed, registrationConfirmed, account, stableCheckRegistration, checkRegistrationStatus, setRegistrationConfirmed])

  const handleRegisterWrapper = async () => {
    hasHandledConfirmation.current = false // 重置标志
    await handleRegister(async () => {
      await registerUser()
    })
  }

  return {
    isRegistered: isRegistered || false,
    showRegistrationPrompt,
    handleRegister: handleRegisterWrapper,
    isRegistering: isRegistering || isPending,
    registrationConfirmed,
    error,
  }
}

