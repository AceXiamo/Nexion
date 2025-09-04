import type { FileItem, SftpConnection } from '@/types/file-transfer'
import '@/types/electron'

export class SftpService implements SftpConnection {
  sessionId: string
  isConnected: boolean = false

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  async connect(): Promise<void> {
    if (!window.ipcRenderer?.sftp) {
      throw new Error('SFTP IPC not available')
    }

    try {
      const result = await window.ipcRenderer.sftp.connect(this.sessionId)
      if (!result.success) {
        throw new Error(result.error || 'SFTP connection failed')
      }
      this.isConnected = true
    } catch (error) {
      this.isConnected = false
      throw error
    }
  }

  disconnect(): void {
    if (window.ipcRenderer?.sftp) {
      window.ipcRenderer.sftp.disconnect(this.sessionId)
    }
    this.isConnected = false
  }

  async listFiles(path: string): Promise<FileItem[]> {
    if (!this.isConnected) {
      throw new Error('SFTP not connected')
    }

    if (!window.ipcRenderer?.sftp) {
      throw new Error('SFTP IPC not available')
    }

    const result = await window.ipcRenderer.sftp.listFiles(this.sessionId, path)
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to list remote files')
    }
    
    return result.files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size || 0,
      permissions: file.permissions || '',
      modifiedAt: file.modifiedAt ? new Date(file.modifiedAt) : new Date(),
      path: file.path,
      isHidden: file.name.startsWith('.')
    }))
  }

  async uploadFile(
    localPath: string, 
    remotePath: string, 
    taskId: string
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('SFTP not connected')
    }

    if (!window.ipcRenderer?.sftp) {
      throw new Error('SFTP IPC not available')
    }

    const result = await window.ipcRenderer.sftp.uploadFile(
      this.sessionId, 
      localPath, 
      remotePath,
      taskId
    )
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed')
    }
  }

  async downloadFile(
    remotePath: string, 
    localPath: string, 
    taskId: string
  ): Promise<void> {
    if (!this.isConnected) {
      throw new Error('SFTP not connected')
    }

    if (!window.ipcRenderer?.sftp) {
      throw new Error('SFTP IPC not available')
    }

    const result = await window.ipcRenderer.sftp.downloadFile(
      this.sessionId, 
      remotePath, 
      localPath,
      taskId
    )
    
    if (!result.success) {
      throw new Error(result.error || 'Download failed')
    }
  }

  async createDirectory(path: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('SFTP not connected')
    }

    if (!window.ipcRenderer?.sftp) {
      throw new Error('SFTP IPC not available')
    }

    const result = await window.ipcRenderer.sftp.createDirectory(this.sessionId, path)
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create directory')
    }
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('SFTP not connected')
    }

    if (!window.ipcRenderer?.sftp) {
      throw new Error('SFTP IPC not available')
    }

    const result = await window.ipcRenderer.sftp.deleteFile(this.sessionId, path)
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete file')
    }
  }

  async deleteDirectory(path: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('SFTP not connected')
    }

    if (!window.ipcRenderer?.sftp) {
      throw new Error('SFTP IPC not available')
    }

    const result = await window.ipcRenderer.sftp.deleteDirectory(this.sessionId, path)
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete directory')
    }
  }
}

class SftpServiceManager {
  private services = new Map<string, SftpService>()

  getService(sessionId: string): SftpService {
    if (!this.services.has(sessionId)) {
      this.services.set(sessionId, new SftpService(sessionId))
    }
    return this.services.get(sessionId)!
  }

  async connectService(sessionId: string): Promise<SftpService> {
    const service = this.getService(sessionId)
    if (!service.isConnected) {
      await service.connect()
    }
    return service
  }

  disconnectService(sessionId: string): void {
    const service = this.services.get(sessionId)
    if (service) {
      service.disconnect()
      this.services.delete(sessionId)
    }
  }

  disconnectAll(): void {
    this.services.forEach((service) => {
      service.disconnect()
    })
    this.services.clear()
  }
}

export const sftpServiceManager = new SftpServiceManager()
