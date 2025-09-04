import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { xLayerTestnet, xLayerMainnet } from './web3-config'

// WalletConnect Project ID - a valid ID needs to be obtained from https://cloud.walletconnect.com for production environments
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

// WalletConnect Wagmi Configuration
export const walletConnectConfig = defaultWagmiConfig({
  chains,
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata: projectMetadata,
  enableWalletConnect: true,
  enableInjected: false, // Electron 中禁用
  enableEIP6963: false,  // Electron 中禁用
  enableCoinbase: false, // Electron 中禁用
  ssr: false,
})

// Create a Web3Modal instance at the top level of the module (only in browser environment)
let web3Modal: ReturnType<typeof createWeb3Modal> | null = null

// Initialize Web3Modal immediately (if in browser environment)
if (typeof window !== 'undefined') {
  try {
    web3Modal = createWeb3Modal({
      wagmiConfig: walletConnectConfig,
      projectId: WALLETCONNECT_PROJECT_ID,
      chains: chains as any,
      defaultChain: xLayerTestnet,
      themeMode: 'light',
      themeVariables: {
        '--w3m-color-mix': '#1e40af',
        '--w3m-color-mix-strength': 20,
        '--w3m-border-radius-master': '8px'
      },
      // Electron 特定配置
      enableOnramp: false,       // 禁用法币入口
      enableSwaps: false,        // 禁用交换功能
      enableAnalytics: false,    // 禁用分析
      allowUnsupportedChain: true,
      featuredWalletIds: [
        'e7c4d26541a7fd84dbdfa9922d3ad21e936e13a7a0e44385d44f006139e44d3b', // OKX
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust
      ]
    })
    console.log('Web3Modal initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Web3Modal:', error)
  }
}

export function getWeb3Modal() {
  return web3Modal
}

// Helper function to ensure Web3Modal is initialized
export function ensureWeb3Modal() {
  if (!web3Modal && typeof window !== 'undefined') {
    throw new Error('Web3Modal not initialized. This should not happen.')
  }
  return web3Modal
}
