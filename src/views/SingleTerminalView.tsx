import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useSSHConfigs } from '@/hooks/useSSHConfigs'
import { useSSHConnection } from '@/hooks/useSSHConnection'

export function SingleTerminalView() {
  const { configId } = useParams<{ configId: string }>()
  const navigate = useNavigate()
  const { configs, isLoading } = useSSHConfigs()
  const { 
    connectionStates, 
    connect, 
    disconnect, 
    isConnected, 
    isConnecting 
  } = useSSHConnection()

  const [terminalStatus, setTerminalStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Find the current config
  const currentConfig = configs.find(config => config.id === configId)

  // Handle connection when component mounts
  useEffect(() => {
    if (currentConfig && !isConnected(configId!)) {
      handleConnect()
    }
  }, [currentConfig, configId])

  const handleConnect = async () => {
    if (!currentConfig || !configId) return

    setTerminalStatus('connecting')
    setErrorMessage('')
    
    try {
      await connect(currentConfig)
      setTerminalStatus('connected')
    } catch (error) {
      console.error('Connection failed:', error)
      setTerminalStatus('error')
      setErrorMessage(error instanceof Error ? error.message : '连接失败')
    }
  }

  const handleDisconnect = async () => {
    if (!configId) return

    try {
      await disconnect(configId)
      setTerminalStatus('idle')
    } catch (error) {
      console.error('Disconnect failed:', error)
    }
  }

  const handleBackToConfigs = () => {
    navigate('/connections')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-3 text-neutral-400">
          <Icon icon="mdi:loading" className="w-6 h-6 animate-spin" />
          <span>加载配置中...</span>
        </div>
      </div>
    )
  }

  if (!currentConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Icon icon="mdi:server-off" className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">配置不存在</h3>
        <p className="text-neutral-400 mb-6 max-w-md leading-relaxed">
          未找到 ID 为 "{configId}" 的 SSH 配置。可能已被删除或不存在。
        </p>
        <button onClick={handleBackToConfigs} className="btn-primary">
          <Icon icon="mdi:arrow-left" className="w-4 h-4" />
          <span>返回配置列表</span>
        </button>
      </div>
    )
  }

  const connectionState = connectionStates[configId!]
  const currentConnectionStatus = connectionState?.status || 'disconnected'
  const isCurrentlyConnecting = isConnecting(configId!) || terminalStatus === 'connecting'
  const isCurrentlyConnected = isConnected(configId!) || terminalStatus === 'connected'

  return (
    <div className="space-y-6">
      {/* Terminal Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-lime-400/20 to-lime-500/20 rounded-xl flex items-center justify-center border border-lime-400/20">
              <Icon icon="mdi:terminal" className="w-6 h-6 text-lime-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white mb-1">
                {currentConfig.name}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-neutral-400">
                <span className="flex items-center space-x-1">
                  <Icon icon="mdi:account" className="w-4 h-4" />
                  <span>{currentConfig.username}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Icon icon="mdi:server" className="w-4 h-4" />
                  <span>{currentConfig.host}:{currentConfig.port}</span>
                </span>
                <span className={`flex items-center space-x-1 ${
                  isCurrentlyConnected ? 'text-lime-400' : 
                  isCurrentlyConnecting ? 'text-yellow-400' :
                  terminalStatus === 'error' ? 'text-red-400' :
                  'text-neutral-400'
                }`}>
                  <Icon 
                    icon={
                      isCurrentlyConnected ? 'mdi:check-circle' :
                      isCurrentlyConnecting ? 'mdi:loading' :
                      terminalStatus === 'error' ? 'mdi:alert-circle' :
                      'mdi:circle-outline'
                    } 
                    className={`w-4 h-4 ${isCurrentlyConnecting ? 'animate-spin' : ''}`} 
                  />
                  <span>
                    {isCurrentlyConnected ? '已连接' :
                     isCurrentlyConnecting ? '连接中' :
                     terminalStatus === 'error' ? '连接失败' :
                     '未连接'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={handleBackToConfigs} className="btn-secondary">
              <Icon icon="mdi:arrow-left" className="w-4 h-4" />
              <span>返回列表</span>
            </button>
            
            {isCurrentlyConnected ? (
              <button 
                onClick={handleDisconnect} 
                className="btn-secondary text-red-400 hover:text-red-300"
              >
                <Icon icon="mdi:lan-disconnect" className="w-4 h-4" />
                <span>断开连接</span>
              </button>
            ) : (
              <button 
                onClick={handleConnect} 
                className="btn-primary"
                disabled={isCurrentlyConnecting}
              >
                {isCurrentlyConnecting ? (
                  <>
                    <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                    <span>连接中...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:lan-connect" className="w-4 h-4" />
                    <span>重新连接</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {terminalStatus === 'error' && errorMessage && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-medium">连接失败</p>
                <p className="text-red-300 text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Content */}
      <div className="bg-black border border-neutral-800 rounded-xl overflow-hidden">
        <div className="bg-neutral-900 px-6 py-3 border-b border-neutral-800">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-lime-500 rounded-full"></div>
            <span className="ml-4 text-sm text-neutral-500">
              {currentConfig.username}@{currentConfig.host}
            </span>
          </div>
        </div>

        <div className="p-6 min-h-[500px]">
          {isCurrentlyConnected ? (
            <div className="font-mono text-sm">
              <div className="text-lime-400 mb-4">
                <Icon icon="mdi:check-circle" className="w-4 h-4 inline mr-2" />
                成功连接到 {currentConfig.name}
              </div>
              <div className="text-neutral-400 mb-4">
                终端功能正在开发中...
              </div>
              <div className="flex items-center text-neutral-300">
                <span className="text-lime-400 mr-2">$</span>
                <div className="w-2 h-4 bg-lime-400 animate-pulse ml-1"></div>
              </div>
            </div>
          ) : isCurrentlyConnecting ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-3 text-neutral-400">
                <Icon icon="mdi:loading" className="w-6 h-6 animate-spin" />
                <span>正在连接到 {currentConfig.name}...</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-center">
              <div>
                <Icon icon="mdi:lan-disconnect" className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-500">
                  {terminalStatus === 'error' ? '连接失败，请重试' : '等待连接...'}
                </p>
                {terminalStatus !== 'error' && (
                  <button onClick={handleConnect} className="btn-primary mt-4">
                    <Icon icon="mdi:lan-connect" className="w-4 h-4" />
                    <span>立即连接</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}