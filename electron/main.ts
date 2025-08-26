import { app, BrowserWindow } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

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

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    title: 'Web3 SSH Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
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

app.whenReady().then(createWindow)
