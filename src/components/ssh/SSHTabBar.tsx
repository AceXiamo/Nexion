import React from 'react'
import { X, Plus, Terminal, AlertTriangle, Loader2, FolderSync } from 'lucide-react'
import type { SSHSessionData } from '@/types/electron'
import '@/types/electron'

interface SSHTabBarProps {
  sessions: SSHSessionData[]
  activeSessionId?: string
  onCreateSession: () => void
  onSwitchSession: (sessionId: string) => void
  onCloseSession: (sessionId: string) => void
  onOpenFileTransfer?: () => void
}

const getStatusIcon = (status: SSHSessionData['status']) => {
  switch (status) {
    case 'connecting':
      return <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />
    case 'connected':
      return <Terminal className="w-3 h-3 text-lime-400" />
    case 'error':
      return <AlertTriangle className="w-3 h-3 text-red-400" />
    default:
      return <div className="w-3 h-3 rounded-full bg-gray-500" />
  }
}

const getStatusColor = (status: SSHSessionData['status']) => {
  switch (status) {
    case 'connecting':
      return 'border-yellow-400/50 bg-yellow-400/10'
    case 'connected':
      return 'border-lime-400/50 bg-lime-400/10'
    case 'error':
      return 'border-red-400/50 bg-red-400/10'
    default:
      return 'border-gray-500/50 bg-gray-500/10'
  }
}

export function SSHTabBar({ sessions, activeSessionId, onCreateSession, onSwitchSession, onCloseSession, onOpenFileTransfer }: SSHTabBarProps) {
  const handleTabClose = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    onCloseSession(sessionId)
  }

  return (
    <div className="bg-black/95 border-b border-neutral-800 flex items-center px-2 py-1 min-h-[40px]">
      {/* New Tab button */}
      <button
        onClick={onCreateSession}
        className="flex items-center gap-1 px-3 py-1.5 mr-1 text-xs 
                   bg-neutral-800 hover:bg-neutral-700 rounded-md 
                   text-gray-300 hover:text-white transition-all duration-150
                   border border-neutral-700 hover:border-neutral-600"
        title="Create new SSH connection"
      >
        <Plus className="w-3 h-3" />
        <span>New</span>
      </button>

      {/* Separator */}
      {sessions.length > 0 && <div className="w-px h-6 bg-neutral-700 mx-2" />}

      {/* SSH Tab list */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto">
        {sessions.map((session, index) => {
          const isActive = session.id === activeSessionId
          const statusColor = getStatusColor(session.status)
          const tabNumber = index + 1

          return (
            <div
              key={session.id}
              onClick={() => onSwitchSession(session.id)}
              className={`
                group relative flex items-center gap-2 px-3 py-1.5 rounded-md 
                text-xs cursor-pointer select-none transition-all duration-150
                border min-w-0 max-w-[200px]
                ${isActive ? `${statusColor} text-white shadow-sm` : 'border-transparent bg-neutral-800 hover:bg-neutral-700 text-gray-300 hover:text-white'}
              `}
              title={`${session.name} - ${session.status}`}
            >
              {/* Tab number indicator */}
              {tabNumber <= 9 && <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-[10px] text-neutral-400 font-mono">{tabNumber}</div>}

              {/* Status icon */}
              <div className="flex-shrink-0">{getStatusIcon(session.status)}</div>

              {/* Session name */}
              <span className="truncate flex-1 font-mono">{session.name}</span>

              {/* Close button */}
              <button
                onClick={(e) => handleTabClose(e, session.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 
                           hover:bg-red-500/20 hover:text-red-400 rounded p-0.5
                           transition-all duration-150"
                title="Close connection"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute -bottom-px left-1/2 transform -translate-x-1/2 
                               w-8 h-0.5 bg-lime-400 rounded-full"
                />
              )}

              {/* Red border emphasis for error state */}
              {session.status === 'error' && <div className="absolute inset-0 border border-red-400/30 rounded-md pointer-events-none" />}
            </div>
          )
        })}
      </div>

      {/* Session actions and status summary */}
      {sessions.length > 0 && (
        <div className="flex items-center gap-4 ml-4">
          {/* File Transfer Button */}
          {activeSessionId && onOpenFileTransfer && (
            <button
              onClick={onOpenFileTransfer}
              className="flex items-center gap-1 px-2 py-1 text-xs 
                         bg-neutral-800 hover:bg-neutral-700 rounded-md 
                         text-gray-300 hover:text-white transition-all duration-150
                         border border-neutral-700 hover:border-neutral-600"
              title="文件传输"
            >
              <FolderSync className="w-3 h-3" />
              <span>文件</span>
            </button>
          )}

          {/* Status Summary */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Terminal className="w-3 h-3" />
              <span>{sessions.length}</span>
            </div>
            {sessions.some((s) => s.status === 'connected') && (
              <div className="flex items-center gap-1 text-lime-400">
                <div className="w-2 h-2 bg-lime-400 rounded-full" />
                <span>{sessions.filter((s) => s.status === 'connected').length}</span>
              </div>
            )}
            {sessions.some((s) => s.status === 'error') && (
              <div className="flex items-center gap-1 text-red-400">
                <div className="w-2 h-2 bg-red-400 rounded-full" />
                <span>{sessions.filter((s) => s.status === 'error').length}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
