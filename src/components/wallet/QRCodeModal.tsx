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
  const [isVisible, setIsVisible] = useState(false)
  const { supportedWallets, openWallet } = useWalletStore()

  useEffect(() => {
    if (uri) {
      generateQRCode(uri)
    }
  }, [uri])

  // 动画状态控制
  useEffect(() => {
    if (isOpen) {
      // 稍微延迟显示内容，让背景先出现
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  // ESC键关闭功能
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // 防止背景滚动
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

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
      // TODO: 可以添加复制成功的提示
    } catch (error) {
      console.error('Failed to copy URI:', error)
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    // 等待动画完成后再关闭
    setTimeout(() => onClose(), 200)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 ${
        isVisible ? 'bg-black/50 opacity-100' : 'bg-black/0 opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 max-w-md w-full mx-4 overflow-hidden transition-all duration-300 transform ${
          isVisible 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">
            {t('wallet:connectWallet')}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors group"
          >
            <Icon icon="mdi:close" className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* QR Code */}
          <div className="bg-white rounded-xl p-4 mb-6 flex justify-center transition-all duration-300">
            {qrDataURL ? (
              <img 
                src={qrDataURL} 
                alt="WalletConnect QR Code" 
                className="w-64 h-64 transition-all duration-300 hover:scale-105"
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
              {supportedWallets.map((wallet, index) => (
                <button
                  key={wallet.id}
                  onClick={() => openWallet(wallet.id)}
                  className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-all duration-200 flex flex-col items-center space-y-2 group hover:scale-105 active:scale-95"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: isVisible ? 'fadeInUp 0.4s ease-out forwards' : 'none'
                  }}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                    {wallet.iconify_icon ? (
                      <Icon 
                        icon={wallet.iconify_icon} 
                        className="w-6 h-6" 
                      />
                    ) : (
                      <Icon 
                        icon="mdi:wallet" 
                        className="w-5 h-5 text-neutral-400" 
                      />
                    )}
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
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Icon icon="mdi:content-copy" className="w-4 h-4" />
            <span className="text-sm font-medium">{t('wallet:copyConnectionURI')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}