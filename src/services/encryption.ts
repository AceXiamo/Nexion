import { xchacha20poly1305 } from '@noble/ciphers/chacha'
import { randomBytes } from '@noble/ciphers/utils'
import { sha256 } from '@noble/hashes/sha2'
import type { SSHConfigInput, DecryptedSSHConfig } from '@/types/ssh'

/**
 * 基于钱包签名的 SSH 配置加密服务
 * 使用钱包签名派生加密密钥，采用 ChaCha20Poly1305 对称加密
 */
export class WalletBasedEncryptionService {
  private static readonly CACHE_PREFIX = 'ssh_encryption_key_'
  private static readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24小时

  /**
   * 通过钱包签名派生加密密钥
   */
  private static async deriveEncryptionKey(
    walletAddress: string, 
    signMessageAsync: (message: { message: string }) => Promise<string>
  ): Promise<Uint8Array> {
    // 检查缓存的加密密钥
    const cachedKey = this.getCachedEncryptionKey(walletAddress)
    if (cachedKey) {
      return cachedKey
    }

    try {
      // 构造标准化的签名消息
      const currentDay = Math.floor(Date.now() / (24 * 60 * 60 * 1000))
      const message = [
        'SSH Manager - Encryption Key Derivation',
        `Wallet Address: ${walletAddress}`,
        `Purpose: SSH Configuration Encryption`,
        `Day: ${currentDay}`,
        '',
        'This signature will be used to generate an encryption key',
        'for securing your SSH configurations. The key expires in 24 hours.'
      ].join('\n')

      // 使用 Wagmi 签名方法
      const signature = await signMessageAsync({ message })
      
      // 从签名派生32字节加密密钥
      const encryptionKey = sha256(new TextEncoder().encode(signature))
      
      // 缓存密钥
      this.cacheEncryptionKey(walletAddress, encryptionKey)
      
      return encryptionKey
    } catch (error) {
      console.error('派生加密密钥失败:', error)
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('用户拒绝') || error.message.includes('User denied')) {
          throw new Error('用户取消了签名操作，无法生成加密密钥')
        }
        if (error.message.includes('Connector not found') || error.message.includes('No connector')) {
          throw new Error('钱包连接已断开，请重新连接钱包')
        }
        throw error
      }
      throw new Error('生成加密密钥时发生未知错误')
    }
  }



  /**
   * 缓存加密密钥
   */
  private static cacheEncryptionKey(walletAddress: string, key: Uint8Array): void {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${walletAddress.toLowerCase()}`
      const cacheData = {
        key: Array.from(key),
        timestamp: Date.now(),
        expiry: Date.now() + this.CACHE_EXPIRY
      }
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('缓存加密密钥失败:', error)
    }
  }

  /**
   * 获取缓存的加密密钥
   */
  private static getCachedEncryptionKey(walletAddress: string): Uint8Array | null {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${walletAddress.toLowerCase()}`
      const cached = sessionStorage.getItem(cacheKey)
      
      if (!cached) return null
      
      const cacheData = JSON.parse(cached)
      
      // 检查过期时间
      if (Date.now() > cacheData.expiry) {
        sessionStorage.removeItem(cacheKey)
        return null
      }
      
      return new Uint8Array(cacheData.key)
    } catch (error) {
      console.warn('读取加密密钥缓存失败:', error)
      return null
    }
  }

  /**
   * 使用用户钱包地址加密 SSH 配置
   */
  static async encryptSSHConfig(
    config: SSHConfigInput,
    walletAddress: string,
    signMessageAsync: (message: { message: string }) => Promise<string>
  ): Promise<string> {
    try {
      // 1. 获取或生成加密密钥
      const encryptionKey = await this.deriveEncryptionKey(walletAddress, signMessageAsync)

      // 2. 序列化配置数据
      const configData = JSON.stringify({
        ...config,
        timestamp: Date.now(),
      })
      const plaintext = new TextEncoder().encode(configData)

      // 3. 生成随机 nonce
      const nonce = randomBytes(24) // XChaCha20Poly1305 需要 24 字节 nonce

      // 4. 使用对称加密
      const cipher = xchacha20poly1305(encryptionKey, nonce)
      const ciphertext = cipher.encrypt(plaintext)

      // 5. 返回简化的结果格式
      const result = {
        nonce: Array.from(nonce),
        ciphertext: Array.from(ciphertext),
        keyVersion: '2.0' // 新版本标识
      }

      return JSON.stringify(result)
    } catch (error) {
      console.error('SSH配置加密失败:', error)
      
      // 提供更具体的错误信息
      if (error instanceof Error) {
        if (error.message.includes('用户取消') || error.message.includes('签名')) {
          throw new Error('用户取消了签名操作，加密过程已中断')
        }
        if (error.message.includes('钱包连接已断开') || error.message.includes('Connector not found')) {
          throw new Error('钱包连接已断开，请重新连接钱包后重试')
        }
        if (error.message.includes('网络') || error.message.includes('连接')) {
          throw new Error('网络连接异常，请检查网络后重试')
        }
        
        // 如果是已知错误，直接抛出
        throw error
      }
      
      throw new Error('配置加密过程中发生未知错误，请重试')
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
    isActive: boolean,
    signMessageAsync: (message: { message: string }) => Promise<string>
  ): Promise<DecryptedSSHConfig> {
    try {
      // 1. 解析加密数据
      const encrypted = JSON.parse(encryptedData)
      const { nonce, ciphertext, keyVersion } = encrypted

      // 检查版本
      if (keyVersion !== '2.0') {
        throw new Error(`不支持的加密版本: ${keyVersion || 'unknown'}`)
      }

      // 2. 获取加密密钥（可能需要用户签名）
      const encryptionKey = await this.deriveEncryptionKey(walletAddress, signMessageAsync)

      // 3. 解密数据
      const nonceArray = new Uint8Array(nonce)
      const ciphertextArray = new Uint8Array(ciphertext)
      const cipher = xchacha20poly1305(encryptionKey, nonceArray)
      const plaintext = cipher.decrypt(ciphertextArray)

      // 4. 解析配置数据
      const configData = JSON.parse(new TextDecoder().decode(plaintext))
      
      // 5. 构建完整的解密配置对象
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
      
      // 提供更具体的错误信息
      if (error instanceof Error) {
        if (error.message.includes('不支持的加密版本')) {
          throw new Error('配置版本不兼容，请重新创建此配置')
        }
        if (error.message.includes('用户取消') || error.message.includes('签名')) {
          throw new Error('需要签名验证身份才能解密配置')
        }
        if (error.message.includes('钱包连接已断开') || error.message.includes('Connector not found')) {
          throw new Error('钱包连接已断开，请重新连接')
        }
        if (error.message.includes('invalid') || error.message.includes('SyntaxError')) {
          throw new Error('配置数据已损坏或格式错误')
        }
        if (error.message.includes('decrypt')) {
          throw new Error('解密失败，可能是密钥不匹配')
        }
        
        // 如果是已知错误，直接抛出
        throw error
      }
      
      throw new Error('配置解密过程中发生未知错误')
    }
  }

  /**
   * 验证加密数据的完整性
   */
  static validateEncryptedData(encryptedData: string): boolean {
    try {
      const data = JSON.parse(encryptedData)
      return !!(
        data.nonce &&
        data.ciphertext &&
        data.keyVersion &&
        Array.isArray(data.nonce) &&
        Array.isArray(data.ciphertext) &&
        data.nonce.length === 24 && // XChaCha20Poly1305 nonce
        data.ciphertext.length > 16 && // 至少包含认证标签
        data.keyVersion === '2.0'
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

  /**
   * 清除指定地址的加密密钥缓存
   */
  static clearEncryptionKeyCache(walletAddress: string): void {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${walletAddress.toLowerCase()}`
      sessionStorage.removeItem(cacheKey)
    } catch (error) {
      console.warn('清除密钥缓存失败:', error)
    }
  }

  /**
   * 清除所有加密密钥缓存
   */
  static clearAllEncryptionKeyCache(): void {
    try {
      const keys = Object.keys(sessionStorage)
      keys.forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('清除所有密钥缓存失败:', error)
    }
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