import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

// Expose wallet detection and debugging utilities
contextBridge.exposeInMainWorld('walletDebug', {
  checkWalletAvailability: () => {
    const result = {
      ethereum: typeof window.ethereum !== 'undefined',
      okxwallet: typeof window.okxwallet !== 'undefined',
      userAgent: navigator.userAgent,
      isElectron: typeof process !== 'undefined' && process.type === 'renderer'
    }
    console.log('Wallet availability check:', result)
    return result
  },
  
  logWalletProviders: () => {
    console.log('All window properties containing "eth" or "wallet":', 
      Object.keys(window).filter(key => 
        key.toLowerCase().includes('eth') || key.toLowerCase().includes('wallet')
      )
    )
  }
})

// Try to simulate wallet injection for development
if (process.env.NODE_ENV === 'development') {
  // Mock wallet provider for testing if no real wallet is available
  setTimeout(() => {
    if (typeof window.ethereum === 'undefined' && typeof window.okxwallet === 'undefined') {
      console.warn('No wallet detected, injecting mock provider for development...')
      
      // Mock minimal Ethereum provider
      ;(window as any).ethereum = {
        isMetaMask: false,
        isOKXWallet: false,
        request: async ({ method, params }: any) => {
          console.log('Mock wallet request:', method, params)
          
          switch (method) {
            case 'eth_requestAccounts':
              // Return a test account
              return ['0x742d35Cc6635C0532925a3b8c2412A4B1B06B2B5']
            case 'eth_chainId':
              // Return X Layer testnet chain ID
              return '0x7A0' // 1952 in hex
            case 'eth_accounts':
              return ['0x742d35Cc6635C0532925a3b8c2412A4B1B06B2B5']
            default:
              throw new Error(`Mock wallet: Method ${method} not implemented`)
          }
        },
        on: (event: string, callback: any) => {
          console.log('Mock wallet: Listening for', event)
        },
        removeListener: (event: string, callback: any) => {
          console.log('Mock wallet: Removing listener for', event)
        }
      }
      
      console.log('Mock wallet provider injected')
    }
  }, 1000)
}
