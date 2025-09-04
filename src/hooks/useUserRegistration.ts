import { useSSHContract } from './useSSHContract'
import { useWalletStore } from '@/stores/walletStore'
import { useEffect, useState, useRef } from 'react'

export function useUserRegistration() {
  const { account, isConnected } = useWalletStore()
  const { useIsRegistered, registerUser, isPending, isConfirmed } = useSSHContract()
  const { data: isRegistered, refetch } = useIsRegistered(account)
  
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false)
  const lastAccountRef = useRef<string | null>(null)

  // Refetch data only when account actually changes
  useEffect(() => {
    if (account && isConnected && lastAccountRef.current !== account) {
      console.log('Account changed, refetching registration status...', account)
      lastAccountRef.current = account
      refetch()
    }
  }, [account, isConnected]) // Depend on both to ensure proper triggering

  useEffect(() => {
    if (isConnected && account && isRegistered === false) {
      setShowRegistrationPrompt(true)
    } else {
      setShowRegistrationPrompt(false)
    }
  }, [isConnected, account, isRegistered])

  useEffect(() => {
    if (isConfirmed) {
      refetch()
      setShowRegistrationPrompt(false)
    }
  }, [isConfirmed])

  const handleRegister = async () => {
    try {
      await registerUser()
    } catch (error) {
      console.error('注册失败:', error)
    }
  }

  return {
    isRegistered: isRegistered || false,
    showRegistrationPrompt,
    handleRegister,
    isRegistering: isPending,
    registrationConfirmed: isConfirmed,
  }
}