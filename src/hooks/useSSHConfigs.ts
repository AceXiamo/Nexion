import { useState, useCallback, useEffect, useRef } from 'react'
import { useSSHContract } from './useSSHContract'
import { WalletBasedEncryptionService } from '@/services/encryption'
import { useWalletStore } from '@/stores/walletStore'
import { useSSHConfigStore } from '@/stores/sshConfigStore'
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
  const { account, isConnected, signMessage } = useWalletStore()
  const sshContract = useSSHContract()
  const lastAccountRef = useRef<string | null>(null)

  // Get configuration data from the blockchain
  const { data: rawConfigs, isLoading: isContractLoading, refetch: refetchConfigs } = sshContract.useGetSSHConfigs(account!)

  // Store state and actions
  const {
    configs,
    isLoading,
    error,
    totalConfigs,
    activeConfigs,
    isAdding,
    isUpdating,
    isDeleting,
    fetchConfigs,
    addConfig: addConfigToStore,
    updateConfig: updateConfigInStore,
    deleteConfig: deleteConfigFromStore,
    clearConfigCache
  } = useSSHConfigStore()

  // Clean up expired persistent cache on application startup
  useEffect(() => {
    WalletBasedEncryptionService.cleanupExpiredPersistentCache()
  }, [])

  // Unified processing of on-chain data decryption and conversion
  const processRawConfigs = useCallback(
    async (rawConfigs: SSHConfig[]): Promise<DecryptedSSHConfig[]> => {
      if (!account || !signMessage || !rawConfigs) {
        console.log('Processing skipped: missing necessary parameters')
        return []
      }

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
            account,
            configId,
            new Date(Number(rawConfig.timestamp) * 1000),
            rawConfig.isActive,
            signMessage
          )

          decryptedConfigs.push(decryptedConfig)
          console.log('Configuration decrypted successfully:', configId)
        } catch (error) {
          console.error(`Failed to decrypt config ${rawConfig.configId}:`, error)

          // Check if the user cancelled the signature
          if (error instanceof Error && error.message.includes('User rejected the request')) {
            console.log('User cancelled signature, stopping processing')
            throw new Error('用户取消了签名操作')
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

      console.log('Configuration processing complete, number of decrypted configs:', decryptedConfigs.length)

      // Output cache status (for debugging)
      const cacheStatus = WalletBasedEncryptionService.getCacheStatus()
      console.log('Master key cache status:', {
        'Memory cache': `${cacheStatus.memoryCache.cacheSize} items [${cacheStatus.memoryCache.cachedAddresses.join(', ')}]`,
        'Persistent cache': `${cacheStatus.persistentCache.cacheSize} items [${cacheStatus.persistentCache.cachedAddresses.join(', ')}]`,
      })

      return decryptedConfigs
    },
    [account, signMessage]
  )

  // Manually refresh the configuration list (re-fetch on-chain data)
  const refreshConfigs = useCallback(async () => {
    if (!account) return
    
    console.log('Manually refreshing configs: re-fetching on-chain data')
    await fetchConfigs(
      account,
      async () => {
        const result = await refetchConfigs()
        return result || []
      },
      processRawConfigs,
      true // force refresh
    )
  }, [account, fetchConfigs, refetchConfigs, processRawConfigs])

  // Clear master key cache (for debugging/troubleshooting)
  const clearMasterKeyCache = useCallback(() => {
    if (account) {
      WalletBasedEncryptionService.clearMasterKeyCache(account)
      console.log('Cleared master key cache for the current wallet')
    }
  }, [account])

  // Auto fetch configs when account changes or when we have raw data
  useEffect(() => {
    if (account && isConnected && lastAccountRef.current !== account) {
      console.log('Account changed, fetching SSH configs...', account)
      lastAccountRef.current = account
      
      fetchConfigs(
        account,
        async () => {
          console.log('Fetching configs from contract...')
          return rawConfigs || []
        },
        processRawConfigs
      )
    } else if (!account) {
      // Clear configs when account is disconnected
      clearConfigCache()
      lastAccountRef.current = null
    }
  }, [account, isConnected, fetchConfigs, processRawConfigs, clearConfigCache, rawConfigs])

  // Fetch configs when raw data is available and account hasn't changed
  useEffect(() => {
    if (
      account && 
      isConnected && 
      rawConfigs && 
      lastAccountRef.current === account &&
      !isLoading &&
      !isContractLoading
    ) {
      fetchConfigs(
        account,
        async () => rawConfigs,
        processRawConfigs
      )
    }
  }, [rawConfigs, account, isConnected, isContractLoading, fetchConfigs, processRawConfigs, isLoading])

  // Add new configuration
  const addConfig = useCallback(
    async (config: SSHConfigInput) => {
      if (!account || !isConnected) {
        throw new Error('Please connect your wallet first')
      }

      if (!signMessage) {
        throw new Error('Signing feature is not available, please check your wallet connection')
      }

      await addConfigToStore(config, async (config) => {
        // 1. Encrypt configuration data
        const encryptedData = await WalletBasedEncryptionService.encryptSSHConfig(config, account, signMessage)

        // 2. Add to the blockchain
        await sshContract.addSSHConfig(encryptedData)

        toast.success('SSH config submitted successfully! Waiting for blockchain confirmation...')

        // 3. Refresh after delay to get new data
        setTimeout(async () => {
          console.log('Auto-refreshing config list after 1 second')
          await refreshConfigs()
        }, 1000)

        setTimeout(async () => {
          console.log('Refreshing config list again after 5 seconds')
          await refreshConfigs()
        }, 5000)
      })
    },
    [account, isConnected, signMessage, sshContract, addConfigToStore, refreshConfigs]
  )

  // Update configuration
  const updateConfig = useCallback(
    async (configId: string, config: SSHConfigInput) => {
      if (!account || !isConnected) {
        throw new Error('Please connect your wallet first')
      }

      if (!signMessage) {
        throw new Error('Signing feature is not available, please check your wallet connection')
      }

      await updateConfigInStore(configId, config, async (configId, config) => {
        // 1. Encrypt new configuration data
        const encryptedData = await WalletBasedEncryptionService.encryptSSHConfig(config, account, signMessage)

        // 2. Update blockchain configuration
        await sshContract.updateSSHConfig(BigInt(configId), encryptedData)

        toast.success('SSH config updated successfully!')

        // 3. Refresh configuration list if confirmed
        if (sshContract.isConfirmed) {
          await refreshConfigs()
        }
      })
    },
    [account, isConnected, signMessage, sshContract, updateConfigInStore, refreshConfigs]
  )

  // Delete configuration
  const deleteConfig = useCallback(
    async (configId: string) => {
      if (!account || !isConnected) {
        throw new Error('Please connect your wallet first')
      }

      await deleteConfigFromStore(configId, async (configId) => {
        // 1. Revoke blockchain configuration
        await sshContract.revokeConfig(BigInt(configId))

        toast.success('SSH config deleted successfully!')

        // 2. Refresh configuration list if confirmed
        if (sshContract.isConfirmed) {
          await refreshConfigs()
        }
      })
    },
    [account, isConnected, sshContract, deleteConfigFromStore, refreshConfigs]
  )

  return {
    // Data state
    configs,
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
  const { account, isConnected, signMessage } = useWalletStore()
  const sshContract = useSSHContract()
  const [config, setConfig] = useState<DecryptedSSHConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: rawConfig, isLoading: isContractLoading } = sshContract.useGetSSHConfig(account!, BigInt(configId))

  const fetchConfig = useCallback(async () => {
    if (!account || !rawConfig || !configId || !isConnected || !signMessage) return

    setIsLoading(true)
    setError(null)

    try {
      // Directly decrypt configuration, without using cache
      const decryptedConfig = await WalletBasedEncryptionService.decryptSSHConfig(
        rawConfig.encryptedData,
        account,
        configId,
        new Date(Number(rawConfig.timestamp) * 1000),
        rawConfig.isActive,
        signMessage
      )

      setConfig(decryptedConfig)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get configuration'
      setError(errorMessage)
      console.error('Failed to get single configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }, [account, rawConfig, configId, isConnected, signMessage])

  useEffect(() => {
    if (rawConfig && account && !isContractLoading) {
      fetchConfig()
    }
  }, [rawConfig, account, isContractLoading, fetchConfig])

  return {
    config,
    isLoading: isLoading || isContractLoading,
    error,
    refetch: fetchConfig,
  }
}
