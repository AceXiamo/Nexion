import React, { useState, useRef, useCallback, useEffect } from 'react';
import { keyboardShortcutManager } from '../../services/keyboard-shortcut-manager';

interface ShortcutInputProps {
  value: string;
  onChange: (shortcut: string) => void;
  onValidate?: (shortcut: string) => boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const ShortcutInput: React.FC<ShortcutInputProps> = ({
  value,
  onChange,
  onValidate,
  placeholder = '点击录制快捷键...',
  disabled = false,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentKeys, setCurrentKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout>();

  const displayValue = value ? keyboardShortcutManager.formatShortcutForDisplay(value) : '';

  const startRecording = useCallback(() => {
    if (disabled) return;
    
    setIsRecording(true);
    setCurrentKeys(new Set());
    setError('');
    
    if (inputRef.current) {
      inputRef.current.focus();
    }

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
    
    recordingTimeoutRef.current = setTimeout(() => {
      setIsRecording(false);
    }, 5000);
  }, [disabled]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setCurrentKeys(new Set());
    
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isRecording) return;
    
    event.preventDefault();
    event.stopPropagation();

    const keys = new Set(currentKeys);
    
    if (event.ctrlKey) keys.add('Ctrl');
    if (event.metaKey) keys.add('Cmd');
    if (event.altKey) keys.add('Alt');
    if (event.shiftKey) keys.add('Shift');
    
    if (!['Control', 'Meta', 'Alt', 'Shift', 'Cmd'].includes(event.key)) {
      let key = event.key;
      if (key === ' ') {
        key = 'Space';
      } else if (key.length === 1) {
        key = key.toUpperCase();
      }
      keys.add(key);
    }

    setCurrentKeys(keys);
  }, [isRecording, currentKeys]);

  const handleKeyUp = useCallback((event: React.KeyboardEvent) => {
    if (!isRecording) return;
    
    event.preventDefault();
    event.stopPropagation();

    if (currentKeys.size > 1) {
      const shortcut = Array.from(currentKeys).join('+');
      
      if (keyboardShortcutManager.isValidShortcut(shortcut)) {
        if (onValidate && !onValidate(shortcut)) {
          setError('此快捷键已被占用');
          setTimeout(() => setError(''), 2000);
        } else {
          onChange(shortcut);
          setError('');
        }
      } else {
        setError('无效的快捷键组合');
        setTimeout(() => setError(''), 2000);
      }
      
      stopRecording();
    }
  }, [isRecording, currentKeys, onChange, onValidate, stopRecording]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      stopRecording();
    }, 100);
  }, [stopRecording]);

  const handleClear = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onChange('');
    setError('');
  }, [onChange]);

  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  const currentDisplay = isRecording && currentKeys.size > 0 
    ? Array.from(currentKeys).join('+')
    : '';

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`
          flex items-center justify-between border rounded-lg px-3 py-2 min-h-[40px]
          ${disabled 
            ? 'bg-[#0f0f0f] border-[#333333] cursor-not-allowed' 
            : isRecording 
              ? 'bg-[#1a2332] border-[#BCFF2F] ring-2 ring-[#BCFF2F] ring-opacity-30' 
              : error
                ? 'bg-[#2a1a1a] border-red-500'
                : 'bg-[#1a1a1a] border-[#333333] hover:border-[#555555] cursor-pointer'
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
          {isRecording && (
            <span className="text-xs text-[#BCFF2F] animate-pulse">
              录制中...
            </span>
          )}
          
          {value && !isRecording && (
            <button
              onClick={handleClear}
              disabled={disabled}
              className="text-[#666666] hover:text-[#CCCCCC] text-sm p-1 rounded"
              title="清除快捷键"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-400">
          {error}
        </div>
      )}
      
      {isRecording && (
        <div className="absolute top-full left-0 mt-1 text-xs text-[#888888]">
          按 Escape 取消录制
        </div>
      )}
    </div>
  );
};