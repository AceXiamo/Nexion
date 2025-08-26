import { useState } from 'react'
import { Icon } from '@iconify/react'

interface SidebarProps {
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

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={`bg-black border-r border-neutral-800 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 pt-10 h-[128px]">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-lime-500 rounded-xl flex items-center justify-center">
                  <Icon icon="mdi:shield-lock" className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">SSH Manager</h1>
                  <p className="text-sm text-neutral-400">Web3 Security</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="btn-icon"
            >
              <Icon 
                icon={isCollapsed ? 'mdi:menu' : 'mdi:menu-open'} 
                className="w-5 h-5"
              />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6">
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
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-6 border-t border-neutral-800">
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-neutral-400">X Layer 测试网</span>
              </div>
              <div className="w-2 h-2 bg-lime-400 rounded-full opacity-60"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
