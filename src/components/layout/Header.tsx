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
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Network Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isCorrectNetwork ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {isCorrectNetwork ? 'X Layer 测试网' : '网络错误'}
            </span>
          </div>

          {/* Wallet Connection */}
          <WalletConnectButton />
        </div>
      </div>
    </header>
  )
}