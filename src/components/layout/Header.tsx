import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { xLayerTestnet } from '@/lib/web3-config'
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton'
import { useWalletStore } from '@/stores/walletStore'

interface HeaderProps {
  title: string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  const { t } = useTranslation()
  const { chainId } = useWalletStore()
  const isCorrectNetwork = chainId === xLayerTestnet.id

  return (
    <header className="bg-black border-b border-neutral-800 px-6 py-3 pt-8">
      <div className="flex items-center justify-between">
        {/* Page title */}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-neutral-400 mt-1 leading-relaxed">{description}</p>
          )}
        </div>
        
        {/* Right toolbar */}
        <div className="flex items-center space-x-6">
          {/* Network Status - Clean Design */}
          <div className="flex items-center space-x-3 px-4 py-3 transition-all duration-200">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center">
              <Icon 
                icon={isCorrectNetwork ? "lucide:wifi" : "lucide:wifi-off"} 
                className="w-3 h-3 text-black font-bold" 
              />
            </div>
            <div className="text-left min-w-0">
              <div className="font-medium text-white text-sm tracking-wide">
                {isCorrectNetwork ? 'X Layer' : t('wallet:networkError')}
              </div>
              <div className="text-xs text-neutral-400">
                {isCorrectNetwork ? 'Testnet' : 'Network Error'}
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isCorrectNetwork 
                ? 'bg-lime-400 shadow-lg shadow-lime-400/50 animate-pulse' 
                : 'bg-red-500 shadow-lg shadow-red-500/50'
            }`}></div>
          </div>

          {/* Wallet Connection */}
          <WalletConnectButton />
        </div>
      </div>
    </header>
  )
}
