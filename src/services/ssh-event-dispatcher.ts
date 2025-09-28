import { Terminal } from '@xterm/xterm'
import '@/types/electron'

/**
 * Global SSH event dispatcher
 * Singleton pattern manages all SSH event listening, avoiding duplicate registration
 * Precisely dispatches data to corresponding terminal instances based on sessionId
 */
export class SSHEventDispatcher {
  private static instance: SSHEventDispatcher
  private terminals = new Map<string, Terminal>()
  private isInitialized = false

  private constructor() {}

  static getInstance(): SSHEventDispatcher {
    if (!this.instance) {
      this.instance = new SSHEventDispatcher()
    }
    return this.instance
  }

  /**
   * Initialize global event listeners - called only once for the entire application
   */
  initialize(): void {
    if (this.isInitialized || !window.ipcRenderer) return
    
    console.log('🚀 Initializing SSH event dispatcher')

    // Register global event listeners
    window.ipcRenderer.on('ssh-session-data', this.handleSessionData.bind(this))
    window.ipcRenderer.on('ssh-session-connected', this.handleSessionConnected.bind(this))
    window.ipcRenderer.on('ssh-session-disconnected', this.handleSessionDisconnected.bind(this))
    window.ipcRenderer.on('ssh-session-error', this.handleSessionError.bind(this))
    window.ipcRenderer.on('ssh-session-reconnecting', this.handleSessionReconnecting.bind(this))
    
    this.isInitialized = true
  }

  /**
   * Register terminal instance to dispatcher
   */
  registerTerminal(sessionId: string, terminal: Terminal): void {
    if (this.terminals.has(sessionId)) {
      console.log(`📱 Terminal instance already exists, updating registration: ${sessionId}`)
      // If already exists, update to new terminal instance (handle component remount)
      this.terminals.set(sessionId, terminal)
      return
    }
    console.log(`📱 Registering terminal instance: ${sessionId}`)
    this.terminals.set(sessionId, terminal)
  }

  /**
   * Unregister terminal instance from dispatcher
   */
  unregisterTerminal(sessionId: string): void {
    console.log(`📱 Unregistering terminal instance: ${sessionId}`)
    this.terminals.delete(sessionId)
  }

  /**
   * Get the number of registered terminals
   */
  getTerminalCount(): number {
    return this.terminals.size
  }

  /**
   * Get all registered session IDs
   */
  getRegisteredSessionIds(): string[] {
    return Array.from(this.terminals.keys())
  }

  /**
   * Check if the specified session has a registered terminal
   */
  hasTerminal(sessionId: string): boolean {
    return this.terminals.has(sessionId)
  }

  /**
   * Handle session data - precisely dispatch to corresponding terminal
   */
  private handleSessionData = (_event: unknown, sessionId: string, data: string): void => {
    const terminal = this.terminals.get(sessionId)
    if (terminal) {
      console.log(`📊 Dispatching data to terminal ${sessionId}:`, data.length, 'bytes')
      terminal.write(data)
    } else {
      console.warn(`⚠️ Session ${sessionId} has no registered terminal instance`)
    }
  }

  /**
   * Handle session connection success event
   */
  private handleSessionConnected = (_event: unknown, sessionId: string): void => {
    const terminal = this.terminals.get(sessionId)
    if (terminal) {
      console.log(`✅ Session ${sessionId} connected successfully`)
      terminal.write('\r\n\x1b[1;32m✓ SSH connection established\x1b[0m\r\n')
    }
  }

  /**
   * Handle session disconnection event
   */
  private handleSessionDisconnected = (_event: unknown, sessionId: string): void => {
    const terminal = this.terminals.get(sessionId)
    if (terminal) {
      console.log(`❌ Session ${sessionId} disconnected`)
      terminal.write('\r\n\x1b[1;31m✗ SSH connection disconnected\x1b[0m\r\n')
    }
  }

  /**
   * Handle session error event
   */
  private handleSessionError = (_event: unknown, sessionId: string, error: string): void => {
    const terminal = this.terminals.get(sessionId)
    if (terminal) {
      console.log(`🚨 Session ${sessionId} error occurred:`, error)
      terminal.write(`\r\n\x1b[1;31m✗ Connection error: ${error}\x1b[0m\r\n`)
    }
  }

  /**
   * Handle session reconnection event
   */
  private handleSessionReconnecting = (_event: unknown, sessionId: string, attempt: number, delay: number): void => {
    const terminal = this.terminals.get(sessionId)
    if (terminal) {
      console.log(`🔄 Session ${sessionId} reconnecting: attempt ${attempt}`)
      terminal.write(`\r\n\x1b[1;33m🔄 Reconnecting (attempt ${attempt}, ${Math.round(delay / 1000)}s delay)\x1b[0m\r\n`)
    }
  }

  /**
   * Clean up dispatcher - called when application exits
   */
  cleanup(): void {
    if (!this.isInitialized || !window.ipcRenderer) return

    console.log('🧹 Cleaning up SSH event dispatcher')

    // Remove all event listeners
    window.ipcRenderer.off('ssh-session-data', this.handleSessionData)
    window.ipcRenderer.off('ssh-session-connected', this.handleSessionConnected)
    window.ipcRenderer.off('ssh-session-disconnected', this.handleSessionDisconnected)
    window.ipcRenderer.off('ssh-session-error', this.handleSessionError)
    window.ipcRenderer.off('ssh-session-reconnecting', this.handleSessionReconnecting)

    // Clear terminal registry
    this.terminals.clear()
    this.isInitialized = false
  }
}

// Export singleton instance
export const sshEventDispatcher = SSHEventDispatcher.getInstance()
