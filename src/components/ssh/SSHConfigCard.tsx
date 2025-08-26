import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@iconify/react'
import { format } from 'date-fns'
import type { DecryptedSSHConfig } from '@/types/ssh'

interface SSHConfigCardProps {
  config: DecryptedSSHConfig
  onEdit: (config: DecryptedSSHConfig) => void
  onDelete: (configId: string) => void
  onTest: (config: DecryptedSSHConfig) => void
  isTesting?: boolean
}

export function SSHConfigCard({
  config,
  onEdit,
  onDelete,
  onTest,
  isTesting = false,
}: SSHConfigCardProps) {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)


  const getAuthTypeDisplay = () => {
    return config.authType === 'password' ? '密码认证' : '密钥认证'
  }

  const getAuthTypeIcon = () => {
    return config.authType === 'password' ? 'mdi:lock' : 'mdi:key-variant'
  }

  const handleConnect = () => {
    navigate(`/terminal/${config.id}`)
  }

  return (
    <div className="border border-neutral-800 rounded-xl bg-neutral-900/50 hover:bg-neutral-900 transition-all duration-200 group">
      {/* 卡片头部 */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          {/* 配置信息 */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-white group-hover:text-lime-400 transition-colors">
                {config.name}
              </h3>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-neutral-400">
              <span className="flex items-center space-x-1">
                <Icon icon="mdi:account" className="w-4 h-4" />
                <span>{config.username}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Icon icon="mdi:server" className="w-4 h-4" />
                <span>{config.host}:{config.port}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Icon icon={getAuthTypeIcon()} className="w-4 h-4" />
                <span>{getAuthTypeDisplay()}</span>
              </span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center space-x-2">
            {/* 连接按钮 */}
            <button
              onClick={handleConnect}
              className="btn-icon text-neutral-400 hover:text-lime-400"
              title="打开终端"
            >
              <Icon icon="mdi:terminal" className="w-5 h-5" />
            </button>

            {/* 更多操作 */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="btn-icon"
              >
                <Icon icon="mdi:dots-vertical" className="w-5 h-5" />
              </button>

              {showDropdown && (
                <>
                  {/* 遮罩层 */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowDropdown(false)}
                  />
                  
                  {/* 下拉菜单 */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl z-20">
                    <div className="py-2">
                      <button
                        onClick={() => {
                          onTest(config)
                          setShowDropdown(false)
                        }}
                        disabled={isTesting}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800 flex items-center space-x-3 transition-colors"
                      >
                        <Icon 
                          icon={isTesting ? "mdi:loading" : "mdi:test-tube"} 
                          className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} 
                        />
                        <span>{isTesting ? '测试中...' : '测试连接'}</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          onEdit(config)
                          setShowDropdown(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800 flex items-center space-x-3 transition-colors"
                      >
                        <Icon icon="mdi:pencil" className="w-4 h-4" />
                        <span>编辑配置</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(true)
                          setShowDropdown(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center space-x-3 transition-colors"
                      >
                        <Icon icon="mdi:delete" className="w-4 h-4" />
                        <span>删除配置</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 卡片底部 */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span className="flex items-center space-x-1">
            <Icon icon="mdi:calendar" className="w-3 h-3" />
            <span>创建于 {format(config.createdAt, 'yyyy-MM-dd HH:mm')}</span>
          </span>
          
          {config.updatedAt > config.createdAt && (
            <span className="flex items-center space-x-1">
              <Icon icon="mdi:pencil" className="w-3 h-3" />
              <span>更新于 {format(config.updatedAt, 'yyyy-MM-dd HH:mm')}</span>
            </span>
          )}
        </div>
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <>
          {/* 遮罩层 */}
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md mx-4">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon icon="mdi:alert-circle" className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">确认删除配置</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  您确定要删除配置 <span className="text-white font-medium">"{config.name}"</span> 吗？
                  <br />
                  此操作无法撤销，配置将从区块链上永久移除。
                </p>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    onDelete(config.id)
                    setShowDeleteConfirm(false)
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Icon icon="mdi:delete" className="w-4 h-4" />
                  <span>确认删除</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}