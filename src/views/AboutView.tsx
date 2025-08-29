import { Icon } from '@iconify/react'
import { useTranslation } from 'react-i18next'

export function AboutView() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      {/* 产品头部 */}
      <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#BCFF2F] to-[#9FE827] rounded-xl flex items-center justify-center">
            <Icon icon="lucide:terminal-square" className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Web3 SSH Manager</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-[#888888]">{t('views:about.version')}</span>
              <div className="w-2 h-2 bg-[#BCFF2F] rounded-full"></div>
              <span className="text-xs text-[#BCFF2F]">BETA</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <Icon icon="lucide:info" className="w-5 h-5 text-[#BCFF2F]" />
              <h2 className="text-lg font-semibold text-white">{t('views:about.productIntro')}</h2>
            </div>
            <p className="text-[#CCCCCC] leading-relaxed">
              {t('views:about.productDesc')}
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Icon icon="lucide:star" className="w-5 h-5 text-[#BCFF2F]" />
              <h2 className="text-lg font-semibold text-white">{t('views:about.coreFeatures')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: 'lucide:wallet',
                  title: t('views:about.features.unifiedAuth.title'),
                  description: t('views:about.features.unifiedAuth.description')
                },
                {
                  icon: 'lucide:shield-check',
                  title: t('views:about.features.decentralizedStorage.title'),
                  description: t('views:about.features.decentralizedStorage.description')
                },
                {
                  icon: 'lucide:lock',
                  title: t('views:about.features.secureConnection.title'),
                  description: t('views:about.features.secureConnection.description')
                },
                {
                  icon: 'lucide:monitor',
                  title: t('views:about.features.crossPlatform.title'),
                  description: t('views:about.features.crossPlatform.description')
                }
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-[#272727] border border-[#333333] rounded-lg hover:border-[#BCFF2F]/50 transition-all duration-200">
                  <div className="w-10 h-10 bg-[#0f0f0f] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon icon={feature.icon} className="w-5 h-5 text-[#BCFF2F]" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{feature.title}</h3>
                    <p className="text-sm text-[#888888] mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* 联系我们 */}
      <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Icon icon="lucide:heart" className="w-5 h-5 text-[#BCFF2F]" />
          <h2 className="text-lg font-semibold text-white">{t('views:about.contact')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-[#CCCCCC] leading-relaxed">
              本项目由 Web3 技术爱好者开发，致力于为用户提供更安全、便捷的 SSH 管理体验。
            </p>
            <div className="flex items-center space-x-2">
              <Icon icon="lucide:globe" className="w-4 h-4 text-[#888888]" />
              <span className="text-sm text-[#888888]">OKX Web3 生态</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon icon="lucide:mail" className="w-4 h-4 text-[#888888]" />
              <span className="text-sm text-[#888888]">{t('views:about.contactEmail')}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Icon icon="lucide:message-circle" className="w-4 h-4 text-[#888888]" />
              <span className="text-sm text-[#888888]">反馈建议</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon icon="lucide:users" className="w-4 h-4 text-[#888888]" />
              <span className="text-sm text-[#888888]">社区支持</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon icon="lucide:shield" className="w-4 h-4 text-[#888888]" />
              <span className="text-sm text-[#888888]">安全报告</span>
            </div>
          </div>
        </div>
      </div>

      {/* 重要链接 */}
      <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Icon icon="lucide:external-link" className="w-5 h-5 text-[#BCFF2F]" />
          <h2 className="text-lg font-semibold text-white">重要链接</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="#"
            className="flex items-center space-x-3 p-4 bg-[#272727] border border-[#333333] rounded-lg hover:border-[#BCFF2F] hover:bg-[#1C260A] transition-all duration-200 group"
          >
            <Icon icon="lucide:github" className="w-5 h-5 text-[#CCCCCC] group-hover:text-[#BCFF2F]" />
            <div>
              <div className="text-sm font-medium text-white group-hover:text-[#BCFF2F]">{t('views:about.github')}</div>
              <div className="text-xs text-[#888888]">源码仓库</div>
            </div>
          </a>
          <a
            href="https://www.oklink.com/xlayer-test"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-4 bg-[#272727] border border-[#333333] rounded-lg hover:border-[#BCFF2F] hover:bg-[#1C260A] transition-all duration-200 group"
          >
            <Icon icon="lucide:search" className="w-5 h-5 text-[#CCCCCC] group-hover:text-[#BCFF2F]" />
            <div>
              <div className="text-sm font-medium text-white group-hover:text-[#BCFF2F]">区块链浏览器</div>
              <div className="text-xs text-[#888888]">X Layer</div>
            </div>
          </a>
          <a
            href="#"
            className="flex items-center space-x-3 p-4 bg-[#272727] border border-[#333333] rounded-lg hover:border-[#BCFF2F] hover:bg-[#1C260A] transition-all duration-200 group"
          >
            <Icon icon="lucide:book-open" className="w-5 h-5 text-[#CCCCCC] group-hover:text-[#BCFF2F]" />
            <div>
              <div className="text-sm font-medium text-white group-hover:text-[#BCFF2F]">文档</div>
              <div className="text-xs text-[#888888]">使用手册</div>
            </div>
          </a>
          <a
            href="#"
            className="flex items-center space-x-3 p-4 bg-[#272727] border border-[#333333] rounded-lg hover:border-[#BCFF2F] hover:bg-[#1C260A] transition-all duration-200 group"
          >
            <Icon icon="lucide:bug" className="w-5 h-5 text-[#CCCCCC] group-hover:text-[#BCFF2F]" />
            <div>
              <div className="text-sm font-medium text-white group-hover:text-[#BCFF2F]">问题反馈</div>
              <div className="text-xs text-[#888888]">Bug 报告</div>
            </div>
          </a>
        </div>
      </div>

      {/* 更新日志 */}
      <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Icon icon="lucide:clock" className="w-5 h-5 text-[#BCFF2F]" />
          <h2 className="text-lg font-semibold text-white">{t('views:about.changelog')}</h2>
        </div>
        <div className="space-y-4">
          <div className="border-l-2 border-[#BCFF2F] pl-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-white">v0.1.0-beta</span>
              <span className="text-xs text-[#888888]">{t('views:about.releaseDate')}</span>
            </div>
            <ul className="text-sm text-[#CCCCCC] space-y-1">
              <li>• {t('views:about.releaseFeatures.basicSSH')}</li>
              <li>• {t('views:about.releaseFeatures.walletIntegration')}</li>
              <li>• {t('views:about.releaseFeatures.testnetSupport')}</li>
              <li>• {t('views:about.releaseFeatures.encryption')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
