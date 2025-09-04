// Type definitions for i18n
export type SupportedLanguages = 'en' | 'zh'

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: 'raw'
  }
}

type ExtendedIpcRenderer = import('electron').IpcRenderer & {
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

declare global {
  interface Window {
    ipcRenderer: ExtendedIpcRenderer
  }
}

export {}
