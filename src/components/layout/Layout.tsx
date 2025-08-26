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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          title={currentPage.title} 
          description={currentPage.description}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}