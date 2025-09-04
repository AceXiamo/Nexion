import React, { useState, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { FileItem as FileItemComponent } from './FileItem'
import { useFileTransferStore } from '@/store/file-transfer-store'
import type { FileItem } from '@/types/file-transfer'
import { cn } from '@/lib/utils'
// Note: Using path-browserify for browser compatibility
const path = {
  join: (...parts: string[]) => parts.join('/').replace(/\/+/g, '/'),
  basename: (filePath: string) => filePath.split('/').pop() || '',
  posix: {
    join: (...parts: string[]) => parts.join('/').replace(/\/+/g, '/')
  }
}

interface FileBrowserProps {
  files: FileItem[]
  isLoading: boolean
  selectedFiles: Set<string>
  onSelectionChange: (selection: Set<string>) => void
  onFileDoubleClick: (file: FileItem) => void
  type: 'local' | 'remote'
  currentPath: string
}

export function FileBrowser({
  files,
  isLoading,
  selectedFiles,
  onSelectionChange,
  onFileDoubleClick,
  type,
  currentPath
}: FileBrowserProps) {
  const [draggedFiles, setDraggedFiles] = useState<Set<string>>(new Set())
  const [isDragOver, setIsDragOver] = useState(false)
  const [lastClickedIndex, setLastClickedIndex] = useState<number>(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleFileClick = (file: FileItem, index: number, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + Click: Toggle selection
      const newSelection = new Set(selectedFiles)
      if (newSelection.has(file.path)) {
        newSelection.delete(file.path)
      } else {
        newSelection.add(file.path)
      }
      onSelectionChange(newSelection)
      setLastClickedIndex(index)
    } else if (event.shiftKey && lastClickedIndex !== -1) {
      // Shift + Click: Range selection
      const start = Math.min(lastClickedIndex, index)
      const end = Math.max(lastClickedIndex, index)
      const newSelection = new Set<string>()
      
      for (let i = start; i <= end; i++) {
        if (files[i]) {
          newSelection.add(files[i].path)
        }
      }
      
      onSelectionChange(newSelection)
    } else {
      // Regular click: Single selection
      const newSelection = new Set([file.path])
      onSelectionChange(newSelection)
      setLastClickedIndex(index)
    }
  }

  const handleFileDoubleClick = (file: FileItem) => {
    onFileDoubleClick(file)
  }

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, file: FileItem) => {
    setDraggedFiles(new Set([file.path]))
    
    // Set drag data
    e.dataTransfer.setData('text/plain', file.path)
    e.dataTransfer.setData('application/x-file-transfer', JSON.stringify({
      type,
      files: [file],
      sourceType: type
    }))
    
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    try {
      const transferData = e.dataTransfer.getData('application/x-file-transfer')
      if (transferData) {
        const data = JSON.parse(transferData)
        
        // Only handle drops from opposite type
        if (data.sourceType !== type) {
          const store = useFileTransferStore.getState()
          
          if (type === 'remote') {
            // Upload files to remote
            const uploadTasks = data.files.map((file: FileItem) => ({
              localPath: file.path,
              remotePath: path.posix.join(currentPath, file.name)
            }))
            await store.uploadFiles(uploadTasks)
          } else {
            // Download files to local
            const downloadTasks = data.files.map((file: FileItem) => ({
              remotePath: file.path,
              localPath: path.join(currentPath, file.name)
            }))
            await store.downloadFiles(downloadTasks)
          }
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          // TODO: Navigate up
          break
        case 'ArrowDown':
          e.preventDefault()
          // TODO: Navigate down
          break
        case 'Enter':
          e.preventDefault()
          // TODO: Open selected item
          break
        case 'Delete':
          e.preventDefault()
          // TODO: Delete selected items
          break
        case 'Escape':
          e.preventDefault()
          onSelectionChange(new Set())
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onSelectionChange])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Icon icon="mdi:loading" className="w-8 h-8 animate-spin mb-2" />
        <span className="text-sm">加载中...</span>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Icon icon="mdi:folder-open" className="w-8 h-8 mb-2" />
        <span className="text-sm">此文件夹为空</span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-full overflow-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent",
        isDragOver && "bg-lime-400/10 border-lime-400/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      tabIndex={0}
    >
      {/* Drop overlay */}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-lime-400/20 border-2 border-dashed border-lime-400/50 pointer-events-none z-10">
          <div className="flex flex-col items-center text-lime-400">
            <Icon icon="mdi:download" className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">释放以传输文件</span>
          </div>
        </div>
      )}

      <div className="p-2 space-y-1">
        {files.map((file, index) => (
          <FileItemComponent
            key={file.path}
            file={file}
            isSelected={selectedFiles.has(file.path)}
            isDragged={draggedFiles.has(file.path)}
            onClick={(e) => handleFileClick(file, index, e)}
            onDoubleClick={() => handleFileDoubleClick(file)}
            onDragStart={(e) => handleDragStart(e, file)}
          />
        ))}
      </div>
    </div>
  )
}