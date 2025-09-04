import React, { useState, useRef } from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/Modal'
import { Dropdown, type DropdownItem } from '@/components/ui/Dropdown'
import { FileBrowser } from './FileBrowser'
import { PathBreadcrumb } from './PathBreadcrumb'
import { useFileTransferStore } from '@/store/file-transfer-store'
import type { FileItem } from '@/types/file-transfer'
import { type SortBy, type SortOrder } from './utils/file-utils'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
// Note: Using path-browserify for browser compatibility
const path = {
  join: (...parts: string[]) => parts.join('/').replace(/\/+/g, '/'),
  basename: (filePath: string) => filePath.split('/').pop() || '',
  posix: {
    join: (...parts: string[]) => parts.join('/').replace(/\/+/g, '/'),
  },
}

interface FilePanelProps {
  type: 'local' | 'remote'
  currentPath: string
  files: FileItem[]
  isLoading: boolean
  error?: string
  onPathChange: (path: string) => void
}

export function FilePanel({ type, currentPath, files, isLoading, error, onPathChange }: FilePanelProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isEditing, setIsEditing] = useState(false)
  const [editPath, setEditPath] = useState(currentPath)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [filesToDelete, setFilesToDelete] = useState<{ files: Set<string>; fileNames: string }>({ files: new Set(), fileNames: '' })
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [showHiddenFiles, setShowHiddenFiles] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation(['fileTransfer', 'common'])

  const isLocal = type === 'local'
  const panelTitle = isLocal ? t('fileTransfer:modal.localPanel') : t('fileTransfer:modal.remotePanel')
  const panelIcon = isLocal ? 'mdi:laptop' : 'mdi:server'
  const panelColor = isLocal ? 'text-blue-400' : 'text-orange-400'

  const handlePathEdit = () => {
    setEditPath(currentPath)
    setIsEditing(true)
  }

  const handlePathSubmit = () => {
    if (editPath.trim() && editPath !== currentPath) {
      onPathChange(editPath.trim())
    }
    setIsEditing(false)
  }

  const handlePathKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePathSubmit()
    } else if (e.key === 'Escape') {
      setEditPath(currentPath)
      setIsEditing(false)
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const store = useFileTransferStore.getState()

    const uploadTasks = files.map((file) => ({
      localPath: (file as any).path || file.name, // Electron provides full path
      remotePath: path.posix.join(currentPath, file.name),
    }))

    await store.uploadFiles(uploadTasks)

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }


  const handleDeleteClick = () => {
    if (selectedFiles.size === 0) return

    const fileNames = Array.from(selectedFiles)
      .map((filePath) => {
        const file = files.find((f) => f.path === filePath)
        return file?.name || path.basename(filePath)
      })
      .join(', ')

    setFilesToDelete({ files: selectedFiles, fileNames })
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    const store = useFileTransferStore.getState()

    if (isLocal) {
      // Delete local files using Electron IPC
      try {
        for (const filePath of filesToDelete.files) {
          const file = files.find((f) => f.path === filePath)
          if (file?.type === 'directory') {
            await window.ipcRenderer?.invoke('fs:rmdir', filePath)
          } else {
            await window.ipcRenderer?.invoke('fs:unlink', filePath)
          }
        }
        store.loadLocalFiles(currentPath)
        setSelectedFiles(new Set())
      } catch (error) {
        console.error('Failed to delete local files:', error)
        store.setLocalError(t('fileTransfer:errors.deleteLocalFilesFailed'))
      }
    } else {
      // Delete remote files using SFTP
      try {
        for (const filePath of filesToDelete.files) {
          await store.deleteRemoteFile(filePath)
        }
        setSelectedFiles(new Set())
      } catch (error) {
        console.error('Failed to delete remote files:', error)
      }
    }

    setShowDeleteModal(false)
    setFilesToDelete({ files: new Set(), fileNames: '' })
  }

  const getParentPath = (path: string): string => {
    if (path === '/' || path === '') return path

    const parts = path.split('/').filter(Boolean)
    if (parts.length === 0) return '/'
    if (parts.length === 1) return isLocal ? '/' : '/'

    return '/' + parts.slice(0, -1).join('/')
  }

  const handleGoUp = () => {
    const parentPath = getParentPath(currentPath)
    if (parentPath !== currentPath) {
      onPathChange(parentPath)
    }
  }

  // Sort dropdown items
  const sortDropdownItems: DropdownItem[] = [
    {
      id: 'name-asc',
      label: t('fileTransfer:actions.sortByName') + ' (' + t('fileTransfer:actions.sortAsc') + ')',
      icon: sortBy === 'name' && sortOrder === 'asc' ? 'mdi:check' : 'mdi:sort-alphabetical-ascending',
      onClick: () => { setSortBy('name'); setSortOrder('asc') }
    },
    {
      id: 'name-desc',
      label: t('fileTransfer:actions.sortByName') + ' (' + t('fileTransfer:actions.sortDesc') + ')',
      icon: sortBy === 'name' && sortOrder === 'desc' ? 'mdi:check' : 'mdi:sort-alphabetical-descending',
      onClick: () => { setSortBy('name'); setSortOrder('desc') }
    },
    {
      id: 'time-asc',
      label: t('fileTransfer:actions.sortByTime') + ' (' + t('fileTransfer:actions.sortAsc') + ')',
      icon: sortBy === 'modifiedAt' && sortOrder === 'asc' ? 'mdi:check' : 'mdi:sort-clock-ascending-outline',
      onClick: () => { setSortBy('modifiedAt'); setSortOrder('asc') }
    },
    {
      id: 'time-desc',
      label: t('fileTransfer:actions.sortByTime') + ' (' + t('fileTransfer:actions.sortDesc') + ')',
      icon: sortBy === 'modifiedAt' && sortOrder === 'desc' ? 'mdi:check' : 'mdi:sort-clock-descending-outline',
      onClick: () => { setSortBy('modifiedAt'); setSortOrder('desc') }
    }
  ]

  return (
    <div className="flex flex-col h-full bg-neutral-900/50 rounded-lg border border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-neutral-800">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon icon={panelIcon} className={cn('w-4 h-4', panelColor)} />
          <span className="text-sm font-medium text-white truncate">{panelTitle}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 ml-2">
          <Button variant="ghost" size="sm" onClick={handleGoUp} disabled={isLoading || currentPath === '/'} title={t('fileTransfer:actions.goBack')}>
            <Icon icon="mdi:arrow-up" className="w-4 h-4" />
          </Button>

          {/* Sort Dropdown */}
          <Dropdown
            trigger={
              <Button variant="ghost" size="sm" title={t('fileTransfer:actions.sortBy')}>
                {/* <Icon icon={sortBy === 'name' ? 'mdi:sort-alphabetical-variant' : 'mdi:sort-clock-outline'} className="w-4 h-4" /> */}
                {
                  sortBy === 'name' && sortOrder === 'asc' ? 
                  (<Icon icon="mdi:sort-alphabetical-ascending" className="w-4 h-4" />) :
                  sortBy === 'name' && sortOrder === 'desc' ? 
                  (<Icon icon="mdi:sort-alphabetical-descending" className="w-4 h-4" />) :
                  sortBy === 'modifiedAt' && sortOrder === 'asc' ? 
                  (<Icon icon="mdi:sort-clock-ascending-outline" className="w-4 h-4" />) :
                  (<Icon icon="mdi:sort-clock-descending-outline" className="w-4 h-4" />)
                }
              </Button>
            }
            items={sortDropdownItems}
            align="right"
          />

          {/* Toggle Hidden Files */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowHiddenFiles(!showHiddenFiles)}
            title={showHiddenFiles ? t('fileTransfer:actions.hideHiddenFiles') : t('fileTransfer:actions.showHiddenFiles')}
          >
            <Icon 
              icon={showHiddenFiles ? 'mdi:eye-off' : 'mdi:eye'} 
              className={cn('w-4 h-4', showHiddenFiles && 'text-lime-400')} 
            />
          </Button>

          {selectedFiles.size > 0 && (
            <Button variant="ghost" size="sm" onClick={handleDeleteClick} disabled={isLoading} title={t('fileTransfer:actions.deleteSelected')}>
              <Icon icon="mdi:delete" className="w-4 h-4 text-red-400" />
            </Button>
          )}
        </div>
      </div>

      {/* Path Bar */}
      <div className="px-3 py-2 border-b border-neutral-800">
        {isEditing ? (
          <input
            type="text"
            value={editPath}
            onChange={(e) => setEditPath(e.target.value)}
            onBlur={handlePathSubmit}
            onKeyDown={handlePathKeyDown}
            className="w-full bg-neutral-800 text-white text-sm px-2 py-1 rounded border border-neutral-700 focus:border-lime-400 focus:outline-none"
            autoFocus
          />
        ) : (
          <PathBreadcrumb path={currentPath} onPathClick={onPathChange} onEditClick={handlePathEdit} />
        )}
      </div>

      {/* File Browser */}
      <div className="flex-1 min-h-0">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-400">
            <Icon icon="mdi:alert-circle" className="w-8 h-8 mb-2" />
            <span className="text-sm">{error}</span>
          </div>
        ) : (
          <FileBrowser
            files={files}
            isLoading={isLoading}
            selectedFiles={selectedFiles}
            onSelectionChange={setSelectedFiles}
            onFileDoubleClick={(file) => {
              if (file.type === 'directory') {
                onPathChange(file.path)
              }
            }}
            type={type}
            currentPath={currentPath}
            sortBy={sortBy}
            sortOrder={sortOrder}
            showHiddenFiles={showHiddenFiles}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="px-3 py-2 border-t border-neutral-800 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <span>
            {files.length} {t('fileTransfer:status.itemsCount')}
            {selectedFiles.size > 0 && ` (${selectedFiles.size} ${t('fileTransfer:status.selectedCount')})`}
          </span>

          <div className="flex items-center gap-2">{isLoading && <Icon icon="mdi:loading" className="w-3 h-3 animate-spin text-lime-400" />}</div>
        </div>
      </div>

      {/* Hidden File Input */}
      {isLocal && <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInputChange} />}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('fileTransfer:delete.confirmTitle')}
        size="sm"
        disableContentAnimation={true}
        disableBackdropBlur={true}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <Icon icon="mdi:alert-circle" className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm">
                {t('fileTransfer:delete.confirmMessage')}
              </p>
              <div className="mt-2 p-2 bg-neutral-800 rounded text-xs text-gray-300 max-h-20 overflow-y-auto">
                {filesToDelete.fileNames}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              className="text-gray-400 hover:text-white"
            >
              {t('common:cancel')}
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t('fileTransfer:delete.confirmButton')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
