import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DynamicSidebar } from './DynamicSidebar'
import { Header } from './Header'

interface LayoutProps {
  children: ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}

// Page configuration factory function
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
      {/* macOS title bar drag area */}
      <div 
        className="fixed top-0 left-0 right-0 h-8 bg-transparent z-50 pointer-events-none"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />
      
      {/* Sidebar */}
      <DynamicSidebar activeTab={activeTab} onTabChange={onTabChange} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Reserve space for macOS title bar */}
        <Header 
          title={currentPage.title} 
          description={currentPage.description}
        />
        
        {/* Page Content */}
        <main className="flex-1">
          <div className="p-6 h-full overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
