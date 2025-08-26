import { defineChain } from 'viem'
import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'

// X Layer 测试网配置
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

// X Layer 主网配置
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

// Wagmi 配置
export const wagmiConfig = createConfig({
  chains: [xLayerTestnet, xLayerMainnet],
  connectors: [
    injected({
      target() {
        return {
          id: 'okx',
          name: 'OKX Wallet',
          provider: window.okxwallet,
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

// 智能合约地址
export const CONTRACT_ADDRESSES = {
  SSH_MANAGER: {
    [xLayerTestnet.id]: '0xFf9EAe146001597a8Dd8424DE7D3Ef0bE9B1762a',
    [xLayerMainnet.id]: '', // 主网地址待部署
  },
} as const

// 默认网络
export const DEFAULT_CHAIN = xLayerTestnet

// 类型定义
declare global {
  interface Window {
    okxwallet?: any
    ethereum?: any
  }
}