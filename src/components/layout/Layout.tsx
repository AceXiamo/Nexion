import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DynamicSidebar } from './DynamicSidebar'
import { Header } from './Header'

interface LayoutProps {
  children: ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}

// 页面配置工厂函数
const getPageConfig = (t: any) => ({
  connections: {
    title: t('navigation:pageTitle.connections'),
    description: t('navigation:pageDescription.connections')
  },
  settings: {
    title: t('navigation:pageTitle.settings'),
    description: t('navigation:pageDescription.settings')
  },
  stats: {
    title: t('navigation:pageTitle.stats'),
    description: t('navigation:pageDescription.stats')
  },
  about: {
    title: t('navigation:pageTitle.about'),
    description: t('navigation:pageDescription.about')
  }
})

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { t } = useTranslation()
  const pageConfig = getPageConfig(t)
  const currentPage = pageConfig[activeTab as keyof typeof pageConfig] || pageConfig.connections

  return (
    <div className="flex h-screen bg-black">
      {/* macOS 标题栏拖拽区域 */}
      <div 
        className="fixed top-0 left-0 right-0 h-8 bg-transparent z-50 pointer-events-none"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />
      
      {/* Sidebar */}
      <DynamicSidebar activeTab={activeTab} onTabChange={onTabChange} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - 为 macOS 标题栏预留空间 */}
        <Header 
          title={currentPage.title} 
          description={currentPage.description}
        />
        
        {/* Page Content */}
        <main className="flex-1">
          <div className="p-8 h-full overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
