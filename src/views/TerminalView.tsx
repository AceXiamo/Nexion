import { useAccount } from 'wagmi'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { SSHTabContainer } from '@/components/ssh/SSHTabContainer'
import { useUserRegistration } from '@/hooks/useUserRegistration'

export function TerminalView() {
  const { t } = useTranslation()
  const { isConnected } = useAccount()
  const { isRegistered } = useUserRegistration()

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-80 border border-neutral-800 rounded-xl shadow-lg">
        <div className="w-20 h-20 bg-lime-400/10 rounded-2xl flex items-center justify-center mb-6">
          <Icon icon="mdi:wallet-outline" className="w-10 h-10 text-lime-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{t('views:terminal.connectWalletToStart')}</h3>
        <p className="text-neutral-400 text-center max-w-md leading-relaxed">
          {t('views:terminal.connectWalletDesc').split('。').map((part, index, array) => (
            <span key={index}>
              {part}{index < array.length - 1 ? '。' : ''}
              {index === 0 && <br />}
            </span>
          ))}
        </p>
        <div className="mt-6 flex items-center space-x-2 text-xs text-neutral-500">
          <Icon icon="mdi:shield-check" className="w-4 h-4 text-lime-400" />
          <span>{t('views:terminal.secureConnection')}</span>
          <div className="w-1 h-1 bg-neutral-600 rounded-full"></div>
          <Icon icon="mdi:lock" className="w-4 h-4 text-lime-400" />
          <span>{t('views:terminal.endToEndEncryption')}</span>
        </div>
      </div>
    )
  }

  if (!isRegistered) {
    return (
      <div className="border border-neutral-800 rounded-xl shadow-lg p-12 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Icon icon="mdi:account-alert" className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-3">{t('views:terminal.needRegistration')}</h3>
        <p className="text-neutral-400 mb-6 max-w-md mx-auto leading-relaxed">
          {t('views:terminal.registrationDesc')}
        </p>
        <div className="flex items-center justify-center space-x-2 text-xs text-neutral-500">
          <Icon icon="mdi:information" className="w-4 h-4" />
          <span>{t('views:terminal.clickConnectButton')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <SSHTabContainer />
    </div>
  )
}