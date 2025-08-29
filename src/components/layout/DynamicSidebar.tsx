import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'
import { useTranslation } from 'react-i18next'
import { useSSHSessions } from '@/hooks/useSSHSessions'

interface DynamicSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const getNavigation = (t: any) => [
  {
    id: 'connections',
    name: t('navigation:connections'),
    icon: 'lucide:server',
    description: t('navigation:connectionsDesc'),
  },
  {
    id: 'settings',
    name: t('navigation:settings'),
    icon: 'lucide:settings',
    description: t('navigation:settingsDesc'),
  },
  // {
  //   id: 'stats',
  //   name: t('navigation:stats'),
  //   icon: 'lucide:bar-chart-3',
  //   description: t('navigation:statsDesc'),
  // },
  {
    id: 'about',
    name: t('navigation:about'),
    icon: 'lucide:info',
    description: t('navigation:aboutDesc'),
  },
]

export function DynamicSidebar({ activeTab, onTabChange }: DynamicSidebarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { sessions, switchSession, closeSession, reconnectSession } = useSSHSessions()
  const navigation = getNavigation(t)

  // Check if we're in terminal mode
  const isInTerminalMode = location.pathname.startsWith('/terminal/')
  const currentSessionId = isInTerminalMode ? location.pathname.split('/terminal/')[1] : null

  const handleBackToMain = () => {
    navigate('/connections')
  }

  const handleSessionClick = async (sessionId: string) => {
    await switchSession(sessionId)
    navigate(`/terminal/${sessionId}`)
  }

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-[#BCFF2F]'
      case 'connecting':
        return 'text-yellow-400'
      case 'error':
        return 'text-red-400'
      default:
        return 'text-[#888888]'
    }
  }

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return 'lucide:check-circle'
      case 'connecting':
        return 'lucide:loader-2'
      case 'error':
        return 'lucide:alert-circle'
      default:
        return 'lucide:circle'
    }
  }

  return (
    <div className={`bg-black border-r border-neutral-800 transition-all duration-300 ${isInTerminalMode && isCollapsed ? 'w-16' : 'w-80'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 pt-10 h-[128px]">
          <div className="flex items-center justify-between">
            {(!isCollapsed || !isInTerminalMode) && (
              <motion.div className="flex items-center space-x-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="w-10 h-10 bg-gradient-to-br from-[#BCFF2F] to-[#9FE827] rounded-xl flex items-center justify-center">
                  <Icon icon="lucide:terminal-square" className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{t('navigation:appTitle')}</h1>
                  <p className="text-sm text-[#888888]">{isInTerminalMode ? t('navigation:secureTerminal') : t('navigation:web3SecureConnection')}</p>
                </div>
              </motion.div>
            )}
            {isInTerminalMode && (
              <button onClick={() => setIsCollapsed(!isCollapsed)} className="btn-icon">
                <Icon icon={isCollapsed ? 'mdi:menu' : 'mdi:menu-open'} className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 p-6">
          <AnimatePresence mode="wait">
            {isInTerminalMode ? (
              // Connection List View
              <motion.div key="connections" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
                {/* Back Button */}
                {!isCollapsed && (
                  <button
                    onClick={handleBackToMain}
                    className="w-full flex items-center space-x-3 py-3 text-[#CCCCCC] hover:text-white transition-all duration-200 group"
                  >
                    <Icon icon="lucide:arrow-left" className="w-5 h-5 text-[#888888] group-hover:text-white" />
                    <span>{t('navigation:backToMainMenu')}</span>
                  </button>
                )}

                {/* Back Button for collapsed state */}
                {isCollapsed && (
                  <button
                    onClick={handleBackToMain}
                    className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-[#CCCCCC] hover:bg-[#0f0f0f] hover:text-white transition-all duration-200 group border border-[#1a1a1a] hover:border-[#333333]"
                    title={t('navigation:backToMainMenu')}
                  >
                    <Icon icon="lucide:arrow-left" className="w-5 h-5 text-[#888888] group-hover:text-white" />
                  </button>
                )}

                {/* Session List */}
                <div className="space-y-2">
                  {!isCollapsed && <h3 className="text-sm font-semibold text-[#888888] uppercase tracking-wide px-4">{t('navigation:sessionList')}</h3>}

                  {sessions.map((session) => (
                    <div key={session.id} className="relative group">
                      <button
                        onClick={() => handleSessionClick(session.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 border ${
                          currentSessionId === session.id 
                            ? 'bg-[#272727] text-white border-[#BCFF2F] border-l-[3px] border-t-[1px] border-r-[1px] border-b-[1px]' 
                            : 'text-[#CCCCCC] hover:bg-[#0f0f0f] hover:text-white border-[#1a1a1a] hover:border-[#333333]'
                        }`}
                        title={isCollapsed ? session.name : undefined}
                      >
                        <Icon
                          icon={getConnectionStatusIcon(session.status)}
                          className={`w-5 h-5 flex-shrink-0 ${
                            currentSessionId === session.id 
                              ? 'text-[#BCFF2F]' 
                              : getConnectionStatusColor(session.status)
                          } ${session.status === 'connecting' ? 'animate-spin' : ''}`}
                        />
                        {!isCollapsed && (
                          <div className="flex-1 text-left min-w-0">
                            <div className={`text-sm font-medium truncate ${
                              currentSessionId === session.id ? 'text-white' : 'text-[#CCCCCC]'
                            }`}>
                              {session.name}
                            </div>
                            <div className="text-xs text-[#888888] mt-0.5">
                              {session.status === 'connected' ? t('navigation:connected') : session.status === 'connecting' ? t('navigation:connecting') : session.status === 'error' ? t('navigation:connectionError') : t('navigation:disconnected')}
                              {session.error && session.status === 'error' && <span className="ml-1 text-red-400">• {session.error}</span>}
                            </div>
                          </div>
                        )}
                      </button>

                      {/* 会话操作按钮（悬停时显示） */}
                      {!isCollapsed && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                          {session.status === 'error' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                reconnectSession(session.id)
                              }}
                              className="p-1 rounded text-[#888888] hover:text-[#BCFF2F] hover:bg-[#1C260A] transition-all duration-200"
                              title={t('navigation:reconnect')}
                            >
                              <Icon icon="lucide:refresh-cw" className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              closeSession(session.id)
                            }}
                            className="p-1 rounded text-[#888888] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                            title={t('navigation:closeConnection')}
                          >
                            <Icon icon="lucide:x" className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Connection Button */}
                  <button
                    onClick={() => navigate('/connections')}
                    className="w-full flex items-center space-x-4 px-4 py-3 rounded-lg text-[#888888] hover:bg-[#0f0f0f] hover:text-[#BCFF2F] transition-all duration-200 group border-2 border-dashed border-[#333333] hover:border-[#BCFF2F]/50"
                    title={isCollapsed ? t('navigation:addConnection') : undefined}
                  >
                    <Icon icon="lucide:plus" className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span className="text-sm font-medium">{t('navigation:addConnection')}</span>}
                  </button>
                </div>
              </motion.div>
            ) : (
              // Main Navigation View
              <motion.nav key="navigation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                <ul className="space-y-3">
                  {navigation.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => onTabChange(item.id)}
                        className={`w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-200 group relative border ${
                          activeTab === item.id 
                            ? 'bg-[#272727] text-white border-[#BCFF2F]' 
                            : 'text-[#CCCCCC] hover:bg-[#0f0f0f] hover:text-white border-[#1a1a1a] hover:border-[#333333]'
                        }`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <Icon 
                          icon={item.icon} 
                          className={`w-5 h-5 flex-shrink-0 ${
                            activeTab === item.id 
                              ? 'text-[#BCFF2F]' 
                              : 'text-[#888888] group-hover:text-white'
                          }`} 
                        />
                        {!isCollapsed && (
                          <div className="flex-1 text-left">
                            <div className={`text-sm font-medium ${
                              activeTab === item.id ? 'text-white' : 'text-[#CCCCCC]'
                            }`}>
                              {item.name}
                            </div>
                            <div className="text-xs text-[#888888] mt-0.5">{item.description}</div>
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {(!isInTerminalMode || !isCollapsed) && (
          <motion.div className="p-6 border-t border-neutral-800" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-neutral-400">{t('navigation:networkStatus')}</span>
              </div>
              <div className="w-2 h-2 bg-lime-400 rounded-full opacity-60"></div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
