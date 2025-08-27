import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { Icon } from '@iconify/react'
import { useState, useEffect } from 'react'
import { xLayerTestnet } from '@/lib/web3-config'

export function WalletConnectButton() {
  const { address, isConnected, isConnecting } = useAccount()
  const { open } = useWeb3Modal()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  const [showDropdown, setShowDropdown] = useState(false)
  const [needsNetworkSwitch, setNeedsNetworkSwitch] = useState(false)

  useEffect(() => {
    setNeedsNetworkSwitch(isConnected && chainId !== xLayerTestnet.id)
  }, [isConnected, chainId])

  const handleConnect = () => {
    console.log('Opening WalletConnect modal...')
    open()
  }

  const handleSwitchNetwork = () => {
    switchChain({ chainId: xLayerTestnet.id })
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <div className="relative">
        <div className="flex items-center space-x-4">
          {/* Network Switch Button */}
          {needsNetworkSwitch && (
            <button
              onClick={handleSwitchNetwork}
              className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-all duration-200 flex items-center space-x-2"
            >
              <Icon icon="mdi:alert-circle" className="w-4 h-4" />
              <span>切换网络</span>
            </button>
          )}

          {/* Wallet Info */}
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-3 bg-neutral-900 hover:bg-neutral-800 rounded-lg px-4 py-3 transition-all duration-200 border border-neutral-800"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-lime-400 to-lime-500 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:wallet" className="w-4 h-4 text-black font-bold" />
            </div>
            <div className="text-left">
              <div className="font-medium text-white text-sm tracking-wide">{formatAddress(address)}</div>
              <div className="text-xs text-neutral-400">
                {needsNetworkSwitch ? '网络错误' : 'WalletConnect'}
              </div>
            </div>
            <Icon 
              icon={showDropdown ? 'mdi:chevron-up' : 'mdi:chevron-down'} 
              className="w-4 h-4 text-neutral-400"
            />
          </button>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute right-0 top-full mt-3 w-80 bg-neutral-900 rounded-xl shadow-2xl border border-neutral-800 pt-3 z-50 overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-800">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-lime-500 rounded-xl flex items-center justify-center">
                  <Icon icon="mdi:wallet" className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">已连接钱包</div>
                  <div className="text-xs text-neutral-400">WalletConnect 协议</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-neutral-400">钱包地址:</span>
                  <span className="text-xs text-white font-mono">{formatAddress(address)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-neutral-400">网络状态:</span>
                  <span className={`text-xs font-medium ${needsNetworkSwitch ? 'text-red-400' : 'text-lime-400'}`}>
                    {needsNetworkSwitch ? '错误网络' : 'X Layer Testnet'}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                disconnect()
                setShowDropdown(false)
              }}
              className="w-full px-5 py-4 text-left hover:bg-neutral-800 flex items-center space-x-3 text-red-400 transition-colors duration-200"
            >
              <Icon icon="mdi:logout" className="w-4 h-4" />
              <span className="text-sm font-medium">断开钱包连接</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative group">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
      >
        {isConnecting ? (
          <>
            <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
            <span>连接中...</span>
          </>
        ) : (
          <>
            <Icon icon="mdi:qrcode-scan" className="w-4 h-4" />
            <span>扫码连接钱包</span>
          </>
        )}
      </button>

      {/* 连接说明 - 悬停显示 */}
      {!isConnected && (
        <div className="absolute right-0 top-full mt-3 w-96 bg-neutral-900 rounded-xl shadow-2xl border border-neutral-800 p-5 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="text-sm text-neutral-200">
            <div className="flex items-center space-x-2 mb-3">
              <Icon icon="mdi:information" className="w-5 h-5 text-lime-400" />
              <span className="font-semibold text-white">扫码连接说明</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-xs text-neutral-300 leading-relaxed">
              <li>点击"扫码连接钱包"按钮打开二维码</li>
              <li>使用手机钱包应用扫描二维码</li>
              <li>在手机钱包上确认连接请求</li>
              <li>系统将自动切换到 X Layer Testnet</li>
            </ol>
            <div className="mt-4 p-3 bg-lime-400/10 border border-lime-400/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon icon="mdi:star" className="w-4 h-4 text-lime-400" />
                <span className="text-xs font-medium text-lime-400">推荐钱包</span>
              </div>
              <div className="text-xs text-neutral-300 mt-1">
                OKX Wallet、MetaMask、Trust Wallet、TokenPocket
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
