import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'

/**
 * Terminal persistence manager
 * Globally manages terminal instances to ensure terminal content is not lost during session switching
 */
class TerminalPersistenceManager {
  private static instance: TerminalPersistenceManager
  private terminals = new Map<string, { terminal: Terminal; fitAddon: FitAddon }>()

  private constructor() {}

  static getInstance(): TerminalPersistenceManager {
    if (!this.instance) {
      this.instance = new TerminalPersistenceManager()
    }
    return this.instance
  }

  /**
   * Get or create terminal instance
   */
  getOrCreateTerminal(sessionId: string): { terminal: Terminal; fitAddon: FitAddon } {
    console.log('🚀 Get or create terminal instance:', sessionId)
    // If terminal instance already exists, return directly
    if (this.terminals.has(sessionId)) {
      console.log(`🔄 Reusing existing terminal instance: ${sessionId}`)
      return this.terminals.get(sessionId)!
    }

    console.log(`🆕 Creating new terminal instance: ${sessionId}`)

    // Create new terminal instance
    const terminal = new Terminal({
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#BCFF2F',
        cursorAccent: '#000000',
        selectionBackground: '#BCFF2F40',
        black: '#000000',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
        brightBlack: '#6272a4',
        brightRed: '#ff5555',
        brightGreen: '#50fa7b',
        brightYellow: '#f1fa8c',
        brightBlue: '#bd93f9',
        brightMagenta: '#ff79c6',
        brightCyan: '#8be9fd',
        brightWhite: '#ffffff',
      },
      fontFamily: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Source Code Pro", monospace',
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      scrollback: 1000,
      tabStopWidth: 4,
      convertEol: true,
      disableStdin: false,
      screenReaderMode: false,
      allowProposedApi: true,
    })

    // Create fit addon
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    // Save terminal instance
    const terminalData = { terminal, fitAddon }
    this.terminals.set(sessionId, terminalData)

    return terminalData
  }

  /**
   * Check if terminal instance exists
   */
  hasTerminal(sessionId: string): boolean {
    return this.terminals.has(sessionId)
  }

  /**
   * Remove terminal instance
   */
  removeTerminal(sessionId: string): void {
    const terminalData = this.terminals.get(sessionId)
    if (terminalData) {
      console.log(`🗑️ Destroying terminal instance: ${sessionId}`)
      terminalData.terminal.dispose()
      this.terminals.delete(sessionId)
    }
  }

  /**
   * Get all terminal session IDs
   */
  getTerminalSessionIds(): string[] {
    return Array.from(this.terminals.keys())
  }

  /**
   * Clear all terminal instances
   */
  clear(): void {
    console.log('🧹 Clearing all terminal instances')
    this.terminals.forEach((terminalData) => {
      terminalData.terminal.dispose()
    })
    this.terminals.clear()
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    return {
      terminalCount: this.terminals.size,
      sessionIds: Array.from(this.terminals.keys()),
    }
  }
}

export const terminalPersistenceManager = TerminalPersistenceManager.getInstance()
export { TerminalPersistenceManager }
