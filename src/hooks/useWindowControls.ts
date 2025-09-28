import { useState, useEffect, useCallback } from 'react'

interface WindowState {
  isMaximized: boolean
  isMinimized: boolean
  isFullscreen: boolean
}

interface WindowControls {
  windowState: WindowState
  minimizeWindow: () => Promise<void>
  maximizeWindow: () => Promise<void>
  closeWindow: () => Promise<void>
  refreshWindowState: () => Promise<void>
}

/**
 * Hook for managing window controls in Electron app
 * Provides methods to control window state and track window status
 */
export function useWindowControls(): WindowControls {
  const [windowState, setWindowState] = useState<WindowState>({
    isMaximized: false,
    isMinimized: false,
    isFullscreen: false
  })

  // Check if we're in Electron environment
  const isElectron = typeof window !== 'undefined' && window.ipcRenderer

  /**
   * Refresh window state from main process
   */
  const refreshWindowState = useCallback(async () => {
    if (!isElectron) return

    try {
      const result = await window.ipcRenderer.window.isMaximized()
      if (result.success) {
        setWindowState(prev => ({
          ...prev,
          isMaximized: result.isMaximized || false
        }))
      }
    } catch (error) {
      console.error('Failed to get window state:', error)
    }
  }, [isElectron])

  /**
   * Minimize window
   */
  const minimizeWindow = useCallback(async () => {
    if (!isElectron) return

    try {
      const result = await window.ipcRenderer.window.minimize()
      if (result.success) {
        setWindowState(prev => ({
          ...prev,
          isMinimized: true
        }))
      }
    } catch (error) {
      console.error('Failed to minimize window:', error)
    }
  }, [isElectron])

  /**
   * Maximize or restore window
   */
  const maximizeWindow = useCallback(async () => {
    if (!isElectron) return

    try {
      const result = await window.ipcRenderer.window.maximize()
      if (result.success) {
        setWindowState(prev => ({
          ...prev,
          isMaximized: result.isMaximized || false
        }))
      }
    } catch (error) {
      console.error('Failed to maximize window:', error)
    }
  }, [isElectron])

  /**
   * Close window
   */
  const closeWindow = useCallback(async () => {
    if (!isElectron) return

    try {
      await window.ipcRenderer.window.close()
    } catch (error) {
      console.error('Failed to close window:', error)
    }
  }, [isElectron])

  // Initialize window state on mount
  useEffect(() => {
    if (isElectron) {
      refreshWindowState()
    }
  }, [refreshWindowState, isElectron])

  // Listen for window state changes (optional - requires more IPC setup)
  useEffect(() => {
    if (!isElectron) return

    // Setup listeners for window events (would need IPC events from main process)
    // This is a placeholder for future implementation

    return () => {
      // Cleanup listeners
    }
  }, [refreshWindowState, isElectron])

  return {
    windowState,
    minimizeWindow,
    maximizeWindow,
    closeWindow,
    refreshWindowState
  }
}