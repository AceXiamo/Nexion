import { useAccount } from 'wagmi'
import { Icon } from '@iconify/react'
import { useSSHContract } from '@/hooks/useSSHContract'

export function StatsView() {
  const { address } = useAccount()
  const { useGetUserStats } = useSSHContract()
  const { data: userStats, isLoading } = useGetUserStats(address)

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm border border-gray-200">
        <Icon icon="mdi:chart-line" className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">连接钱包查看统计</h3>
        <p className="text-gray-600 text-center max-w-md">
          连接你的钱包以查看 SSH 配置和使用统计
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const stats = [
    {
      name: '总配置数',
      value: userStats?.totalConfigs?.toString() || '0',
      icon: 'mdi:server-network',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      name: '活跃配置',
      value: userStats?.activeConfigs?.toString() || '0',
      icon: 'mdi:server-check',
      color: 'text-green-600 bg-green-100'
    },
    {
      name: '最后活动',
      value: userStats?.lastActivity ? new Date(Number(userStats.lastActivity) * 1000).toLocaleDateString() : '无',
      icon: 'mdi:clock',
      color: 'text-purple-600 bg-purple-100'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                <Icon icon={stat.icon} className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">使用详情</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">钱包地址</span>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
              {`${address.slice(0, 8)}...${address.slice(-8)}`}
            </code>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">网络</span>
            <span className="text-sm font-medium">X Layer Testnet</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">数据存储</span>
            <span className="text-sm font-medium text-green-600">区块链 (已加密)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
