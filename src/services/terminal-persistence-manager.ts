import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'

/**
 * 终端持久化管理器
 * 全局管理终端实例，确保会话切换时终端内容不丢失
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
   * 获取或创建终端实例
   */
  getOrCreateTerminal(sessionId: string): { terminal: Terminal; fitAddon: FitAddon } {
    console.log('🚀 获取或创建终端实例:', sessionId)
    // 如果终端实例已存在，直接返回
    if (this.terminals.has(sessionId)) {
      console.log(`🔄 复用已存在的终端实例: ${sessionId}`)
      return this.terminals.get(sessionId)!
    }

    console.log(`🆕 创建新的终端实例: ${sessionId}`)

    // 创建新的终端实例
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

    // 创建自适应插件
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    // 保存终端实例
    const terminalData = { terminal, fitAddon }
    this.terminals.set(sessionId, terminalData)

    return terminalData
  }

  /**
   * 检查终端实例是否存在
   */
  hasTerminal(sessionId: string): boolean {
    return this.terminals.has(sessionId)
  }

  /**
   * 移除终端实例
   */
  removeTerminal(sessionId: string): void {
    const terminalData = this.terminals.get(sessionId)
    if (terminalData) {
      console.log(`🗑️ 销毁终端实例: ${sessionId}`)
      terminalData.terminal.dispose()
      this.terminals.delete(sessionId)
    }
  }

  /**
   * 获取所有终端会话ID
   */
  getTerminalSessionIds(): string[] {
    return Array.from(this.terminals.keys())
  }

  /**
   * 清空所有终端实例
   */
  clear(): void {
    console.log('🧹 清空所有终端实例')
    this.terminals.forEach((terminalData) => {
      terminalData.terminal.dispose()
    })
    this.terminals.clear()
  }

  /**
   * 获取调试信息
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
