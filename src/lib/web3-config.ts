import { defineChain } from 'viem'
import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'

// X Layer Testnet Configuration
export const xLayerTestnet = defineChain({
  id: 1952,
  name: 'X Layer Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'OKB',
    symbol: 'OKB',
  },
  rpcUrls: {
    default: {
      http: ['https://xlayertestrpc.okx.com/terigon'],
    },
  },
  blockExplorers: {
    default: {
      name: 'OKLink',
      url: 'https://www.oklink.com/xlayer-test',
    },
  },
  testnet: true,
})

// X Layer Mainnet Configuration
export const xLayerMainnet = defineChain({
  id: 196,
  name: 'X Layer',
  nativeCurrency: {
    decimals: 18,
    name: 'OKB',
    symbol: 'OKB',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.xlayer.tech'],
    },
  },
  blockExplorers: {
    default: {
      name: 'OKLink',
      url: 'https://www.oklink.com/xlayer',
    },
  },
})

// Wagmi Configuration
export const wagmiConfig = createConfig({
  chains: [xLayerTestnet, xLayerMainnet],
  connectors: [
    injected({
      target() {
        // Debug wallet availability
        console.log('Checking wallet availability:', {
          okxwallet: typeof window.okxwallet,
          ethereum: typeof window.ethereum,
          isElectron: typeof window !== 'undefined' && window.process?.type === 'renderer'
        })
        
        // Try OKX wallet first
        if (window.okxwallet) {
          console.log('OKX Wallet detected')
          return {
            id: 'okx',
            name: 'OKX Wallet',
            provider: window.okxwallet,
          }
        }
        
        // Fallback to generic ethereum provider
        if (window.ethereum) {
          console.log('Generic Ethereum provider detected')
          return {
            id: 'injected',
            name: 'Injected Wallet',
            provider: window.ethereum,
          }
        }
        
        // No wallet found
        console.warn('No wallet provider found')
        return {
          id: 'none',
          name: 'No Wallet',
          provider: null,
        }
      },
    }),
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [xLayerTestnet.id]: http(),
    [xLayerMainnet.id]: http(),
  },
})

// Smart Contract Addresses
export const CONTRACT_ADDRESSES = {
  SSH_MANAGER: {
    [xLayerTestnet.id]: '0x371f6716CD26Bf8e27Dd5322c2B4341Aaf1CedfA',
    [xLayerMainnet.id]: '', // Mainnet address to be deployed
  },
} as const

// Default Network
export const DEFAULT_CHAIN = xLayerTestnet

// Type Definitions
declare global {
  interface Window {
    okxwallet?: any
    ethereum?: any
    walletDebug?: {
      checkWalletAvailability: () => any
      logWalletProviders: () => void
    }
  }
}
