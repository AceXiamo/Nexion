import { useState, useCallback, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useSSHContract } from './useSSHContract'
import { ECIESEncryptionService, LocalStorageEncryption } from '@/services/encryption'
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
  
  // 操作状态
  isAdding: boolean
  isUpdating: boolean
  isDeleting: boolean
}

export function useSSHConfigs(): UseSSHConfigsReturn {
  const { address } = useAccount()
  const sshContract = useSSHContract()
  
  // 本地状态
  const [configs, setConfigs] = useState<DecryptedSSHConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 获取区块链上的配置数据
  const { 
    data: rawConfigs, 
    isLoading: isContractLoading, 
    refetch: refetchConfigs 
  } = sshContract.useGetSSHConfigs(address)

  // 解密并转换配置数据
  const decryptConfigs = useCallback(async (
    rawConfigs: SSHConfig[]
  ): Promise<DecryptedSSHConfig[]> => {
    if (!address) return []
    
    const decryptedConfigs: DecryptedSSHConfig[] = []
    
    for (const rawConfig of rawConfigs) {
      try {
        const configId = rawConfig.configId.toString()
        
        // 首先尝试从缓存获取
        let decryptedConfig = LocalStorageEncryption.getCachedConfig(configId)
        
        if (!decryptedConfig) {
          // 缓存未命中，执行解密
          decryptedConfig = await ECIESEncryptionService.decryptSSHConfig(
            rawConfig.encryptedData,
            address,
            configId,
            new Date(Number(rawConfig.timestamp) * 1000),
            rawConfig.isActive
          )
          
          // 缓存解密结果
          LocalStorageEncryption.cacheDecryptedConfig(configId, decryptedConfig)
        }
        
        decryptedConfigs.push(decryptedConfig)
      } catch (error) {
        console.error(`解密配置 ${rawConfig.configId} 失败:`, error)
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
    
    return decryptedConfigs
  }, [address])

  // 刷新配置列表
  const refreshConfigs = useCallback(async () => {
    if (!address || !rawConfigs) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const decrypted = await decryptConfigs(rawConfigs)
      setConfigs(decrypted)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取配置失败'
      setError(errorMessage)
      console.error('刷新配置失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [address, rawConfigs, decryptConfigs])

  // 添加新配置
  const addConfig = useCallback(async (config: SSHConfigInput) => {
    if (!address) {
      throw new Error('钱包未连接')
    }
    
    setIsAdding(true)
    
    try {
      // 1. 加密配置数据
      const encryptedData = await ECIESEncryptionService.encryptSSHConfig(
        config,
        address
      )
      
      // 2. 添加到区块链
      await sshContract.addSSHConfig(encryptedData)
      
      toast.success('SSH 配置添加成功！')
      
      // 3. 等待交易确认后刷新列表
      if (sshContract.isConfirmed) {
        await refetchConfigs()
        await refreshConfigs()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '添加配置失败'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsAdding(false)
    }
  }, [address, sshContract, refetchConfigs, refreshConfigs])

  // 更新配置
  const updateConfig = useCallback(async (
    configId: string, 
    config: SSHConfigInput
  ) => {
    if (!address) {
      throw new Error('钱包未连接')
    }
    
    setIsUpdating(true)
    
    try {
      // 1. 加密新的配置数据
      const encryptedData = await ECIESEncryptionService.encryptSSHConfig(
        config,
        address
      )
      
      // 2. 更新区块链配置
      await sshContract.updateSSHConfig(BigInt(configId), encryptedData)
      
      toast.success('SSH 配置更新成功！')
      
      // 3. 清除旧缓存并刷新
      LocalStorageEncryption.clearConfigCache(configId)
      
      if (sshContract.isConfirmed) {
        await refetchConfigs()
        await refreshConfigs()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新配置失败'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [address, sshContract, refetchConfigs, refreshConfigs])

  // 删除配置
  const deleteConfig = useCallback(async (configId: string) => {
    if (!address) {
      throw new Error('钱包未连接')
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
        await refreshConfigs()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除配置失败'
      toast.error(errorMessage)
      throw error
    } finally {
      setIsDeleting(false)
    }
  }, [address, sshContract, refetchConfigs, refreshConfigs])

  // 清除所有缓存
  const clearCache = useCallback(() => {
    LocalStorageEncryption.clearAllCache()
    toast.success('配置缓存已清除')
  }, [])

  // 当原始配置数据更新时自动解密
  useEffect(() => {
    if (rawConfigs && address && !isContractLoading) {
      refreshConfigs()
    }
  }, [rawConfigs, address, isContractLoading, refreshConfigs])

  // 统计信息
  const { totalConfigs, activeConfigs } = useMemo(() => {
    return {
      totalConfigs: configs.length,
      activeConfigs: configs.filter(config => config.isActive).length,
    }
  }, [configs])

  // 监听钱包地址变化，清除缓存
  useEffect(() => {
    return () => {
      LocalStorageEncryption.clearAllCache()
    }
  }, [address])

  return {
    // 数据状态
    configs: configs.filter(config => config.isActive), // 只返回活跃配置
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
  const { address } = useAccount()
  const sshContract = useSSHContract()
  const [config, setConfig] = useState<DecryptedSSHConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    data: rawConfig,
    isLoading: isContractLoading,
  } = sshContract.useGetSSHConfig(address, BigInt(configId))

  const fetchConfig = useCallback(async () => {
    if (!address || !rawConfig || !configId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // 先尝试从缓存获取
      let decryptedConfig = LocalStorageEncryption.getCachedConfig(configId)
      
      if (!decryptedConfig) {
        // 缓存未命中，执行解密
        decryptedConfig = await ECIESEncryptionService.decryptSSHConfig(
          rawConfig.encryptedData,
          address,
          configId,
          new Date(Number(rawConfig.timestamp) * 1000),
          rawConfig.isActive
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
  }, [address, rawConfig, configId])

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