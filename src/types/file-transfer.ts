export interface FileItem {
  name: string
  type: 'file' | 'directory'
  size: number
  permissions: string
  modifiedAt: Date
  path: string
  isHidden?: boolean
}

export interface TransferTask {
  id: string
  type: 'upload' | 'download'
  source: string
  destination: string
  fileName: string
  fileSize: number
  transferred: number
  progress?: number
  status: 'pending' | 'transferring' | 'completed' | 'error' | 'paused'
  error?: string
  startTime?: Date
  endTime?: Date
  speed?: number
}

export interface FileTransferState {
  isOpen: boolean
  currentSession: string | null
  localPath: string
  remotePath: string
  localFiles: FileItem[]
  remoteFiles: FileItem[]
  transferQueue: TransferTask[]
  isLoading: {
    local: boolean
    remote: boolean
  }
  errors: {
    local?: string
    remote?: string
  }
}

export interface SftpConnection {
  sessionId: string
  isConnected: boolean
  connect(): Promise<void>
  disconnect(): void
  listFiles(path: string): Promise<FileItem[]>
  uploadFile(localPath: string, remotePath: string): Promise<void>
  downloadFile(remotePath: string, localPath: string): Promise<void>
  createDirectory(path: string): Promise<void>
  deleteFile(path: string): Promise<void>
  deleteDirectory(path: string): Promise<void>
}