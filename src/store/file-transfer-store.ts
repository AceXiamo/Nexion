import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { FileItem, TransferTask, FileTransferState } from '@/types/file-transfer'
import { sftpServiceManager } from '@/services/sftp-service'
import { v4 as uuidv4 } from 'uuid'
// Note: Using path-browserify for browser compatibility
const path = {
  join: (...parts: string[]) => parts.join('/').replace(/\/+/g, '/'),
  basename: (filePath: string) => filePath.split('/').pop() || '',
  posix: {
    join: (...parts: string[]) => parts.join('/').replace(/\/+/g, '/'),
  },
}

interface FileTransferActions {
  // Modal actions
  openModal: (sessionId: string, initialLocalPath?: string, initialRemotePath?: string) => void
  closeModal: () => void

  // Path actions
  setLocalPath: (path: string) => void
  setRemotePath: (path: string) => void

  // File listing actions
  loadLocalFiles: (path: string) => Promise<void>
  loadRemoteFiles: (path: string) => Promise<void>
  refreshFiles: () => Promise<void>

  // Transfer actions
  addTransferTask: (task: Omit<TransferTask, 'id'>) => string
  updateTransferTask: (id: string, updates: Partial<TransferTask>) => void
  removeTransferTask: (id: string) => void
  clearCompletedTasks: () => void

  // File operations
  uploadFiles: (files: { localPath: string; remotePath: string }[]) => Promise<void>
  downloadFiles: (files: { remotePath: string; localPath: string }[]) => Promise<void>
  deleteRemoteFile: (filePath: string) => Promise<void>
  createRemoteDirectory: (dirPath: string) => Promise<void>

  // Progress handling
  setupProgressListener: () => void
  removeProgressListener: () => void

  // Error handling
  setLocalError: (error?: string) => void
  setRemoteError: (error?: string) => void
  clearErrors: () => void
}

const initialState: FileTransferState = {
  isOpen: false,
  currentSession: null,
  localPath: process.env.HOME || '/Users',
  remotePath: '/',
  localFiles: [],
  remoteFiles: [],
  transferQueue: [],
  isLoading: {
    local: false,
    remote: false,
  },
  errors: {},
}

// Store progress listener function reference
let progressListener: ((event: any, data: { taskId: string; progress: number; transferred: number }) => void) | null = null

// Progress throttling - store last update time for each task
const lastProgressUpdate = new Map<string, number>()
const PROGRESS_UPDATE_INTERVAL = 100 // Update every 100ms

