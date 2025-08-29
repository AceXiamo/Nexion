import { Icon } from '@iconify/react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'

export function SettingsView() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      {/* 基本设置 */}
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
    </div>
  )
}
