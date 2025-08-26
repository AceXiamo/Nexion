import { useState, useMemo } from 'react'
import { Icon } from '@iconify/react'
import { SSHConfigCard } from './SSHConfigCard'
import type { DecryptedSSHConfig } from '@/types/ssh'

interface SSHConfigListProps {
  configs: DecryptedSSHConfig[]
  isLoading?: boolean
  onAdd: () => void
  onEdit: (config: DecryptedSSHConfig) => void
  onDelete: (configId: string) => void
  onConnect: (config: DecryptedSSHConfig) => void
  onTest: (config: DecryptedSSHConfig) => void
  connectionStates?: Record<string, {
    status: 'connected' | 'disconnected' | 'connecting' | 'error'
    isConnecting: boolean
    isTesting: boolean
  }>
}

type SortOption = 'name' | 'host' | 'created' | 'updated'
type SortDirection = 'asc' | 'desc'

export function SSHConfigList({
  configs,
  isLoading = false,
  onAdd,
  onEdit,
  onDelete,
  onConnect,
  onTest,
  connectionStates = {},
}: SSHConfigListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // 过滤和排序配置
  const filteredAndSortedConfigs = useMemo(() => {
    let filtered = configs.filter(config => {
      const searchLower = searchTerm.toLowerCase()
      return (
        config.name.toLowerCase().includes(searchLower) ||
        config.host.toLowerCase().includes(searchLower) ||
        config.username.toLowerCase().includes(searchLower)
      )
    })

    // 排序
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'host':
          aValue = a.host.toLowerCase()
          bValue = b.host.toLowerCase()
          break
        case 'created':
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
          break
        case 'updated':
          aValue = a.updatedAt.getTime()
          bValue = b.updatedAt.getTime()
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [configs, searchTerm, sortBy, sortDirection])

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(option)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return 'mdi:sort'
    return sortDirection === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* 工具栏骨架 */}
        <div className="flex items-center justify-between">
          <div className="w-64 h-10 bg-neutral-800 rounded-lg animate-pulse" />
          <div className="flex items-center space-x-3">
            <div className="w-24 h-10 bg-neutral-800 rounded-lg animate-pulse" />
            <div className="w-20 h-10 bg-neutral-800 rounded-lg animate-pulse" />
          </div>
        </div>
        
        {/* 配置卡片骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-neutral-800 rounded-xl p-6">
              <div className="space-y-4">
                <div className="h-6 bg-neutral-800 rounded animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-neutral-800 rounded animate-pulse" />
                  <div className="h-4 bg-neutral-800 rounded w-3/4 animate-pulse" />
                </div>
                <div className="flex space-x-2">
                  <div className="w-8 h-8 bg-neutral-800 rounded animate-pulse" />
                  <div className="w-8 h-8 bg-neutral-800 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (configs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Icon icon="mdi:server-plus" className="w-10 h-10 text-neutral-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">暂无 SSH 配置</h3>
        <p className="text-neutral-400 mb-6 max-w-md mx-auto leading-relaxed">
          您还没有添加任何 SSH 连接配置。添加您的第一个配置来开始安全地管理服务器连接。
        </p>
        <button onClick={onAdd} className="btn-primary">
          <Icon icon="mdi:plus" className="w-4 h-4" />
          <span>添加首个配置</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* 搜索框 */}
          <div className="relative max-w-md flex-1">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索配置名称、主机或用户名..."
              className="input pl-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 btn-icon"
              >
                <Icon icon="mdi:close" className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 统计信息 */}
          <div className="text-sm text-neutral-400">
            共 <span className="text-white font-medium">{filteredAndSortedConfigs.length}</span> 个配置
            {searchTerm && (
              <span className="ml-2">
                • 筛选自 <span className="text-white font-medium">{configs.length}</span> 个
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* 排序选项 */}
          <div className="flex items-center space-x-2 bg-neutral-900 rounded-lg p-1">
            <button
              onClick={() => handleSort('name')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sortBy === 'name' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Icon icon={getSortIcon('name')} className="w-4 h-4 mr-1 inline" />
              名称
            </button>
            <button
              onClick={() => handleSort('host')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sortBy === 'host' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Icon icon={getSortIcon('host')} className="w-4 h-4 mr-1 inline" />
              主机
            </button>
            <button
              onClick={() => handleSort('created')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                sortBy === 'created' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Icon icon={getSortIcon('created')} className="w-4 h-4 mr-1 inline" />
              创建时间
            </button>
          </div>

          {/* 视图模式 */}
          <div className="flex items-center space-x-1 bg-neutral-900 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="网格视图"
            >
              <Icon icon="mdi:view-grid" className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="列表视图"
            >
              <Icon icon="mdi:view-list" className="w-4 h-4" />
            </button>
          </div>

          {/* 添加按钮 */}
          <button onClick={onAdd} className="btn-primary">
            <Icon icon="mdi:plus" className="w-4 h-4" />
            <span>添加配置</span>
          </button>
        </div>
      </div>

      {/* 配置列表 */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
      }>
        {filteredAndSortedConfigs.map((config) => {
          const connectionState = connectionStates[config.id] || {
            status: 'disconnected' as const,
            isConnecting: false,
            isTesting: false,
          }

          return (
            <SSHConfigCard
              key={config.id}
              config={config}
              onEdit={onEdit}
              onDelete={onDelete}
              onConnect={onConnect}
              onTest={onTest}
              connectionStatus={connectionState.status}
              isConnecting={connectionState.isConnecting}
              isTesting={connectionState.isTesting}
            />
          )
        })}
      </div>

      {/* 搜索无结果 */}
      {searchTerm && filteredAndSortedConfigs.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:magnify" className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">未找到匹配的配置</h3>
          <p className="text-neutral-400 mb-4">
            没有找到与 "<span className="text-white font-medium">{searchTerm}</span>" 匹配的配置
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="btn-secondary"
          >
            清除搜索
          </button>
        </div>
      )}
    </div>
  )
}