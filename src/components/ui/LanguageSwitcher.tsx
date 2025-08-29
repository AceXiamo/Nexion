import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'

interface Language {
  code: 'zh' | 'en'
  name: string
  nativeName: string
  flag: string
}

const languages: Language[] = [
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [showDropdown, setShowDropdown] = useState(false)
  
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = async (languageCode: string) => {
    await i18n.changeLanguage(languageCode)
    localStorage.setItem('language', languageCode)
    setShowDropdown(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-all duration-200 border border-neutral-700"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm font-medium text-white">{currentLanguage.nativeName}</span>
        <Icon 
          icon={showDropdown ? 'mdi:chevron-up' : 'mdi:chevron-down'} 
          className="w-4 h-4 text-neutral-400"
        />
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-800 rounded-lg shadow-xl border border-neutral-700 py-2 z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-neutral-700 transition-colors duration-200 ${
                currentLanguage.code === language.code ? 'bg-neutral-700 text-lime-400' : 'text-white'
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{language.nativeName}</div>
                <div className="text-xs text-neutral-400">{language.name}</div>
              </div>
              {currentLanguage.code === language.code && (
                <Icon icon="mdi:check" className="w-4 h-4 text-lime-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}