import { useParams, useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { useSSHConfigs } from '@/hooks/useSSHConfigs'
import { useSSHSessions } from '@/hooks/useSSHSessions'
import { SSHTerminal } from '@/components/ssh/SSHTerminal'

export function SingleTerminalView() {
  const { configId: sessionId } = useParams<{ configId: string }>() // 注意：路由参数名还是configId，但实际是sessionId
  const navigate = useNavigate()
  const { configs, isLoading } = useSSHConfigs()
  const { sessions, closeSession, reconnectSession } = useSSHSessions()

  // Find the current session and config
  const currentSession = sessions.find((session) => session.id === sessionId)
  const currentConfig = currentSession ? configs.find((config) => config.id === currentSession.configId) : null

  const handleReconnect = async () => {
    if (!sessionId) return
    await reconnectSession(sessionId)
  }

  const handleDisconnect = async () => {
    if (!sessionId) return
    await closeSession(sessionId)
    navigate('/connections')
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

  if (!currentSession || !currentConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Icon icon="mdi:server-off" className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">会话不存在</h3>
        <p className="text-neutral-400 mb-6 max-w-md leading-relaxed">未找到 ID 为 "{sessionId}" 的 SSH 会话。可能已被关闭或不存在。</p>
        <button onClick={handleBackToConfigs} className="btn-primary">
          <Icon icon="mdi:arrow-left" className="w-4 h-4" />
          <span>返回配置列表</span>
        </button>
      </div>
    )
  }

  const isCurrentlyConnecting = currentSession.status === 'connecting'
  const isCurrentlyConnected = currentSession.status === 'connected'
  const hasError = currentSession.status === 'error'

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
              <h1 className="text-xl font-semibold text-white mb-1">{currentSession.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-neutral-400">
                <span className="flex items-center space-x-1">
                  <Icon icon="mdi:account" className="w-4 h-4" />
                  <span>{currentConfig.username}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Icon icon="mdi:server" className="w-4 h-4" />
                  <span>
                    {currentConfig.host}:{currentConfig.port}
                  </span>
                </span>
                <span className={`flex items-center space-x-1 ${isCurrentlyConnected ? 'text-lime-400' : isCurrentlyConnecting ? 'text-yellow-400' : hasError ? 'text-red-400' : 'text-neutral-400'}`}>
                  <Icon
                    icon={isCurrentlyConnected ? 'mdi:check-circle' : isCurrentlyConnecting ? 'mdi:loading' : hasError ? 'mdi:alert-circle' : 'mdi:circle-outline'}
                    className={`w-4 h-4 ${isCurrentlyConnecting ? 'animate-spin' : ''}`}
                  />
                  <span>{isCurrentlyConnected ? '已连接' : isCurrentlyConnecting ? '连接中' : hasError ? '连接失败' : '未连接'}</span>
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
              <button onClick={handleDisconnect} className="btn-secondary text-red-400 hover:text-red-300">
                <Icon icon="mdi:lan-disconnect" className="w-4 h-4" />
                <span>断开连接</span>
              </button>
            ) : (
              <button onClick={handleReconnect} className="btn-primary" disabled={isCurrentlyConnecting}>
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
        {hasError && currentSession.error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-400 font-medium">连接失败</p>
                <p className="text-red-300 text-sm mt-1">{currentSession.error}</p>
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

        <div className="min-h-[500px]">
          {isCurrentlyConnected ? (
            <SSHTerminal
              sessionId={sessionId}
              isVisible={true}
              onResize={(cols, rows) => {
                // 可以在这里处理终端大小变化
                console.log('Terminal resized:', cols, rows)
              }}
            />
          ) : isCurrentlyConnecting ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex items-center space-x-3 text-neutral-400">
                <Icon icon="mdi:loading" className="w-6 h-6 animate-spin" />
                <span>正在连接到 {currentSession.name}...</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-center">
              <div>
                <Icon icon="mdi:lan-disconnect" className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-500">{hasError ? '连接失败，请重试' : '等待连接...'}</p>
                {!hasError && (
                  <button onClick={handleReconnect} className="btn-primary mt-4">
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
