import { useState, useCallback, useEffect, useMemo } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { useSSHContract } from './useSSHContract'
import { WalletBasedEncryptionService, LocalStorageEncryption } from '@/services/encryption'
import type { SSHConfigInput, DecryptedSSHConfig, SSHConfig } from '@/types/ssh'
import toast from 'react-hot-toast'

export interface UseSSHConfigsReturn {
  // 数据状态
  configs: DecryptedSSHConfig[]
  isLoading: boolean
  error: string | null

  // 统计信息
  totalConfigs: number
  activeConfigs: number

  // 操作函数
  addConfig: (config: SSHConfigInput) => Promise<void>
  updateConfig: (configId: string, config: SSHConfigInput) => Promise<void>
  deleteConfig: (configId: string) => Promise<void>
  refreshConfigs: () => Promise<void>

  // 缓存管理
  clearCache: () => void
  resetSigningState: () => void

  // 操作状态
  isAdding: boolean
  isUpdating: boolean
  isDeleting: boolean
  isSigningInProgress: boolean
}

export function useSSHConfigs(): UseSSHConfigsReturn {
  const { address, isConnected } = useAccount()
  const { signMessageAsync, error: signError } = useSignMessage()
  const sshContract = useSSHContract()

  // 本地状态
  const [configs, setConfigs] = useState<DecryptedSSHConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 获取区块链上的配置数据
  const { data: rawConfigs, isLoading: isContractLoading, refetch: refetchConfigs } = sshContract.useGetSSHConfigs(address)

  // 添加签名请求状态跟踪，避免并发签名请求
  const [isSigningInProgress, setIsSigningInProgress] = useState(false)

  // 统一处理链上数据的解密和转换
  const processRawConfigs = useCallback(
    async (rawConfigs: SSHConfig[]): Promise<void> => {
      if (!address || !signMessageAsync || !rawConfigs) {
        console.log('处理跳过: address =', !!address, 'signMessageAsync =', !!signMessageAsync, 'rawConfigs =', !!rawConfigs)
        return
      }

      // 防止并发签名请求
      if (isSigningInProgress) {
        console.log('签名正在进行中，跳过此次处理')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const decryptedConfigs: DecryptedSSHConfig[] = []
        let needsSigning = false

        // 首先检查哪些配置需要解密（没有缓存）
        for (const rawConfig of rawConfigs) {
          const configId = rawConfig.configId.toString()
          const cachedConfig = LocalStorageEncryption.getCachedConfig(configId)
          
          if (!cachedConfig) {
            needsSigning = true
            break
          }
        }

        // 如果需要签名，设置签名进行中状态
        if (needsSigning) {
          setIsSigningInProgress(true)
        }

        // 串行处理每个配置，避免并发签名请求
        for (const rawConfig of rawConfigs) {
          try {
            const configId = rawConfig.configId.toString()
            console.log('处理配置 ID:', configId)
            
            // 首先尝试从缓存获取
            let decryptedConfig = LocalStorageEncryption.getCachedConfig(configId)

            if (!decryptedConfig) {
              console.log('缓存未命中，开始解密配置:', configId)
              
              // 串行解密，避免并发钱包签名请求
              try {
                decryptedConfig = await WalletBasedEncryptionService.decryptSSHConfig(
                  rawConfig.encryptedData,
                  address,
                  configId,
                  new Date(Number(rawConfig.timestamp) * 1000),
                  rawConfig.isActive,
                  signMessageAsync
                )
                
                // 缓存解密结果
                LocalStorageEncryption.cacheDecryptedConfig(configId, decryptedConfig)
                console.log('配置解密成功:', configId)
              } catch (signingError) {
                console.error(`配置 ${configId} 解密失败:`, signingError)
                
                // 检查是否是用户取消签名
                if (signingError instanceof Error && signingError.message.includes('User rejected')) {
                  console.log('用户取消签名，停止处理')
                  break
                }
                
                throw signingError
              }
            } else {
              console.log('使用缓存配置:', configId)
            }

            decryptedConfigs.push(decryptedConfig)
          } catch (error) {
            console.error(`处理配置 ${rawConfig.configId} 失败:`, error)
            // 添加一个错误占位符，让用户知道有配置但无法解密
            decryptedConfigs.push({
              id: rawConfig.configId.toString(),
              name: '⚠️ 解密失败',
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
        console.log('配置处理完成，解密配置数量:', decryptedConfigs.length)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '处理配置失败'
        setError(errorMessage)
        console.error('处理配置失败:', error)
      } finally {
        setIsLoading(false)
        setIsSigningInProgress(false) // 确保签名状态被重置
      }
    },
    [address, signMessageAsync, isSigningInProgress]
  )

  // 手动刷新配置列表（重新获取链上数据）
  const refreshConfigs = useCallback(async () => {
    console.log('手动刷新配置：重新获取链上数据')
    await refetchConfigs()
  }, [refetchConfigs])

  // 添加新配置
  const addConfig = useCallback(
    async (config: SSHConfigInput) => {
      if (!address || !isConnected) {
        throw new Error('请先连接钱包')
      }

      if (!signMessageAsync) {
        throw new Error('签名功能不可用，请检查钱包连接')
      }

      setIsAdding(true)

      try {
        // 1. 加密配置数据
        const encryptedData = await WalletBasedEncryptionService.encryptSSHConfig(config, address, signMessageAsync)

        // 2. 添加到区块链
        await sshContract.addSSHConfig(encryptedData)

        toast.success('SSH 配置提交成功！等待区块链确认...')

        // 3. 立即刷新一次（可能会获取到新数据）
        setTimeout(async () => {
          console.log('1秒后自动刷新配置列表')
          await refetchConfigs()
        }, 1000)

        // 4. 再次延迟刷新确保获取到数据
        setTimeout(async () => {
          console.log('5秒后再次刷新配置列表')
          await refetchConfigs()
        }, 5000)
      } catch (error) {
        let errorMessage = '添加配置失败'

        if (error instanceof Error) {
          errorMessage = error.message
        } else if (signError) {
          errorMessage = '签名失败，请重试'
        }

        toast.error(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setIsAdding(false)
      }
    },
    [address, isConnected, signMessageAsync, signError, sshContract, refetchConfigs, refreshConfigs]
  )

  // 更新配置
  const updateConfig = useCallback(
    async (configId: string, config: SSHConfigInput) => {
      if (!address || !isConnected) {
        throw new Error('请先连接钱包')
      }

      if (!signMessageAsync) {
        throw new Error('签名功能不可用，请检查钱包连接')
      }

      setIsUpdating(true)

      try {
        // 1. 加密新的配置数据
        const encryptedData = await WalletBasedEncryptionService.encryptSSHConfig(config, address, signMessageAsync)

        // 2. 更新区块链配置
        await sshContract.updateSSHConfig(BigInt(configId), encryptedData)

        toast.success('SSH 配置更新成功！')

        // 3. 清除旧缓存并刷新
        LocalStorageEncryption.clearConfigCache(configId)

        if (sshContract.isConfirmed) {
          await refetchConfigs()
        }
      } catch (error) {
        let errorMessage = '更新配置失败'

        if (error instanceof Error) {
          errorMessage = error.message
        } else if (signError) {
          errorMessage = '签名失败，请重试'
        }

        toast.error(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setIsUpdating(false)
      }
    },
    [address, isConnected, signMessageAsync, signError, sshContract, refetchConfigs, refreshConfigs]
  )

  // 删除配置
  const deleteConfig = useCallback(
    async (configId: string) => {
      if (!address || !isConnected) {
        throw new Error('请先连接钱包')
      }

      setIsDeleting(true)

      try {
        // 1. 撤销区块链配置
        await sshContract.revokeConfig(BigInt(configId))

        toast.success('SSH 配置删除成功！')

        // 2. 清除本地缓存
        LocalStorageEncryption.clearConfigCache(configId)

        if (sshContract.isConfirmed) {
          await refetchConfigs()
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '删除配置失败'
        toast.error(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setIsDeleting(false)
      }
    },
    [address, isConnected, sshContract, refetchConfigs, refreshConfigs]
  )

  // 清除所有缓存并重置签名状态
  const clearCache = useCallback(() => {
    LocalStorageEncryption.clearAllCache()
    setIsSigningInProgress(false)
    toast.success('配置缓存已清除')
  }, [])

  // 重置签名状态的公共方法
  const resetSigningState = useCallback(() => {
    setIsSigningInProgress(false)
    console.log('签名状态已重置')
  }, [])

  // 统计信息
  const { totalConfigs, activeConfigs } = useMemo(() => {
    return {
      totalConfigs: configs.length,
      activeConfigs: configs.filter((config) => config.isActive).length,
    }
  }, [configs])

  // 监听 rawConfigs 变化，自动处理解密
  useEffect(() => {
    if (rawConfigs && address && isConnected && !isContractLoading) {
      processRawConfigs(rawConfigs)
    }
  }, [rawConfigs, address, isConnected, isContractLoading, processRawConfigs])

  // 监听钱包地址变化，清除缓存和重置签名状态
  useEffect(() => {
    // 地址变化时重置签名状态
    setIsSigningInProgress(false)
    
    return () => {
      LocalStorageEncryption.clearAllCache()
    }
  }, [address])

  return {
    // 数据状态
    configs: configs.filter((config) => config.isActive), // 只返回活跃配置
    isLoading: isLoading || isContractLoading,
    error,

    // 统计信息
    totalConfigs,
    activeConfigs,

    // 操作函数
    addConfig,
    updateConfig,
    deleteConfig,
    refreshConfigs,

    // 缓存管理
    clearCache,
    resetSigningState,

    // 操作状态
    isAdding,
    isUpdating,
    isDeleting,
    isSigningInProgress,
  }
}

/**
 * 获取单个 SSH 配置的 Hook
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
      // 先尝试从缓存获取
      let decryptedConfig = LocalStorageEncryption.getCachedConfig(configId)

      if (!decryptedConfig) {
        // 缓存未命中，执行解密
        decryptedConfig = await WalletBasedEncryptionService.decryptSSHConfig(
          rawConfig.encryptedData,
          address,
          configId,
          new Date(Number(rawConfig.timestamp) * 1000),
          rawConfig.isActive,
          signMessageAsync
        )

        // 缓存解密结果
        LocalStorageEncryption.cacheDecryptedConfig(configId, decryptedConfig)
      }

      setConfig(decryptedConfig)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取配置失败'
      setError(errorMessage)
      console.error('获取单个配置失败:', error)
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
