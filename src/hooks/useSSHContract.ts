import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { SSH_MANAGER_CONTRACT, getContractAddress } from '@/lib/contracts'
import { useChainId } from 'wagmi'
import { SSHConfig, UserStats } from '@/types/ssh'

export function useSSHContract() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = getContractAddress(chainId)
  
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Read operations
  const useIsRegistered = (userAddress?: `0x${string}`) => {
    return useReadContract({
      ...SSH_MANAGER_CONTRACT,
      address: contractAddress as `0x${string}`,
      functionName: 'isRegisteredUser',
      args: [userAddress!],
      query: {
        enabled: !!userAddress,
      },
    })
  }

  const useGetSSHConfigs = (userAddress?: `0x${string}`) => {
    return useReadContract({
      ...SSH_MANAGER_CONTRACT,
      address: contractAddress as `0x${string}`,
      functionName: 'getSSHConfigs',
      args: [userAddress!],
      query: {
        enabled: !!userAddress,
        refetchInterval: 30000, // Refetch every 30 seconds
      },
    }) as { data: SSHConfig[] | undefined; isLoading: boolean; error: Error | null; refetch: () => void }
  }

  const useGetSSHConfig = (userAddress?: `0x${string}`, configId?: bigint) => {
    return useReadContract({
      ...SSH_MANAGER_CONTRACT,
      address: contractAddress as `0x${string}`,
      functionName: 'getSSHConfig',
      args: [userAddress!, configId!],
      query: {
        enabled: !!userAddress && configId !== undefined,
      },
    }) as { data: SSHConfig | undefined; isLoading: boolean; error: Error | null }
  }

  const useGetUserStats = (userAddress?: `0x${string}`) => {
    return useReadContract({
      ...SSH_MANAGER_CONTRACT,
      address: contractAddress as `0x${string}`,
      functionName: 'getUserStats',
      args: [userAddress!],
      query: {
        enabled: !!userAddress,
      },
    }) as { data: UserStats | undefined; isLoading: boolean; error: Error | null }
  }

  // Write operations
  const registerUser = async () => {
    if (!address) throw new Error('Wallet not connected')
    
    return writeContract({
      ...SSH_MANAGER_CONTRACT,
      address: contractAddress as `0x${string}`,
      functionName: 'registerUser',
    })
  }

  const addSSHConfig = async (encryptedData: string) => {
    if (!address) throw new Error('Wallet not connected')
    
    return writeContract({
      ...SSH_MANAGER_CONTRACT,
      address: contractAddress as `0x${string}`,
      functionName: 'addSSHConfig',
      args: [encryptedData],
    })
  }

  const updateSSHConfig = async (configId: bigint, newEncryptedData: string) => {
    if (!address) throw new Error('Wallet not connected')
    
    return writeContract({
      ...SSH_MANAGER_CONTRACT,
      address: contractAddress as `0x${string}`,
      functionName: 'updateSSHConfig',
      args: [configId, newEncryptedData],
    })
  }

  const revokeConfig = async (configId: bigint) => {
    if (!address) throw new Error('Wallet not connected')
    
    return writeContract({
      ...SSH_MANAGER_CONTRACT,
      address: contractAddress as `0x${string}`,
      functionName: 'revokeConfig',
      args: [configId],
    })
  }

  const batchUpdateConfigs = async (configIds: bigint[], newEncryptedData: string[]) => {
    if (!address) throw new Error('Wallet not connected')
    if (configIds.length !== newEncryptedData.length) {
      throw new Error('Arrays length mismatch')
    }
    
    return writeContract({
      ...SSH_MANAGER_CONTRACT,
      address: contractAddress as `0x${string}`,
      functionName: 'batchUpdateConfigs',
      args: [configIds, newEncryptedData],
    })
  }

  const batchRevokeConfigs = async (configIds: bigint[]) => {
    if (!address) throw new Error('Wallet not connected')
    
    return writeContract({
      ...SSH_MANAGER_CONTRACT,
      address: contractAddress as `0x${string}`,
      functionName: 'batchRevokeConfigs',
      args: [configIds],
    })
  }

  return {
    // Read hooks
    useIsRegistered,
    useGetSSHConfigs,
    useGetSSHConfig,
    useGetUserStats,
    
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