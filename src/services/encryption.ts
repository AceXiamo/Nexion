import { xchacha20poly1305 } from '@noble/ciphers/chacha'
import { randomBytes } from '@noble/ciphers/utils'
import { DeterministicSignatureService } from './deterministic-signature'
import type { SSHConfigInput, DecryptedSSHConfig } from '@/types/ssh'

/**
 * 基于确定性签名的 SSH 配置加密服务
 * 使用确定性钱包签名派生稳定加密密钥，采用 ChaCha20Poly1305 对称加密
 * 
 * 重构说明：
 * - 移除了不稳定的基于日期的密钥派生
 * - 添加了主密钥内存+持久缓存机制，避免重复签名
 * - 使用确定性签名确保密钥一致性
 * - 支持localStorage持久化，用户断开钱包时自动清理
 */
/**
 * 持久缓存数据结构
 */
interface CachedMasterKey {
  version: string
  walletAddress: string
  masterKey: number[] // Uint8Array 转换为普通数组存储
  timestamp: number
  expiresAt: number
}

export class WalletBasedEncryptionService {
  // 主密钥内存缓存：钱包地址 -> 主密钥
  private static masterKeyCache = new Map<string, Uint8Array>()
  
  // 持久缓存配置
  private static readonly CACHE_KEY_PREFIX = 'ssh_master_key_'
  private static readonly CACHE_VERSION = '1.0'
  private static readonly CACHE_EXPIRY_HOURS = 24 // 24小时过期

