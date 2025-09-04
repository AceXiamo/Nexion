import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SSHConfigForm } from './SSHConfigForm'
import type { SSHConfigInput, DecryptedSSHConfig } from '@/types/ssh'

interface SSHConfigModalProps {
  isOpen: boolean
  onClose: () => void
  config?: DecryptedSSHConfig
  onSubmit: (config: SSHConfigInput) => Promise<void>
  isSubmitting?: boolean
}

export function SSHConfigModal({ isOpen, onClose, config, onSubmit, isSubmitting = false }: SSHConfigModalProps) {
  const { t } = useTranslation()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showDiscardWarning, setShowDiscardWarning] = useState(false)

  const isEditing = !!config

  const handleClose = () => {
    if (hasUnsavedChanges && !isSubmitting) {
      setShowDiscardWarning(true)
    } else {
      onClose()
    }
  }

  const handleSubmit = async (configData: SSHConfigInput) => {
    try {
      await onSubmit(configData)
      setHasUnsavedChanges(false)
      onClose()
    } catch (error) {
      // Error handling is handled by parent component
      console.error(t('ssh:submitError'), error)
    }
  }

  const handleDiscardChanges = () => {
    setHasUnsavedChanges(false)
    setShowDiscardWarning(false)
    onClose()
  }

  // External submit button handling
  const handleExternalSubmit = () => {
    // Trigger form submission
    const formElement = document.getElementById('ssh-config-form') as HTMLFormElement
    if (formElement) {
      formElement.requestSubmit()
    }
  }

  return (
    <>
      {/* SSH configuration form modal - fixed bottom buttons, scrollable content */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-full max-w-lg bg-neutral-900 border-neutral-700 max-h-[85vh] p-0 flex flex-col">
          {/* Fixed header area */}
          <div className="p-4 pb-2 flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="text-white text-lg">{isEditing ? t('ssh:editConfigModal') : t('ssh:newConfigModal')}</DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">{isEditing ? t('ssh:editConfigDesc') : t('ssh:newConfigDesc')}</DialogDescription>
            </DialogHeader>
          </div>

          {/* Scrollable form content area */}
          <div className="px-4 flex-1 overflow-y-auto">
            <SSHConfigForm config={config} onSubmit={handleSubmit} onCancel={handleClose} showActions={false} />
          </div>

          {/* Fixed bottom button area */}
          <div className="flex items-center justify-end space-x-2 p-4 pt-2 border-t border-neutral-800 flex-shrink-0">
            <button type="button" onClick={handleClose} disabled={isSubmitting} className="btn-secondary disabled:opacity-50">
              <span>{t('common:cancel')}</span>
            </button>

            <button type="button" onClick={handleExternalSubmit} disabled={isSubmitting} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>{isEditing ? t('ssh:updating') : t('ssh:submitting')}</span>
                </>
              ) : (
                <span>{isEditing ? t('ssh:updateConfig') : t('ssh:createConfig')}</span>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discard changes confirmation dialog */}
      <Dialog open={showDiscardWarning} onOpenChange={() => setShowDiscardWarning(false)}>
        <DialogContent className="sm:max-w-md bg-neutral-900 border-neutral-700">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">{t('ssh:discardChanges')}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">{t('ssh:discardChangesDesc')}</p>
            </div>

            <div className="flex items-center justify-center space-x-2 pt-2">
              <button onClick={() => setShowDiscardWarning(false)} className="btn-secondary">
                {t('ssh:continueEditing')}
              </button>
              <button onClick={handleDiscardChanges} className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium transition-colors">
                {t('ssh:discardChangesConfirm')}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
