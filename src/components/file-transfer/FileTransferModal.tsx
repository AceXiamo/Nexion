import { Modal } from '@/components/ui/Modal'
import { FilePanel } from './FilePanel'
import { TransferQueue } from './TransferQueue'
import { useFileTransferStore } from '@/store/file-transfer-store'
import { Icon } from '@iconify/react'

export function FileTransferModal() {
  const { isOpen, closeModal, currentSession, localPath, remotePath, localFiles, remoteFiles, isLoading, errors, transferQueue, setLocalPath, setRemotePath } = useFileTransferStore()

  if (!isOpen || !currentSession) return null

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title="文件传输" size="2xl" closeOnOverlayClick={false} closeOnEscape={true}>
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

        {/* Transfer Queue */}
        {transferQueue.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="mdi:transfer" className="w-5 h-5 text-lime-400" />
              <span className="text-sm font-medium text-white">传输队列 ({transferQueue.length})</span>
            </div>

            <TransferQueue />
          </div>
        )}
      </div>
    </Modal>
  )
}
