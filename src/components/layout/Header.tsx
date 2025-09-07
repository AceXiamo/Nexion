import { WalletConnectButton } from '@/components/wallet/WalletConnectButton'

interface HeaderProps {
  title: string
  description?: string
}

export function Header({ title, description }: HeaderProps) {

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
          {/* Wallet Connection */}
          <WalletConnectButton />
        </div>
      </div>
    </header>
  )
}
