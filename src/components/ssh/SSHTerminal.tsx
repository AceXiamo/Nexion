import { useEffect, useRef, useCallback } from 'react'
import '@xterm/xterm/css/xterm.css'
import '@/types/electron'
import { sshEventDispatcher } from '@/services/ssh-event-dispatcher'
import { terminalPersistenceManager } from '@/services/terminal-persistence-manager'

interface SSHTerminalProps {
  sessionId?: string
  isVisible: boolean
  onResize?: (cols: number, rows: number) => void
}

export function SSHTerminal({ sessionId, isVisible, onResize }: SSHTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const currentSessionId = useRef<string | undefined>(sessionId)

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || !sessionId) return

    console.log('🚀 Initialize terminal instance:', sessionId)

    // Create terminal instance
    const { terminal, fitAddon } = terminalPersistenceManager.getOrCreateTerminal(sessionId)
    console.log('🚀 Terminal instance:', terminal)

    // If terminal is not yet mounted to DOM, mount it
    if (!terminal.element) {
      terminal.open(terminalRef.current)
      fitAddon.fit()
    } else {
      // If terminal is already mounted to another DOM node, remount to current node
      if (terminal.element.parentNode !== terminalRef.current) {
        if (terminalRef.current) {
          terminalRef.current.appendChild(terminal.element)
        } else {
          terminal.open(terminalRef.current)
        }
        fitAddon.fit()
      }
    }

    // Register to global event dispatcher
    sshEventDispatcher.registerTerminal(sessionId, terminal)

    // Listen for user input
    const handleData = (data: string) => {
      if (currentSessionId.current && window.ipcRenderer?.ssh) {
        window.ipcRenderer.ssh.sendCommand(currentSessionId.current, data)
      }
    }

    // Listen for terminal size changes
    const handleResize = ({ cols, rows }: { cols: number; rows: number }) => {
      if (currentSessionId.current && onResize) {
        onResize(cols, rows)
        window.ipcRenderer?.ssh.resizeSession(currentSessionId.current, cols, rows)
      }
    }

    const dataDisposable = terminal.onData(handleData)
    const resizeDisposable = terminal.onResize(handleResize)

    return () => {
      // Unregister from global dispatcher
      dataDisposable.dispose()
      resizeDisposable.dispose()

      sshEventDispatcher.unregisterTerminal(sessionId)
    }
  }, [sessionId, onResize])

  // Update current session ID
  useEffect(() => {
    currentSessionId.current = sessionId
    // Don't clear terminal content, keep session history
  }, [sessionId])

  // sessionId is determined at initialization and should not change, remove duplicate registration logic

  // Handle terminal size adjustment
  const handleResize = useCallback(() => {
    if (sessionId && isVisible) {
      const terminalData = terminalPersistenceManager.getOrCreateTerminal(sessionId)
      terminalData.fitAddon.fit()
    }
  }, [isVisible, sessionId])

  // Listen for window size changes
  useEffect(() => {
    if (!isVisible) return

    // Adjust size immediately
    handleResize()

    // Listen for window size changes
    window.addEventListener('resize', handleResize)

    // Use ResizeObserver to monitor container size changes
    let resizeObserver: ResizeObserver | null = null

    if (terminalRef.current) {
      resizeObserver = new ResizeObserver(() => {
        // Delayed adjustment to avoid frequent calls
        setTimeout(handleResize, 10)
      })
      resizeObserver.observe(terminalRef.current)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver?.disconnect()
    }
  }, [isVisible, handleResize])

  // Focus terminal
  useEffect(() => {
    if (isVisible && sessionId) {
      const terminalData = terminalPersistenceManager.getOrCreateTerminal(sessionId)
      terminalData.terminal.focus()
    }
  }, [isVisible, sessionId])

  return (
    <div className={`absolute inset-0 ${isVisible ? 'block' : 'hidden'}`}>
      <div ref={terminalRef} className="w-full h-full" style={{ minHeight: '400px' }} />
    </div>
  )
}
