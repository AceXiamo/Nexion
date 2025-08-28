import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Icon } from '@iconify/react'
import { RegistrationPrompt } from '@/components/wallet/RegistrationPrompt'
import { useUserRegistration } from '@/hooks/useUserRegistration'
import { useSSHConfigs } from '@/hooks/useSSHConfigs'
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
    refreshConfigs,
    isAdding,
    isUpdating,
    isDeleting,
  } = useSSHConfigs()
  
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

  
  // 关闭模态框
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingConfig(undefined)
  }
  
  // 检查是否有操作正在进行
  const isSubmitting = isAdding || isUpdating || isDeleting

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-160 rounded-xl shadow-lg">
        <div className="w-20 h-20 bg-[#BCFF2F]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#BCFF2F]/20">
          <Icon icon="lucide:wallet" className="w-10 h-10 text-[#BCFF2F]" />
        </div>
        <h3 className="text-2xl font-semibold text-white mb-4">连接钱包</h3>
        <p className="text-[#CCCCCC] text-center max-w-lg leading-relaxed text-base mb-6">
          连接你的 Web3 钱包开始使用安全的 SSH 连接管理器。<br />
          所有配置信息将通过区块链加密存储，确保数据安全与隐私保护。
        </p>
        <div className="mt-4 flex items-center space-x-6 text-sm text-[#888888]">
          <div className="flex items-center space-x-2">
            <Icon icon="lucide:shield-check" className="w-4 h-4 text-[#BCFF2F]" />
            <span>去中心化存储</span>
          </div>
          <div className="w-1 h-1 bg-[#555555] rounded-full"></div>
          <div className="flex items-center space-x-2">
            <Icon icon="lucide:lock" className="w-4 h-4 text-[#BCFF2F]" />
            <span>端到端加密</span>
          </div>
          <div className="w-1 h-1 bg-[#555555] rounded-full"></div>
          <div className="flex items-center space-x-2">
            <Icon icon="lucide:server" className="w-4 h-4 text-[#BCFF2F]" />
            <span>SSH 安全连接</span>
          </div>
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
            onRefresh={refreshConfigs}
            isRefreshing={isLoadingConfigs}
          />
        ) : (
          <div className="border border-[#1a1a1a] bg-[#0f0f0f] rounded-xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
              <Icon icon="lucide:user-plus" className="w-8 h-8 text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">完成身份验证</h3>
            <p className="text-[#CCCCCC] mb-6 max-w-lg mx-auto leading-relaxed">
              为确保安全性，需要通过数字签名验证你的钱包身份。<br />
              验证完成后即可开始创建和管理 SSH 连接配置。
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-[#888888]">
              <Icon icon="lucide:info" className="w-4 h-4 text-[#BCFF2F]" />
              <span>点击上方的"验证身份"按钮完成设置</span>
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
