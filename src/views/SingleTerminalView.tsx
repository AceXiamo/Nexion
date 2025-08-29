import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { useSSHConfigs } from '@/hooks/useSSHConfigs'
import { useSSHSessions } from '@/hooks/useSSHSessions'
import { SSHTerminal } from '@/components/ssh/SSHTerminal'

export function SingleTerminalView() {
  const { t } = useTranslation()
  const { configId: sessionId } = useParams<{ configId: string }>() // 注意：路由参数名还是configId，但实际是sessionId
  const navigate = useNavigate()
  const { configs, isLoading } = useSSHConfigs()
  const { sessions, reconnectSession } = useSSHSessions()

  // Find the current session and config
  const currentSession = sessions.find((session) => session.id === sessionId)
  const currentConfig = currentSession ? configs.find((config) => config.id === currentSession.configId) : null

  const handleReconnect = async () => {
    if (!sessionId) return
    await reconnectSession(sessionId)
  }

  const handleBackToConfigs = () => {
    navigate('/connections')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-3 text-neutral-400">
          <Icon icon="mdi:loading" className="w-6 h-6 animate-spin" />
          <span>{t('views:terminal.loadingConfig')}</span>
        </div>
      </div>
    )
  }

  if (!currentSession || !currentConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Icon icon="mdi:server-off" className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">{t('views:terminal.sessionNotFound')}</h3>
        <p className="text-neutral-400 mb-6 max-w-md leading-relaxed">{t('views:terminal.sessionNotFoundDesc', { sessionId })}</p>
        <button onClick={handleBackToConfigs} className="btn-primary">
          <Icon icon="mdi:arrow-left" className="w-4 h-4" />
          <span>{t('views:terminal.backToConfigList')}</span>
        </button>
      </div>
    )
  }

  const isCurrentlyConnecting = currentSession.status === 'connecting'
  const isCurrentlyConnected = currentSession.status === 'connected'
  const hasError = currentSession.status === 'error'

  return (
    <div className="h-full bg-black flex justify-center items-center">
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
        <div className="flex items-center justify-center h-screen">
          <div className="flex items-center space-x-3 text-neutral-400">
            <Icon icon="mdi:loading" className="w-6 h-6 animate-spin" />
            <span>{t('views:terminal.connectingTo', { name: currentSession.name })}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen text-center">
          <div>
            <Icon icon="mdi:lan-disconnect" className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-500">{hasError ? t('views:terminal.connectionFailed') : t('views:terminal.waitingConnection')}</p>
            {hasError && currentSession.error && (
              <p className="text-red-400 text-sm mt-2">{currentSession.error}</p>
            )}
            <button onClick={handleReconnect} className="btn-primary mt-4">
              <Icon icon="mdi:lan-connect" className="w-4 h-4" />
              <span>{hasError ? t('views:terminal.reconnect') : t('views:terminal.connectNow')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
