import React, { useEffect, useRef, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import '@/types/electron'

interface SSHTerminalProps {
  sessionId?: string
  isVisible: boolean
  onResize?: (cols: number, rows: number) => void
}

export function SSHTerminal({ sessionId, isVisible, onResize }: SSHTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstance = useRef<Terminal | null>(null)
  const fitAddon = useRef<FitAddon | null>(null)
  const currentSessionId = useRef<string | undefined>(sessionId)

  // 初始化终端
  useEffect(() => {
    if (!terminalRef.current) return

    // 创建终端实例
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
    })

    // 创建自适应插件
    const fitPlugin = new FitAddon()
    terminal.loadAddon(fitPlugin)

    // 打开终端
    terminal.open(terminalRef.current)
    fitPlugin.fit()

    // 保存引用
    terminalInstance.current = terminal
    fitAddon.current = fitPlugin

    // 监听用户输入
    terminal.onData((data) => {
      if (currentSessionId.current && window.ipcRenderer?.ssh) {
        window.ipcRenderer.ssh.sendCommand(currentSessionId.current, data)
      }
    })

    // 监听终端大小变化
    terminal.onResize(({ cols, rows }) => {
      if (currentSessionId.current && onResize) {
        onResize(cols, rows)
        window.ipcRenderer?.ssh.resizeSession(currentSessionId.current, cols, rows)
      }
    })

    // 初始化时显示欢迎信息
    if (!sessionId) {
      terminal.write('\r\n\x1b[1;32m欢迎使用 Web3 SSH Manager\x1b[0m\r\n')
      terminal.write('请创建 SSH 连接开始使用...\r\n')
    }

    return () => {
      terminal.dispose()
      terminalInstance.current = null
      fitAddon.current = null
    }
  }, [])

  // 更新当前会话ID
  useEffect(() => {
    currentSessionId.current = sessionId
    
    if (terminalInstance.current && sessionId) {
      // 清空终端并显示连接信息
      terminalInstance.current.clear()
      terminalInstance.current.write(`\r\n\x1b[1;33m正在连接到会话 ${sessionId}...\x1b[0m\r\n`)
    }
  }, [sessionId])

  // 监听会话数据
  useEffect(() => {
    if (!window.ipcRenderer) return

    const handleSessionData = (receivedSessionId: string, data: string) => {
      if (receivedSessionId === sessionId && terminalInstance.current) {
        terminalInstance.current.write(data)
      }
    }

    const handleSessionConnected = (connectedSessionId: string) => {
      if (connectedSessionId === sessionId && terminalInstance.current) {
        terminalInstance.current.write('\r\n\x1b[1;32m✓ SSH 连接已建立\x1b[0m\r\n')
      }
    }

    const handleSessionDisconnected = (disconnectedSessionId: string) => {
      if (disconnectedSessionId === sessionId && terminalInstance.current) {
        terminalInstance.current.write('\r\n\x1b[1;31m✗ SSH 连接已断开\x1b[0m\r\n')
      }
    }

    const handleSessionError = (errorSessionId: string, error: string) => {
      if (errorSessionId === sessionId && terminalInstance.current) {
        terminalInstance.current.write(`\r\n\x1b[1;31m✗ 连接错误: ${error}\x1b[0m\r\n`)
      }
    }

    // 注册事件监听
    window.ipcRenderer.on('ssh-session-data', handleSessionData)
    window.ipcRenderer.on('ssh-session-connected', handleSessionConnected)
    window.ipcRenderer.on('ssh-session-disconnected', handleSessionDisconnected)
    window.ipcRenderer.on('ssh-session-error', handleSessionError)

    return () => {
      window.ipcRenderer?.off('ssh-session-data', handleSessionData)
      window.ipcRenderer?.off('ssh-session-connected', handleSessionConnected)
      window.ipcRenderer?.off('ssh-session-disconnected', handleSessionDisconnected)
      window.ipcRenderer?.off('ssh-session-error', handleSessionError)
    }
  }, [sessionId])

  // 处理终端大小调整
  const handleResize = useCallback(() => {
    if (fitAddon.current && isVisible) {
      fitAddon.current.fit()
    }
  }, [isVisible])

  // 监听窗口大小变化
  useEffect(() => {
    if (!isVisible) return

    // 立即调整大小
    handleResize()

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
    
    // 使用 ResizeObserver 监听容器大小变化
    let resizeObserver: ResizeObserver | null = null
    
    if (terminalRef.current) {
      resizeObserver = new ResizeObserver(() => {
        // 延迟调整以避免频繁调用
        setTimeout(handleResize, 10)
      })
      resizeObserver.observe(terminalRef.current)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver?.disconnect()
    }
  }, [isVisible, handleResize])

  // 聚焦终端
  useEffect(() => {
    if (isVisible && terminalInstance.current) {
      terminalInstance.current.focus()
    }
  }, [isVisible, sessionId])

  return (
    <div className={`flex-1 ${isVisible ? 'block' : 'hidden'}`}>
      <div 
        ref={terminalRef} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  )
}