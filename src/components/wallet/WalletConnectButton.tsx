import { Icon } from '@iconify/react'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { useWalletStore, useWalletSelectors } from '@/stores/walletStore'
import { QRCodeModal } from './QRCodeModal'
import { xLayerTestnet } from '@/lib/web3-config'

export function WalletConnectButton() {
  const { t } = useTranslation()
  const {
    isConnected,
    isConnecting,
    account,
    uri,
    error,
    connect,
    disconnect,
    switchChain,
    setShowQrCode,
    showQrCode,
    clearError,
    cancelConnection
  } = useWalletStore()
  
  const {
    isWrongNetwork,
    shortAddress,
    canConnect,
    canDisconnect,
    needsNetworkSwitch
  } = useWalletSelectors()
  
  const [showDropdown, setShowDropdown] = useState(false)

  const handleConnect = async () => {
    try {
      clearError()
      setShowQrCode(true) // Show QR code immediately
      await connect() // This will start the connection process and emit events
    } catch (error) {
      console.error('Connection failed:', error)
      setShowQrCode(false) // Hide QR code on error
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      setShowDropdown(false)
    } catch (error) {
      console.error('Disconnection failed:', error)
    }
  }

  const handleSwitchNetwork = async () => {
    try {
      await switchChain(xLayerTestnet.id)
    } catch (error) {
      console.error('Network switch failed:', error)
    }
  }

  const handleCloseQrModal = () => {
    if (isConnecting) {
      // If still connecting, cancel the connection
      cancelConnection()
    } else {
      // Otherwise just close the modal
      setShowQrCode(false)
    }
  }

  if (isConnected && account) {
    return (
      <>
        <div className="relative">
          <div className="flex items-center space-x-4">
            {/* Network Switch Button */}
            {needsNetworkSwitch && (
              <button
                onClick={handleSwitchNetwork}
                className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-all duration-200 flex items-center space-x-2"
              >
                <Icon icon="mdi:alert-circle" className="w-4 h-4" />
                <span>{t('wallet:switchNetwork')}</span>
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
                <div className="font-medium text-white text-sm tracking-wide">{shortAddress}</div>
                <div className="text-xs text-neutral-400">
                  {needsNetworkSwitch ? t('wallet:networkError') : 'WalletConnect'}
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
                    <div className="font-semibold text-white text-sm">{t('wallet:connectedWallet')}</div>
                    <div className="text-xs text-neutral-400">{t('wallet:walletProtocol')}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-400">{t('wallet:walletAddress')}</span>
                    <span className="text-xs text-white font-mono">{shortAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-neutral-400">{t('wallet:networkStatus')}</span>
                    <span className={`text-xs font-medium ${needsNetworkSwitch ? 'text-red-400' : 'text-lime-400'}`}>
                      {needsNetworkSwitch ? t('wallet:wrongNetwork') : 'X Layer Testnet'}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleDisconnect}
                className="w-full px-5 py-4 text-left hover:bg-neutral-800 flex items-center space-x-3 text-red-400 transition-colors duration-200"
              >
                <Icon icon="mdi:logout" className="w-4 h-4" />
                <span className="text-sm font-medium">{t('wallet:disconnectWallet')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-900/90 text-red-200 px-4 py-2 rounded-lg shadow-lg border border-red-800 max-w-sm">
            <div className="flex items-center space-x-2">
              <Icon icon="mdi:alert-circle" className="w-4 h-4" />
              <span className="text-sm">{error}</span>
              <button onClick={clearError} className="ml-2">
                <Icon icon="mdi:close" className="w-4 h-4 hover:text-white" />
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="relative group">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
        >
          {isConnecting ? (
            <>
              <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
              <span>{t('wallet:connecting')}</span>
            </>
          ) : (
            <>
              <Icon icon="mdi:qrcode-scan" className="w-4 h-4" />
              <span>{t('wallet:scanToConnect')}</span>
            </>
          )}
        </button>

        {/* Connection instructions - show on hover */}
        {!isConnected && !isConnecting && (
          <div className="absolute right-0 top-full mt-3 w-96 bg-neutral-900 rounded-xl shadow-2xl border border-neutral-800 p-5 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="text-sm text-neutral-200">
              <div className="flex items-center space-x-2 mb-3">
                <Icon icon="mdi:information" className="w-5 h-5 text-lime-400" />
                <span className="font-semibold text-white">{t('wallet:connectionGuide')}</span>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-xs text-neutral-300 leading-relaxed">
                {(t('wallet:connectionSteps', { returnObjects: true }) as unknown as string[]).map((step: string, index: number) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
              <div className="mt-4 p-3 bg-lime-400/10 border border-lime-400/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Icon icon="mdi:star" className="w-4 h-4 text-lime-400" />
                  <span className="text-xs font-medium text-lime-400">{t('wallet:recommendedWallets')}</span>
                </div>
                <div className="text-xs text-neutral-300 mt-1">
                  {t('wallet:walletList')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQrCode}
        onClose={handleCloseQrModal}
        uri={uri || ''}
      />

      {/* Error Display */}
      {error && !isConnected && (
        <div className="fixed bottom-4 right-4 bg-red-900/90 text-red-200 px-4 py-2 rounded-lg shadow-lg border border-red-800 max-w-sm z-50">
          <div className="flex items-center space-x-2">
            <Icon icon="mdi:alert-circle" className="w-4 h-4" />
            <span className="text-sm">{error}</span>
            <button onClick={clearError} className="ml-2">
              <Icon icon="mdi:close" className="w-4 h-4 hover:text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}