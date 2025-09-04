import { UniversalProvider } from '@walletconnect/universal-provider'
import { WALLETCONNECT_PROJECT_ID, projectMetadata, chains } from './walletconnect-config'

export interface WalletInfo {
  id: string
  name: string
  homepage?: string
  image_url?: {
    sm?: string
    md?: string
    lg?: string
  }
  mobile?: {
    native?: string
    universal?: string
  }
  desktop?: {
    native?: string
    universal?: string
  }
}

export interface ConnectionState {
  isConnected: boolean
  isConnecting: boolean
  account?: string
  chainId?: number
  uri?: string
  error?: string
}

export class NativeWalletConnect {
  private provider: UniversalProvider | null = null
  private listeners: Map<string, Function[]> = new Map()
  private connectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
  }
  private connectionTimeout: NodeJS.Timeout | null = null

  // Supported wallets for Electron
  private supportedWallets: WalletInfo[] = [
    {
      id: 'okx',
      name: 'OKX Wallet',
      homepage: 'https://www.okx.com/web3',
      image_url: {
        sm: 'https://registry.walletconnect.com/api/v1/logo/sm/okx-wallet',
        md: 'https://registry.walletconnect.com/api/v1/logo/md/okx-wallet',
        lg: 'https://registry.walletconnect.com/api/v1/logo/lg/okx-wallet'
      },
      mobile: {
        native: 'okx://wallet/dapp/url?dappUrl=',
        universal: 'https://www.okx.com/download'
      },
      desktop: {
        native: 'okx://wallet/dapp/url?dappUrl=',
        universal: 'https://www.okx.com/download'
      }
    },
    {
      id: 'metamask',
      name: 'MetaMask',
      homepage: 'https://metamask.io/',
      image_url: {
        sm: 'https://registry.walletconnect.com/api/v1/logo/sm/metamask',
        md: 'https://registry.walletconnect.com/api/v1/logo/md/metamask',
        lg: 'https://registry.walletconnect.com/api/v1/logo/lg/metamask'
      },
      mobile: {
        native: 'metamask://dapp/',
        universal: 'https://metamask.app.link/dapp/'
      },
      desktop: {
        native: 'metamask://dapp/',
        universal: 'https://metamask.app.link/dapp/'
      }
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      homepage: 'https://trustwallet.com/',
      image_url: {
        sm: 'https://registry.walletconnect.com/api/v1/logo/sm/trust-wallet',
        md: 'https://registry.walletconnect.com/api/v1/logo/md/trust-wallet',
        lg: 'https://registry.walletconnect.com/api/v1/logo/lg/trust-wallet'
      },
      mobile: {
        native: 'trust://wc?uri=',
        universal: 'https://link.trustwallet.com/wc?uri='
      },
      desktop: {
        native: 'trust://wc?uri=',
        universal: 'https://link.trustwallet.com/wc?uri='
      }
    }
  ]

  constructor() {
    this.initializeProvider()
  }

  private async initializeProvider() {
    try {
      this.provider = await UniversalProvider.init({
        projectId: WALLETCONNECT_PROJECT_ID,
        metadata: projectMetadata,
        chains: chains.map(chain => `eip155:${chain.id}`),
        showQrModal: false,
        rpcMap: {
          [chains[0].id]: chains[0].rpcUrls.default.http[0],
          [chains[1].id]: chains[1].rpcUrls.default.http[0],
        }
      })

      this.setupEventListeners()
      console.log('Native WalletConnect provider initialized')
    } catch (error) {
      console.error('Failed to initialize WalletConnect provider:', error)
      this.emit('error', error)
    }
  }

  private setupEventListeners() {
    if (!this.provider) return

    this.provider.on('display_uri', (uri: string) => {
      console.log('WalletConnect URI generated:', uri)
      this.connectionState.uri = uri
      this.emit('uri', uri)
    })

    this.provider.on('session_ping', (args: any) => {
      console.log('Session ping:', args)
    })

    this.provider.on('session_event', (args: any) => {
      console.log('Session event:', args)
    })

    this.provider.on('session_update', (args: any) => {
      console.log('Session update:', args)
      this.handleSessionUpdate(args)
    })

    this.provider.on('session_delete', (args: any) => {
      console.log('Session deleted:', args)
      this.handleDisconnect()
    })

    this.provider.on('connect', (session: any) => {
      console.log('WalletConnect connected:', session)
      this.handleConnect(session)
    })

    this.provider.on('disconnect', (args: any) => {
      console.log('WalletConnect disconnected:', args)
      this.handleDisconnect()
    })
  }

  private handleConnect(session: any) {
    const accounts = session.namespaces?.eip155?.accounts || []
    const account = accounts[0]?.split(':')[2]
    const chainId = parseInt(accounts[0]?.split(':')[1] || '0')

    this.connectionState = {
      isConnected: true,
      isConnecting: false,
      account,
      chainId,
      uri: undefined,
      error: undefined
    }

    this.emit('connect', {
      account,
      chainId,
      session
    })
  }

  private handleSessionUpdate(args: any) {
    const accounts = args.params?.namespaces?.eip155?.accounts || []
    const account = accounts[0]?.split(':')[2]
    const chainId = parseInt(accounts[0]?.split(':')[1] || '0')

    if (account) {
      this.connectionState.account = account
    }
    if (chainId) {
      this.connectionState.chainId = chainId
    }

    this.emit('accountsChanged', account ? [account] : [])
    this.emit('chainChanged', chainId)
  }

  private handleDisconnect() {
    this.connectionState = {
      isConnected: false,
      isConnecting: false,
      uri: undefined,
      error: undefined
    }

    this.emit('disconnect')
  }

  async connect(): Promise<{ account: string; chainId: number } | null> {
    console.log('Starting WalletConnect connection...')
    
    if (!this.provider) {
      console.log('Initializing provider...')
      await this.initializeProvider()
      if (!this.provider) {
        throw new Error('Failed to initialize WalletConnect provider')
      }
    }

    try {
      this.connectionState.isConnecting = true
      this.emit('connecting')
      console.log('Emitted connecting event')

      // Check if already connected
      if (this.provider.session) {
        console.log('Already have session, reusing:', this.provider.session)
        const session = this.provider.session
        this.handleConnect(session)
        return {
          account: this.connectionState.account!,
          chainId: this.connectionState.chainId!
        }
      }

      console.log('Starting new connection...')
      
      // Set connection timeout (2 minutes)
      this.connectionTimeout = setTimeout(() => {
        if (this.connectionState.isConnecting) {
          console.log('Connection timeout reached')
          this.connectionState.isConnecting = false
          this.connectionState.error = 'Connection timeout. Please try again.'
          this.emit('error', new Error('Connection timeout'))
        }
      }, 120000) // 2 minutes

      // Start the connection process - this will generate the URI and wait for user action
      this.provider.connect({
        namespaces: {
          eip155: {
            methods: [
              'eth_sendTransaction',
              'eth_signTransaction',
              'eth_sign',
              'personal_sign',
              'eth_signTypedData',
            ],
            chains: chains.map(chain => `eip155:${chain.id}`),
            events: ['chainChanged', 'accountsChanged'],
          },
        },
      }).then((session) => {
        console.log('Connection completed, session:', session)
        this.clearConnectionTimeout()
        this.handleConnect(session)
      }).catch((error) => {
        console.error('Connection failed:', error)
        this.clearConnectionTimeout()
        this.connectionState.isConnecting = false
        this.connectionState.error = error instanceof Error ? error.message : 'Connection failed'
        this.emit('error', error)
      })

      // Return null immediately - the actual connection will be handled by events
      return null
    } catch (error) {
      console.error('Connection setup failed:', error)
      this.connectionState.isConnecting = false
      this.connectionState.error = error instanceof Error ? error.message : 'Connection failed'
      this.emit('error', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (!this.provider || !this.connectionState.isConnected) {
      return
    }

    try {
      await this.provider.disconnect()
      this.handleDisconnect()
    } catch (error) {
      console.error('Error disconnecting:', error)
      this.handleDisconnect()
    }
  }

  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }
  }

  cancelConnection(): void {
    console.log('Cancelling WalletConnect connection...')
    
    // Clear any pending timeout
    this.clearConnectionTimeout()
    
    // Reset connection state
    this.connectionState = {
      isConnected: false,
      isConnecting: false,
      uri: undefined,
      error: undefined
    }

    // Emit cancelled event
    this.emit('cancelled')
    
    // If provider exists and has an active connection attempt, try to clean up
    if (this.provider) {
      try {
        // Note: WalletConnect doesn't have a direct "cancel" method
        // The connection will timeout naturally if no wallet responds
        console.log('Connection cancelled by user')
      } catch (error) {
        console.error('Error during connection cancellation:', error)
      }
    }
  }

  async switchChain(chainId: number): Promise<void> {
    if (!this.provider || !this.connectionState.isConnected) {
      throw new Error('Wallet not connected')
    }

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      })
    } catch (error) {
      console.error('Error switching chain:', error)
      throw error
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.provider || !this.connectionState.account) {
      throw new Error('Wallet not connected')
    }

    try {
      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [message, this.connectionState.account],
      })
      return signature as string
    } catch (error) {
      console.error('Error signing message:', error)
      throw error
    }
  }

  async sendTransaction(transaction: any): Promise<string> {
    if (!this.provider || !this.connectionState.account) {
      throw new Error('Wallet not connected')
    }

    try {
      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [{ ...transaction, from: this.connectionState.account }],
      })
      return txHash as string
    } catch (error) {
      console.error('Error sending transaction:', error)
      throw error
    }
  }

  async openWallet(walletId: string): Promise<void> {
    const wallet = this.supportedWallets.find(w => w.id === walletId)
    if (!wallet || !this.connectionState.uri) {
      console.warn('Wallet not found or URI not available')
      return
    }

    const uri = encodeURIComponent(this.connectionState.uri)
    let deepLink: string | undefined

    if (wallet.desktop?.native) {
      deepLink = wallet.desktop.native + uri
    } else if (wallet.mobile?.native) {
      deepLink = wallet.mobile.native + uri
    }

    try {
      if (deepLink && window.electronAPI?.openExternal) {
        const result = await window.electronAPI.openExternal(deepLink)
        if (!result?.success) {
          // Fallback to universal link if deep link fails
          if (wallet.desktop?.universal) {
            await window.electronAPI.openExternal(wallet.desktop.universal)
          }
        }
      } else if (wallet.desktop?.universal && window.electronAPI?.openExternal) {
        await window.electronAPI.openExternal(wallet.desktop.universal)
      }
    } catch (error) {
      console.error('Failed to open wallet:', error)
      this.emit('error', error)
    }
  }

  getSupportedWallets(): WalletInfo[] {
    return this.supportedWallets
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState }
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`Error in ${event} callback:`, error)
        }
      })
    }
  }
}

// Global instance
export const walletConnect = new NativeWalletConnect()

// Type declarations for Electron API
declare global {
  interface Window {
    electronAPI?: {
      openExternal: (url: string) => void
    }
  }
}