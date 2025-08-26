import { useState, useCallback, useEffect, useRef } from 'react'
import { SSHConnectionService } from '@/services/ssh-connection'
import type { DecryptedSSHConfig } from '@/types/ssh'
import type { SSHConnectionResult, SSHConnectionStatus } from '@/services/ssh-connection'
import toast from 'react-hot-toast'

export interface UseSSHConnectionReturn {
  // 连接状态
  connectionStates: Record<string, {
    status: 'connected' | 'disconnected' | 'connecting' | 'error'
    isConnecting: boolean
    isTesting: boolean
    lastConnected?: Date
    error?: string
  }>
  
  // 操作函数
  testConnection: (config: DecryptedSSHConfig) => Promise<SSHConnectionResult>
  connect: (config: DecryptedSSHConfig) => Promise<void>
  disconnect: (configId: string) => Promise<void>
  executeCommand: (configId: string, command: string) => Promise<{
    success: boolean
    output?: string
    error?: string
  }>
  
  // 状态查询
  isConnected: (configId: string) => boolean
  isConnecting: (configId: string) => boolean
  isTesting: (configId: string) => boolean
  
  // 清理函数
  cleanup: () => void
}

export function useSSHConnection(): UseSSHConnectionReturn {
  const [connectionStates, setConnectionStates] = useState<
    Record<string, {
      status: 'connected' | 'disconnected' | 'connecting' | 'error'
      isConnecting: boolean
      isTesting: boolean
      lastConnected?: Date
      error?: string
    }>
  >({})
  
  const intervalRef = useRef<NodeJS.Timeout>()

  // 更新连接状态
  const updateConnectionStates = useCallback(() => {
    const serviceStates = SSHConnectionService.getAllConnectionStates()
    setConnectionStates(current => {
      const newStates: typeof current = {}
      
      // 保留当前的操作状态，更新连接状态
      Object.keys({ ...current, ...serviceStates }).forEach(configId => {
        const serviceState = serviceStates[configId]
        const currentState = current[configId]
        
        newStates[configId] = {
          status: serviceState?.status || 'disconnected',
          isConnecting: currentState?.isConnecting || false,
          isTesting: currentState?.isTesting || false,
          lastConnected: serviceState?.lastConnected,
          error: serviceState?.error,
        }
      })
      
      return newStates
    })
  }, [])

  // 定期更新连接状态
  useEffect(() => {
    updateConnectionStates()
    intervalRef.current = setInterval(updateConnectionStates, 2000) // 每2秒更新一次

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [updateConnectionStates])

  // 测试连接
  const testConnection = useCallback(async (config: DecryptedSSHConfig): Promise<SSHConnectionResult> => {
    const configId = config.id
    
    // 设置测试状态
    setConnectionStates(prev => ({
      ...prev,
      [configId]: {
        ...prev[configId],
        status: prev[configId]?.status || 'disconnected',
        isConnecting: prev[configId]?.isConnecting || false,
        isTesting: true,
      },
    }))

    try {
      const result = await SSHConnectionService.testConnection(config)
      
      if (result.success) {
        toast.success(
          `连接测试成功！\n${config.name} (${result.connectionTime}ms)`, 
          {
            duration: 3000,
            icon: '✅',
          }
        )
      } else {
        toast.error(
          `连接测试失败：${result.message}`,
          {
            duration: 5000,
            icon: '❌',
          }
        )
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      toast.error(`连接测试异常：${errorMessage}`)
      
      return {
        success: false,
        message: errorMessage,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    } finally {
      // 清除测试状态
      setConnectionStates(prev => ({
        ...prev,
        [configId]: {
          ...prev[configId],
          isTesting: false,
        },
      }))
    }
  }, [])

  // 建立连接
  const connect = useCallback(async (config: DecryptedSSHConfig): Promise<void> => {
    const configId = config.id
    
    // 设置连接中状态
    setConnectionStates(prev => ({
      ...prev,
      [configId]: {
        ...prev[configId],
        status: 'connecting',
        isConnecting: true,
        isTesting: prev[configId]?.isTesting || false,
      },
    }))

    try {
      const result = await SSHConnectionService.connect(config)
      
      if (result.success) {
        toast.success(
          `已连接到 ${config.name}`,
          {
            duration: 3000,
            icon: '🔗',
          }
        )
      } else {
        toast.error(
          `连接失败：${result.message}`,
          {
            duration: 5000,
            icon: '❌',
          }
        )
      }
      
      // 状态会通过定期更新获取
      updateConnectionStates()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      toast.error(`连接异常：${errorMessage}`)
      
      setConnectionStates(prev => ({
        ...prev,
        [configId]: {
          ...prev[configId],
          status: 'error',
          isConnecting: false,
          error: errorMessage,
        },
      }))
    } finally {
      // 清除连接中状态
      setConnectionStates(prev => ({
        ...prev,
        [configId]: {
          ...prev[configId],
          isConnecting: false,
        },
      }))
    }
  }, [updateConnectionStates])

  // 断开连接
  const disconnect = useCallback(async (configId: string): Promise<void> => {
    try {
      await SSHConnectionService.disconnect(configId)
      toast.success('连接已断开', { icon: '🔌' })
      updateConnectionStates()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      toast.error(`断开连接失败：${errorMessage}`)
    }
  }, [updateConnectionStates])

  // 执行命令
  const executeCommand = useCallback(async (
    configId: string,
    command: string
  ): Promise<{ success: boolean; output?: string; error?: string }> => {
    try {
      return await SSHConnectionService.executeCommand(configId, command)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      }
    }
  }, [])

  // 状态查询函数
  const isConnected = useCallback((configId: string): boolean => {
    return connectionStates[configId]?.status === 'connected'
  }, [connectionStates])

  const isConnecting = useCallback((configId: string): boolean => {
    return connectionStates[configId]?.isConnecting || false
  }, [connectionStates])

  const isTesting = useCallback((configId: string): boolean => {
    return connectionStates[configId]?.isTesting || false
  }, [connectionStates])

  // 清理函数
  const cleanup = useCallback(() => {
    SSHConnectionService.cleanup()
    setConnectionStates({})
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    connectionStates,
    testConnection,
    connect,
    disconnect,
    executeCommand,
    isConnected,
    isConnecting,
    isTesting,
    cleanup,
  }
}