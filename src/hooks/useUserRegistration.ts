import { useSSHContract } from './useSSHContract'
import { useWalletStore } from '@/stores/walletStore'
import { useUserRegistrationStore } from '@/stores/userRegistrationStore'
import { useEffect } from 'react'

export function useUserRegistration() {
  const { account, isConnected } = useWalletStore()
  const { useIsRegistered, registerUser, isPending, isConfirmed } = useSSHContract()
  const { refetch } = useIsRegistered(account!)

  const { isRegistered, showRegistrationPrompt, isRegistering, registrationConfirmed, error, checkRegistrationStatus, handleRegister, setRegistrationConfirmed, clearRegistrationCache } =
    useUserRegistrationStore()

  // 检查注册状态，当账户连接时
  useEffect(() => {
    if (account && isConnected) {
      checkRegistrationStatus(account, async (account) => {
        console.log('Fetching registration status from contract for:', account)
        const result = await refetch()
        console.log('------result', result)
        return result || false
      })
    } else if (!account || !isConnected) {
      // 钱包断开时清空缓存
      clearRegistrationCache()
    }
  }, [account, isConnected, refetch, checkRegistrationStatus, clearRegistrationCache])

  // 处理注册确认状态变化
  useEffect(() => {
    if (isConfirmed !== registrationConfirmed) {
      setRegistrationConfirmed(isConfirmed)
      if (isConfirmed && account) {
        // 注册确认后重新检查状态
        setTimeout(() => {
          checkRegistrationStatus(account, async () => {
            const result = await refetch()
            return result || false
          })
        }, 1000)
      }
    }
  }, [isConfirmed, registrationConfirmed, setRegistrationConfirmed, account, checkRegistrationStatus, refetch])

  const handleRegisterWrapper = async () => {
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