  /**
   * 检查localStorage是否可用
   */
  private static isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false
      }
      
      // 测试localStorage读写功能
      const testKey = '__ssh_localStorage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  /**
   * 生成持久缓存的键
   */
  private static getCacheKey(walletAddress: string): string {
    return `${this.CACHE_KEY_PREFIX}${walletAddress.toLowerCase()}`
  }

  /**
   * 从localStorage读取持久缓存的主密钥
   */
  private static loadMasterKeyFromPersistentCache(walletAddress: string): Uint8Array | null {
    try {
      if (!this.isLocalStorageAvailable()) {
        return null
      }

      const cacheKey = this.getCacheKey(walletAddress)
      const cachedData = localStorage.getItem(cacheKey)
      
      if (!cachedData) {
        return null
      }

      const parsed: CachedMasterKey = JSON.parse(cachedData)
      
      // 验证缓存版本
      if (parsed.version !== this.CACHE_VERSION) {
        console.log(`缓存版本不匹配，清理旧版本缓存: ${parsed.version} != ${this.CACHE_VERSION}`)
        localStorage.removeItem(cacheKey)
        return null
      }

      // 验证缓存是否过期
      if (Date.now() > parsed.expiresAt) {
        console.log(`缓存已过期，清理过期缓存: ${walletAddress}`)
        localStorage.removeItem(cacheKey)
        return null
      }

      // 验证钱包地址
      if (parsed.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        console.log(`钱包地址不匹配，清理无效缓存`)
        localStorage.removeItem(cacheKey)
        return null
      }

      console.log(`从持久缓存加载主密钥: ${walletAddress}`)
      return new Uint8Array(parsed.masterKey)
    } catch (error) {
      console.error('读取持久缓存失败:', error)
      // 清理损坏的缓存
      try {
        localStorage.removeItem(this.getCacheKey(walletAddress))
      } catch (cleanupError) {
        console.error('清理损坏缓存失败:', cleanupError)
      }
      return null
    }
  }

  /**
   * 将主密钥保存到localStorage持久缓存
   */
  private static saveMasterKeyToPersistentCache(walletAddress: string, masterKey: Uint8Array): void {
    try {
      if (!this.isLocalStorageAvailable()) {
        console.log('localStorage不可用，跳过持久缓存保存')
        return
      }

      const now = Date.now()
      const expiresAt = now + (this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000)
      
      const cacheData: CachedMasterKey = {
        version: this.CACHE_VERSION,
        walletAddress: walletAddress.toLowerCase(),
        masterKey: Array.from(masterKey), // 转换为普通数组
        timestamp: now,
        expiresAt
      }

      const cacheKey = this.getCacheKey(walletAddress)
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
      console.log(`主密钥已保存到持久缓存: ${walletAddress}，过期时间: ${new Date(expiresAt).toLocaleString()}`)
    } catch (error) {
      console.error('保存主密钥到持久缓存失败:', error)
      // 持久缓存失败不影响正常功能，继续使用内存缓存
    }
  }

  /**
   * 清理指定钱包的持久缓存
   */
  private static clearPersistentCache(walletAddress: string): void {
    try {
      if (!this.isLocalStorageAvailable()) {
        return
      }

      const cacheKey = this.getCacheKey(walletAddress)
      const removed = localStorage.getItem(cacheKey) !== null
      localStorage.removeItem(cacheKey)
      console.log(`清理持久缓存: ${walletAddress}`, removed ? '成功' : '无缓存')
    } catch (error) {
      console.error('清理持久缓存失败:', error)
    }
  }

  /**
   * 清理所有SSH相关的持久缓存
   */
  private static clearAllPersistentCache(): void {
    try {
      if (!this.isLocalStorageAvailable()) {
        return
      }

      const keysToRemove: string[] = []
      
      // 遍历localStorage找到所有SSH缓存键
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.CACHE_KEY_PREFIX)) {
          keysToRemove.push(key)
        }
      }

      // 删除找到的缓存
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })

      console.log(`清理所有持久缓存，共 ${keysToRemove.length} 个`)
    } catch (error) {
      console.error('清理所有持久缓存失败:', error)
    }
  }

  /**
   * 通过确定性签名派生加密密钥（带双重缓存）
   * 
   * 新实现说明：
   * - 使用固定消息确保签名确定性
   * - 添加内存+持久双重缓存，同一钱包地址只需签名一次
   * - 支持跨会话缓存，提升用户体验
   * - 钱包断开连接时自动清理所有缓存
   */
  private static async deriveEncryptionKey(
    walletAddress: string, 
    signMessageAsync: (message: { message: string }) => Promise<string>
  ): Promise<Uint8Array> {
    try {
      const addressKey = walletAddress.toLowerCase()

      // 1. 检查内存缓存（最快）
      const memoryCachedKey = this.masterKeyCache.get(addressKey)
      if (memoryCachedKey) {
        console.log(`使用内存缓存的主密钥: ${walletAddress}`)
        return memoryCachedKey
      }

      // 2. 检查持久缓存（避免跨会话重复签名）
      const persistentCachedKey = this.loadMasterKeyFromPersistentCache(walletAddress)
      if (persistentCachedKey) {
        console.log(`使用持久缓存的主密钥: ${walletAddress}`)
        // 同时更新内存缓存以提高后续访问速度
        this.masterKeyCache.set(addressKey, persistentCachedKey)
        return persistentCachedKey
      }

      // 3. 缓存全部未命中，需要重新派生主密钥
      console.log(`派生新的主密钥: ${walletAddress}`)
      const masterKey = await DeterministicSignatureService.deriveMasterKey(
        walletAddress,
        signMessageAsync
      )

      // 4. 同时更新内存缓存和持久缓存
      this.masterKeyCache.set(addressKey, masterKey)
      this.saveMasterKeyToPersistentCache(walletAddress, masterKey)
      console.log(`主密钥已缓存（内存+持久）: ${walletAddress}`)

      return masterKey
    } catch (error) {
      console.error('派生加密密钥失败:', error)
      throw error // 直接抛出，让确定性签名服务处理具体错误
    }
  }

  /**
   * 清理指定钱包地址的主密钥缓存（内存+持久）
   */
  static clearMasterKeyCache(walletAddress?: string): void {
    if (walletAddress) {
      // 清理内存缓存
      const memoryRemoved = this.masterKeyCache.delete(walletAddress.toLowerCase())
      // 清理持久缓存
      this.clearPersistentCache(walletAddress)
      console.log(`清理钱包 ${walletAddress} 的主密钥缓存（内存+持久）:`, memoryRemoved ? '成功' : '无内存缓存')
    } else {
      // 清理所有内存缓存
      const memorySize = this.masterKeyCache.size
      this.masterKeyCache.clear()
      // 清理所有持久缓存
      this.clearAllPersistentCache()
      console.log(`清理所有主密钥缓存（内存+持久），内存缓存 ${memorySize} 个`)
    }
  }

  /**
   * 获取当前缓存状态（调试用）
   */
  static getCacheStatus(): { 
    memoryCache: { cachedAddresses: string[], cacheSize: number }
    persistentCache: { cachedAddresses: string[], cacheSize: number }
  } {
    const persistentCachedAddresses: string[] = []
    
    try {
      if (this.isLocalStorageAvailable()) {
        // 扫描localStorage中的SSH缓存
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(this.CACHE_KEY_PREFIX)) {
            // 提取钱包地址
            const address = key.substring(this.CACHE_KEY_PREFIX.length)
            persistentCachedAddresses.push(address)
          }
        }
      }
    } catch (error) {
      console.error('扫描持久缓存失败:', error)
    }

    return {
      memoryCache: {
        cachedAddresses: Array.from(this.masterKeyCache.keys()),
        cacheSize: this.masterKeyCache.size
      },
      persistentCache: {
        cachedAddresses: persistentCachedAddresses,
        cacheSize: persistentCachedAddresses.length
      }
    }
  }

  /**
   * 清理过期的持久缓存（维护任务）
   */
  static cleanupExpiredPersistentCache(): void {
    try {
      if (!this.isLocalStorageAvailable()) {
        return
      }

      const keysToRemove: string[] = []
      const now = Date.now()
      
      // 遍历所有SSH缓存
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.CACHE_KEY_PREFIX)) {
          try {
            const cachedData = localStorage.getItem(key)
            if (cachedData) {
              const parsed: CachedMasterKey = JSON.parse(cachedData)
              
              // 检查是否过期或版本不匹配
              if (now > parsed.expiresAt || parsed.version !== this.CACHE_VERSION) {
                keysToRemove.push(key)
              }
            }
          } catch (parseError) {
            // 损坏的缓存也要清理
            console.error(`解析缓存失败，将清理: ${key}`, parseError)
            keysToRemove.push(key)
          }
        }
      }

      // 删除过期缓存
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })

      if (keysToRemove.length > 0) {
        console.log(`清理过期持久缓存，共 ${keysToRemove.length} 个`)
      }
    } catch (error) {
      console.error('清理过期持久缓存失败:', error)
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
        keyVersion: '3.0' // 确定性签名版本标识
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

      // 检查版本 - 支持新的确定性签名版本
      if (keyVersion !== '3.0' && keyVersion !== '2.0') {
        throw new Error(`不支持的加密版本: ${keyVersion || 'unknown'}。请升级应用或重新创建配置。`)
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
        (data.keyVersion === '3.0' || data.keyVersion === '2.0')
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
   * 测试确定性签名支持（调试功能）
   */
  static async testDeterministicSignature(
    signMessageAsync: (message: { message: string }) => Promise<string>
  ): Promise<boolean> {
    return await DeterministicSignatureService.testDeterministicSignature(signMessageAsync)
  }
}
