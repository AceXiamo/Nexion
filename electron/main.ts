import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import { SSHSessionManager } from './ssh-session-manager'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let sshManager: SSHSessionManager | null = null

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'app-icon.png'),
    title: 'Web3 SSH Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allow external wallet connections
      allowRunningInsecureContent: true, // For Web3 wallet connections
      sandbox: false, // Required for WalletConnect
      experimentalFeatures: true, // Enable experimental web features
      enableBlinkFeatures: 'CSSColorSchemeUARendering', // Enable modern CSS features
      additionalArguments: ['--disable-web-security', '--disable-features=VizDisplayCompositor'],
    },
    // Optimized title bar style for macOS
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    titleBarOverlay: process.platform === 'win32' ? {
      color: '#000000',
      symbolColor: '#BCFF2F',
      height: 32
    } : undefined,
    backgroundColor: '#000000', // Window background color
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined, // macOS glass effect
    visualEffectState: process.platform === 'darwin' ? 'active' : undefined,
    show: false, // Don't show until ready
  })

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win?.show()
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  win.webContents.openDevTools()
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open developer tools in development mode
    // win.webContents.openDevTools()
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Initialize SSH session manager
function initSSHManager() {
  sshManager = new SSHSessionManager(win?.webContents)
  
  // Listen to session events and forward them to the renderer process
  sshManager.on('session-created', (sessionData) => {
    win?.webContents.send('ssh-session-created', sessionData)
  })
  
  sshManager.on('session-connected', (sessionId) => {
    console.log('ssh-session-connected', sessionId)
    win?.webContents.send('ssh-session-connected', sessionId)
  })
  
  sshManager.on('session-disconnected', (sessionId) => {
    win?.webContents.send('ssh-session-disconnected', sessionId)
  })
  
  sshManager.on('session-error', (sessionId, error) => {
    win?.webContents.send('ssh-session-error', sessionId, error)
  })
  
  sshManager.on('session-closed', (sessionId) => {
    win?.webContents.send('ssh-session-closed', sessionId)
  })
  
  sshManager.on('active-session-changed', (sessionId) => {
    win?.webContents.send('ssh-active-session-changed', sessionId)
  })
  
  sshManager.on('session-data', (sessionId, data) => {
    win?.webContents.send('ssh-session-data', sessionId, data)
  })

  sshManager.on('session-reconnecting', (sessionId, attempt, delay) => {
    win?.webContents.send('ssh-session-reconnecting', sessionId, attempt, delay)
  })
}

