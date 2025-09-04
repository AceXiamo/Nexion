import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useTranslation } from 'react-i18next'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const getNavigation = (t: any) => [
  {
    id: 'connections',
    name: t('navigation:connections'),
    icon: 'mdi:server-network',
    description: t('navigation:connectionsDesc')
  },
  {
    id: 'settings',
    name: t('navigation:settings'),
    icon: 'mdi:cog',
    description: t('navigation:settingsDesc')
  },
  {
    id: 'stats',
    name: t('navigation:stats'),
    icon: 'mdi:chart-line',
    description: t('navigation:statsDesc')
  },
  {
    id: 'about',
    name: t('navigation:about'),
    icon: 'mdi:information',
    description: t('navigation:aboutDesc')
  }
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigation = getNavigation(t)

  return (
    <div className={`bg-black border-r border-neutral-800 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    }`}>
      <div className="flex flex-col h-full">
        {/* Navigation */}
        <nav className="flex-1 p-6 pt-10">
          {/* Collapse Button */}
          <div className="flex justify-end mb-6">
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

          <ul className="space-y-3">
            {navigation.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-300 ease-out group relative transform hover:scale-[1.02] active:scale-[0.98] ${
                    activeTab === item.id
                      ? 'bg-neutral-800 text-white shadow-lg'
                      : 'text-neutral-300 hover:bg-neutral-900 hover:text-white hover:shadow-md'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >                  
                  <Icon 
                    icon={item.icon} 
                    className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ease-out ${
                      activeTab === item.id 
                        ? 'text-lime-400 scale-110' 
                        : 'text-neutral-400 group-hover:text-white group-hover:scale-105'
                    }`}
                  />
                  {!isCollapsed && (
                    <div className="flex-1 text-left">
                      <div className={`text-sm font-medium ${
                        activeTab === item.id ? 'text-white' : 'text-neutral-200'
                      }`}>
                        {item.name}
                      </div>
                      {/* <div className="text-xs text-neutral-500 mt-0.5">
                        {item.description}
                      </div> */}
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
            <div className="flex items-center justify-between px-4 py-3 rounded-lg tech-glow-border">
              
              <div className="relative flex items-center space-x-3 z-10">
                <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-neutral-400">{t('navigation:networkStatus')}</span>
              </div>
              <div className="relative w-2 h-2 bg-lime-400 rounded-full opacity-60 z-10"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
