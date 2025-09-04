import React from 'react'
import { Modal } from '@/components/ui/Modal'
import { FilePanel } from './FilePanel'
import { TransferQueue } from './TransferQueue'
import { useFileTransferStore } from '@/store/file-transfer-store'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'

export function FileTransferModal() {
  const {
    isOpen,
    closeModal,
    currentSession,
    localPath,
    remotePath,
    localFiles,
    remoteFiles,
    isLoading,
    errors,
    transferQueue,
    setLocalPath,
    setRemotePath,
    refreshFiles,
    clearErrors
  } = useFileTransferStore()

  if (!isOpen || !currentSession) return null

  const handleRefresh = async () => {
    clearErrors()
    await refreshFiles()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="文件传输"
      size="full"
      closeOnOverlayClick={false}
    >
      <div className="flex flex-col h-[80vh] max-h-[800px]">
        {/* Header Controls */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <Icon icon="mdi:folder-sync" className="w-6 h-6 text-lime-400" />
            <span className="text-lg font-semibold text-white">
              Session: <span className="text-lime-400">{currentSession}</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading.local || isLoading.remote}
            >
              <Icon icon="mdi:refresh" className="w-4 h-4 mr-2" />
              刷新
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left Panel - Local Files */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="mdi:laptop" className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-medium text-white">本地文件</span>
              {isLoading.local && (
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin text-lime-400" />
              )}
            </div>
            
            <FilePanel
              type="local"
              currentPath={localPath}
              files={localFiles}
              isLoading={isLoading.local}
              error={errors.local}
              onPathChange={setLocalPath}
            />
          </div>

          {/* Center Divider */}
          <div className="w-px bg-neutral-800 flex-shrink-0" />

          {/* Right Panel - Remote Files */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="mdi:server" className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-medium text-white">远程文件</span>
              {isLoading.remote && (
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin text-lime-400" />
              )}
            </div>
            
            <FilePanel
              type="remote"
              currentPath={remotePath}
              files={remoteFiles}
              isLoading={isLoading.remote}
              error={errors.remote}
              onPathChange={setRemotePath}
            />
          </div>
        </div>

        {/* Transfer Queue */}
        {transferQueue.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="mdi:transfer" className="w-5 h-5 text-lime-400" />
              <span className="text-sm font-medium text-white">
                传输队列 ({transferQueue.length})
              </span>
            </div>
            
            <TransferQueue />
          </div>
        )}
      </div>
    </Modal>
  )
}