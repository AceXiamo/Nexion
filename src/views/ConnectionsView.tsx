import { useAccount } from 'wagmi'
import { Icon } from '@iconify/react'
import { RegistrationPrompt } from '@/components/wallet/RegistrationPrompt'
import { useUserRegistration } from '@/hooks/useUserRegistration'

export function ConnectionsView() {
  const { isConnected } = useAccount()
  const { isRegistered } = useUserRegistration()

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-80 border border-neutral-800 rounded-xl shadow-lg">
        <div className="w-20 h-20 bg-lime-400/10 rounded-2xl flex items-center justify-center mb-6">
          <Icon icon="mdi:wallet-outline" className="w-10 h-10 text-lime-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3">连接钱包以开始</h3>
        <p className="text-neutral-400 text-center max-w-md leading-relaxed">
          请连接你的 OKX 钱包或其他 WalletConnect 兼容钱包来管理 SSH 配置。<br />
          你的所有配置都将被端到端加密并安全存储在区块链上。
        </p>
        <div className="mt-6 flex items-center space-x-2 text-xs text-neutral-500">
          <Icon icon="mdi:shield-check" className="w-4 h-4 text-lime-400" />
          <span>完全去中心化</span>
          <div className="w-1 h-1 bg-neutral-600 rounded-full"></div>
          <Icon icon="mdi:lock" className="w-4 h-4 text-lime-400" />
          <span>端到端加密</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Registration Prompt */}
      <RegistrationPrompt />

      <div className="border border-neutral-800 rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">SSH 连接配置</h2>
            <p className="text-neutral-400">安全管理你的 SSH 服务器连接配置</p>
          </div>
          {isRegistered && (
            <button className="btn-primary">
              <Icon icon="mdi:plus" className="w-4 h-4" />
              <span>添加配置</span>
            </button>
          )}
        </div>
        
        {isRegistered ? (
          /* SSH 配置列表区域 */
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icon icon="mdi:server-plus" className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">暂无 SSH 配置</h3>
            <p className="text-neutral-400 mb-6 max-w-md mx-auto leading-relaxed">
              你还没有添加任何 SSH 连接配置。添加你的第一个配置来开始安全地管理服务器连接。
            </p>
            <button className="btn-primary">
              <Icon icon="mdi:rocket-launch" className="w-4 h-4" />
              <span>创建首个配置</span>
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icon icon="mdi:account-alert" className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">需要注册钱包</h3>
            <p className="text-neutral-400 mb-6 max-w-md mx-auto leading-relaxed">
              请先注册你的钱包地址才能开始管理 SSH 配置。注册过程快速简单。
            </p>
            <div className="flex items-center justify-center space-x-2 text-xs text-neutral-500">
              <Icon icon="mdi:information" className="w-4 h-4" />
              <span>点击上方横幅中的注册按钮即可开始</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}