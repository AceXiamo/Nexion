export interface SSHConfig {
  encryptedData: string
  timestamp: bigint
  configId: bigint
  isActive: boolean
}

export interface UserStats {
  totalConfigs: bigint
  activeConfigs: bigint
  lastActivity: bigint
}

export interface SSHConfigInput {
  name: string
  host: string
  port: number
  username: string
  authType: 'password' | 'key'
  password?: string
  privateKey?: string
  passphrase?: string
}

export interface DecryptedSSHConfig extends SSHConfigInput {
  id: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface SSHConnection {
  id: string
  name: string
  host: string
  port: number
  username: string
  status: 'connected' | 'disconnected' | 'connecting' | 'error'
  lastConnected?: Date
}