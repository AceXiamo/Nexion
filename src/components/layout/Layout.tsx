import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface LayoutProps {
  children: ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}

// 页面配置
const pageConfig = {
  connections: {
    title: 'SSH 连接管理',
    description: '管理你的 SSH 配置和连接'
  },
  settings: {
    title: '设置',
    description: '应用设置和个人偏好'
  },
  stats: {
    title: '使用统计',
    description: '查看你的 SSH 使用情况'
  },
  about: {
    title: '关于',
    description: '了解 Web3 SSH Manager'
  }
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const currentPage = pageConfig[activeTab as keyof typeof pageConfig] || pageConfig.connections

  return (
    <div className="flex h-screen bg-black">
      {/* macOS 标题栏拖拽区域 */}
      <div 
        className="fixed top-0 left-0 right-0 h-8 bg-transparent z-50 pointer-events-none"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />
      
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - 为 macOS 标题栏预留空间 */}
        <Header 
          title={currentPage.title} 
          description={currentPage.description}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}