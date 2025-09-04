import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SSHTabBar } from './SSHTabBar'
import { SSHTerminal } from './SSHTerminal'
import { SSHConfigForm } from './SSHConfigForm'
import { useSSHSessions } from '@/hooks/useSSHSessions'
import { useSSHConfigs } from '@/hooks/useSSHConfigs'
import { useShortcutHandler } from '@/hooks/useKeyboardShortcuts'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Terminal, Plus } from 'lucide-react'
import { FileTransferModal } from '@/components/file-transfer/FileTransferModal'
import { useFileTransferStore } from '@/store/file-transfer-store'

export function SSHTabContainer() {
  const { t } = useTranslation()
  const { sessions, activeSessionId, loading, createSession, closeSession, switchSession, resizeTerminal } = useSSHSessions()
  const { openModal } = useFileTransferStore()

  const { configs, isLoading: configsLoading } = useSSHConfigs()

  const [showConfigForm, setShowConfigForm] = useState(false)
  const [showConnectionDialog, setShowConnectionDialog] = useState(false)
  const [editingConfig, setEditingConfig] = useState<any>(undefined)
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)

  // Create new session - show configuration selection dialog
  const handleCreateSession = () => {
    if (configs.length === 0) {
      // If no configurations, directly open configuration form
      setEditingConfig(undefined)
      setShowConfigForm(true)
    } else {
      // If configurations exist, show selection dialog
      setShowConnectionDialog(true)
    }
  }

  // Create session using existing configuration
  const handleUseExistingConfig = async (configId: string) => {
    const config = configs.find((c) => c.id === configId)
    if (!config) return

    setShowConnectionDialog(false)

    try {
      const success = await createSession(config)
      if (!success) {
        console.error('Failed to create session with config:', config.name)
      }
    } catch (error) {
      console.error('Error creating session:', error)
    }
  }

  // Automatically create session after successful configuration form submission
  const handleConfigSubmit = async (config: any) => {
    setIsSubmittingForm(false)
    setShowConfigForm(false)

    try {
      // Wait for configuration to be saved before creating session
      setTimeout(async () => {
        const success = await createSession(config)
        if (!success) {
          console.error('Failed to create session after config creation')
        }
      }, 100)
    } catch (error) {
      console.error('Error creating session after config:', error)
    }
  }

  // External submit button handling
  const handleExternalSubmit = () => {
    // Trigger form submission
    const formElement = document.getElementById('ssh-config-form') as HTMLFormElement
    if (formElement) {
      formElement.requestSubmit()
    }
  }

  // Close configuration form
  const handleCloseConfigForm = () => {
    setShowConfigForm(false)
    setEditingConfig(undefined)
    setIsSubmittingForm(false)
  }

  // Open file transfer modal
  const handleOpenFileTransfer = () => {
    if (activeSessionId) {
      openModal(activeSessionId)
    }
  }

  // Keyboard shortcut handlers
  const handleNewSessionShortcut = () => {
    handleCreateSession()
  }

  const handleCloseSessionShortcut = () => {
    if (activeSessionId) {
      closeSession(activeSessionId)
    }
  }

  const handleDuplicateSessionShortcut = async () => {
    if (activeSessionId) {
      const activeSession = sessions.find((s) => s.id === activeSessionId)
      if (activeSession?.config) {
        await createSession(activeSession.config)
      }
    }
  }

  const handleSwitchToTabShortcut = (tabIndex: number) => {
    if (sessions[tabIndex]) {
      switchSession(sessions[tabIndex].id)
    }
  }

  const handleNextTabShortcut = () => {
    if (sessions.length <= 1) return
    const currentIndex = sessions.findIndex((s) => s.id === activeSessionId)
    if (currentIndex === -1) return
    const nextIndex = (currentIndex + 1) % sessions.length
    switchSession(sessions[nextIndex].id)
  }

  const handlePreviousTabShortcut = () => {
    if (sessions.length <= 1) return
    const currentIndex = sessions.findIndex((s) => s.id === activeSessionId)
    if (currentIndex === -1) return
    const prevIndex = currentIndex === 0 ? sessions.length - 1 : currentIndex - 1
    switchSession(sessions[prevIndex].id)
  }

  // Register keyboard shortcuts
  useShortcutHandler('newSession', handleNewSessionShortcut, [])
  useShortcutHandler('closeSession', handleCloseSessionShortcut, [activeSessionId])
  useShortcutHandler('duplicateSession', handleDuplicateSessionShortcut, [activeSessionId, sessions])
  useShortcutHandler('nextTab', handleNextTabShortcut, [sessions, activeSessionId])
  useShortcutHandler('previousTab', handlePreviousTabShortcut, [sessions, activeSessionId])

  // Register tab switching shortcuts (Ctrl+1-9)
  useShortcutHandler('switchToTab1', () => handleSwitchToTabShortcut(0), [sessions])
  useShortcutHandler('switchToTab2', () => handleSwitchToTabShortcut(1), [sessions])
  useShortcutHandler('switchToTab3', () => handleSwitchToTabShortcut(2), [sessions])
  useShortcutHandler('switchToTab4', () => handleSwitchToTabShortcut(3), [sessions])
  useShortcutHandler('switchToTab5', () => handleSwitchToTabShortcut(4), [sessions])
  useShortcutHandler('switchToTab6', () => handleSwitchToTabShortcut(5), [sessions])
  useShortcutHandler('switchToTab7', () => handleSwitchToTabShortcut(6), [sessions])
  useShortcutHandler('switchToTab8', () => handleSwitchToTabShortcut(7), [sessions])
  useShortcutHandler('switchToTab9', () => handleSwitchToTabShortcut(8), [sessions])

  return (
    <div className="flex flex-col h-full bg-black">
      {/* SSH Tab Bar */}
      <SSHTabBar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onCreateSession={handleCreateSession}
        onSwitchSession={switchSession}
        onCloseSession={closeSession}
        onOpenFileTransfer={handleOpenFileTransfer}
      />

      {/* Terminal area */}
      <div className="flex-1 relative">
        {sessions.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Terminal className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">{t('ssh:noActiveConnections')}</h3>
            <p className="text-gray-500 mb-6 max-w-md">{t('ssh:noActiveConnectionsDesc')}</p>
            <Button onClick={handleCreateSession} disabled={loading} className="bg-lime-400 hover:bg-lime-500 text-black font-medium">
              <Plus className="w-4 h-4 mr-2" />
              {t('ssh:createSSHConnection')}
            </Button>
          </div>
        ) : (
          // Render terminals
          sessions.map((session) => <SSHTerminal key={session.id} sessionId={session.id} isVisible={session.id === activeSessionId} onResize={resizeTerminal} />)
        )}
      </div>

      {/* Connection selection dialog */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent className="sm:max-w-md bg-neutral-900 border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-white">{t('ssh:selectConfig')}</DialogTitle>
            <DialogDescription className="text-gray-400">{t('ssh:selectConfigDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {configsLoading ? (
              <div className="text-center py-2 text-gray-400">{t('ssh:loadingConfigs')}</div>
            ) : configs.length > 0 ? (
              <div className="space-y-2">
                {configs.map((config) => (
                  <button
                    key={config.id}
                    onClick={() => handleUseExistingConfig(config.id)}
                    className="w-full text-left p-2 bg-neutral-800 hover:bg-neutral-700 
                               rounded-lg border border-neutral-700 hover:border-neutral-600
                               transition-all duration-150"
                  >
                    <div className="font-medium text-white">{config.name}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {config.username}@{config.host}:{config.port}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-gray-400">{t('ssh:noSavedConfigs')}</div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConnectionDialog(false)
                  setEditingConfig(undefined)
                  setShowConfigForm(true)
                }}
                className="flex-1 border-neutral-600 text-white hover:bg-neutral-800"
              >
                {t('ssh:newConfig')}
              </Button>
              <Button variant="ghost" onClick={() => setShowConnectionDialog(false)} className="text-gray-400 hover:text-white hover:bg-neutral-800">
                {t('common:cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SSH configuration form modal - fixed bottom buttons, scrollable content */}
      <Dialog open={showConfigForm} onOpenChange={setShowConfigForm}>
        <DialogContent className="w-full max-w-lg bg-neutral-900 border-neutral-700 max-h-[85vh] p-0 flex flex-col">
          {/* Fixed header area */}
          <div className="p-4 pb-2 flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="text-white text-lg">{editingConfig ? t('ssh:editConfigModal') : t('ssh:newConfigModal')}</DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">{editingConfig ? t('ssh:editConfigDesc') : t('ssh:newConfigDesc')}</DialogDescription>
            </DialogHeader>
          </div>

          {/* Scrollable form content area */}
          <div className="px-4 flex-1 overflow-y-auto">
            <SSHConfigForm config={editingConfig} onSubmit={handleConfigSubmit} onCancel={handleCloseConfigForm} showActions={false} />
          </div>

          {/* Fixed bottom button area */}
          <div className="flex items-center justify-end space-x-2 p-4 pt-2 border-t border-neutral-800 flex-shrink-0">
            <button type="button" onClick={handleCloseConfigForm} disabled={isSubmittingForm} className="btn-secondary disabled:opacity-50">
              <span>{t('common:cancel')}</span>
            </button>

            <button type="button" onClick={handleExternalSubmit} disabled={isSubmittingForm} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmittingForm ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>{t('ssh:submitting')}</span>
                </>
              ) : (
                <span>{editingConfig ? t('ssh:updateConfig') : t('ssh:createConfig')}</span>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Transfer Modal */}
      <FileTransferModal />
    </div>
  )
}
