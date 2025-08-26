import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Icon } from '@iconify/react'
import { RegistrationPrompt } from '@/components/wallet/RegistrationPrompt'
import { useUserRegistration } from '@/hooks/useUserRegistration'
import { useSSHConfigs } from '@/hooks/useSSHConfigs'
import { useSSHConnection } from '@/hooks/useSSHConnection'
import { SSHConfigList } from '@/components/ssh/SSHConfigList'
import { SSHConfigModal } from '@/components/ssh/SSHConfigModal'
import type { SSHConfigInput, DecryptedSSHConfig } from '@/types/ssh'

export function ConnectionsView() {
  const { isConnected } = useAccount()
  const { isRegistered } = useUserRegistration()
  
  // SSH 配置管理
  const {
    configs,
    isLoading: isLoadingConfigs,
    addConfig,
    updateConfig,
    deleteConfig,
    isAdding,
    isUpdating,
    isDeleting,
  } = useSSHConfigs()
  
  // SSH 连接管理
  const {
    connectionStates,
    testConnection,
    connect,
    disconnect,
  } = useSSHConnection()
  
  // 模态框状态
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<DecryptedSSHConfig | undefined>()
  
  // 处理添加配置
  const handleAddConfig = () => {
    setEditingConfig(undefined)
    setIsModalOpen(true)
  }
  
  // 处理编辑配置
  const handleEditConfig = (config: DecryptedSSHConfig) => {
    setEditingConfig(config)
    setIsModalOpen(true)
  }
  
  // 处理表单提交
  const handleSubmitConfig = async (configData: SSHConfigInput) => {
    if (editingConfig) {
      await updateConfig(editingConfig.id, configData)
    } else {
      await addConfig(configData)
    }
  }
  
  // 处理删除配置
  const handleDeleteConfig = async (configId: string) => {
    await deleteConfig(configId)
  }
  
  // 处理连接/断开
  const handleConnect = async (config: DecryptedSSHConfig) => {
    const currentState = connectionStates[config.id]
    if (currentState?.status === 'connected') {
      await disconnect(config.id)
    } else {
      await connect(config)
    }
  }
  
  // 处理连接测试
  const handleTestConnection = async (config: DecryptedSSHConfig) => {
    await testConnection(config)
  }
  
  // 关闭模态框
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingConfig(undefined)
  }
  
  // 检查是否有操作正在进行
  const isSubmitting = isAdding || isUpdating || isDeleting

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
    <>
      <div className="space-y-8">
        {/* Registration Prompt */}
        <RegistrationPrompt />

        {/* SSH 配置管理区域 */}
        {isRegistered ? (
          <SSHConfigList
            configs={configs}
            isLoading={isLoadingConfigs}
            onAdd={handleAddConfig}
            onEdit={handleEditConfig}
            onDelete={handleDeleteConfig}
            onConnect={handleConnect}
            onTest={handleTestConnection}
            connectionStates={connectionStates}
          />
        ) : (
          <div className="border border-neutral-800 rounded-xl shadow-lg p-12 text-center">
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

      {/* SSH 配置模态框 */}
      <SSHConfigModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        config={editingConfig}
        onSubmit={handleSubmitConfig}
        isSubmitting={isSubmitting}
      />
    </>
  )
}