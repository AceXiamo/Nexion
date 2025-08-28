import { useState, useCallback, useEffect, useMemo } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { useSSHContract } from './useSSHContract'
import { WalletBasedEncryptionService } from '@/services/encryption'
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
  clearMasterKeyCache: () => void

  // 操作状态
  isAdding: boolean
  isUpdating: boolean
  isDeleting: boolean
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

  // 应用启动时清理过期的持久缓存
  useEffect(() => {
    WalletBasedEncryptionService.cleanupExpiredPersistentCache()
  }, [])

  // 统一处理链上数据的解密和转换
  const processRawConfigs = useCallback(
    async (rawConfigs: SSHConfig[]): Promise<void> => {
      if (!address || !signMessageAsync || !rawConfigs) {
        console.log('处理跳过: 缺少必要参数')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const decryptedConfigs: DecryptedSSHConfig[] = []

        console.log(`开始处理 ${rawConfigs.length} 个配置，使用主密钥缓存优化`)

        // 顺序处理所有配置（第一个配置会触发主密钥派生和缓存，后续配置使用缓存）
        for (const rawConfig of rawConfigs) {
          try {
            const configId = rawConfig.configId.toString()
            console.log('解密配置 ID:', configId)
            
            // 解密配置（会自动使用主密钥缓存）
            const decryptedConfig = await WalletBasedEncryptionService.decryptSSHConfig(
              rawConfig.encryptedData,
              address,
              configId,
              new Date(Number(rawConfig.timestamp) * 1000),
              rawConfig.isActive,
              signMessageAsync
            )

            decryptedConfigs.push(decryptedConfig)
            console.log('配置解密成功:', configId)
          } catch (error) {
            console.error(`配置 ${rawConfig.configId} 解密失败:`, error)
            
            // 检查是否是用户取消签名
            if (error instanceof Error && error.message.includes('用户取消')) {
              console.log('用户取消签名，停止处理')
              setError('用户取消了签名操作')
              return
            }
            
            // 添加错误占位符
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
        
        // 输出缓存状态（调试用）
        const cacheStatus = WalletBasedEncryptionService.getCacheStatus()
        console.log('主密钥缓存状态:', {
          内存缓存: `${cacheStatus.memoryCache.cacheSize} 个 [${cacheStatus.memoryCache.cachedAddresses.join(', ')}]`,
          持久缓存: `${cacheStatus.persistentCache.cacheSize} 个 [${cacheStatus.persistentCache.cachedAddresses.join(', ')}]`
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '处理配置失败'
        setError(errorMessage)
        console.error('处理配置失败:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [address, signMessageAsync]
  )

  // 手动刷新配置列表（重新获取链上数据）
  const refreshConfigs = useCallback(async () => {
    console.log('手动刷新配置：重新获取链上数据')
    await refetchConfigs()
  }, [refetchConfigs])

  // 清理主密钥缓存（调试/故障排除用）
  const clearMasterKeyCache = useCallback(() => {
    if (address) {
      WalletBasedEncryptionService.clearMasterKeyCache(address)
      console.log('已清理当前钱包的主密钥缓存')
    }
  }, [address])

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
    [address, isConnected, signMessageAsync, signError, sshContract, refetchConfigs]
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

        // 3. 刷新配置列表
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
    [address, isConnected, signMessageAsync, signError, sshContract, refetchConfigs]
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

        // 2. 刷新配置列表
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

  // 监听钱包地址变化
  useEffect(() => {
    // 地址变化时清空配置列表并清理缓存
    if (!address) {
      setConfigs([])
      // 清理所有主密钥缓存（用户断开连接）
      WalletBasedEncryptionService.clearMasterKeyCache()
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
    clearMasterKeyCache,

    // 操作状态
    isAdding,
    isUpdating,
    isDeleting,
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
      // 直接解密配置，不使用缓存
      const decryptedConfig = await WalletBasedEncryptionService.decryptSSHConfig(
        rawConfig.encryptedData,
        address,
        configId,
        new Date(Number(rawConfig.timestamp) * 1000),
        rawConfig.isActive,
        signMessageAsync
      )

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
