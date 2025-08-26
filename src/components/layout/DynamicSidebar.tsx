import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Icon } from '@iconify/react'

interface DynamicSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navigation = [
  {
    id: 'connections',
    name: 'SSH 配置',
    icon: 'mdi:server-network',
    description: '管理你的 SSH 配置'
  },
  {
    id: 'settings',
    name: '设置',
    icon: 'mdi:cog',
    description: '应用设置和偏好'
  },
  {
    id: 'stats',
    name: '统计',
    icon: 'mdi:chart-line',
    description: '查看使用统计'
  },
  {
    id: 'about',
    name: '关于',
    icon: 'mdi:information',
    description: '关于 Web3 SSH Manager'
  }
]

// Mock connection list - in real app this would come from props
const mockConnections = [
  { id: '1', name: 'Production Server', status: 'connected' },
  { id: '2', name: 'Dev Environment', status: 'disconnected' },
  { id: '3', name: 'Database Server', status: 'connecting' },
]

export function DynamicSidebar({ activeTab, onTabChange }: DynamicSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Check if we're in terminal mode
  const isInTerminalMode = location.pathname.startsWith('/terminal/')
  const currentConfigId = isInTerminalMode ? location.pathname.split('/terminal/')[1] : null

  const handleBackToMain = () => {
    navigate('/connections')
  }

  const handleConnectionClick = (configId: string) => {
    navigate(`/terminal/${configId}`)
  }

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-lime-400'
      case 'connecting':
        return 'text-yellow-400'
      case 'error':
        return 'text-red-400'
      default:
        return 'text-neutral-400'
    }
  }

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return 'mdi:check-circle'
      case 'connecting':
        return 'mdi:loading'
      case 'error':
        return 'mdi:alert-circle'
      default:
        return 'mdi:circle-outline'
    }
  }

  return (
    <div className={`bg-black border-r border-neutral-800 transition-all duration-300 ${
      isInTerminalMode && isCollapsed ? 'w-16' : 'w-80'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 pt-10 h-[128px]">
          <div className="flex items-center justify-between">
            {(!isCollapsed || !isInTerminalMode) && (
              <motion.div 
                className="flex items-center space-x-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-lime-500 rounded-xl flex items-center justify-center">
                  <Icon icon="mdi:shield-lock" className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">SSH Manager</h1>
                  <p className="text-sm text-neutral-400">
                    {isInTerminalMode ? '终端连接' : 'Web3 Security'}
                  </p>
                </div>
              </motion.div>
            )}
            {isInTerminalMode && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="btn-icon"
              >
                <Icon 
                  icon={isCollapsed ? 'mdi:menu' : 'mdi:menu-open'} 
                  className="w-5 h-5"
                />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 p-6">
          <AnimatePresence mode="wait">
            {isInTerminalMode ? (
              // Connection List View
              <motion.div
                key="connections"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Back Button */}
                {!isCollapsed && (
                  <button
                    onClick={handleBackToMain}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-neutral-300 hover:bg-neutral-900 hover:text-white transition-all duration-200 group"
                  >
                    <Icon icon="mdi:arrow-left" className="w-5 h-5" />
                    <span>返回主菜单</span>
                  </button>
                )}
                
                {/* Back Button for collapsed state */}
                {isCollapsed && (
                  <button
                    onClick={handleBackToMain}
                    className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-neutral-300 hover:bg-neutral-900 hover:text-white transition-all duration-200 group"
                    title="返回主菜单"
                  >
                    <Icon icon="mdi:arrow-left" className="w-5 h-5" />
                  </button>
                )}

                {/* Connection List */}
                <div className="space-y-2">
                  {!isCollapsed && (
                    <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide px-4">
                      连接列表
                    </h3>
                  )}
                  
                  {mockConnections.map((connection) => (
                    <button
                      key={connection.id}
                      onClick={() => handleConnectionClick(connection.id)}
                      className={`w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-200 group ${
                        currentConfigId === connection.id
                          ? 'bg-neutral-800 text-white'
                          : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                      }`}
                      title={isCollapsed ? connection.name : undefined}
                    >
                      <Icon 
                        icon={getConnectionStatusIcon(connection.status)} 
                        className={`w-5 h-5 flex-shrink-0 ${
                          currentConfigId === connection.id 
                            ? 'text-lime-400' 
                            : getConnectionStatusColor(connection.status)
                        } ${connection.status === 'connecting' ? 'animate-spin' : ''}`}
                      />
                      {!isCollapsed && (
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium truncate">
                            {connection.name}
                          </div>
                          <div className="text-xs text-neutral-500 capitalize">
                            {connection.status === 'connected' ? '已连接' : 
                             connection.status === 'connecting' ? '连接中' : '未连接'}
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                  
                  {/* Add Connection Button */}
                  <button
                    onClick={() => navigate('/connections')}
                    className="w-full flex items-center space-x-4 px-4 py-3 rounded-lg text-neutral-400 hover:bg-neutral-900 hover:text-lime-400 transition-all duration-200 group border-2 border-dashed border-neutral-700 hover:border-lime-400/50"
                    title={isCollapsed ? '添加连接' : undefined}
                  >
                    <Icon icon="mdi:plus" className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">添加连接</span>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              // Main Navigation View
              <motion.nav
                key="navigation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <ul className="space-y-3">
                  {navigation.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => onTabChange(item.id)}
                        className={`w-full flex border-0 items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                          activeTab === item.id
                            ? 'bg-neutral-800 text-white'
                            : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                        }`}
                        title={isCollapsed ? item.name : undefined}
                      >                  
                        <Icon 
                          icon={item.icon} 
                          className={`w-5 h-5 flex-shrink-0 ${
                            activeTab === item.id 
                              ? 'text-lime-400' 
                              : 'text-neutral-400 group-hover:text-white'
                          }`}
                        />
                        {!isCollapsed && (
                          <div className="flex-1 text-left">
                            <div className={`text-sm font-medium ${
                              activeTab === item.id ? 'text-white' : 'text-neutral-200'
                            }`}>
                              {item.name}
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              {item.description}
                            </div>
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
          <motion.div 
            className="p-6 border-t border-neutral-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-neutral-400">X Layer 测试网</span>
              </div>
              <div className="w-2 h-2 bg-lime-400 rounded-full opacity-60"></div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}