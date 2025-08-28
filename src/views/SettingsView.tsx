import { Icon } from '@iconify/react'

export function SettingsView() {
  return (
    <div className="space-y-6">
      {/* 基本设置 */}
      <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Icon icon="lucide:settings" className="w-6 h-6 text-[#BCFF2F]" />
          <h2 className="text-xl font-semibold text-white">应用设置</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-[#333333]">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#272727] rounded-lg flex items-center justify-center">
                <Icon icon="lucide:palette" className="w-5 h-5 text-[#CCCCCC]" />
              </div>
              <div>
                <h3 className="font-medium text-white">外观主题</h3>
                <p className="text-sm text-[#888888]">选择应用的外观主题</p>
              </div>
            </div>
            <select className="bg-[#000000] border border-[#333333] rounded-lg px-4 py-2 text-white text-sm focus:border-[#BCFF2F] focus:outline-none">
              <option value="dark">暗色主题</option>
              <option value="light">亮色主题</option>
              <option value="auto">跟随系统</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-[#333333]">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#272727] rounded-lg flex items-center justify-center">
                <Icon icon="lucide:refresh-cw" className="w-5 h-5 text-[#CCCCCC]" />
              </div>
              <div>
                <h3 className="font-medium text-white">自动同步</h3>
                <p className="text-sm text-[#888888]">自动同步区块链配置数据</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-12 h-6 bg-[#333333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#BCFF2F]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-[#333333]">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#272727] rounded-lg flex items-center justify-center">
                <Icon icon="lucide:bell" className="w-5 h-5 text-[#CCCCCC]" />
              </div>
              <div>
                <h3 className="font-medium text-white">桌面通知</h3>
                <p className="text-sm text-[#888888]">显示连接状态和系统通知</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-12 h-6 bg-[#333333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#BCFF2F]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#272727] rounded-lg flex items-center justify-center">
                <Icon icon="lucide:shield-check" className="w-5 h-5 text-[#CCCCCC]" />
              </div>
              <div>
                <h3 className="font-medium text-white">启动时验证</h3>
                <p className="text-sm text-[#888888]">应用启动时要求钱包签名验证</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-12 h-6 bg-[#333333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#BCFF2F]"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 网络设置 */}
      <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Icon icon="lucide:globe" className="w-6 h-6 text-[#BCFF2F]" />
          <h2 className="text-xl font-semibold text-white">网络设置</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-[#333333]">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#272727] rounded-lg flex items-center justify-center">
                <Icon icon="lucide:link" className="w-5 h-5 text-[#CCCCCC]" />
              </div>
              <div>
                <h3 className="font-medium text-white">RPC 端点</h3>
                <p className="text-sm text-[#888888]">X Layer 网络连接端点</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white">https://xlayerrpc.okx.com</div>
              <div className="text-xs text-[#BCFF2F] flex items-center mt-1">
                <div className="w-2 h-2 bg-[#BCFF2F] rounded-full mr-2"></div>
                已连接
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-[#333333]">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#272727] rounded-lg flex items-center justify-center">
                <Icon icon="lucide:zap" className="w-5 h-5 text-[#CCCCCC]" />
              </div>
              <div>
                <h3 className="font-medium text-white">Gas 优化</h3>
                <p className="text-sm text-[#888888]">自动优化交易 Gas 费用</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-12 h-6 bg-[#333333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#BCFF2F]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#272727] rounded-lg flex items-center justify-center">
                <Icon icon="lucide:clock" className="w-5 h-5 text-[#CCCCCC]" />
              </div>
              <div>
                <h3 className="font-medium text-white">请求超时</h3>
                <p className="text-sm text-[#888888]">网络请求超时时间 (秒)</p>
              </div>
            </div>
            <select className="bg-[#000000] border border-[#333333] rounded-lg px-4 py-2 text-white text-sm focus:border-[#BCFF2F] focus:outline-none">
              <option value="30">30 秒</option>
              <option value="60">60 秒</option>
              <option value="120">120 秒</option>
            </select>
          </div>
        </div>
      </div>

      {/* 安全设置 */}
      <div className="bg-[#0f0f0f] rounded-lg border border-[#1a1a1a] p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Icon icon="lucide:lock" className="w-6 h-6 text-[#BCFF2F]" />
          <h2 className="text-xl font-semibold text-white">安全设置</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-4 border-b border-[#333333]">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#272727] rounded-lg flex items-center justify-center">
                <Icon icon="lucide:key" className="w-5 h-5 text-[#CCCCCC]" />
              </div>
              <div>
                <h3 className="font-medium text-white">本地加密</h3>
                <p className="text-sm text-[#888888]">使用额外密码加密本地数据</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-[#272727] text-[#CCCCCC] rounded-lg border border-[#333333] hover:border-[#BCFF2F] hover:text-[#BCFF2F] transition-all duration-200">
              配置
            </button>
          </div>

          <div className="flex items-center justify-between py-4 border-b border-[#333333]">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#272727] rounded-lg flex items-center justify-center">
                <Icon icon="lucide:history" className="w-5 h-5 text-[#CCCCCC]" />
              </div>
              <div>
                <h3 className="font-medium text-white">操作日志</h3>
                <p className="text-sm text-[#888888]">记录所有操作日志便于审计</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-12 h-6 bg-[#333333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#BCFF2F]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-[#272727] rounded-lg flex items-center justify-center">
                <Icon icon="lucide:trash-2" className="w-5 h-5 text-[#CCCCCC]" />
              </div>
              <div>
                <h3 className="font-medium text-white">清除数据</h3>
                <p className="text-sm text-[#888888]">清除所有本地缓存和配置</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg border border-red-600/30 hover:bg-red-600/30 hover:border-red-600/50 transition-all duration-200">
              清除
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
