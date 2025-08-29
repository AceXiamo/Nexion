import { Icon } from '@iconify/react'
import { useTranslation } from 'react-i18next'
import { useUserRegistration } from '@/hooks/useUserRegistration'

export function RegistrationPrompt() {
  const { t } = useTranslation()
  const { showRegistrationPrompt, handleRegister, isRegistering } = useUserRegistration()

  if (!showRegistrationPrompt) return null

  return (
    <div className="bg-lime-400/5 border border-lime-400/20 rounded-xl p-6 mb-8">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-lime-400/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon icon="mdi:account-plus" className="w-6 h-6 text-lime-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-2">{t('wallet:registration.title')}</h3>
          <p className="text-sm text-neutral-300 leading-relaxed mb-4">
            {t('wallet:registration.description')}
          </p>
          
          {/* 功能亮点 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:shield-check" className="w-4 h-4 text-lime-400" />
              <span className="text-xs text-neutral-400">{t('ssh:securityFeature1')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:database-lock" className="w-4 h-4 text-lime-400" />
              <span className="text-xs text-neutral-400">{t('ssh:securityFeature2')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:history" className="w-4 h-4 text-lime-400" />
              <span className="text-xs text-neutral-400">Traceable Operations</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:account-group" className="w-4 h-4 text-lime-400" />
              <span className="text-xs text-neutral-400">Team Collaboration</span>
            </div>
          </div>
          
          <button
            onClick={handleRegister}
            disabled={isRegistering}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegistering ? (
              <>
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                <span>{t('wallet:registration.registering')}</span>
              </>
            ) : (
              <>
                <Icon icon="mdi:rocket-launch" className="w-4 h-4" />
                <span>{t('wallet:registration.registerButton')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}