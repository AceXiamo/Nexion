import { Icon } from '@iconify/react'

export function AboutView() {
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
      {/* 英雄区域 - 产品头部 */}
      <div className="p-4">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 rounded-lg border border-blue-400/30 flex items-center justify-center overflow-hidden">
            <img src="/app-icon.png" alt="Nexion Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">Nexion</h1>
            <p className="text-sm text-blue-200/80 mt-1 font-medium">下一代 Web3 SSH 管理器</p>
            <div className="flex items-center space-x-2 mt-2">
              <Icon icon="token-branded:ethereum" className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-300/70">Powered by Web3 Technology</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Icon icon="fluent-emoji:globe-showing-americas" className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-blue-100">产品介绍</h2>
            </div>
            <p className="text-blue-200/70 leading-relaxed text-sm">
              Nexion 是一款革命性的 SSH 管理工具，将传统服务器管理与 Web3 技术完美融合。 通过区块链技术实现配置的去中心化存储，用加密钱包替代传统密钥管理，
              为企业和开发者提供更安全、便捷的服务器访问解决方案。
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Icon icon="fluent-emoji:magnifying-glass-tilted-right" className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-blue-100">核心特性</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  icon: 'token-branded:metamask',
                  title: '钱包身份认证',
                  description: '使用 Web3 钱包进行安全身份验证，告别传统密钥管理',
                  iconColor: 'text-orange-400',
                },
                {
                  icon: 'oui:ws-search',
                  title: '区块链存储',
                  description: '配置数据加密存储在 X Layer 区块链，永不丢失',
                  iconColor: 'text-blue-400',
                },
                {
                  icon: 'token-branded:polkadot',
                  title: '端到端加密',
                  description: '军用级加密算法保护所有数据传输和存储',
                  iconColor: 'text-pink-400',
                },
                {
                  icon: 'fluent:arrow-sync-circle-16-regular',
                  title: '跨设备同步',
                  description: '无论在哪台设备上，只要连接钱包就能访问你的所有SSH配置',
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

      {/* 联系我们 */}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Icon icon="fluent-emoji:open-mailbox-with-raised-flag" className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-blue-100">联系我们</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
          <div className="space-y-3 flex flex-col">
            <p className="text-blue-200/70 leading-relaxed text-sm">
              Nexion 由专业的 Web3 技术团队开发，致力于为企业和个人开发者提供 安全、高效的服务器管理解决方案。我们相信去中心化技术将重新定义 基础设施管理的未来。
            </p>
            <div className="space-y-2 mt-auto">
              <div className="flex items-center space-x-3 px-3 py-2 rounded bg-blue-900/20 hover:bg-blue-900/30 transition-colors duration-300">
                <Icon icon="lucide:webhook" className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-blue-200/80">基于 OKX Web3 生态构建</span>
              </div>
              <div className="flex items-center space-x-3 px-3 py-2 rounded bg-indigo-900/20 hover:bg-indigo-900/30 transition-colors duration-300">
                <Icon icon="lucide:mail" className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-blue-200/80">xiamo@qwq.link</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 px-4 py-3 rounded bg-[#1a1a2e]/40 hover:bg-[#1a1a2e]/60 transition-all duration-300">
              <Icon icon="lucide:headphones" className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-xs font-medium text-blue-100">技术支持</div>
                <div className="text-xs text-blue-200/60">7x24 专业技术服务</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 px-4 py-3 rounded bg-[#1a1a2e]/40 hover:bg-purple-900/30 transition-all duration-300">
              <Icon icon="lucide:building" className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-xs font-medium text-blue-100">企业服务</div>
                <div className="text-xs text-blue-200/60">定制化解决方案</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 px-4 py-3 rounded bg-[#1a1a2e]/40 hover:bg-indigo-900/30 transition-all duration-300">
              <Icon icon="lucide:shield" className="w-4 h-4 text-indigo-400" />
              <div>
                <div className="text-xs font-medium text-blue-100">安全报告</div>
                <div className="text-xs text-blue-200/60">漏洞反馈与奖励</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 重要链接 */}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Icon icon="fluent-emoji:link" className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-semibold text-blue-100">重要链接</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleExternalLink('https://example.com')}
            className="group bg-[#1a1a2e]/40 rounded p-3 hover:bg-blue-900/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="flex flex-col items-center space-y-2">
              <Icon icon="lucide:globe" className="w-5 h-5 text-blue-400" />
              <div className="text-center">
                <div className="text-xs font-medium text-blue-100 group-hover:text-blue-50 transition-colors duration-300">官方网站</div>
                <div className="text-xs text-blue-200/60 mt-1">产品主页</div>
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
                <div className="text-xs font-medium text-blue-100 group-hover:text-blue-50 transition-colors duration-300">开源合约</div>
                <div className="text-xs text-blue-200/60 mt-1">智能合约代码</div>
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
                <div className="text-xs font-medium text-blue-100 group-hover:text-blue-50 transition-colors duration-300">区块链浏览器</div>
                <div className="text-xs text-blue-200/60 mt-1">X Layer 网络</div>
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
                <div className="text-xs font-medium text-blue-100 group-hover:text-blue-50 transition-colors duration-300">使用文档</div>
                <div className="text-xs text-blue-200/60 mt-1">帮助中心</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 版权信息 */}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Icon icon="lucide:info" className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-semibold text-blue-100">版权与许可</h2>
        </div>

        <div className="mt-4">
          <div className="flex items-start">
            <div className="flex-1">
              <div className="text-blue-200/80 leading-relaxed">
                <p className="mb-2 text-sm">
                  © 2024 <span className="font-semibold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">Nexion</span>. 保留所有权利。
                </p>
                <p className="text-blue-200/70 mb-3 text-xs">
                  本软件为专有产品，受版权法和国际条约保护。核心智能合约代码已在 GitHub 开源， 采用 Apache 2.0 许可证。应用程序本体为商业软件，未经授权不得复制、分发或修改。
                </p>
                <div className="flex items-center space-x-3 pt-2 border-t border-[#2a2a4a]/30">
                  <div className="flex items-center space-x-1">
                    <Icon icon="token-branded:apache" className="w-3 h-3 text-orange-400" />
                    <span className="text-xs text-blue-200/60">Apache 2.0 License</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Icon icon="token-branded:ethereum" className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-blue-200/60">Web3 Technology</span>
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
