import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { SSHSessionManager } from './ssh-session-manager'

const require = createRequire(import.meta.url)
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
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    title: 'Web3 SSH Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allow external wallet connections
      allowRunningInsecureContent: true, // For Web3 wallet connections
      enableRemoteModule: false,
      sandbox: false, // Required for WalletConnect
    },
    // macOS 优化的标题栏样式
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    titleBarOverlay: process.platform === 'win32' ? {
      color: '#000000',
      symbolColor: '#BCFF2F',
      height: 32
    } : undefined,
    backgroundColor: '#000000', // 窗口背景色
    vibrancy: process.platform === 'darwin' ? 'ultra-dark' : undefined, // macOS 毛玻璃效果
    visualEffectState: process.platform === 'darwin' ? 'active' : undefined,
    show: false, // Don't show until ready
  })

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win?.show()
    
    // Open DevTools in development
    if (VITE_DEV_SERVER_URL) {
      win?.webContents.openDevTools()
    }
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    
    // Log wallet detection for debugging
    win?.webContents.executeJavaScript(`
      console.log('Wallet detection:', {
        ethereum: typeof window.ethereum,
        okxwallet: typeof window.okxwallet,
        metaMask: typeof window.MetaMask
      });
    `).catch(console.error)
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
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

// 初始化 SSH 会话管理器
function initSSHManager() {
  sshManager = new SSHSessionManager()
  
  // 监听会话事件并转发给渲染进程
  sshManager.on('session-created', (sessionData) => {
    win?.webContents.send('ssh-session-created', sessionData)
  })
  
  sshManager.on('session-connected', (sessionId) => {
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
}

// SSH Tab 相关的 IPC 处理器
ipcMain.handle('ssh-create-session', async (event, config) => {
  try {
    if (!sshManager) {
      throw new Error('SSH 管理器未初始化')
    }
    
    const sessionId = await sshManager.createSession(config)
    return { success: true, sessionId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
})

ipcMain.handle('ssh-close-session', async (event, sessionId) => {
  try {
    if (!sshManager) {
      throw new Error('SSH 管理器未初始化')
    }
    
    await sshManager.closeSession(sessionId)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
})

ipcMain.handle('ssh-switch-session', async (event, sessionId) => {
  try {
    if (!sshManager) {
      throw new Error('SSH 管理器未初始化')
    }
    
    const success = sshManager.setActiveSession(sessionId)
    return { success }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
})

ipcMain.handle('ssh-send-command', async (event, sessionId, command) => {
  try {
    if (!sshManager) {
      throw new Error('SSH 管理器未初始化')
    }
    
    const success = sshManager.sendCommand(sessionId, command)
    return { success }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
})

ipcMain.handle('ssh-resize-session', async (event, sessionId, cols, rows) => {
  try {
    if (!sshManager) {
      throw new Error('SSH 管理器未初始化')
    }
    
    const success = sshManager.resizeSession(sessionId, cols, rows)
    return { success }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
})

ipcMain.handle('ssh-get-all-sessions', async (event) => {
  try {
    if (!sshManager) {
      return { success: true, sessions: [] }
    }
    
    const sessions = sshManager.getAllSessions()
    return { success: true, sessions }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
})

ipcMain.handle('ssh-get-active-session', async (event) => {
  try {
    if (!sshManager) {
      return { success: true, sessionId: null }
    }
    
    const sessionId = sshManager.getActiveSessionId()
    return { success: true, sessionId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }
  }
})

// 保留原有的测试连接功能（用于配置验证）
ipcMain.handle('ssh-test-connection', async (event, config) => {
  try {
    const { Client } = await import('ssh2')
    
    return new Promise((resolve) => {
      const conn = new Client()
      const startTime = Date.now()
      
      const timeout = setTimeout(() => {
        conn.end()
        resolve({
          success: false,
          message: '连接超时',
          connectionTime: Date.now() - startTime,
        })
      }, 10000)

      conn.on('ready', () => {
        clearTimeout(timeout)
        const connectionTime = Date.now() - startTime
        conn.end()
        
        resolve({
          success: true,
          message: `连接成功！耗时 ${connectionTime}ms`,
          connectionTime,
          serverInfo: {
            hostname: config.host,
            username: config.username,
          },
        })
      })

      conn.on('error', (err) => {
        clearTimeout(timeout)
        const connectionTime = Date.now() - startTime
        
        let errorMessage = '连接失败'
        if (err.message.includes('ECONNREFUSED')) {
          errorMessage = '连接被拒绝，请检查主机地址和端口'
        } else if (err.message.includes('ENOTFOUND')) {
          errorMessage = '无法解析主机名，请检查网络连接'
        } else if (err.message.includes('Authentication failed')) {
          errorMessage = '认证失败，请检查用户名和密码/密钥'
        } else {
          errorMessage = `连接失败: ${err.message}`
        }

        resolve({
          success: false,
          message: errorMessage,
          connectionTime,
        })
      })

      try {
        const connectionConfig: any = {
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
          message: `配置错误: ${error instanceof Error ? error.message : '未知错误'}`,
          connectionTime: Date.now() - startTime,
        })
      }
    })
  } catch (error) {
    return {
      success: false,
      message: `SSH 模块加载失败: ${error instanceof Error ? error.message : '未知错误'}`,
    }
  }
})

app.whenReady().then(() => {
  createWindow()
  initSSHManager()
})

// 应用退出时清理
app.on('before-quit', () => {
  if (sshManager) {
    sshManager.cleanup()
  }
})
