import { Icon } from '@iconify/react'

export function AboutView() {
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
              <span className="text-[#888888]">v0.1.0 - 测试版</span>
              <div className="w-2 h-2 bg-[#BCFF2F] rounded-full"></div>
              <span className="text-xs text-[#BCFF2F]">BETA</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <Icon icon="lucide:info" className="w-5 h-5 text-[#BCFF2F]" />
              <h2 className="text-lg font-semibold text-white">产品介绍</h2>
            </div>
            <p className="text-[#CCCCCC] leading-relaxed">
              Web3 SSH Manager 是一个基于区块链技术的 SSH 配置管理工具。
              它将传统的 SSH 管理与 Web3 技术相结合，提供去中心化、安全、便捷的服务器访问管理解决方案。
            </p>
          </div>

          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Icon icon="lucide:star" className="w-5 h-5 text-[#BCFF2F]" />
              <h2 className="text-lg font-semibold text-white">核心特性</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: 'lucide:wallet',
                  title: '统一身份认证',
                  description: '使用 Web3 钱包替代传统 SSH 密钥管理'
                },
                {
                  icon: 'lucide:shield-check',
                  title: '去中心化存储',
                  description: 'SSH 配置信息 ECIES 加密存储在区块链'
                },
                {
                  icon: 'lucide:history',
                  title: '审计可追溯',
                  description: '所有操作记录链上可查，完整审计链'
                },
                {
                  icon: 'lucide:users',
                  title: '团队协作',
                  description: '基于智能合约的权限管理系统'
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

      {/* 技术架构 */}
      <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Icon icon="lucide:cpu" className="w-5 h-5 text-[#BCFF2F]" />
          <h2 className="text-lg font-semibold text-white">技术架构</h2>
        </div>
        <div className="bg-[#000000] border border-[#333333] rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[#333333]">
                <span className="text-[#888888]">区块链网络</span>
                <span className="text-white font-medium">X Layer</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#333333]">
                <span className="text-[#888888]">加密方案</span>
                <span className="text-white font-medium">ECIES + ChaCha20Poly1305</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[#888888]">智能合约</span>
                <span className="text-white font-medium">Solidity</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-[#333333]">
                <span className="text-[#888888]">前端框架</span>
                <span className="text-white font-medium">Electron + React</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#333333]">
                <span className="text-[#888888]">Web3 工具</span>
                <span className="text-white font-medium">Wagmi + Viem</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[#888888]">UI 框架</span>
                <span className="text-white font-medium">Tailwind CSS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 版本信息 & 开发团队 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Icon icon="lucide:code" className="w-5 h-5 text-[#BCFF2F]" />
            <h2 className="text-lg font-semibold text-white">版本信息</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-[#333333]">
              <span className="text-[#888888]">当前版本</span>
              <span className="text-white font-medium">0.1.0-beta</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#333333]">
              <span className="text-[#888888]">发布日期</span>
              <span className="text-white font-medium">2024-08-27</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#333333]">
              <span className="text-[#888888]">构建版本</span>
              <span className="text-[#CCCCCC] font-mono text-xs">a1b2c3d</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[#888888]">许可证</span>
              <span className="text-white font-medium">MIT</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Icon icon="lucide:heart" className="w-5 h-5 text-[#BCFF2F]" />
            <h2 className="text-lg font-semibold text-white">开发团队</h2>
          </div>
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
              <span className="text-sm text-[#888888]">support@web3ssh.com</span>
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
              <div className="text-sm font-medium text-white group-hover:text-[#BCFF2F]">GitHub</div>
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
          <h2 className="text-lg font-semibold text-white">更新日志</h2>
        </div>
        <div className="space-y-4">
          <div className="border-l-2 border-[#BCFF2F] pl-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-white">v0.1.0-beta</span>
              <span className="text-xs text-[#888888]">2024-08-27</span>
            </div>
            <ul className="text-sm text-[#CCCCCC] space-y-1">
              <li>• 初始版本发布</li>
              <li>• 基础 SSH 配置管理功能</li>
              <li>• OKX 钱包集成</li>
              <li>• X Layer 测试网支持</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
