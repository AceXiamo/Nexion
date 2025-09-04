import { useState, useCallback, useRef } from 'react'
import { createPublicClient, http, encodeFunctionData } from 'viem'
import { SSH_MANAGER_ABI, getContractAddress } from '@/lib/contracts'
import { useWalletStore } from '@/stores/walletStore'
import { SSHConfig, UserStats } from '@/types/ssh'
import { xLayerTestnet } from '@/lib/web3-config'

export function useSSHContract() {
  const { account, chainId, sendTransaction } = useWalletStore()
  const contractAddress = getContractAddress(chainId || xLayerTestnet.id)
  
  const [isPending, setIsPending] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [hash, setHash] = useState<string | undefined>()

  // Create clients
  const currentChain = chainId === xLayerTestnet.id ? xLayerTestnet : xLayerTestnet
  
  const publicClient = createPublicClient({
    chain: currentChain,
    transport: http()
  })

  // Read operations with React Query-like interface
  const useIsRegistered = (userAddress?: string) => {
    const [data, setData] = useState<boolean | undefined>()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const lastAddress = useRef<string>()

    const refetch = useCallback(async () => {
      if (!userAddress || !contractAddress) {
        setData(undefined)
        return Promise.resolve()
      }

      setIsLoading(true)
      setError(null)
      
      try {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: SSH_MANAGER_ABI,
          functionName: 'isRegisteredUser',
          args: [userAddress as `0x${string}`]
        })
        setData(result as boolean)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to check registration')
        setError(error)
        console.error('Error checking user registration:', error)
      } finally {
        setIsLoading(false)
      }
    }, [userAddress, contractAddress])

    // Auto-fetch when address changes
    if (userAddress && userAddress !== lastAddress.current) {
      lastAddress.current = userAddress
      refetch()
    }

    return {
      data,
      isLoading,
      error,
      refetch
    }
  }

  const useGetSSHConfigs = (userAddress?: string) => {
    const [data, setData] = useState<SSHConfig[] | undefined>()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const lastAddress = useRef<string>()

    const refetch = useCallback(async () => {
      if (!userAddress || !contractAddress) {
        setData(undefined)
        return Promise.resolve()
      }

      setIsLoading(true)
      setError(null)
      
      try {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: SSH_MANAGER_ABI,
          functionName: 'getSSHConfigs',
          args: [userAddress as `0x${string}`]
        })
        
        // Transform the result to match expected SSHConfig format
        const configs = (result as any[]).map((config: any) => ({
          encryptedData: config.encryptedData,
          timestamp: BigInt(config.timestamp),
          configId: BigInt(config.configId),
          isActive: config.isActive
        }))
        
        setData(configs)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch SSH configs')
        setError(error)
        console.error('Error fetching SSH configs:', error)
      } finally {
        setIsLoading(false)
      }
    }, [userAddress, contractAddress])

    // Auto-fetch when address changes
    if (userAddress && userAddress !== lastAddress.current) {
      lastAddress.current = userAddress
      refetch()
    }

    return {
      data,
      isLoading,
      error,
      refetch
    }
  }

  const useGetSSHConfig = (userAddress?: string, configId?: bigint) => {
    const [data, setData] = useState<SSHConfig | undefined>()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const lastParams = useRef<string>()

    const refetch = useCallback(async () => {
      if (!userAddress || !contractAddress || configId === undefined) {
        setData(undefined)
        return Promise.resolve()
      }

      setIsLoading(true)
      setError(null)
      
      try {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: SSH_MANAGER_ABI,
          functionName: 'getSSHConfig',
          args: [userAddress as `0x${string}`, configId]
        })
        
        const config = result as any
        setData({
          encryptedData: config.encryptedData,
          timestamp: BigInt(config.timestamp),
          configId: BigInt(config.configId),
          isActive: config.isActive
        })
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch SSH config')
        setError(error)
        console.error('Error fetching SSH config:', error)
      } finally {
        setIsLoading(false)
      }
    }, [userAddress, contractAddress, configId])

    // Auto-fetch when params change
    const currentParams = `${userAddress}-${configId}`
    if (currentParams !== lastParams.current) {
      lastParams.current = currentParams
      refetch()
    }

    return {
      data,
      isLoading,
      error,
      refetch
    }
  }

  const useGetUserStats = (userAddress?: string) => {
    const [data, setData] = useState<UserStats | undefined>()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const lastAddress = useRef<string>()

    const refetch = useCallback(async () => {
      if (!userAddress || !contractAddress) {
        setData(undefined)
        return Promise.resolve()
      }

      setIsLoading(true)
      setError(null)
      
      try {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: SSH_MANAGER_ABI,
          functionName: 'getUserStats',
          args: [userAddress as `0x${string}`]
        })
        
        const stats = result as any
        setData({
          totalConfigs: BigInt(stats.totalConfigs),
          activeConfigs: BigInt(stats.activeConfigs),
          lastActivity: BigInt(stats.lastActivity)
        })
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch user stats')
        setError(error)
        console.error('Error fetching user stats:', error)
      } finally {
        setIsLoading(false)
      }
    }, [userAddress, contractAddress])

    // Auto-fetch when address changes
    if (userAddress && userAddress !== lastAddress.current) {
      lastAddress.current = userAddress
      refetch()
    }

    return {
      data,
      isLoading,
      error,
      refetch
    }
  }

  // Write operations
  const executeTransaction = useCallback(async (functionName: string, args: any[] = []) => {
    if (!account || !contractAddress || !sendTransaction) {
      throw new Error('Wallet not connected')
    }

    setIsPending(true)
    setIsConfirming(false)
    setIsConfirmed(false)
    setHash(undefined)

    try {
      // Prepare transaction data
      const data = encodeFunctionData({
        abi: SSH_MANAGER_ABI,
        functionName,
        args
      })

      const txHash = await sendTransaction({
        to: contractAddress as `0x${string}`,
        data
      })

      setHash(txHash)
      setIsPending(false)
      setIsConfirming(true)

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({
        hash: txHash as `0x${string}`,
        confirmations: 1
      })

      setIsConfirming(false)
      setIsConfirmed(true)

      return txHash
    } catch (error) {
      setIsPending(false)
      setIsConfirming(false)
      setIsConfirmed(false)
      throw error
    }
  }, [account, contractAddress, sendTransaction, publicClient])

  const registerUser = useCallback(async () => {
    return executeTransaction('registerUser')
  }, [executeTransaction])

  const addSSHConfig = useCallback(async (encryptedData: string) => {
    return executeTransaction('addSSHConfig', [encryptedData])
  }, [executeTransaction])

  const updateSSHConfig = useCallback(async (configId: bigint, newEncryptedData: string) => {
    return executeTransaction('updateSSHConfig', [configId, newEncryptedData])
  }, [executeTransaction])

  const revokeConfig = useCallback(async (configId: bigint) => {
    return executeTransaction('revokeConfig', [configId])
  }, [executeTransaction])

  const batchUpdateConfigs = useCallback(async (configIds: bigint[], newEncryptedData: string[]) => {
    if (configIds.length !== newEncryptedData.length) {
      throw new Error('Arrays length mismatch')
    }
    return executeTransaction('batchUpdateConfigs', [configIds, newEncryptedData])
  }, [executeTransaction])

  const batchRevokeConfigs = useCallback(async (configIds: bigint[]) => {
    return executeTransaction('batchRevokeConfigs', [configIds])
  }, [executeTransaction])

  const useGetTotalUsers = () => {
    const [data, setData] = useState<bigint | undefined>()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const refetch = useCallback(async () => {
      if (!contractAddress) return Promise.resolve()

      setIsLoading(true)
      setError(null)
      
      try {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: SSH_MANAGER_ABI,
          functionName: 'getTotalUsers'
        })
        setData(result as bigint)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch total users')
        setError(error)
        console.error('Error fetching total users:', error)
      } finally {
        setIsLoading(false)
      }
    }, [contractAddress])

    // Auto-fetch once
    useState(() => {
      refetch()
    })

    return {
      data,
      isLoading,
      error,
      refetch
    }
  }

  const useGetTotalConfigs = () => {
    const [data, setData] = useState<bigint | undefined>()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const refetch = useCallback(async () => {
      if (!contractAddress) return Promise.resolve()

      setIsLoading(true)
      setError(null)
      
      try {
        const result = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: SSH_MANAGER_ABI,
          functionName: 'getTotalConfigs'
        })
        setData(result as bigint)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch total configs')
        setError(error)
        console.error('Error fetching total configs:', error)
      } finally {
        setIsLoading(false)
      }
    }, [contractAddress])

    // Auto-fetch once
    useState(() => {
      refetch()
    })

    return {
      data,
      isLoading,
      error,
      refetch
    }
  }

  return {
    // Read hooks
    useIsRegistered,
    useGetSSHConfigs,
    useGetSSHConfig,
    useGetUserStats,
    useGetTotalUsers,
    useGetTotalConfigs,

    // Write functions
    registerUser,
    addSSHConfig,
    updateSSHConfig,
    revokeConfig,
    batchUpdateConfigs,
    batchRevokeConfigs,

    // Transaction states
    isPending,
    isConfirming,
    isConfirmed,
    hash,

    // Contract info
    contractAddress,
  }
}