import { Icon } from '@iconify/react'
import { useUserRegistration } from '@/hooks/useUserRegistration'

export function RegistrationPrompt() {
  const { showRegistrationPrompt, handleRegister, isRegistering } = useUserRegistration()

  if (!showRegistrationPrompt) return null

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <Icon icon="mdi:account-plus" className="w-6 h-6 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">欢迎使用 Web3 SSH Manager</h3>
          <p className="text-sm text-yellow-700 mt-1">
            请先注册你的钱包地址以开始使用 SSH 配置管理服务。注册是免费的，只需要很少的 gas 费用。
          </p>
          <div className="mt-3">
            <button
              onClick={handleRegister}
              disabled={isRegistering}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              {isRegistering ? (
                <>
                  <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                  <span>注册中...</span>
                </>
              ) : (
                <>
                  <Icon icon="mdi:account-check" className="w-4 h-4" />
                  <span>注册钱包</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}