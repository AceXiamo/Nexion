import { defineChain } from 'viem'
import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'

// Build-time network selection (must be defined first)
const BUILD_NETWORK = __BUILD_NETWORK__ || 'testnet'
console.log('BUILD_NETWORK', BUILD_NETWORK)

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

// Determine current network based on build configuration (must be after chain definitions)
export const CURRENT_CHAIN = BUILD_NETWORK === 'mainnet' ? xLayerMainnet : xLayerTestnet
export const CURRENT_CHAIN_ID = CURRENT_CHAIN.id

// Smart Contract Addresses
export const CONTRACT_ADDRESSES = {
  SSH_MANAGER: {
    [xLayerTestnet.id]: '0x9871a29FDEC2121b32Cb311C800D0a99949A1A85',
    [xLayerMainnet.id]: '0xFf9EAe146001597a8Dd8424DE7D3Ef0bE9B1762a',
  },
} as const

// Current contract address based on build network
export const CURRENT_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.SSH_MANAGER[CURRENT_CHAIN_ID]

// Legacy export for backward compatibility
export const DEFAULT_CHAIN = CURRENT_CHAIN

// Wagmi Configuration - Single Network
export const wagmiConfig = createConfig({
  chains: [CURRENT_CHAIN],
  connectors: [
    injected({
      target() {
        // Debug wallet availability
        console.log('Checking wallet availability:', {
          okxwallet: typeof window.okxwallet,
          ethereum: typeof window.ethereum,
          isElectron: typeof window !== 'undefined' && window.process?.type === 'renderer',
          buildNetwork: BUILD_NETWORK,
          currentChain: CURRENT_CHAIN.name
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
    [CURRENT_CHAIN.id]: http(),
  },
})

// Type Definitions
declare global {
  interface Window {
    okxwallet?: any
    ethereum?: any
  }
  const __BUILD_NETWORK__: string
}
