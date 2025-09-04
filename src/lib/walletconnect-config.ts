import { createConfig, http } from 'wagmi'
import { xLayerTestnet, xLayerMainnet } from './web3-config'
import { walletConnect } from 'wagmi/connectors'

// WalletConnect Project ID
export const WALLETCONNECT_PROJECT_ID = '3805e25bdd69f068b33004da1054407d'

// Project metadata
export const projectMetadata = {
  name: 'Nexion',
  description: 'A blockchain-based SSH configuration management tool',
  url: 'https://nexion.local',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Supported chains
export const chains = [xLayerTestnet, xLayerMainnet] as const

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
    [xLayerTestnet.id]: http(),
    [xLayerMainnet.id]: http(),
  },
})
