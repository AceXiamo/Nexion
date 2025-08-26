import { useAccount } from 'wagmi'
import { Icon } from '@iconify/react'
import { RegistrationPrompt } from '@/components/wallet/RegistrationPrompt'
import { useUserRegistration } from '@/hooks/useUserRegistration'

export function ConnectionsView() {
  const { isConnected } = useAccount()
  const { isRegistered } = useUserRegistration()

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200">
        <Icon icon="mdi:wallet-outline" className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">连接钱包以开始</h3>
        <p className="text-gray-600 text-center max-w-md">
          请连接你的 OKX 钱包以管理 SSH 配置。你的所有配置都将被加密存储在区块链上。
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Registration Prompt */}
      <RegistrationPrompt />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">SSH 连接配置</h2>
        <p className="text-gray-600 mb-4">管理你的 SSH 服务器连接配置</p>
        
        {isRegistered ? (
          /* 这里将放置 SSH 配置列表组件 */
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Icon icon="mdi:server-plus" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无 SSH 配置</h3>
            <p className="text-gray-600 mb-4">添加你的第一个 SSH 连接配置</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              添加 SSH 配置
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Icon icon="mdi:account-alert" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">需要注册</h3>
            <p className="text-gray-600 mb-4">请先注册你的钱包地址以管理 SSH 配置</p>
          </div>
        )}
      </div>
    </div>
  )
}