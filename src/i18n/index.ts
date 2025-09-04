import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import language resources
import commonEn from '../locales/en/common.json'
import navigationEn from '../locales/en/navigation.json'
import sshEn from '../locales/en/ssh.json'
import walletEn from '../locales/en/wallet.json'
import errorsEn from '../locales/en/errors.json'
import settingsEn from '../locales/en/settings.json'
import viewsEn from '../locales/en/views.json'
import fileTransferEn from '../locales/en/file-transfer.json'

import commonZh from '../locales/zh/common.json'
import navigationZh from '../locales/zh/navigation.json'
import sshZh from '../locales/zh/ssh.json'
import walletZh from '../locales/zh/wallet.json'
import errorsZh from '../locales/zh/errors.json'
import settingsZh from '../locales/zh/settings.json'
import viewsZh from '../locales/zh/views.json'
import fileTransferZh from '../locales/zh/file-transfer.json'

export const defaultNS = 'common'
export const fallbackLng = 'en'

export const resources = {
  en: {
    common: commonEn,
    navigation: navigationEn,
    ssh: sshEn,
    wallet: walletEn,
    errors: errorsEn,
    settings: settingsEn,
    views: viewsEn,
    fileTransfer: fileTransferEn,
  },
  zh: {
    common: commonZh,
    navigation: navigationZh,
    ssh: sshZh,
    wallet: walletZh,
    errors: errorsZh,
    settings: settingsZh,
    views: viewsZh,
    fileTransfer: fileTransferZh,
  },
} as const

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: typeof window !== 'undefined' ? localStorage.getItem('language') || 'en' : 'en',
    fallbackLng,
    defaultNS,
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
    
    // Namespace separator
    nsSeparator: ':',
    
    // Key separator for nested keys
    keySeparator: '.',
    
    // Return objects for array translations
    returnObjects: true,
    
    // Save language to localStorage when changed
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
