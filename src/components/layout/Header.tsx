import { useChainId } from 'wagmi'
import { Icon } from '@iconify/react'
import { xLayerTestnet } from '@/lib/web3-config'
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton'

interface HeaderProps {
  title: string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  const chainId = useChainId()
  const isCorrectNetwork = chainId === xLayerTestnet.id

  return (
    <header className="bg-black border-b border-neutral-800 px-8 py-6 pt-10">
      <div className="flex items-center justify-between">
        {/* 页面标题 */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-neutral-400 mt-2 leading-relaxed">{description}</p>
          )}
        </div>
        
        {/* 右侧工具栏 */}
        <div className="flex items-center space-x-6">
          {/* Network Status */}
          <div className="flex items-center space-x-3 px-4 py-2 bg-neutral-900 rounded-lg border border-neutral-800">
            <div className={`w-2 h-2 rounded-full ${
              isCorrectNetwork 
                ? 'bg-lime-400 shadow-lg shadow-lime-400/50' 
                : 'bg-red-500 shadow-lg shadow-red-500/50'
            }`}></div>
            <span className="text-sm font-medium text-neutral-200">
              {isCorrectNetwork ? 'X Layer Testnet' : '网络错误'}
            </span>
            {isCorrectNetwork && (
              <div className="w-1 h-1 bg-lime-400 rounded-full animate-ping"></div>
            )}
          </div>

          {/* Wallet Connection */}
          <WalletConnectButton />
        </div>
      </div>
    </header>
  )
}
