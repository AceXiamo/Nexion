import { Icon } from '@iconify/react'
import { useUserRegistration } from '@/hooks/useUserRegistration'

export function RegistrationPrompt() {
  const { showRegistrationPrompt, handleRegister, isRegistering } = useUserRegistration()

  if (!showRegistrationPrompt) return null

  return (
    <div className="bg-lime-400/5 border border-lime-400/20 rounded-xl p-6 mb-8">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-lime-400/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon icon="mdi:account-plus" className="w-6 h-6 text-lime-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-2">欢迎使用 Web3 SSH Manager</h3>
          <p className="text-sm text-neutral-300 leading-relaxed mb-4">
            请先注册你的钱包地址以开始使用 SSH 配置管理服务。<br />
            注册过程完全免费，仅需支付极少的网络手续费（约 0.0006 OKB）。
          </p>
          
          {/* 功能亮点 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:shield-check" className="w-4 h-4 text-lime-400" />
              <span className="text-xs text-neutral-400">端到端加密</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:database-lock" className="w-4 h-4 text-lime-400" />
              <span className="text-xs text-neutral-400">去中心化存储</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:history" className="w-4 h-4 text-lime-400" />
              <span className="text-xs text-neutral-400">操作可追溯</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:account-group" className="w-4 h-4 text-lime-400" />
              <span className="text-xs text-neutral-400">团队协作</span>
            </div>
          </div>
          
          <button
            onClick={handleRegister}
            disabled={isRegistering}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegistering ? (
              <>
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                <span>正在注册...</span>
              </>
            ) : (
              <>
                <Icon icon="mdi:rocket-launch" className="w-4 h-4" />
                <span>立即注册钱包</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}