/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer & {
    ssh: {
      createSession: (config: any) => Promise<any>
      closeSession: (sessionId: string) => Promise<any>
      switchSession: (sessionId: string) => Promise<any>
      sendCommand: (sessionId: string, command: string) => Promise<any>
      resizeSession: (sessionId: string, cols: number, rows: number) => Promise<any>
      getAllSessions: () => Promise<any>
      getActiveSession: () => Promise<any>
      reconnectSession: (sessionId: string) => Promise<any>
      testConnection: (config: any) => Promise<any>
    }
  }
}
