import { Terminal } from '@xterm/xterm'
import '@/types/electron'
import { terminalHistoryManager } from '@/services/terminal-history-manager'

/**
 * 全局SSH事件分发器
 * 单例模式管理所有SSH事件监听，避免重复注册
 * 基于sessionId精确分发数据到对应终端实例
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
   * 初始化全局事件监听器 - 整个应用只调用一次
   */
  initialize(): void {
    if (this.isInitialized || !window.ipcRenderer) return
    
    console.log('🚀 初始化SSH事件分发器')

    // 注册全局事件监听器
    window.ipcRenderer.on('ssh-session-data', this.handleSessionData.bind(this))
    window.ipcRenderer.on('ssh-session-connected', this.handleSessionConnected.bind(this))
    window.ipcRenderer.on('ssh-session-disconnected', this.handleSessionDisconnected.bind(this))
    window.ipcRenderer.on('ssh-session-error', this.handleSessionError.bind(this))
    window.ipcRenderer.on('ssh-session-reconnecting', this.handleSessionReconnecting.bind(this))
    
    this.isInitialized = true
  }

  /**
   * 注册终端实例到分发器
   */
  registerTerminal(sessionId: string, terminal: Terminal): void {
    if (this.terminals.has(sessionId)) {
      console.log(`📱 终端实例已存在，更新注册: ${sessionId}`)
      // 如果已存在，更新为新的终端实例（处理组件重新挂载情况）
      this.terminals.set(sessionId, terminal)
      return
    }
    console.log(`📱 注册终端实例: ${sessionId}`)
    this.terminals.set(sessionId, terminal)
  }

  /**
   * 从分发器注销终端实例
   */
  unregisterTerminal(sessionId: string): void {
    console.log(`📱 注销终端实例: ${sessionId}`)
    this.terminals.delete(sessionId)
  }

  /**
   * 获取已注册的终端数量
   */
  getTerminalCount(): number {
    return this.terminals.size
  }

  /**
   * 获取所有已注册的会话ID
   */
  getRegisteredSessionIds(): string[] {
    return Array.from(this.terminals.keys())
  }

  /**
   * 检查指定会话是否有注册的终端
   */
  hasTerminal(sessionId: string): boolean {
    return this.terminals.has(sessionId)
  }

  /**
   * 处理会话数据 - 精确分发到对应终端
   */
  private handleSessionData = (_event: unknown, sessionId: string, data: string): void => {
    const terminal = this.terminals.get(sessionId)
    if (terminal) {
      console.log(`📊 分发数据到终端 ${sessionId}:`, data.length, 'bytes')
      terminal.write(data)
    } else {
      console.warn(`⚠️ 会话 ${sessionId} 没有注册的终端实例`)
    }
  }

  /**
   * 处理会话连接成功事件
   */
  private handleSessionConnected = (_event: unknown, sessionId: string): void => {
    const terminal = this.terminals.get(sessionId)
    if (terminal) {
      console.log(`✅ 会话 ${sessionId} 连接成功`)
      terminal.write('\r\n\x1b[1;32m✓ SSH 连接已建立\x1b[0m\r\n')
    }
  }

  /**
   * 处理会话断开连接事件
   */
  private handleSessionDisconnected = (_event: unknown, sessionId: string): void => {
    const terminal = this.terminals.get(sessionId)
    if (terminal) {
      console.log(`❌ 会话 ${sessionId} 连接断开`)
      terminal.write('\r\n\x1b[1;31m✗ SSH 连接已断开\x1b[0m\r\n')
    }
  }

  /**
   * 处理会话错误事件
   */
  private handleSessionError = (_event: unknown, sessionId: string, error: string): void => {
    const terminal = this.terminals.get(sessionId)
    if (terminal) {
      console.log(`🚨 会话 ${sessionId} 发生错误:`, error)
      terminal.write(`\r\n\x1b[1;31m✗ 连接错误: ${error}\x1b[0m\r\n`)
    }
  }

  /**
   * 处理会话重连事件
   */
  private handleSessionReconnecting = (_event: unknown, sessionId: string, attempt: number, delay: number): void => {
    const terminal = this.terminals.get(sessionId)
    if (terminal) {
      console.log(`🔄 会话 ${sessionId} 重连中: 第${attempt}次尝试`)
      terminal.write(`\r\n\x1b[1;33m🔄 重连中 (第${attempt}次尝试，${Math.round(delay / 1000)}秒后)\x1b[0m\r\n`)
    }
  }

  /**
   * 清理分发器 - 应用退出时调用
   */
  cleanup(): void {
    if (!this.isInitialized || !window.ipcRenderer) return

    console.log('🧹 清理SSH事件分发器')

    // 移除所有事件监听器
    window.ipcRenderer.off('ssh-session-data', this.handleSessionData)
    window.ipcRenderer.off('ssh-session-connected', this.handleSessionConnected)
    window.ipcRenderer.off('ssh-session-disconnected', this.handleSessionDisconnected)
    window.ipcRenderer.off('ssh-session-error', this.handleSessionError)
    window.ipcRenderer.off('ssh-session-reconnecting', this.handleSessionReconnecting)

    // 清空终端注册表
    this.terminals.clear()
    this.isInitialized = false
  }
}

// 导出单例实例
export const sshEventDispatcher = SSHEventDispatcher.getInstance()