import React, { useState } from 'react'
import { SSHTabBar } from './SSHTabBar'
import { SSHTerminal } from './SSHTerminal'
import { SSHConfigForm } from './SSHConfigForm'
import { useSSHSessions } from '@/hooks/useSSHSessions'
import { useSSHConfigs } from '@/hooks/useSSHConfigs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Terminal, Plus } from 'lucide-react'

export function SSHTabContainer() {
  const {
    sessions,
    activeSessionId,
    loading,
    createSession,
    closeSession,
    switchSession,
    resizeTerminal,
  } = useSSHSessions()
  
  const { configs, loading: configsLoading } = useSSHConfigs()
  
  const [showConfigForm, setShowConfigForm] = useState(false)
  const [showConnectionDialog, setShowConnectionDialog] = useState(false)
  const [editingConfig, setEditingConfig] = useState<any>(undefined)
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)

  // 创建新会话 - 显示配置选择对话框
  const handleCreateSession = () => {
    if (configs.length === 0) {
      // 如果没有配置，直接打开配置表单
      setEditingConfig(undefined)
      setShowConfigForm(true)
    } else {
      // 如果有配置，显示选择对话框
      setShowConnectionDialog(true)
    }
  }

  // 使用现有配置创建会话
  const handleUseExistingConfig = async (configId: string) => {
    const config = configs.find(c => c.id === configId)
    if (!config) return

    setShowConnectionDialog(false)
    
    try {
      const success = await createSession(config)
      if (!success) {
        console.error('Failed to create session with config:', config.name)
      }
    } catch (error) {
      console.error('Error creating session:', error)
    }
  }

  // 配置表单提交成功后自动创建会话
  const handleConfigSubmit = async (config: any) => {
    setIsSubmittingForm(false)
    setShowConfigForm(false)
    
    try {
      // 等待配置保存完成后再创建会话
      setTimeout(async () => {
        const success = await createSession(config)
        if (!success) {
          console.error('Failed to create session after config creation')
        }
      }, 100)
    } catch (error) {
      console.error('Error creating session after config:', error)
    }
  }

  // 外部提交按钮处理
  const handleExternalSubmit = () => {
    // 触发表单提交
    const formElement = document.getElementById('ssh-config-form') as HTMLFormElement
    if (formElement) {
      formElement.requestSubmit()
    }
  }

  // 表单提交开始
  const handleSubmitStart = () => {
    setIsSubmittingForm(true)
  }

  // 表单提交出错
  const handleSubmitError = (error: any) => {
    setIsSubmittingForm(false)
    console.error('Form submission error:', error)
  }

  // 关闭配置表单
  const handleCloseConfigForm = () => {
    setShowConfigForm(false)
    setEditingConfig(undefined)
    setIsSubmittingForm(false)
  }

  return (
    <div className="flex flex-col h-full bg-black">
      {/* SSH Tab Bar */}
      <SSHTabBar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onCreateSession={handleCreateSession}
        onSwitchSession={switchSession}
        onCloseSession={closeSession}
      />

      {/* Terminal 区域 */}
      <div className="flex-1 relative">
        {sessions.length === 0 ? (
          // 空状态
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Terminal className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              没有活跃的 SSH 连接
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              创建你的第一个 SSH 连接，开始远程服务器管理之旅。
            </p>
            <Button
              onClick={handleCreateSession}
              disabled={loading}
              className="bg-lime-400 hover:bg-lime-500 text-black font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              创建 SSH 连接
            </Button>
          </div>
        ) : (
          // 渲染终端
          sessions.map((session) => (
            <SSHTerminal
              key={session.id}
              sessionId={session.id}
              isVisible={session.id === activeSessionId}
              onResize={resizeTerminal}
            />
          ))
        )}
      </div>

      {/* 连接选择对话框 */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent className="sm:max-w-md bg-neutral-900 border-neutral-700">
          <DialogHeader>
            <DialogTitle className="text-white">选择 SSH 配置</DialogTitle>
            <DialogDescription className="text-gray-400">
              从已保存的配置中选择一个来创建新的连接
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            {configsLoading ? (
              <div className="text-center py-2 text-gray-400">
                加载配置中...
              </div>
            ) : configs.length > 0 ? (
              <div className="space-y-2">
                {configs.map((config) => (
                  <button
                    key={config.id}
                    onClick={() => handleUseExistingConfig(config.id)}
                    className="w-full text-left p-2 bg-neutral-800 hover:bg-neutral-700 
                               rounded-lg border border-neutral-700 hover:border-neutral-600
                               transition-all duration-150"
                  >
                    <div className="font-medium text-white">{config.name}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {config.username}@{config.host}:{config.port}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-gray-400">
                还没有保存的配置
              </div>
            )}
            
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConnectionDialog(false)
                  setEditingConfig(undefined)
                  setShowConfigForm(true)
                }}
                className="flex-1 border-neutral-600 text-white hover:bg-neutral-800"
              >
                新建配置
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowConnectionDialog(false)}
                className="text-gray-400 hover:text-white hover:bg-neutral-800"
              >
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SSH 配置表单弹窗 - 固定底部按钮，内容可滚动 */}
      <Dialog open={showConfigForm} onOpenChange={setShowConfigForm}>
        <DialogContent className="w-full max-w-lg bg-neutral-900 border-neutral-700 max-h-[85vh] p-0 flex flex-col">
          {/* 固定的标题区域 */}
          <div className="p-4 pb-2 flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="text-white text-lg">
                {editingConfig ? '编辑 SSH 配置' : '新建 SSH 配置'}
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                {editingConfig 
                  ? '修改现有的 SSH 连接配置信息' 
                  : '创建新的 SSH 连接配置，所有信息将被安全加密存储'
                }
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* 可滚动的表单内容区域 */}
          <div className="px-4 flex-1 overflow-y-auto">
            <SSHConfigForm
              config={editingConfig}
              onSubmit={handleConfigSubmit}
              onCancel={handleCloseConfigForm}
              showActions={false}
            />
          </div>

          {/* 固定在底部的按钮区域 */}
          <div className="flex items-center justify-end space-x-2 p-4 pt-2 border-t border-neutral-800 flex-shrink-0">
            <button
              type="button"
              onClick={handleCloseConfigForm}
              disabled={isSubmittingForm}
              className="btn-secondary disabled:opacity-50"
            >
              <span>取消</span>
            </button>
            
            <button
              type="button"
              onClick={handleExternalSubmit}
              disabled={isSubmittingForm}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingForm ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>提交中...</span>
                </>
              ) : (
                <span>{editingConfig ? '更新配置' : '创建配置'}</span>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}