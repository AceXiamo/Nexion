import { Modal } from '@/components/ui/Modal'
import { FilePanel } from './FilePanel'
import { useFileTransferStore } from '@/store/file-transfer-store'
import { useTranslation } from 'react-i18next'

export function FileTransferModal() {
  const { isOpen, closeModal, currentSession, localPath, remotePath, localFiles, remoteFiles, isLoading, errors, setLocalPath, setRemotePath } = useFileTransferStore()
  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen && !!currentSession} onClose={closeModal} title={t('modal.title')} size="2xl" closeOnOverlayClick={false} closeOnEscape={true} disableContentAnimation={true}>
      {currentSession && (
        <div className="flex flex-col h-[60vh] max-h-[800px]">
          {/* Main Content Area */}
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Left Panel - Local Files */}
            <div className="flex-1 flex flex-col min-w-0">
              <FilePanel type="local" currentPath={localPath} files={localFiles} isLoading={isLoading.local} error={errors.local} onPathChange={setLocalPath} />
            </div>

            {/* Center Divider */}
            {/* <div className="w-px bg-neutral-800 flex-shrink-0" /> */}

            {/* Right Panel - Remote Files */}
            <div className="flex-1 flex flex-col min-w-0">
              <FilePanel type="remote" currentPath={remotePath} files={remoteFiles} isLoading={isLoading.remote} error={errors.remote} onPathChange={setRemotePath} />
            </div>
          </div>

        </div>
      )}
    </Modal>
  )
}
