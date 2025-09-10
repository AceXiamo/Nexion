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

  // Use ref to track if registration confirmation has been handled
  const hasHandledConfirmation = useRef(false)

  // Stabilized check function
  const stableCheckRegistration = useCallback(async (accountToCheck: string) => {
    console.log('Fetching registration status from contract for:', accountToCheck)
    const result = await refetch()
    console.log('------result', result)
    return result || false
  }, [refetch])

  // Check registration status when account is connected
  useEffect(() => {
    if (account && isConnected) {
      checkRegistrationStatus(account, stableCheckRegistration)
    } else if (!account || !isConnected) {
      // Clear cache when wallet is disconnected
      clearRegistrationCache()
      hasHandledConfirmation.current = false
    }
  }, [account, isConnected, stableCheckRegistration, checkRegistrationStatus, clearRegistrationCache])

  // Handle registration confirmation state changes - only handle once
  useEffect(() => {
    if (isConfirmed && !registrationConfirmed && !hasHandledConfirmation.current) {
      hasHandledConfirmation.current = true
      setRegistrationConfirmed(isConfirmed)
      
      if (account) {
        // Delay re-checking status to give blockchain time to update
        setTimeout(() => {
          checkRegistrationStatus(account, stableCheckRegistration)
        }, 2000) // Increase delay to 2 seconds
      }
    }
    
    // Reset flag when isConfirmed becomes false (new transaction starts)
    if (!isConfirmed && hasHandledConfirmation.current) {
      hasHandledConfirmation.current = false
    }
  }, [isConfirmed, registrationConfirmed, account, stableCheckRegistration, checkRegistrationStatus, setRegistrationConfirmed])

  const handleRegisterWrapper = async () => {
    hasHandledConfirmation.current = false // Reset flag
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

