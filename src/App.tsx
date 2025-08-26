import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { ConnectionsView } from '@/views/ConnectionsView'
import { SettingsView } from '@/views/SettingsView'
import { StatsView } from '@/views/StatsView'
import { AboutView } from '@/views/AboutView'

function App() {
  const [activeTab, setActiveTab] = useState('connections')

  const renderCurrentView = () => {
    switch (activeTab) {
      case 'connections':
        return <ConnectionsView />
      case 'settings':
        return <SettingsView />
      case 'stats':
        return <StatsView />
      case 'about':
        return <AboutView />
      default:
        return <ConnectionsView />
    }
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderCurrentView()}
    </Layout>
  )
}

export default App
