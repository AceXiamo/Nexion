import { useAccount } from 'wagmi'
import { useSSHContract } from './useSSHContract'
import { useEffect, useState } from 'react'

export function useUserRegistration() {
  const { address, isConnected } = useAccount()
  const { useIsRegistered, registerUser, isPending, isConfirmed } = useSSHContract()
  const { data: isRegistered, refetch } = useIsRegistered(address)
  
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false)

  useEffect(() => {
    if (isConnected && address && isRegistered === false) {
      setShowRegistrationPrompt(true)
    } else {
      setShowRegistrationPrompt(false)
    }
  }, [isConnected, address, isRegistered])

  useEffect(() => {
    if (isConfirmed) {
      refetch()
      setShowRegistrationPrompt(false)
    }
  }, [isConfirmed, refetch])

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