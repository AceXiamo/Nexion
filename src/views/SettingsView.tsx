import { Icon } from '@iconify/react'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ShortcutInput } from '@/components/ui/ShortcutInput'
import { Toggle } from '@/components/ui/Toggle'
import { settingsStore } from '@/store/settings-store'
import { KeyboardShortcut, ShortcutAction } from '@/types/keyboard-shortcuts'

export function SettingsView() {
  const { t } = useTranslation()
  const [shortcuts, setShortcuts] = useState<Record<string, KeyboardShortcut>>({})
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    const loadSettings = () => {
      const config = settingsStore.getKeyboardShortcuts()
      setShortcuts(config.shortcuts)
      setEnabled(config.enabled)
    }

    loadSettings()
    const unsubscribe = settingsStore.subscribe(loadSettings)
    return unsubscribe
  }, [])

  const handleShortcutChange = (action: ShortcutAction, newKey: string) => {
    if (settingsStore.updateKeyboardShortcut(action, newKey)) {
      setShortcuts((prev) => ({
        ...prev,
        [action]: {
          ...prev[action],
          currentKey: newKey,
        },
      }))
    }
  }

  const handleShortcutValidation = (action: ShortcutAction) => (shortcut: string) => {
    return !settingsStore.isShortcutConflict(shortcut, action)
  }

  const handleToggleEnabled = (newEnabled: boolean) => {
    settingsStore.toggleKeyboardShortcuts(newEnabled)
    setEnabled(newEnabled)
  }

  const filteredShortcuts = Object.values(shortcuts)
  const groupedShortcuts = filteredShortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(shortcut)
    return groups
  }, {} as Record<string, KeyboardShortcut[]>)

  return (
    <div className="space-y-6">
      {/* Basic settings */}
      <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Icon icon="lucide:settings" className="w-6 h-6 text-[#BCFF2F]" />
          <h2 className="text-xl font-semibold text-white">{t('settings:general')}</h2>
        </div>

        <div className="space-y-4">
          {/* Language settings */}
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

      {/* Keyboard shortcuts settings */}
      <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Icon icon="lucide:keyboard" className="w-6 h-6 text-[#BCFF2F]" />
          <h2 className="text-xl font-semibold text-white">{t('settings:keyboardShortcuts')}</h2>
        </div>

        <div className="space-y-4">
          {/* Keyboard shortcuts master switch */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#272727] rounded-lg flex items-center justify-center">
                <Icon icon="lucide:toggle-left" className="w-5 h-5 text-[#CCCCCC]" />
              </div>
              <div>
                <h3 className="font-medium text-white">{t('settings:enableShortcuts')}</h3>
                <p className="text-sm text-[#888888]">{t('settings:enableShortcutsDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Toggle checked={enabled} onChange={handleToggleEnabled} />
              <span className="text-sm text-[#CCCCCC]">{t('settings:enabled')}</span>
            </div>
          </div>

          {enabled && (
            <>
              <div className="border-t border-[#333333] pt-4"></div>

              {/* Keyboard shortcuts list */}
              <div className="space-y-6">
                {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                  <div key={category} className="space-y-4">
                    <h4 className="text-sm font-medium text-[#BCFF2F] uppercase tracking-wider">{t(`settings:category${category.charAt(0).toUpperCase() + category.slice(1)}`)}</h4>

                    <div className="space-y-3">
                      {categoryShortcuts.map((shortcut) => (
                        <div key={shortcut.id} className="flex items-center justify-between py-3">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-[#272727] rounded-lg flex items-center justify-center flex-shrink-0">
                              <Icon icon="lucide:command" className="w-4 h-4 text-[#CCCCCC]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-white text-sm">{t(`settings:shortcuts.${shortcut.action}.name`)}</h3>
                                {shortcut.currentKey !== shortcut.defaultKey && (
                                  <span className="px-2 py-0.5 text-xs bg-[#BCFF2F20] bg-opacity-20 text-[#BCFF2F] rounded">{t('settings:shortcutCustomized')}</span>
                                )}
                              </div>
                              <p className="text-xs text-[#888888] mt-1">{t(`settings:shortcuts.${shortcut.action}.description`)}</p>
                            </div>
                          </div>

                          <ShortcutInput
                            value={shortcut.currentKey}
                            onChange={(newKey) => handleShortcutChange(shortcut.action as ShortcutAction, newKey)}
                            onValidate={handleShortcutValidation(shortcut.action as ShortcutAction)}
                            disabled={!enabled}
                            placeholder={t('settings:shortcutNotSet')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
