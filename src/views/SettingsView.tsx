import { Icon } from '@iconify/react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { KeyboardShortcutSettings } from '@/components/settings/KeyboardShortcutSettings'

type SettingsTab = 'general' | 'shortcuts'

export function SettingsView() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  const tabs = [
    { id: 'general', name: t('settings:general'), icon: 'lucide:settings' },
    { id: 'shortcuts', name: '快捷键', icon: 'lucide:keyboard' }
  ] as const

  return (
    <div className="space-y-6">
      {/* 标签导航 */}
      <div className="flex space-x-1 bg-[#0a0a0a] p-1 rounded-lg border border-[#1a1a1a]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
              activeTab === tab.id
                ? 'bg-[#BCFF2F] text-black font-medium'
                : 'text-[#888888] hover:text-white hover:bg-[#1a1a1a]'
            }`}
          >
            <Icon icon={tab.icon} className="w-4 h-4" />
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* 标签内容 */}
      {activeTab === 'general' && (
        <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Icon icon="lucide:settings" className="w-6 h-6 text-[#BCFF2F]" />
            <h2 className="text-xl font-semibold text-white">{t('settings:general')}</h2>
          </div>
          
          <div className="space-y-4">
            {/* 语言设置 */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-[#272727] rounded-lg flex items-center justify-center">
                  <Icon icon="lucide:languages" className="w-5 h-5 text-[#CCCCCC]" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{t('settings:language')}</h3>
                  <p className="text-sm text-[#888888]">{t('settings:languageDesc')}</p>
                </div>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'shortcuts' && (
        <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a]">
          <KeyboardShortcutSettings />
        </div>
      )}
    </div>
  )
}
