import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { xLayerTestnet, xLayerMainnet } from './web3-config'

// WalletConnect Project ID - 在生产环境中需要从 https://cloud.walletconnect.com 获取有效ID
export const WALLETCONNECT_PROJECT_ID = '82704de434624e1e9e7f74890ea8166a'

// 项目元数据
export const projectMetadata = {
  name: 'Web3 SSH Manager',
  description: '基于区块链的 SSH 配置管理工具',
  url: 'https://web3-ssh-manager.local',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 支持的链
export const chains = [xLayerTestnet, xLayerMainnet] as const

// 环境检测
export const isElectron = typeof window !== 'undefined' && window.process?.type === 'renderer'
export const isBrowser = typeof window !== 'undefined' && !isElectron

// WalletConnect Wagmi 配置
export const walletConnectConfig = defaultWagmiConfig({
  chains,
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata: projectMetadata,
  enableWalletConnect: true,
  enableInjected: isElectron ? false : true, // 根据环境决定是否启用 injected
  enableEIP6963: !isElectron,
  enableCoinbase: !isElectron,
})

// 在模块顶层创建 Web3Modal 实例（仅在浏览器环境）
let web3Modal: ReturnType<typeof createWeb3Modal> | null = null

// 立即初始化 Web3Modal（如果在浏览器环境）
if (typeof window !== 'undefined') {
  try {
    web3Modal = createWeb3Modal({
      wagmiConfig: walletConnectConfig,
      projectId: WALLETCONNECT_PROJECT_ID,
      chains,
      defaultChain: xLayerTestnet,
      themeMode: 'light',
      themeVariables: {
        '--w3m-color-mix': '#1e40af',
        '--w3m-color-mix-strength': 20,
        '--w3m-border-radius-master': '8px'
      },
      featuredWalletIds: [
        // OKX Wallet
        'e7c4d26541a7fd84dbdfa9922d3ad21e936e13a7a0e44385d44f006139e44d3b',
        // MetaMask
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
        // Trust Wallet
        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
        // TokenPocket
        'e025619980a5a91f30ffa27eb5b3a4b6b1adc9b6732b93e3e9ad0fb2db4e9e2c'
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

// 确保 Web3Modal 已初始化的辅助函数
export function ensureWeb3Modal() {
  if (!web3Modal && typeof window !== 'undefined') {
    throw new Error('Web3Modal not initialized. This should not happen.')
  }
  return web3Modal
}
