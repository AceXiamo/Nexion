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
  openModal: (sessionId: string) => void
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

export const useFileTransferStore = create<FileTransferState & FileTransferActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    openModal: (sessionId: string) => {
      set({
        isOpen: true,
        currentSession: sessionId,
        errors: {},
      })

      // Load initial file listings
      const { loadLocalFiles, loadRemoteFiles, localPath, remotePath } = get()
      loadLocalFiles(localPath)
      loadRemoteFiles(remotePath)
    },

    closeModal: () => {
      set({
        isOpen: false,
        currentSession: null,
        errors: {},
        transferQueue: get().transferQueue.filter((task) => task.status === 'transferring' || task.status === 'pending'),
      })
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
    },

    clearCompletedTasks: () => {
      set((state) => ({
        transferQueue: state.transferQueue.filter((task) => task.status !== 'completed' && task.status !== 'error'),
      }))
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

          await sftpService.uploadFile(localPath, remotePath, (progress) => {
            const progressValue = Number(progress) || 0
            const fileSize = Number(stats.size) || 0
            const transferred = Math.round((fileSize * progressValue) / 100)
            console.log('progressValue', progressValue)
            console.log('transferred', transferred)
            get().updateTransferTask(taskId, {
              transferred: isNaN(transferred) ? 0 : transferred,
              speed: progressValue,
            })
          })

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

          await sftpService.downloadFile(remotePath, localPath, (progress) => {
            const progressValue = Number(progress) || 0
            const transferred = Math.round((fileSize * progressValue) / 100)
            get().updateTransferTask(taskId, {
              transferred: isNaN(transferred) ? 0 : transferred,
              speed: progressValue,
            })
          })

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
  }))
)
