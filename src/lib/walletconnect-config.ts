import { createConfig, http } from 'wagmi'
import { CURRENT_CHAIN } from './web3-config'
import { walletConnect } from 'wagmi/connectors'

// WalletConnect Project ID
export const WALLETCONNECT_PROJECT_ID = '3805e25bdd69f068b33004da1054407d'

// Project metadata
export const projectMetadata = {
  name: 'Nexion',
  description: 'A blockchain-based SSH configuration management tool',
  url: 'file://',
  icons: ['https://nexion.acexiamo.com/logo.png']
}

// Single chain based on build configuration
export const chains = [CURRENT_CHAIN] as const

// Environment detection
export const isElectron = typeof window !== 'undefined' && window.process?.type === 'renderer'
export const isBrowser = typeof window !== 'undefined' && !isElectron

// Native Wagmi Configuration with WalletConnect
export const walletConnectConfig = createConfig({
  chains,
  connectors: [
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: projectMetadata,
      showQrModal: false, // We'll handle QR display ourselves
    }),
  ],
  transports: {
    [CURRENT_CHAIN.id]: http(),
  },
})