// SSH Tab related IPC handlers
ipcMain.handle('ssh-create-session', async (_event, config) => {
  try {
    if (!sshManager) {
      throw new Error('SSH manager not initialized')
    }
    
    const sessionId = await sshManager.createSession(config)
    return { success: true, sessionId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('ssh-close-session', async (_event, sessionId) => {
  try {
    if (!sshManager) {
      throw new Error('SSH manager not initialized')
    }
    
    await sshManager.closeSession(sessionId)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('ssh-switch-session', async (_event, sessionId) => {
  try {
    if (!sshManager) {
      throw new Error('SSH manager not initialized')
    }
    
    const success = sshManager.setActiveSession(sessionId)
    return { success }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('ssh-send-command', async (_event, sessionId, command) => {
  try {
    if (!sshManager) {
      throw new Error('SSH manager not initialized')
    }
    
    const success = sshManager.sendCommand(sessionId, command)
    return { success }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('ssh-resize-session', async (_event, sessionId, cols, rows) => {
  try {
    if (!sshManager) {
      throw new Error('SSH manager not initialized')
    }
    
    const success = sshManager.resizeSession(sessionId, cols, rows)
    return { success }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('ssh-get-all-sessions', async () => {
  try {
    if (!sshManager) {
      return { success: true, sessions: [] }
    }
    
    const sessions = sshManager.getAllSessions()
    return { success: true, sessions }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('ssh-get-active-session', async () => {
  try {
    if (!sshManager) {
      return { success: true, sessionId: null }
    }
    
    const sessionId = sshManager.getActiveSessionId()
    return { success: true, sessionId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

// Manual session reconnection
ipcMain.handle('ssh-reconnect-session', async (_event, sessionId) => {
  try {
    if (!sshManager) {
      throw new Error('SSH manager not initialized')
    }
    
    await sshManager.reconnectSession(sessionId)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

// Keep the original test connection functionality (for configuration validation)
ipcMain.handle('ssh-test-connection', async (_event, config) => {
  try {
    const { Client } = await import('ssh2')
    
    return new Promise((resolve) => {
      const conn = new Client()
      const startTime = Date.now()
      
      const timeout = setTimeout(() => {
        conn.end()
        resolve({
          success: false,
          message: 'Connection timeout',
          connectionTime: Date.now() - startTime,
        })
      }, 10000)

      conn.on('ready', () => {
        clearTimeout(timeout)
        const connectionTime = Date.now() - startTime
        conn.end()
        
        resolve({
          success: true,
          message: `Connection successful! Time taken: ${connectionTime}ms`,
          connectionTime,
          serverInfo: {
            hostname: config.host,
            username: config.username,
          },
        })
      })

      conn.on('error', (err: Error) => {
        clearTimeout(timeout)
        const connectionTime = Date.now() - startTime
        
        let errorMessage = 'Connection failed'
        if (err.message.includes('ECONNREFUSED')) {
          errorMessage = 'Connection refused, please check host address and port'
        } else if (err.message.includes('ENOTFOUND')) {
          errorMessage = 'Unable to resolve hostname, please check network connection'
        } else if (err.message.includes('Authentication failed')) {
          errorMessage = 'Authentication failed, please check username and password/key'
        } else {
          errorMessage = `Connection failed: ${err.message}`
        }

        resolve({
          success: false,
          message: errorMessage,
          connectionTime,
        })
      })

      try {
        const connectionConfig: Record<string, unknown> = {
          host: config.host,
          port: config.port,
          username: config.username,
          readyTimeout: 10000,
        }

        if (config.authType === 'password') {
          connectionConfig.password = config.password
        } else {
          connectionConfig.privateKey = config.privateKey
          if (config.passphrase) {
            connectionConfig.passphrase = config.passphrase
          }
        }

        conn.connect(connectionConfig)
      } catch (error) {
        clearTimeout(timeout)
        resolve({
          success: false,
          message: `Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          connectionTime: Date.now() - startTime,
        })
      }
    })
  } catch (error) {
    return {
      success: false,
      message: `SSH module loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
})

// File System IPC handlers
ipcMain.handle('fs:readdir', async (_event, dirPath: string) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    const files = []
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      try {
        const stats = await fs.stat(fullPath)
        files.push({
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modifiedAt: stats.mtime.toISOString(),
          permissions: stats.mode,
          isHidden: entry.name.startsWith('.'),
          path: fullPath
        })
      } catch (error) {
        // Skip files that can't be accessed
        console.warn(`Cannot access ${fullPath}:`, error)
      }
    }
    
    return { success: true, files }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('fs:stat', async (_event, filePath: string) => {
  try {
    const stats = await fs.stat(filePath)
    const isDirectory = stats.isDirectory()
    
    return {
      success: true,
      stats: {
        name: path.basename(filePath),
        type: isDirectory ? 'directory' : 'file',
        size: stats.size,
        modifiedAt: stats.mtime.toISOString(),
        permissions: stats.mode,
        isHidden: path.basename(filePath).startsWith('.'),
        path: filePath
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('fs:mkdir', async (_event, dirPath: string) => {
  try {
    await fs.mkdir(dirPath, { recursive: true })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('fs:unlink', async (_event, filePath: string) => {
  try {
    await fs.unlink(filePath)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('fs:rmdir', async (_event, dirPath: string) => {
  try {
    await fs.rmdir(dirPath, { recursive: true })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

// SFTP IPC handlers
ipcMain.handle('sftp:connect', async (_event, sessionId: string) => {
  try {
    if (!sshManager) {
      throw new Error('SSH manager not initialized')
    }
    
    const session = sshManager.getSessionObject(sessionId)
    if (!session) {
      throw new Error('SSH session not found')
    }
    
    // SFTP connection will be handled by the SSH session manager
    // For now, just return success if the SSH session is connected
    return { success: session.status === 'connected' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('sftp:disconnect', async (_event, sessionId: string) => {
  try {
    // SFTP disconnection is handled with SSH session disconnect
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('sftp:listFiles', async (_event, sessionId: string, remotePath: string) => {
  try {
    if (!sshManager) {
      throw new Error('SSH manager not initialized')
    }
    
    const session = sshManager.getSessionObject(sessionId)
    if (!session || session.status !== 'connected') {
      throw new Error('SSH session not connected')
    }
    
    // Use the SSH manager's SFTP connection to list files
    const files = await sshManager.listFiles(sessionId, remotePath)
    return { success: true, files }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('sftp:mkdir', async (_event, sessionId: string, remotePath: string) => {
  try {
    if (!sshManager) {
      throw new Error('SSH manager not initialized')
    }
    
    const session = sshManager.getSessionObject(sessionId)
    if (!session || session.status !== 'connected') {
      throw new Error('SSH session not connected')
    }
    
    await sshManager.createDirectory(sessionId, remotePath)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('sftp:unlink', async (_event, sessionId: string, remotePath: string) => {
  try {
    if (!sshManager) {
      throw new Error('SSH manager not initialized')
    }
    
    const session = sshManager.getSessionObject(sessionId)
    if (!session || session.status !== 'connected') {
      throw new Error('SSH session not connected')
    }
    
    await sshManager.deleteFile(sessionId, remotePath)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('sftp:rmdir', async (_event, sessionId: string, remotePath: string) => {
  try {
    if (!sshManager) {
      throw new Error('SSH manager not initialized')
    }
    
    const session = sshManager.getSessionObject(sessionId)
    if (!session || session.status !== 'connected') {
      throw new Error('SSH session not connected')
    }
    
    await sshManager.deleteDirectory(sessionId, remotePath)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('sftp:uploadFile', async (_event, sessionId: string, localPath: string, remotePath: string, taskId: string) => {
  try {
    if (!sshManager) {
      throw new Error('SSH manager not initialized')
    }
    
    const session = sshManager.getSessionObject(sessionId)
    if (!session || session.status !== 'connected') {
      throw new Error('SSH session not connected')
    }
    
    await sshManager.uploadFile(sessionId, localPath, remotePath, taskId)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('sftp:downloadFile', async (_event, sessionId: string, remotePath: string, localPath: string, taskId: string) => {
  try {
    if (!sshManager) {
      throw new Error('SSH manager not initialized')
    }
    
    const session = sshManager.getSessionObject(sessionId)
    if (!session || session.status !== 'connected') {
      throw new Error('SSH session not connected')
    }
    
    await sshManager.downloadFile(sessionId, remotePath, localPath, taskId)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

// WalletConnect IPC handlers
ipcMain.handle('wallet:openExternal', async (_event, url: string) => {
  try {
    await shell.openExternal(url)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open external URL'
    }
  }
})

app.whenReady().then(() => {
  createWindow()
  initSSHManager()
})

// Cleanup when application exits
app.on('before-quit', () => {
  if (sshManager) {
    sshManager.cleanup()
  }
})
