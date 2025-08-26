import { useState } from 'react'
import { Icon } from '@iconify/react'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navigation = [
  {
    id: 'connections',
    name: 'SSH 连接',
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

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Icon icon="mdi:shield-lock" className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">SSH Manager</h1>
                  <p className="text-xs text-gray-400">Web3 版本</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Icon 
                icon={isCollapsed ? 'mdi:menu' : 'mdi:menu-open'} 
                className="w-5 h-5"
              />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon 
                    icon={item.icon} 
                    className={`w-5 h-5 ${
                      activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs opacity-70">{item.description}</div>
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3 px-3 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">X Layer 测试网</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}