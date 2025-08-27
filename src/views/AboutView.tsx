import { Icon } from '@iconify/react'

export function AboutView() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Icon icon="mdi:shield-lock" className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Web3 SSH Manager</h1>
            <p className="text-gray-600">v0.1.0 - 测试版</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">产品介绍</h2>
            <p className="text-gray-600 leading-relaxed">
              Web3 SSH Manager 是一个基于区块链技术的 SSH 配置管理工具。
              它将传统的 SSH 管理与 Web3 技术相结合，提供去中心化、安全、便捷的服务器访问管理解决方案。
            </p>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3">核心特性</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: 'mdi:wallet',
                  title: '统一身份认证',
                  description: '使用 Web3 钱包替代传统 SSH 密钥管理'
                },
                {
                  icon: 'mdi:shield-lock',
                  title: '去中心化存储',
                  description: 'SSH 配置信息 ECIES 加密存储在区块链'
                },
                {
                  icon: 'mdi:history',
                  title: '审计可追溯',
                  description: '所有操作记录链上可查，完整审计链'
                },
                {
                  icon: 'mdi:account-group',
                  title: '团队协作',
                  description: '基于智能合约的权限管理系统'
                }
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                  <Icon icon={feature.icon} className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3">技术架构</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900">区块链网络:</span>
                  <span className="ml-2 text-gray-600">X Layer</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">加密方案:</span>
                  <span className="ml-2 text-gray-600">ECIES + ChaCha20Poly1305</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">前端框架:</span>
                  <span className="ml-2 text-gray-600">Electron + React</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Web3 工具:</span>
                  <span className="ml-2 text-gray-600">Wagmi + Viem</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3">开发团队</h2>
            <p className="text-gray-600">
              本项目由 Web3 技术爱好者开发，致力于为用户提供更安全、便捷的 SSH 管理体验。
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">重要链接</h2>
        <div className="grid grid-cols-2 gap-4">
          <a
            href="#"
            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Icon icon="mdi:github" className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">GitHub 源码</span>
          </a>
          <a
            href="https://www.oklink.com/xlayer-test"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Icon icon="mdi:link" className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">区块链浏览器</span>
          </a>
        </div>
      </div>
    </div>
  )
}
