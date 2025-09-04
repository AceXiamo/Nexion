import React, { useState, useRef, useCallback, useEffect } from 'react'
import { keyboardShortcutManager } from '../../services/keyboard-shortcut-manager'

interface ShortcutInputProps {
  value: string
  onChange: (shortcut: string) => void
  onValidate?: (shortcut: string) => boolean
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const ShortcutInput: React.FC<ShortcutInputProps> = ({ value, onChange, onValidate, placeholder = '点击录制快捷键...', disabled = false, className = '' }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [currentKeys, setCurrentKeys] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)
  const recordingTimeoutRef = useRef<NodeJS.Timeout>()

  const displayValue = value ? keyboardShortcutManager.formatShortcutForDisplay(value) : ''

  const startRecording = useCallback(() => {
    if (disabled) return

    setIsRecording(true)
    setCurrentKeys(new Set())
    setError('')

    if (inputRef.current) {
      inputRef.current.focus()
    }

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current)
    }

    recordingTimeoutRef.current = setTimeout(() => {
      setIsRecording(false)
    }, 5000)
  }, [disabled])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    setCurrentKeys(new Set())

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current)
    }
  }, [])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isRecording) return

      event.preventDefault()
      event.stopPropagation()

      // Handle ESC key to cancel recording
      if (event.key === 'Escape') {
        stopRecording()
        return
      }

      const keys = new Set(currentKeys)

      if (event.ctrlKey) keys.add('Ctrl')
      if (event.metaKey) keys.add('Cmd')
      if (event.altKey) keys.add('Alt')
      if (event.shiftKey) keys.add('Shift')

      if (!['Control', 'Meta', 'Alt', 'Shift', 'Cmd', 'Escape'].includes(event.key)) {
        let key = event.key
        if (key === ' ') {
          key = 'Space'
        } else if (key.length === 1) {
          key = key.toUpperCase()
        }
        keys.add(key)
      }

      setCurrentKeys(keys)
    },
    [isRecording, currentKeys, stopRecording]
  )

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isRecording) return

      event.preventDefault()
      event.stopPropagation()

      if (currentKeys.size > 1) {
        const shortcut = Array.from(currentKeys).join('+')

        if (keyboardShortcutManager.isValidShortcut(shortcut)) {
          if (onValidate && !onValidate(shortcut)) {
            setError('此快捷键已被占用')
            setTimeout(() => setError(''), 2000)
          } else {
            onChange(shortcut)
            setError('')
          }
        } else {
          setError('无效的快捷键组合')
          setTimeout(() => setError(''), 2000)
        }

        stopRecording()
      }
    },
    [isRecording, currentKeys, onChange, onValidate, stopRecording]
  )

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      stopRecording()
    }, 100)
  }, [stopRecording])

  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current)
      }
    }
  }, [])

  const currentDisplay = isRecording && currentKeys.size > 0 ? Array.from(currentKeys).join('+') : ''

  return (
    <div className={`relative w-32 ${className}`}>
      <div
        className={`
          flex items-center justify-between border rounded-md px-4 py-2 min-h-[36px]
          transition-all duration-200 ease-in-out
          ${
            disabled
              ? 'bg-[#000000] border-[#333333] cursor-not-allowed opacity-40'
              : isRecording
              ? 'bg-[#000000] border-[#BCFF2F] shadow-[inset_0_0_0_1px_rgba(188,255,47,0.3)]'
              : error
              ? 'bg-[#000000] border-red-500 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.3)]'
              : 'bg-[#000000] border-[#333333] hover:border-[#BCFF2F] cursor-pointer'
          }
        `}
        onClick={startRecording}
      >
        <input
          ref={inputRef}
          type="text"
          value={currentDisplay || displayValue || ''}
          placeholder={isRecording ? '按下快捷键组合...' : placeholder}
          readOnly
          disabled={disabled}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onBlur={handleBlur}
          className={`
            flex-1 bg-transparent border-none outline-none text-sm placeholder-[#666666]
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            ${isRecording ? 'text-[#BCFF2F]' : error ? 'text-red-400' : 'text-white'}
          `}
        />

        <div className="flex items-center space-x-2">
        </div>
      </div>

      {error && <div className="absolute top-full left-0 mt-1 text-xs text-red-400">{error}</div>}
    </div>
  )
}
