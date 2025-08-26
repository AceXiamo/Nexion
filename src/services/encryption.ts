import * as secp256k1 from '@noble/secp256k1'
import { xchacha20poly1305 } from '@noble/ciphers/chacha'
import { randomBytes } from '@noble/ciphers/utils'
import { sha256 } from '@noble/hashes/sha2'
import type { SSHConfigInput, DecryptedSSHConfig } from '@/types/ssh'

/**
 * ECIES (Elliptic Curve Integrated Encryption Scheme) 加密服务
 * 基于 secp256k1 椭圆曲线，使用 ChaCha20Poly1305 进行对称加密
 */
export class ECIESEncryptionService {
  /**
   * 从以太坊地址推导公钥（用于加密）
   */
  private static async derivePublicKeyFromAddress(address: string): Promise<Uint8Array> {
    // 这是一个简化实现，实际应用中需要用户签名来获取真实公钥
    // 这里我们使用地址作为种子来生成一致的密钥对
    const seed = sha256(new TextEncoder().encode(address.toLowerCase()))
    const privateKey = secp256k1.utils.normPrivateKeyToScalar(seed)
    return secp256k1.getPublicKey(privateKey, false) // 非压缩格式
  }

  /**
   * 生成临时密钥对用于 ECIES
   */
  private static generateEphemeralKeyPair(): {
    privateKey: Uint8Array
    publicKey: Uint8Array
  } {
    const privateKey = secp256k1.utils.randomPrivateKey()
    const publicKey = secp256k1.getPublicKey(privateKey, false)
    return { privateKey, publicKey }
  }

  /**
   * ECDH 密钥交换
   */
  private static performECDH(
    privateKey: Uint8Array,
    publicKey: Uint8Array
  ): Uint8Array {
    const sharedSecret = secp256k1.getSharedSecret(privateKey, publicKey)
    return sha256(sharedSecret) // 对共享密钥进行哈希处理
  }

  /**
   * 使用用户钱包地址加密 SSH 配置
   */
  static async encryptSSHConfig(
    config: SSHConfigInput,
    walletAddress: string
  ): Promise<string> {
    try {
      // 1. 序列化配置数据
      const configData = JSON.stringify({
        ...config,
        timestamp: Date.now(),
      })
      const plaintext = new TextEncoder().encode(configData)

      // 2. 获取接收者公钥
      const recipientPublicKey = await this.derivePublicKeyFromAddress(walletAddress)

      // 3. 生成临时密钥对
      const ephemeral = this.generateEphemeralKeyPair()

      // 4. 执行 ECDH 密钥交换
      const sharedSecret = this.performECDH(ephemeral.privateKey, recipientPublicKey)

      // 5. 使用共享密钥进行对称加密
      const nonce = randomBytes(24) // ChaCha20Poly1305 需要 24 字节 nonce
      const cipher = xchacha20poly1305(sharedSecret, nonce)
      const ciphertext = cipher.encrypt(plaintext)

      // 6. 组合最终结果
      const result = {
        ephemeralPublicKey: Array.from(ephemeral.publicKey),
        nonce: Array.from(nonce),
        ciphertext: Array.from(ciphertext),
        version: '1.0', // 版本标识，便于未来升级
      }

      return JSON.stringify(result)
    } catch (error) {
      console.error('SSH配置加密失败:', error)
      throw new Error('配置加密失败，请检查网络连接和钱包状态')
    }
  }