export const useFileTransferStore = create<FileTransferState & FileTransferActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    openModal: async (sessionId: string, initialLocalPath?: string, initialRemotePath?: string) => {
      let localPath = initialLocalPath
      let remotePath = initialRemotePath

      // Get smart default paths if not provided
      if (!localPath) {
        try {
          const homeResult = await window.ipcRenderer?.system?.getUserHomeDirectory()
          if (homeResult?.success && homeResult.homeDir) {
            localPath = homeResult.homeDir
          }
        } catch (error) {
          console.warn('Failed to get user home directory:', error)
        }
      }

      if (!remotePath) {
        try {
          const dirResult = await window.ipcRenderer?.ssh?.getCurrentDirectory(sessionId)
          if (dirResult?.success && dirResult.directory) {
            remotePath = dirResult.directory
          }
        } catch (error) {
          console.warn('Failed to get remote current directory:', error)
        }
      }

      // Fallback to original defaults
      const finalLocalPath = localPath || get().localPath
      const finalRemotePath = remotePath || get().remotePath

      set({
        isOpen: true,
        currentSession: sessionId,
        localPath: finalLocalPath,
        remotePath: finalRemotePath,
        errors: {},
      })

      // Setup progress listener
      get().setupProgressListener()

      // Load initial file listings
      const { loadLocalFiles, loadRemoteFiles } = get()
      loadLocalFiles(finalLocalPath)
      loadRemoteFiles(finalRemotePath)
    },

    closeModal: () => {
      // Remove progress listener
      get().removeProgressListener()

      // First, just set isOpen to false to start the closing animation
      set({
        isOpen: false,
        errors: {},
        transferQueue: get().transferQueue.filter((task) => task.status === 'transferring' || task.status === 'pending'),
      })

      // Delay clearing the session and content until animation completes
      setTimeout(() => {
        set({
          currentSession: null,
          localFiles: [],
          remoteFiles: [],
        })
      }, 300) // Wait for modal animation to complete (250ms + buffer)
    },

    setLocalPath: (path: string) => {
      set({ localPath: path })
      get().loadLocalFiles(path)
    },

    setRemotePath: (path: string) => {
      set({ remotePath: path })
      get().loadRemoteFiles(path)
    },

    loadLocalFiles: async (dirPath: string) => {
      set((state) => ({ isLoading: { ...state.isLoading, local: true } }))

      try {
        // Use Node.js fs API through Electron IPC
        if (!window.ipcRenderer?.invoke) {
          throw new Error('Electron IPC not available')
        }

        const result = await window.ipcRenderer.invoke('fs:readdir', dirPath)

        if (!result.success) {
          throw new Error(result.error || 'Failed to read directory')
        }

        const fileItems: FileItem[] = result.files.map((file: any) => ({
          name: file.name,
          type: file.type,
          size: file.size || 0,
          permissions: file.permissions ? file.permissions.toString(8) : '',
          modifiedAt: new Date(file.modifiedAt),
          path: file.path,
          isHidden: file.isHidden,
        }))

        set({
          localFiles: fileItems.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name)
            return a.type === 'directory' ? -1 : 1
          }),
          localPath: dirPath,
        })

        get().setLocalError()
      } catch (error) {
        console.error('Failed to load local files:', error)
        get().setLocalError(error instanceof Error ? error.message : 'Failed to load local files')
      } finally {
        set((state) => ({ isLoading: { ...state.isLoading, local: false } }))
      }
    },

    loadRemoteFiles: async (dirPath: string) => {
      const { currentSession } = get()
      if (!currentSession) return

      set((state) => ({ isLoading: { ...state.isLoading, remote: true } }))

      try {
        const sftpService = await sftpServiceManager.connectService(currentSession)
        const files = await sftpService.listFiles(dirPath)

        set({
          remoteFiles: files.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name)
            return a.type === 'directory' ? -1 : 1
          }),
          remotePath: dirPath,
        })

        get().setRemoteError()
      } catch (error) {
        console.error('Failed to load remote files:', error)
        get().setRemoteError(error instanceof Error ? error.message : 'Failed to load remote files')
      } finally {
        set((state) => ({ isLoading: { ...state.isLoading, remote: false } }))
      }
    },

    refreshFiles: async () => {
      const { localPath, remotePath } = get()
      await Promise.all([get().loadLocalFiles(localPath), get().loadRemoteFiles(remotePath)])
    },

    addTransferTask: (task: Omit<TransferTask, 'id'>) => {
      const id = uuidv4()
      const newTask: TransferTask = {
        id,
        status: 'pending',
        transferred: 0,
        startTime: new Date(),
        ...task, // Spread task last to preserve any existing values
      }

      set((state) => ({
        transferQueue: [...state.transferQueue, newTask],
      }))

      return id
    },

    updateTransferTask: (id: string, updates: Partial<TransferTask>) => {
      set((state) => ({
        transferQueue: state.transferQueue.map((task) => (task.id === id ? { ...task, ...updates } : task)),
      }))
    },

    removeTransferTask: (id: string) => {
      set((state) => ({
        transferQueue: state.transferQueue.filter((task) => task.id !== id),
      }))
      // Clean up throttling cache for this task
      lastProgressUpdate.delete(id)
    },

    clearCompletedTasks: () => {
      set((state) => {
        const completedTaskIds = state.transferQueue
          .filter((task) => task.status === 'completed' || task.status === 'error')
          .map((task) => task.id)
        
        // Clean up throttling cache for completed tasks
        completedTaskIds.forEach(id => lastProgressUpdate.delete(id))
        
        return {
          transferQueue: state.transferQueue.filter((task) => task.status !== 'completed' && task.status !== 'error'),
        }
      })
    },

    uploadFiles: async (files: { localPath: string; remotePath: string }[]) => {
      const { currentSession } = get()
      if (!currentSession) return

      const sftpService = await sftpServiceManager.connectService(currentSession)

      for (const { localPath, remotePath } of files) {
        const fileName = path.basename(localPath)
        const stats = await window.ipcRenderer!.invoke('fs:stat', localPath)

        const taskId = get().addTransferTask({
          type: 'upload',
          source: localPath,
          destination: remotePath,
          fileName,
          fileSize: Number(stats.size) || 0,
          transferred: 0,
          status: 'pending',
        })

        try {
          get().updateTransferTask(taskId, { status: 'transferring' })

          await sftpService.uploadFile(localPath, remotePath, taskId)

          get().updateTransferTask(taskId, {
            status: 'completed',
            endTime: new Date(),
            transferred: Number(stats.size) || 0,
          })
        } catch (error) {
          get().updateTransferTask(taskId, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
            endTime: new Date(),
          })
        }
      }

      // Refresh remote files after upload
      await get().loadRemoteFiles(get().remotePath)
    },

    downloadFiles: async (files: { remotePath: string; localPath: string }[]) => {
      const { currentSession } = get()
      if (!currentSession) return

      const sftpService = await sftpServiceManager.connectService(currentSession)

      for (const { remotePath, localPath } of files) {
        const fileName = path.basename(remotePath)
        const remoteFile = get().remoteFiles.find((f) => f.path === remotePath)
        const fileSize = Number(remoteFile?.size) || 0

        const taskId = get().addTransferTask({
          type: 'download',
          source: remotePath,
          destination: localPath,
          fileName,
          fileSize,
          transferred: 0,
          status: 'pending',
        })

        try {
          get().updateTransferTask(taskId, { status: 'transferring' })

          await sftpService.downloadFile(remotePath, localPath, taskId)

          get().updateTransferTask(taskId, {
            status: 'completed',
            endTime: new Date(),
            transferred: fileSize,
          })
        } catch (error) {
          get().updateTransferTask(taskId, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Download failed',
            endTime: new Date(),
          })
        }
      }

      // Refresh local files after download
      await get().loadLocalFiles(get().localPath)
    },

    deleteRemoteFile: async (filePath: string) => {
      const { currentSession } = get()
      if (!currentSession) return

      try {
        const sftpService = await sftpServiceManager.connectService(currentSession)
        const file = get().remoteFiles.find((f) => f.path === filePath)

        if (file?.type === 'directory') {
          await sftpService.deleteDirectory(filePath)
        } else {
          await sftpService.deleteFile(filePath)
        }

        // Refresh remote files after deletion
        await get().loadRemoteFiles(get().remotePath)
      } catch (error) {
        get().setRemoteError(error instanceof Error ? error.message : 'Delete failed')
      }
    },

    createRemoteDirectory: async (dirPath: string) => {
      const { currentSession } = get()
      if (!currentSession) return

      try {
        const sftpService = await sftpServiceManager.connectService(currentSession)
        await sftpService.createDirectory(dirPath)

        // Refresh remote files after creation
        await get().loadRemoteFiles(get().remotePath)
      } catch (error) {
        get().setRemoteError(error instanceof Error ? error.message : 'Create directory failed')
      }
    },

    setLocalError: (error?: string) => {
      set((state) => ({
        errors: { ...state.errors, local: error },
      }))
    },

    setRemoteError: (error?: string) => {
      set((state) => ({
        errors: { ...state.errors, remote: error },
      }))
    },

    clearErrors: () => {
      set({ errors: {} })
    },

    setupProgressListener: () => {
      if (progressListener || !window.ipcRenderer) return

      progressListener = (_event: any, data: { taskId: string; progress: number; transferred: number }) => {
        const now = Date.now()
        const lastUpdate = lastProgressUpdate.get(data.taskId) || 0
        
        // Only update if enough time has passed since last update, or if progress is 100%
        if (now - lastUpdate >= PROGRESS_UPDATE_INTERVAL || data.progress === 100) {
          lastProgressUpdate.set(data.taskId, now)
          
          get().updateTransferTask(data.taskId, {
            progress: data.progress,
            transferred: data.transferred,
          })
        }
      }

      window.ipcRenderer.on('file-transfer-progress', progressListener)
    },

    removeProgressListener: () => {
      if (progressListener && window.ipcRenderer) {
        window.ipcRenderer.removeListener('file-transfer-progress', progressListener)
        progressListener = null
        // Clear throttling cache
        lastProgressUpdate.clear()
      }
    },
  }))
)
