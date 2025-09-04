import { useState, useCallback, useEffect, useMemo } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { useSSHContract } from './useSSHContract'
import { WalletBasedEncryptionService } from '@/services/encryption'
import type { SSHConfigInput, DecryptedSSHConfig, SSHConfig } from '@/types/ssh'
import toast from 'react-hot-toast'

export interface UseSSHConfigsReturn {
  // Data state
  configs: DecryptedSSHConfig[]
  isLoading: boolean
  error: string | null

  // Statistics
  totalConfigs: number
  activeConfigs: number

  // Action functions
  addConfig: (config: SSHConfigInput) => Promise<void>
  updateConfig: (configId: string, config: SSHConfigInput) => Promise<void>
  deleteConfig: (configId: string) => Promise<void>
  refreshConfigs: () => Promise<void>
  clearMasterKeyCache: () => void

  // Action states
  isAdding: boolean
  isUpdating: boolean
  isDeleting: boolean
}

export function useSSHConfigs(): UseSSHConfigsReturn {
  const { address, isConnected } = useAccount()
  const { signMessageAsync, error: signError } = useSignMessage()
  const sshContract = useSSHContract()

  // Local state
  const [configs, setConfigs] = useState<DecryptedSSHConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Get configuration data from the blockchain
  const { data: rawConfigs, isLoading: isContractLoading, refetch: refetchConfigs } = sshContract.useGetSSHConfigs(address)

  // Clean up expired persistent cache on application startup
  useEffect(() => {
    WalletBasedEncryptionService.cleanupExpiredPersistentCache()
  }, [])

  // Unified processing of on-chain data decryption and conversion
  const processRawConfigs = useCallback(
    async (rawConfigs: SSHConfig[]): Promise<void> => {
      if (!address || !signMessageAsync || !rawConfigs) {
        console.log('Processing skipped: missing necessary parameters')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const decryptedConfigs: DecryptedSSHConfig[] = []

        console.log(`Start processing ${rawConfigs.length} configurations with master key cache optimization`)

        // Process all configurations sequentially (the first configuration will trigger master key derivation and caching, subsequent configurations will use the cache)
        for (const rawConfig of rawConfigs) {
          try {
            const configId = rawConfig.configId.toString()
            console.log('Decrypting config ID:', configId)

            // Decrypt configuration (will automatically use master key cache)
            const decryptedConfig = await WalletBasedEncryptionService.decryptSSHConfig(
              rawConfig.encryptedData,
              address,
              configId,
              new Date(Number(rawConfig.timestamp) * 1000),
              rawConfig.isActive,
              signMessageAsync,
            )

            decryptedConfigs.push(decryptedConfig)
            console.log('Configuration decrypted successfully:', configId)
          } catch (error) {
            console.error(`Failed to decrypt config ${rawConfig.configId}:`, error)

            // Check if the user cancelled the signature
            if (error instanceof Error && error.message.includes('User rejected the request')) {
              console.log('User cancelled signature, stopping processing')
              setError('User cancelled the signature operation')
              return
            }

            // Add error placeholder
            decryptedConfigs.push({
              id: rawConfig.configId.toString(),
              name: '⚠️ Decryption Failed',
              host: 'unknown',
              port: 22,
              username: 'unknown',
              authType: 'password',
              createdAt: new Date(Number(rawConfig.timestamp) * 1000),
              updatedAt: new Date(Number(rawConfig.timestamp) * 1000),
              isActive: rawConfig.isActive,
            })
          }
        }

        setConfigs(decryptedConfigs)
        console.log('Configuration processing complete, number of decrypted configs:', decryptedConfigs.length)

        // Output cache status (for debugging)
        const cacheStatus = WalletBasedEncryptionService.getCacheStatus()
        console.log('Master key cache status:', {
          'Memory cache': `${cacheStatus.memoryCache.cacheSize} items [${cacheStatus.memoryCache.cachedAddresses.join(', ')}]`,
          'Persistent cache': `${cacheStatus.persistentCache.cacheSize} items [${cacheStatus.persistentCache.cachedAddresses.join(', ')}]`,
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process configurations'
        setError(errorMessage)
        console.error('Failed to process configurations:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [address, signMessageAsync],
  )

  // Manually refresh the configuration list (re-fetch on-chain data)
  const refreshConfigs = useCallback(async () => {
    console.log('Manually refreshing configs: re-fetching on-chain data')
    await refetchConfigs()
  }, [refetchConfigs])

  // Clear master key cache (for debugging/troubleshooting)
  const clearMasterKeyCache = useCallback(() => {
    if (address) {
      WalletBasedEncryptionService.clearMasterKeyCache(address)
      console.log('Cleared master key cache for the current wallet')
    }
  }, [address])

  // Add new configuration
  const addConfig = useCallback(
    async (config: SSHConfigInput) => {
      if (!address || !isConnected) {
        throw new Error('Please connect your wallet first')
      }

      if (!signMessageAsync) {
        throw new Error('Signing feature is not available, please check your wallet connection')
      }

      setIsAdding(true)

      try {
        // 1. Encrypt configuration data
        const encryptedData = await WalletBasedEncryptionService.encryptSSHConfig(config, address, signMessageAsync)

        // 2. Add to the blockchain
        await sshContract.addSSHConfig(encryptedData)

        toast.success('SSH config submitted successfully! Waiting for blockchain confirmation...')

        // 3. Refresh immediately once (might get new data)
        setTimeout(async () => {
          console.log('Auto-refreshing config list after 1 second')
          await refetchConfigs()
        }, 1000)

        // 4. Refresh again with a delay to ensure data is fetched
        setTimeout(async () => {
          console.log('Refreshing config list again after 5 seconds')
          await refetchConfigs()
        }, 5000)
      } catch (error) {
        let errorMessage = 'Failed to add configuration'

        if (error instanceof Error) {
          errorMessage = error.message
        } else if (signError) {
          errorMessage = 'Signature failed, please try again'
        }

        toast.error(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setIsAdding(false)
      }
    },
    [address, isConnected, signMessageAsync, signError, sshContract, refetchConfigs],
  )

  // Update configuration
  const updateConfig = useCallback(
    async (configId: string, config: SSHConfigInput) => {
      if (!address || !isConnected) {
        throw new Error('Please connect your wallet first')
      }

      if (!signMessageAsync) {
        throw new Error('Signing feature is not available, please check your wallet connection')
      }

      setIsUpdating(true)

      try {
        // 1. Encrypt new configuration data
        const encryptedData = await WalletBasedEncryptionService.encryptSSHConfig(config, address, signMessageAsync)

        // 2. Update blockchain configuration
        await sshContract.updateSSHConfig(BigInt(configId), encryptedData)

        toast.success('SSH config updated successfully!')

        // 3. Refresh configuration list
        if (sshContract.isConfirmed) {
          await refetchConfigs()
        }
      } catch (error) {
        let errorMessage = 'Failed to update configuration'

        if (error instanceof Error) {
          errorMessage = error.message
        } else if (signError) {
          errorMessage = 'Signature failed, please try again'
        }

        toast.error(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setIsUpdating(false)
      }
    },
    [address, isConnected, signMessageAsync, signError, sshContract, refetchConfigs],
  )

  // Delete configuration
  const deleteConfig = useCallback(
    async (configId: string) => {
      if (!address || !isConnected) {
        throw new Error('Please connect your wallet first')
      }

      setIsDeleting(true)

      try {
        // 1. Revoke blockchain configuration
        await sshContract.revokeConfig(BigInt(configId))

        toast.success('SSH config deleted successfully!')

        // 2. Refresh configuration list
        if (sshContract.isConfirmed) {
          await refetchConfigs()
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete configuration'
        toast.error(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setIsDeleting(false)
      }
    },
    [address, isConnected, sshContract, refetchConfigs, refreshConfigs],
  )

  // Statistics
  const { totalConfigs, activeConfigs } = useMemo(() => {
    return {
      totalConfigs: configs.length,
      activeConfigs: configs.filter((config) => config.isActive).length,
    }
  }, [configs])

  // Watch for rawConfigs changes and automatically handle decryption
  useEffect(() => {
    if (rawConfigs && address && isConnected && !isContractLoading) {
      processRawConfigs(rawConfigs)
    }
  }, [rawConfigs, address, isConnected, isContractLoading, processRawConfigs])

  // Watch for wallet address changes
  useEffect(() => {
    // When address changes, clear the config list and cache
    if (!address) {
      setConfigs([])
      // Clear all master key caches (user disconnected)
      WalletBasedEncryptionService.clearMasterKeyCache()
    }
  }, [address])

  return {
    // Data state
    configs: configs.filter((config) => config.isActive), // Only return active configurations
    isLoading: isLoading || isContractLoading,
    error,

    // Statistics
    totalConfigs,
    activeConfigs,

    // Action functions
    addConfig,
    updateConfig,
    deleteConfig,
    refreshConfigs,
    clearMasterKeyCache,

    // Action states
    isAdding,
    isUpdating,
    isDeleting,
  }
}

/**
 * Hook to get a single SSH configuration
 */
export function useSSHConfig(configId: string) {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const sshContract = useSSHContract()
  const [config, setConfig] = useState<DecryptedSSHConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: rawConfig, isLoading: isContractLoading } = sshContract.useGetSSHConfig(address, BigInt(configId))

  const fetchConfig = useCallback(async () => {
    if (!address || !rawConfig || !configId || !isConnected || !signMessageAsync) return

    setIsLoading(true)
    setError(null)

    try {
      // Directly decrypt configuration, without using cache
      const decryptedConfig = await WalletBasedEncryptionService.decryptSSHConfig(
        rawConfig.encryptedData,
        address,
        configId,
        new Date(Number(rawConfig.timestamp) * 1000),
        rawConfig.isActive,
        signMessageAsync,
      )

      setConfig(decryptedConfig)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get configuration'
      setError(errorMessage)
      console.error('Failed to get single configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }, [address, rawConfig, configId, isConnected, signMessageAsync])

  useEffect(() => {
    if (rawConfig && address && !isContractLoading) {
      fetchConfig()
    }
  }, [rawConfig, address, isContractLoading, fetchConfig])

  return {
    config,
    isLoading: isLoading || isContractLoading,
    error,
    refetch: fetchConfig,
  }
}
