import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { useSSHContract } from '@/hooks/useSSHContract'
import { useWalletStore } from '@/stores/walletStore'

export function StatsView() {
  const { t } = useTranslation()
  const { account } = useWalletStore()
  const { useGetUserStats } = useSSHContract()
  const { data: userStats, isLoading } = useGetUserStats(account)

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-[#0f0f0f] rounded-lg border border-[#1a1a1a]">
        <Icon icon="lucide:bar-chart-3" className="w-16 h-16 text-[#888888] mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">{t('views:stats.title')}</h3>
        <p className="text-[#888888] text-center max-w-md">
          {t('views:stats.description')}
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Icon icon="lucide:loader-2" className="w-8 h-8 animate-spin text-[#BCFF2F]" />
      </div>
    )
  }

  const stats = [
    {
      name: '总配置数',
      value: userStats?.totalConfigs?.toString() || '0',
      icon: 'lucide:server',
      change: '+2',
      changeType: 'increase'
    },
    {
      name: '活跃配置',
      value: userStats?.activeConfigs?.toString() || '0',
      icon: 'lucide:check-circle',
      change: '+1',
      changeType: 'increase'
    },
    {
      name: '最后活动',
      value: userStats?.lastActivity ? new Date(Number(userStats.lastActivity) * 1000).toLocaleDateString() : '今天',
      icon: 'lucide:clock',
      change: '最近',
      changeType: 'neutral'
    },
    {
      name: '总连接次数',
      value: '127',
      icon: 'lucide:activity',
      change: '+15',
      changeType: 'increase'
    }
  ]

  return (
    <div className="space-y-6">
      {/* 标题区域 */}
      <div className="flex items-center space-x-3">
        <Icon icon="lucide:bar-chart-3" className="w-6 h-6 text-[#BCFF2F]" />
        <h1 className="text-2xl font-semibold text-white">{t('views:stats.title')}</h1>
      </div>

      {/* 统计卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6 hover:border-[#333333] transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-[#888888] mb-2">{stat.name}</p>
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <div className={`flex items-center text-xs ${
                  stat.changeType === 'increase' ? 'text-[#BCFF2F]' : 
                  stat.changeType === 'decrease' ? 'text-red-400' : 'text-[#888888]'
                }`}>
                  {stat.changeType === 'increase' && <Icon icon="lucide:trending-up" className="w-3 h-3 mr-1" />}
                  {stat.changeType === 'decrease' && <Icon icon="lucide:trending-down" className="w-3 h-3 mr-1" />}
                  {stat.change}
                </div>
              </div>
              <div className="w-12 h-12 bg-[#272727] rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon icon={stat.icon} className="w-6 h-6 text-[#BCFF2F]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 详细信息卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 使用详情 */}
        <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Icon icon="lucide:info" className="w-5 h-5 text-[#BCFF2F]" />
            <h2 className="text-lg font-semibold text-white">账户信息</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-[#333333]">
              <span className="text-[#888888]">钱包地址</span>
              <code className="text-sm bg-[#272727] px-3 py-1 rounded text-[#CCCCCC] font-mono">
                {`${address.slice(0, 8)}...${address.slice(-8)}`}
              </code>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#333333]">
              <span className="text-[#888888]">网络</span>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-[#BCFF2F] rounded-full mr-2"></div>
                <span className="text-sm font-medium text-white">X Layer Testnet</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#333333]">
              <span className="text-[#888888]">数据存储</span>
              <span className="text-sm font-medium text-[#BCFF2F] flex items-center">
                <Icon icon="lucide:shield-check" className="w-4 h-4 mr-1" />
                区块链 (已加密)
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-[#888888]">注册时间</span>
              <span className="text-sm font-medium text-white">2024-08-15</span>
            </div>
          </div>
        </div>

        {/* 活动记录 */}
        <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Icon icon="lucide:history" className="w-5 h-5 text-[#BCFF2F]" />
            <h2 className="text-lg font-semibold text-white">最近活动</h2>
          </div>
          <div className="space-y-4">
            {[
              { action: '创建 SSH 配置', target: 'prod-server-01', time: '2 小时前', icon: 'lucide:plus' },
              { action: '建立连接', target: 'dev-server-03', time: '4 小时前', icon: 'lucide:link' },
              { action: '修改配置', target: 'staging-db', time: '昨天', icon: 'lucide:edit' },
              { action: '删除配置', target: 'old-server-02', time: '2 天前', icon: 'lucide:trash-2' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 py-3 border-b border-[#333333] last:border-b-0">
                <div className="w-8 h-8 bg-[#272727] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon icon={activity.icon} className="w-4 h-4 text-[#CCCCCC]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{activity.action}</p>
                  <p className="text-xs text-[#888888] truncate">{activity.target}</p>
                </div>
                <div className="text-xs text-[#888888]">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 性能指标 */}
      <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Icon icon="lucide:trending-up" className="w-5 h-5 text-[#BCFF2F]" />
          <h2 className="text-lg font-semibold text-white">性能指标</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">99.9%</div>
            <div className="text-sm text-[#888888]">连接成功率</div>
            <div className="w-full bg-[#272727] rounded-full h-2 mt-2">
              <div className="bg-[#BCFF2F] h-2 rounded-full" style={{ width: '99.9%' }}></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">1.2s</div>
            <div className="text-sm text-[#888888]">平均连接时间</div>
            <div className="w-full bg-[#272727] rounded-full h-2 mt-2">
              <div className="bg-[#BCFF2F] h-2 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">24.5h</div>
            <div className="text-sm text-[#888888]">本月总使用时长</div>
            <div className="w-full bg-[#272727] rounded-full h-2 mt-2">
              <div className="bg-[#BCFF2F] h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
