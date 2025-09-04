import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { useTranslation } from 'react-i18next'
import { useWalletStore } from '@/stores/walletStore'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  uri: string
}

export function QRCodeModal({ isOpen, onClose, uri }: QRCodeModalProps) {
  const { t } = useTranslation()
  const [qrDataURL, setQrDataURL] = useState<string>('')
  const { supportedWallets, openWallet } = useWalletStore()

  useEffect(() => {
    if (uri) {
      generateQRCode(uri)
    }
  }, [uri])

  const generateQRCode = async (uri: string) => {
    try {
      const QRCode = await import('qrcode')
      const dataURL = await QRCode.toDataURL(uri, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
      setQrDataURL(dataURL)
    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(uri)
    } catch (error) {
      console.error('Failed to copy URI:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">
            {t('wallet:connectWallet')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <Icon icon="mdi:close" className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* QR Code */}
          <div className="bg-white rounded-xl p-4 mb-6 flex justify-center">
            {qrDataURL ? (
              <img 
                src={qrDataURL} 
                alt="WalletConnect QR Code" 
                className="w-64 h-64"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center">
                <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-neutral-400" />
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-center mb-6">
            <h3 className="text-white font-medium mb-2">
              {t('wallet:scanQRCode')}
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              {t('wallet:qrCodeInstructions')}
            </p>
          </div>

          {/* Supported Wallets */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-neutral-300 mb-3">
              {t('wallet:supportedWallets')}
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {supportedWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => openWallet(wallet.id)}
                  className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-all duration-200 flex flex-col items-center space-y-2 group"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white">
                    <img
                      src={wallet.image_url?.md || ''}
                      alt={wallet.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-neutral-400"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" /></svg></div>'
                      }}
                    />
                  </div>
                  <span className="text-xs text-neutral-300 group-hover:text-white transition-colors">
                    {wallet.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Copy URI Button */}
          <button
            onClick={copyToClipboard}
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Icon icon="mdi:content-copy" className="w-4 h-4" />
            <span className="text-sm font-medium">{t('wallet:copyConnectionURI')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}