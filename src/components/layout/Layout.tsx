import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DynamicSidebar } from './DynamicSidebar'
import { Header } from './Header'
import { WindowsTitleBar } from './WindowsTitleBar'
import { FloatingTransferProgress } from '../file-transfer/FloatingTransferProgress'
import { isWindows, isMacOS } from '@/lib/platform'

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
    <div className="flex h-screen bg-black flex-col">
      {/* Platform-specific title bar */}
      {isWindows() && (
        <WindowsTitleBar
          title="Nexion"
          showWalletButton={false}
        />
      )}

      {/* macOS title bar drag area (only when not Windows) */}
      {isMacOS() && (
        <div
          className="macos-drag-region fixed top-0 left-0 right-0 h-8 bg-transparent z-50 pointer-events-none"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        />
      )}

      {/* Main layout container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <DynamicSidebar activeTab={activeTab} onTabChange={onTabChange} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header - Adjust padding for different title bar configurations */}
          <Header
            title={currentPage.title}
            description={currentPage.description}
          />

          {/* Page Content */}
          <main className="flex-1 h-0">
            <div className={`h-full p-6 overflow-auto`}>
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Floating Transfer Progress */}
      <FloatingTransferProgress />
    </div>
  )
}