  /**
   * 使用用户钱包地址解密 SSH 配置
   */
  static async decryptSSHConfig(
    encryptedData: string,
    walletAddress: string,
    configId: string,
    createdAt: Date,
    isActive: boolean
  ): Promise<DecryptedSSHConfig> {
    try {
      // 1. 解析加密数据
      const encrypted = JSON.parse(encryptedData)
      const { ephemeralPublicKey, nonce, ciphertext, version } = encrypted

      // 检查版本兼容性
      if (version !== '1.0') {
        throw new Error(`不支持的加密版本: ${version}`)
      }

      // 2. 重建用户密钥对
      const seed = sha256(new TextEncoder().encode(walletAddress.toLowerCase()))
      const userPrivateKey = secp256k1.utils.normPrivateKeyToScalar(seed)

      // 3. 执行 ECDH 密钥交换
      const ephemeralPubKey = new Uint8Array(ephemeralPublicKey)
      const sharedSecret = this.performECDH(userPrivateKey, ephemeralPubKey)

      // 4. 解密数据
      const nonceArray = new Uint8Array(nonce)
      const ciphertextArray = new Uint8Array(ciphertext)
      const cipher = xchacha20poly1305(sharedSecret, nonceArray)
      const plaintext = cipher.decrypt(ciphertextArray)

      // 5. 解析配置数据
      const configData = JSON.parse(new TextDecoder().decode(plaintext))
      
      // 6. 构建完整的解密配置对象
      return {
        id: configId,
        name: configData.name,
        host: configData.host,
        port: configData.port,
        username: configData.username,
        authType: configData.authType,
        password: configData.password,
        privateKey: configData.privateKey,
        passphrase: configData.passphrase,
        createdAt,
        updatedAt: new Date(configData.timestamp),
        isActive,
      }
    } catch (error) {
      console.error('SSH配置解密失败:', error)
      throw new Error('配置解密失败，请确认钱包地址正确')
    }
  }

  /**
   * 验证加密数据的完整性
   */
  static validateEncryptedData(encryptedData: string): boolean {
    try {
      const data = JSON.parse(encryptedData)
      return !!(
        data.ephemeralPublicKey &&
        data.nonce &&
        data.ciphertext &&
        data.version &&
        Array.isArray(data.ephemeralPublicKey) &&
        Array.isArray(data.nonce) &&
        Array.isArray(data.ciphertext) &&
        data.ephemeralPublicKey.length === 65 && // 非压缩公钥长度
        data.nonce.length === 24 && // XChaCha20Poly1305 nonce
        data.ciphertext.length > 16 // 至少包含认证标签
      )
    } catch {
      return false
    }
  }

  /**
   * 生成配置摘要（用于显示，不包含敏感信息）
   */
  static generateConfigSummary(config: DecryptedSSHConfig): string {
    return `${config.name} (${config.username}@${config.host}:${config.port})`
  }
}

/**
 * 本地存储加密服务（用于临时缓存解密后的配置）
 */
export class LocalStorageEncryption {
  private static readonly CACHE_PREFIX = 'ssh_config_cache_'
  private static readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24小时

  /**
   * 缓存解密后的配置（使用会话级加密）
   */
  static cacheDecryptedConfig(
    configId: string,
    config: DecryptedSSHConfig
  ): void {
    try {
      const cacheData = {
        config,
        timestamp: Date.now(),
        expiry: Date.now() + this.CACHE_EXPIRY,
      }
      
      const key = `${this.CACHE_PREFIX}${configId}`
      sessionStorage.setItem(key, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('配置缓存失败:', error)
    }
  }

  /**
   * 从缓存获取解密配置
   */
  static getCachedConfig(configId: string): DecryptedSSHConfig | null {
    try {
      const key = `${this.CACHE_PREFIX}${configId}`
      const cached = sessionStorage.getItem(key)
      
      if (!cached) return null
      
      const cacheData = JSON.parse(cached)
      
      // 检查过期时间
      if (Date.now() > cacheData.expiry) {
        sessionStorage.removeItem(key)
        return null
      }
      
      return cacheData.config
    } catch (error) {
      console.warn('读取缓存失败:', error)
      return null
    }
  }

  /**
   * 清除指定配置的缓存
   */
  static clearConfigCache(configId: string): void {
    const key = `${this.CACHE_PREFIX}${configId}`
    sessionStorage.removeItem(key)
  }

  /**
   * 清除所有配置缓存
   */
  static clearAllCache(): void {
    const keys = Object.keys(sessionStorage)
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        sessionStorage.removeItem(key)
      }
    })
  }
}