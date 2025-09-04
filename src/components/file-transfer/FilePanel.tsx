import React, { useState, useRef } from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { FileBrowser } from './FileBrowser'
import { PathBreadcrumb } from './PathBreadcrumb'
import { useFileTransferStore } from '@/store/file-transfer-store'
import type { FileItem } from '@/types/file-transfer'
import { cn } from '@/lib/utils'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isLocal = type === 'local'
  const panelTitle = isLocal ? '本地文件' : '远程文件'
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

  const handleFileUpload = () => {
    if (isLocal && fileInputRef.current) {
      fileInputRef.current.click()
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

  const handleCreateFolder = async () => {
    const folderName = prompt('输入文件夹名称:')
    if (!folderName?.trim()) return

    const store = useFileTransferStore.getState()

    if (isLocal) {
      // Create local folder using Electron IPC
      try {
        const newFolderPath = path.join(currentPath, folderName)
        await window.ipcRenderer?.invoke('fs:mkdir', newFolderPath)
        store.loadLocalFiles(currentPath)
      } catch (error) {
        console.error('Failed to create local folder:', error)
        store.setLocalError('创建文件夹失败')
      }
    } else {
      // Create remote folder using SFTP
      const newFolderPath = path.posix.join(currentPath, folderName)
      await store.createRemoteDirectory(newFolderPath)
    }
  }

  const handleDelete = async () => {
    if (selectedFiles.size === 0) return

    const fileNames = Array.from(selectedFiles)
      .map((filePath) => {
        const file = files.find((f) => f.path === filePath)
        return file?.name || path.basename(filePath)
      })
      .join(', ')

    if (!confirm(`确定要删除这些文件吗？\n${fileNames}`)) return

    const store = useFileTransferStore.getState()

    if (isLocal) {
      // Delete local files using Electron IPC
      try {
        for (const filePath of selectedFiles) {
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
        store.setLocalError('删除文件失败')
      }
    } else {
      // Delete remote files using SFTP
      try {
        for (const filePath of selectedFiles) {
          await store.deleteRemoteFile(filePath)
        }
        setSelectedFiles(new Set())
      } catch (error) {
        console.error('Failed to delete remote files:', error)
      }
    }
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
          <Button variant="ghost" size="sm" onClick={handleGoUp} disabled={isLoading || currentPath === '/'} title="返回上级">
            <Icon icon="mdi:arrow-up" className="w-4 h-4" />
          </Button>

          {isLocal && (
            <Button variant="ghost" size="sm" onClick={handleFileUpload} disabled={isLoading} title="上传文件">
              <Icon icon="mdi:upload" className="w-4 h-4" />
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={handleCreateFolder} disabled={isLoading} title="新建文件夹">
            <Icon icon="mdi:folder-plus" className="w-4 h-4" />
          </Button>

          {selectedFiles.size > 0 && (
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isLoading} title="删除选中">
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
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="px-3 py-2 border-t border-neutral-800 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <span>
            {files.length} 项目
            {selectedFiles.size > 0 && ` (${selectedFiles.size} 已选中)`}
          </span>

          <div className="flex items-center gap-2">{isLoading && <Icon icon="mdi:loading" className="w-3 h-3 animate-spin text-lime-400" />}</div>
        </div>
      </div>

      {/* Hidden File Input */}
      {isLocal && <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInputChange} />}
    </div>
  )
}
