import { useWindowControls } from '@/hooks/useWindowControls'
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton'
import { Icon } from '@iconify/react'

interface WindowsTitleBarProps {
  title?: string
  showWalletButton?: boolean
}

export function WindowsTitleBar({ title = 'Nexion', showWalletButton = true }: WindowsTitleBarProps) {
  const { windowState, minimizeWindow, maximizeWindow, closeWindow } = useWindowControls()

  const handleDoubleClick = () => {
    maximizeWindow()
  }

  return (
    <div className="windows-titlebar flex items-center justify-between h-8 bg-black border-b border-neutral-800 select-none">
      {/* Left section - App icon and title */}
      <div
        className="windows-drag-region flex items-center flex-1 px-3 py-1 min-w-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        onDoubleClick={handleDoubleClick}
      >
        <div className="flex items-center space-x-2 min-w-0">
          {/* App icon */}
          <div className="flex-shrink-0">
            <img
              src="https://nexion.acexiamo.com/logo.png"
              alt="Nexion"
              className="w-4 h-4 object-contain"
            />
          </div>

          {/* App title */}
          <span className="text-sm font-medium text-white truncate">
            {title}
          </span>
        </div>
      </div>

      {/* Center section - Wallet button (optional) */}
      {showWalletButton && (
        <div
          className="flex-shrink-0 px-2"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <WalletConnectButton />
        </div>
      )}

      {/* Right section - Window controls */}
      <div
        className="flex items-center flex-shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Minimize button */}
        <button
          className="windows-control-btn windows-minimize-btn flex items-center justify-center w-12 h-8 hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
          onClick={minimizeWindow}
          aria-label="Minimize window"
        >
          <Icon
            icon="fluent:subtract-16-regular"
            className="w-3 h-3 text-white"
          />
        </button>

        {/* Maximize/Restore button */}
        <button
          className="windows-control-btn windows-maximize-btn flex items-center justify-center w-12 h-8 hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
          onClick={maximizeWindow}
          aria-label={windowState.isMaximized ? "Restore window" : "Maximize window"}
        >
          <Icon
            icon={windowState.isMaximized ? "fluent:restore-16-regular" : "fluent:maximize-16-regular"}
            className="w-3 h-3 text-white"
          />
        </button>

        {/* Close button */}
        <button
          className="windows-control-btn windows-close-btn flex items-center justify-center w-12 h-8 hover:bg-red-600 active:bg-red-700 transition-colors"
          onClick={closeWindow}
          aria-label="Close window"
        >
          <Icon
            icon="fluent:dismiss-16-regular"
            className="w-3 h-3 text-white"
          />
        </button>
      </div>
    </div>
  )
}