import { Icon } from '@iconify/react'
import { useTranslation } from 'react-i18next'

export function AboutView() {
  const { t } = useTranslation()

  const handleExternalLink = (url: string) => {
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url)
    } else {
      // Fallback for web environment
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero section - Product header */}
      <div className="p-4">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 rounded-lg border border-blue-400/30 flex items-center justify-center overflow-hidden">
            <img src="https://nexion.acexiamo.com/logo.png" alt="Nexion Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">Nexion</h1>
            <p className="text-sm text-blue-200/80 mt-1 font-medium">{t('views:about.version')}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Icon icon="token-branded:ethereum" className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-300/70">Powered by AceXiamo</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Icon icon="fluent-emoji:globe-showing-americas" className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-blue-100">{t('views:about.productIntro')}</h2>
            </div>
            <p className="text-blue-200/70 leading-relaxed text-sm">{t('views:about.productDesc')}</p>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Icon icon="fluent-emoji:magnifying-glass-tilted-right" className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-blue-100">{t('views:about.coreFeatures')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  icon: 'token-branded:metamask',
                  title: t('views:about.features.unifiedAuth.title'),
                  description: t('views:about.features.unifiedAuth.description'),
                  iconColor: 'text-orange-400',
                },
                {
                  icon: 'oui:ws-search',
                  title: t('views:about.features.decentralizedStorage.title'),
                  description: t('views:about.features.decentralizedStorage.description'),
                  iconColor: 'text-blue-400',
                },
                {
                  icon: 'token-branded:polkadot',
                  title: t('views:about.features.secureConnection.title'),
                  description: t('views:about.features.secureConnection.description'),
                  iconColor: 'text-pink-400',
                },
                {
                  icon: 'fluent:arrow-sync-circle-16-regular',
                  title: t('views:about.features.crossPlatform.title'),
                  description: t('views:about.features.crossPlatform.description'),
                  iconColor: 'text-indigo-400',
                },
              ].map((feature, index) => (
                <div key={index} className="group bg-[#1a1a2e]/40 rounded-lg px-4 py-3 hover:bg-[#1a1a2e]/60 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <Icon icon={feature.icon} className={`w-5 h-5 ${feature.iconColor}`} />
                    <div className="flex-1">
                      <h3 className="font-medium text-blue-100 mb-1 text-sm group-hover:text-blue-50 transition-colors duration-300">{feature.title}</h3>
                      <p className="text-xs text-blue-200/60 leading-relaxed group-hover:text-blue-200/80 transition-colors duration-300">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact us */}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Icon icon="fluent-emoji:open-mailbox-with-raised-flag" className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-blue-100">{t('views:about.contact')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
          <div className="space-y-3 flex flex-col">
            <p className="text-blue-200/70 leading-relaxed text-sm">{t('views:about.contactDesc')}</p>
            <div className="space-y-2 mt-auto">
              <div className="flex items-center space-x-3 px-3 py-2 rounded bg-blue-900/20 hover:bg-blue-900/30 transition-colors duration-300">
                <Icon icon="lucide:webhook" className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-blue-200/80">{t('views:about.techStackDesc')}</span>
              </div>
              <div className="flex items-center space-x-3 px-3 py-2 rounded bg-indigo-900/20 hover:bg-indigo-900/30 transition-colors duration-300">
                <Icon icon="lucide:mail" className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-blue-200/80">{t('views:about.contactEmail')}</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 px-4 py-3 rounded bg-[#1a1a2e]/40 hover:bg-[#1a1a2e]/60 transition-all duration-300">
              <Icon icon="lucide:headphones" className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-xs font-medium text-blue-100">{t('views:about.techSupport')}</div>
                <div className="text-xs text-blue-200/60">{t('views:about.techSupportDesc')}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 px-4 py-3 rounded bg-[#1a1a2e]/40 hover:bg-purple-900/30 transition-all duration-300">
              <Icon icon="lucide:building" className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-xs font-medium text-blue-100">{t('views:about.enterpriseService')}</div>
                <div className="text-xs text-blue-200/60">{t('views:about.enterpriseServiceDesc')}</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 px-4 py-3 rounded bg-[#1a1a2e]/40 hover:bg-indigo-900/30 transition-all duration-300">
              <Icon icon="lucide:shield" className="w-4 h-4 text-indigo-400" />
              <div>
                <div className="text-xs font-medium text-blue-100">{t('views:about.securityReport')}</div>
                <div className="text-xs text-blue-200/60">{t('views:about.securityReportDesc')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important links */}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Icon icon="fluent-emoji:link" className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-blue-100">{t('views:about.importantLinks')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleExternalLink('https://example.com')}
            className="group bg-[#1a1a2e]/40 rounded p-3 hover:bg-blue-900/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="flex flex-col items-center space-y-2">
              <Icon icon="lucide:globe" className="w-5 h-5 text-blue-400" />
              <div className="text-center">
                <div className="text-xs font-medium text-blue-100 group-hover:text-blue-50 transition-colors duration-300">{t('views:about.officialWebsite')}</div>
                <div className="text-xs text-blue-200/60 mt-1">{t('views:about.websiteDesc')}</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleExternalLink('https://github.com/AceXiamo/nexion-contracts')}
            className="group bg-[#1a1a2e]/40 rounded p-3 hover:bg-purple-900/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="flex flex-col items-center space-y-2">
              <Icon icon="grommet-icons:github" className="w-5 h-5 text-purple-400" />
              <div className="text-center">
                <div className="text-xs font-medium text-blue-100 group-hover:text-blue-50 transition-colors duration-300">{t('views:about.openSource')}</div>
                <div className="text-xs text-blue-200/60 mt-1">{t('views:about.openSourceDesc')}</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleExternalLink('https://www.oklink.com/xlayer-test')}
            className="group bg-[#1a1a2e]/40 rounded p-3 hover:bg-indigo-900/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="flex flex-col items-center space-y-2">
              <Icon icon="oui:ws-search" className="w-5 h-5 text-indigo-400" />
              <div className="text-center">
                <div className="text-xs font-medium text-blue-100 group-hover:text-blue-50 transition-colors duration-300">{t('views:about.blockchainExplorer')}</div>
                <div className="text-xs text-blue-200/60 mt-1">{t('views:about.blockchainExplorerDesc')}</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleExternalLink('https://example.com/docs')}
            className="group bg-[#1a1a2e]/40 rounded p-3 hover:bg-cyan-900/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="flex flex-col items-center space-y-2">
              <Icon icon="lucide:book-open" className="w-5 h-5 text-cyan-400" />
              <div className="text-center">
                <div className="text-xs font-medium text-blue-100 group-hover:text-blue-50 transition-colors duration-300">{t('views:about.documentation')}</div>
                <div className="text-xs text-blue-200/60 mt-1">{t('views:about.documentationDesc')}</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Copyright information */}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Icon icon="lucide:info" className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-semibold text-blue-100">{t('views:about.copyrightAndLicense')}</h2>
        </div>

        <div className="mt-4">
          <div className="flex items-start">
            <div className="flex-1">
              <div className="text-blue-200/80 leading-relaxed">
                <p className="mb-2 text-sm">
                  © 2024 <span className="font-semibold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Nexion</span>. {t('views:about.allRightsReserved')}.
                </p>
                <p className="text-blue-200/70 mb-3 text-xs">{t('views:about.licenseDesc')}</p>
                <div className="flex items-center space-x-3 pt-2 border-t border-[#2a2a4a]/30">
                  <div className="flex items-center space-x-1">
                    <Icon icon="token-branded:apache" className="w-3 h-3 text-orange-400" />
                    <span className="text-xs text-blue-200/60">{t('views:about.apacheLicense')}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Icon icon="token-branded:ethereum" className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-blue-200/60">{t('views:about.web3Technology')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
