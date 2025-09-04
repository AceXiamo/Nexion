import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { SSHConfigCard } from './SSHConfigCard'
import type { DecryptedSSHConfig } from '@/types/ssh'

interface SSHConfigListProps {
  configs: DecryptedSSHConfig[]
  isLoading?: boolean
  onAdd: () => void
  onEdit: (config: DecryptedSSHConfig) => void
  onDelete: (configId: string) => void
  onRefresh: () => Promise<void>
  isRefreshing?: boolean
}

export function SSHConfigList({ configs, isLoading = false, onAdd, onEdit, onDelete, onRefresh, isRefreshing = false }: SSHConfigListProps) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')

  // Filter configurations
  const filteredConfigs = useMemo(() => {
    return configs.filter((config) => {
      const searchLower = searchTerm.toLowerCase()
      return config.name.toLowerCase().includes(searchLower) || config.host.toLowerCase().includes(searchLower) || config.username.toLowerCase().includes(searchLower)
    })
  }, [configs, searchTerm])

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Simplified toolbar skeleton */}
        <div className="flex items-center justify-between">
          <div className="w-64 h-10 bg-neutral-800 rounded-lg animate-pulse" />
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-neutral-800 rounded-lg animate-pulse" />
            <div className="w-28 h-10 bg-neutral-800 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* OKX style skeleton layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-[#333333] rounded animate-pulse mb-2" />
                  <div className="h-3 bg-[#1a1a1a] rounded w-2/3 animate-pulse" />
                </div>
                <div className="flex items-center space-x-2 ml-3">
                  <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333333] rounded-md animate-pulse" />
                  <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333333] rounded-md animate-pulse" />
                  <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333333] rounded-md animate-pulse" />
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
        <h3 className="text-xl font-semibold text-white mb-3">{t('ssh:noConfigs')}</h3>
        <p className="text-neutral-400 mb-6 max-w-md mx-auto leading-relaxed">{t('ssh:noConfigsDesc')}</p>
        <button onClick={onAdd} className="btn-primary">
          <Icon icon="mdi:plus" className="w-4 h-4" />
          <span>{t('ssh:addFirstConfig')}</span>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Simplified toolbar - only search and add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Search box */}
          <div className="relative max-w-md flex-1">
            <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('ssh:searchPlaceholder')} className="input !px-10" />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 btn-icon">
                <Icon icon="mdi:close" className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Statistics information */}
          <div className="text-sm text-neutral-400">
            {t('common:total')} <span className="text-white font-medium">{filteredConfigs.length}</span> {t('ssh:configsCount')}
            {searchTerm && (
              <span className="ml-2">
                • {t('ssh:filteredFrom')} <span className="text-white font-medium">{configs.length}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing || isLoading}
            className="btn-icon hover:bg-lime-400/10 hover:text-lime-400 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('ssh:reloadConfigs')}
          >
            <Icon 
              icon="mdi:refresh" 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </button>

          {/* Add button */}
          <button onClick={onAdd} className="btn-primary">
            <Icon icon="mdi:plus" className="w-4 h-4" />
            <span>{t('ssh:addConfig')}</span>
          </button>
        </div>
      </div>

      {/* OKX style responsive grid layout - 24px spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredConfigs.map((config) => (
          <SSHConfigCard 
            key={config.id} 
            config={config} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))}
      </div>

      {/* No search results */}
      {searchTerm && filteredConfigs.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:magnify" className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{t('ssh:noSearchResults')}</h3>
          <p className="text-neutral-400 mb-4">
            {t('ssh:noSearchResultsDesc')} "<span className="text-white font-medium">{searchTerm}</span>" {t('ssh:matchingConfigs')}
          </p>
          <button onClick={() => setSearchTerm('')} className="btn-secondary">
            {t('ssh:clearSearch')}
          </button>
        </div>
      )}
    </div>
  )
}
