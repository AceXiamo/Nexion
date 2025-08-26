import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { Icon } from '@iconify/react'
import { useState, useEffect } from 'react'
import { xLayerTestnet } from '@/lib/web3-config'

export function WalletConnectButton() {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  const [showDropdown, setShowDropdown] = useState(false)
  const [needsNetworkSwitch, setNeedsNetworkSwitch] = useState(false)

  const okxConnector = connectors.find(connector => connector.id === 'injected' || connector.name.includes('OKX'))
  const metaMaskConnector = connectors.find(connector => connector.name.includes('MetaMask'))

  useEffect(() => {
    setNeedsNetworkSwitch(isConnected && chainId !== xLayerTestnet.id)
  }, [isConnected, chainId])

  const handleConnect = (connector: any) => {
    connect({ connector })
    setShowDropdown(false)
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
        <div className="flex items-center space-x-3">
          {/* Network Switch Button */}
          {needsNetworkSwitch && (
            <button
              onClick={handleSwitchNetwork}
              className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center space-x-2"
            >
              <Icon icon="mdi:alert-circle" className="w-4 h-4" />
              <span>切换网络</span>
            </button>
          )}

          {/* Wallet Info */}
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-3 bg-gray-100 hover:bg-gray-200 rounded-lg px-4 py-2 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Icon icon="mdi:wallet" className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900 text-sm">{formatAddress(address)}</div>
              <div className="text-xs text-gray-500">
                {needsNetworkSwitch ? '网络错误' : '已连接'}
              </div>
            </div>
            <Icon 
              icon={showDropdown ? 'mdi:chevron-up' : 'mdi:chevron-down'} 
              className="w-4 h-4 text-gray-400"
            />
          </button>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="font-medium text-gray-900">钱包信息</div>
              <div className="text-sm text-gray-600 mt-1">地址: {formatAddress(address)}</div>
              <div className="text-sm text-gray-600">
                网络: {needsNetworkSwitch ? '错误网络' : 'X Layer 测试网'}
              </div>
            </div>
            
            <button
              onClick={() => {
                disconnect()
                setShowDropdown(false)
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 text-red-600"
            >
              <Icon icon="mdi:logout" className="w-4 h-4" />
              <span className="text-sm">断开连接</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isConnecting}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
      >
        {isConnecting ? (
          <>
            <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
            <span>连接中...</span>
          </>
        ) : (
          <>
            <Icon icon="mdi:wallet" className="w-4 h-4" />
            <span>连接钱包</span>
          </>
        )}
      </button>

      {/* Connect Dropdown */}
      {showDropdown && !isConnected && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-medium text-gray-900">选择钱包</div>
            <div className="text-sm text-gray-600 mt-1">连接到 X Layer 网络</div>
          </div>
          
          {okxConnector && (
            <button
              onClick={() => handleConnect(okxConnector)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">OKX</span>
              </div>
              <div>
                <div className="font-medium text-gray-900">OKX Wallet</div>
                <div className="text-sm text-gray-600">推荐选择</div>
              </div>
            </button>
          )}

          {metaMaskConnector && (
            <button
              onClick={() => handleConnect(metaMaskConnector)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Icon icon="mdi:fox" className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">MetaMask</div>
                <div className="text-sm text-gray-600">需要手动添加网络</div>
              </div>
            </button>
          )}
          
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              没有钱包？<a href="#" className="text-blue-600 hover:underline">下载 OKX Wallet</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}