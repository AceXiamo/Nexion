import { Icon } from '@iconify/react'

export function SettingsView() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">应用设置</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Icon icon="mdi:theme-light-dark" className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="font-medium text-gray-900">主题设置</h3>
                <p className="text-sm text-gray-600">选择亮色或暗色主题</p>
              </div>
            </div>
            <select className="border border-gray-300 rounded-md px-3 py-1 text-sm">
              <option>系统</option>
              <option>亮色</option>
              <option>暗色</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Icon icon="mdi:auto-download" className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="font-medium text-gray-900">自动同步</h3>
                <p className="text-sm text-gray-600">自动同步区块链数据</p>
              </div>
            </div>
            <input type="checkbox" className="rounded" defaultChecked />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <Icon icon="mdi:notification" className="w-5 h-5 text-gray-400" />
              <div>
                <h3 className="font-medium text-gray-900">桌面通知</h3>
                <p className="text-sm text-gray-600">显示连接状态通知</p>
              </div>
            </div>
            <input type="checkbox" className="rounded" defaultChecked />
          </div>
        </div>
      </div>
    </div>
  )
}
