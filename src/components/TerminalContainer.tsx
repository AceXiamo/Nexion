import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { useSSHSessions } from '@/hooks/useSSHSessions'
import { SSHTerminal } from '@/components/ssh/SSHTerminal'
import { Button } from '@/components/ui/button'
import { Terminal, Plus, RefreshCw } from 'lucide-react'

/**
 * Unified Terminal Container
 * Manages all session terminal instances, displays corresponding terminal based on route parameters
 * Solves content conflict issues between multiple sessions
 */
export function TerminalContainer() {
  const { t } = useTranslation()
  const { sessionId } = useParams<{ sessionId: string }>()
  const { sessions, reconnectSession, loading } = useSSHSessions()
  const navigate = useNavigate()

  // Find current session
  const currentSession = sessionId ? sessions.find((s) => s.id === sessionId) : null

  // Handle reconnection
  const handleReconnect = async () => {
    if (!sessionId) return
    await reconnectSession(sessionId)
  }

  // If session data is loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-3 text-neutral-400">
          <Icon icon="mdi:loading" className="w-6 h-6 animate-spin" />
          <span>{t('common:loading')}</span>
        </div>
      </div>
    )
  }

  // If there are no sessions
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-black">
        <Terminal className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">{t('ssh:noActiveConnections')}</h3>
        <p className="text-gray-500 mb-6 max-w-md">{t('ssh:noActiveConnectionsDesc')}</p>
        <Button
          onClick={() => {
            navigate('/connections')
          }}
          className="bg-lime-400 hover:bg-lime-500 text-black font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('ssh:createSSHConnection')}
        </Button>
      </div>
    )
  }

  // If sessionId is specified but session does not exist
  if (sessionId && !currentSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center bg-black">
        <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Icon icon="mdi:server-off" className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">{t('ssh:sessionNotFound')}</h3>
        <p className="text-neutral-400 mb-6 max-w-md leading-relaxed">
          Session {sessionId} does not exist or has been closed
        </p>
        <Button
          onClick={() => {
            window.location.href = '/connections'
          }}
          className="bg-lime-400 hover:bg-lime-500 text-black font-medium"
        >
          <Icon icon="mdi:arrow-left" className="w-4 h-4 mr-2" />
          {t('navigation:connections')}
        </Button>
      </div>
    )
  }

  // If sessionId is specified and session exists, but is in an error state
  if (sessionId && currentSession?.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center bg-black">
        <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Icon icon="mdi:lan-disconnect" className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">{t('ssh:connectionFailed')}</h3>
        <p className="text-red-400 mb-2">{currentSession.error}</p>
        <p className="text-neutral-400 mb-6">Session: {currentSession.name}</p>
        <Button onClick={handleReconnect} className="bg-lime-400 hover:bg-lime-500 text-black font-medium">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('ssh:reconnect')}
        </Button>
      </div>
    )
  }

  // If sessionId is specified and session exists, but is connecting
  if (sessionId && currentSession?.status === 'connecting') {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="flex items-center space-x-3 text-neutral-400">
          <Icon icon="mdi:loading" className="w-6 h-6 animate-spin" />
          <span>
            Connecting to {currentSession.name}...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full relative bg-black">
      {/* Render all session terminals, use isVisible to control display, keeping instances persistent */}
      {sessions.map((session) => (
        <SSHTerminal
          key={session.id}
          sessionId={session.id}
          isVisible={session.id === sessionId}
          onResize={(cols, rows) => {
            // Handle terminal resize
            if (window.ipcRenderer?.ssh) {
              window.ipcRenderer.ssh.resizeSession(session.id, cols, rows)
            }
          }}
        />
      ))}

      {/* If no sessionId is specified, show a prompt to select a session */}
      {!sessionId && sessions.length > 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Terminal className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Select a session to start</h3>
            <p className="text-gray-500">Please select an SSH session from the left menu</p>
          </div>
        </div>
      )}
    </div>
  )
}
