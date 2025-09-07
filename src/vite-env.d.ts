/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BUILD_NETWORK: 'testnet' | 'mainnet'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
