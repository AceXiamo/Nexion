import { xchacha20poly1305 } from '@noble/ciphers/chacha'
import { randomBytes } from '@noble/ciphers/utils'
import { DeterministicSignatureService } from './deterministic-signature'
import type { SSHConfigInput, DecryptedSSHConfig } from '@/types/ssh'

/**
 * SSH configuration encryption service based on deterministic signatures
 * Uses deterministic wallet signatures to derive stable encryption keys, employing ChaCha20Poly1305 symmetric encryption
 * 
 * Refactoring notes:
 * - Removed unstable date-based key derivation
 * - Added master key memory + persistent cache mechanism to avoid repeated signing
 * - Uses deterministic signatures to ensure key consistency
 * - Supports localStorage persistence, automatically cleaned when wallet is disconnected
 */
/**
 * Persistent cache data structure
 */
interface CachedMasterKey {
  version: string
  walletAddress: string
  masterKey: number[] // Uint8Array 转换为普通数组存储
  timestamp: number
  expiresAt: number
}

export class WalletBasedEncryptionService {
  // Master key memory cache: wallet address -> master key
  private static masterKeyCache = new Map<string, Uint8Array>()
  
  // Persistent cache configuration
  private static readonly CACHE_KEY_PREFIX = 'ssh_master_key_'
  private static readonly CACHE_VERSION = '1.0'
  private static readonly CACHE_EXPIRY_HOURS = 24 // 24 hours expiry

  /**
   * Check if localStorage is available
   */
  private static isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false
      }
      
      // Test localStorage read/write functionality
      const testKey = '__ssh_localStorage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  /**
   * Generate persistent cache key
   */
  private static getCacheKey(walletAddress: string): string {
    return `${this.CACHE_KEY_PREFIX}${walletAddress.toLowerCase()}`
  }

  /**
   * Load master key from localStorage persistent cache
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
      
      // Verify cache version
      if (parsed.version !== this.CACHE_VERSION) {
        console.log(`Cache version mismatch, clearing old version cache: ${parsed.version} != ${this.CACHE_VERSION}`)
        localStorage.removeItem(cacheKey)
        return null
      }

      // Verify if cache is expired
      if (Date.now() > parsed.expiresAt) {
        console.log(`Cache expired, clearing expired cache: ${walletAddress}`)
        localStorage.removeItem(cacheKey)
        return null
      }

      // Verify wallet address
      if (parsed.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        console.log(`Wallet address mismatch, clearing invalid cache`)
        localStorage.removeItem(cacheKey)
        return null
      }

      console.log(`Loading master key from persistent cache: ${walletAddress}`)
      return new Uint8Array(parsed.masterKey)
    } catch (error) {
      console.error('Failed to read persistent cache:', error)
      // Clean up corrupted cache
      try {
        localStorage.removeItem(this.getCacheKey(walletAddress))
      } catch (cleanupError) {
        console.error('Failed to clean up corrupted cache:', cleanupError)
      }
      return null
    }
  }

  /**
   * Save master key to localStorage persistent cache
   */
  private static saveMasterKeyToPersistentCache(walletAddress: string, masterKey: Uint8Array): void {
    try {
      if (!this.isLocalStorageAvailable()) {
        console.log('localStorage unavailable, skipping persistent cache save')
        return
      }

      const now = Date.now()
      const expiresAt = now + (this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000)
      
      const cacheData: CachedMasterKey = {
        version: this.CACHE_VERSION,
        walletAddress: walletAddress.toLowerCase(),
        masterKey: Array.from(masterKey), // Convert to regular array
        timestamp: now,
        expiresAt
      }

      const cacheKey = this.getCacheKey(walletAddress)
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
      console.log(`Master key saved to persistent cache: ${walletAddress}, expires at: ${new Date(expiresAt).toLocaleString()}`)
    } catch (error) {
      console.error('Failed to save master key to persistent cache:', error)
      // Persistent cache failure doesn't affect normal functionality, continue using memory cache
    }
  }

  /**
   * Clear persistent cache for specified wallet
   */
  private static clearPersistentCache(walletAddress: string): void {
    try {
      if (!this.isLocalStorageAvailable()) {
        return
      }

      const cacheKey = this.getCacheKey(walletAddress)
      const removed = localStorage.getItem(cacheKey) !== null
      localStorage.removeItem(cacheKey)
      console.log(`Clear persistent cache: ${walletAddress}`, removed ? 'success' : 'no cache')
    } catch (error) {
      console.error('Failed to clear persistent cache:', error)
    }
  }

  /**
   * Clear all SSH-related persistent cache
   */
  private static clearAllPersistentCache(): void {
    try {
      if (!this.isLocalStorageAvailable()) {
        return
      }

      const keysToRemove: string[] = []
      
      // Traverse localStorage to find all SSH cache keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.CACHE_KEY_PREFIX)) {
          keysToRemove.push(key)
        }
      }

      // Delete found caches
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })

      console.log(`Cleared all persistent cache, total ${keysToRemove.length} items`)
    } catch (error) {
      console.error('Failed to clear all persistent cache:', error)
    }
  }

  /**
   * Derive encryption key through deterministic signature (with dual cache)
   * 
   * New implementation notes:
   * - Uses fixed messages to ensure signature determinism
   * - Adds memory + persistent dual cache, same wallet address only needs to sign once
   * - Supports cross-session cache, improving user experience
   * - Automatically clears all cache when wallet is disconnected
   */
  private static async deriveEncryptionKey(
    walletAddress: string, 
    signMessageAsync: (message: { message: string }) => Promise<string>
  ): Promise<Uint8Array> {
    try {
      const addressKey = walletAddress.toLowerCase()

      // 1. Check memory cache (fastest)
      const memoryCachedKey = this.masterKeyCache.get(addressKey)
      if (memoryCachedKey) {
        console.log(`Using memory cached master key: ${walletAddress}`)
        return memoryCachedKey
      }

      // 2. Check persistent cache (avoid cross-session duplicate signing)
      const persistentCachedKey = this.loadMasterKeyFromPersistentCache(walletAddress)
      if (persistentCachedKey) {
        console.log(`Using persistent cached master key: ${walletAddress}`)
        // Also update memory cache to improve subsequent access speed
        this.masterKeyCache.set(addressKey, persistentCachedKey)
        return persistentCachedKey
      }

      // 3. All caches missed, need to re-derive master key
      console.log(`Deriving new master key: ${walletAddress}`)
      const masterKey = await DeterministicSignatureService.deriveMasterKey(
        walletAddress,
        signMessageAsync
      )

      // 4. Update both memory cache and persistent cache
      this.masterKeyCache.set(addressKey, masterKey)
      this.saveMasterKeyToPersistentCache(walletAddress, masterKey)
      console.log(`Master key cached (memory + persistent): ${walletAddress}`)

      return masterKey
    } catch (error) {
      console.error('Failed to derive encryption key:', error)
      throw error // Throw directly, let deterministic signature service handle specific errors
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
        // Scan SSH cache in localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(this.CACHE_KEY_PREFIX)) {
            // Extract wallet address
            const address = key.substring(this.CACHE_KEY_PREFIX.length)
            persistentCachedAddresses.push(address)
          }
        }
      }
    } catch (error) {
      console.error('Failed to scan persistent cache:', error)
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
   * Clean up expired persistent cache (maintenance task)
   */
  static cleanupExpiredPersistentCache(): void {
    try {
      if (!this.isLocalStorageAvailable()) {
        return
      }

      const keysToRemove: string[] = []
      const now = Date.now()
      
      // Traverse all SSH caches
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.CACHE_KEY_PREFIX)) {
          try {
            const cachedData = localStorage.getItem(key)
            if (cachedData) {
              const parsed: CachedMasterKey = JSON.parse(cachedData)
              
              // Check if expired or version mismatch
              if (now > parsed.expiresAt || parsed.version !== this.CACHE_VERSION) {
                keysToRemove.push(key)
              }
            }
          } catch (parseError) {
            // Corrupted cache also needs to be cleaned
            console.error(`Failed to parse cache, will clean: ${key}`, parseError)
            keysToRemove.push(key)
          }
        }
      }

      // Delete expired caches
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })

      if (keysToRemove.length > 0) {
        console.log(`Cleaned expired persistent cache, total ${keysToRemove.length} items`)
      }
    } catch (error) {
      console.error('Failed to clean expired persistent cache:', error)
    }
  }



  /**
   * Encrypt SSH configuration using user wallet address
   */
  static async encryptSSHConfig(
    config: SSHConfigInput,
    walletAddress: string,
    signMessageAsync: (message: { message: string }) => Promise<string>
  ): Promise<string> {
    try {
      // 1. Get or generate encryption key
      const encryptionKey = await this.deriveEncryptionKey(walletAddress, signMessageAsync)

      // 2. Serialize configuration data
      const configData = JSON.stringify({
        ...config,
        timestamp: Date.now(),
      })
      const plaintext = new TextEncoder().encode(configData)

      // 3. Generate random nonce
      const nonce = randomBytes(24) // XChaCha20Poly1305 requires 24-byte nonce

      // 4. Use symmetric encryption
      const cipher = xchacha20poly1305(encryptionKey, nonce)
      const ciphertext = cipher.encrypt(plaintext)

      // 5. Return simplified result format
      const result = {
        nonce: Array.from(nonce),
        ciphertext: Array.from(ciphertext),
        keyVersion: '3.0' // Deterministic signature version identifier
      }

      return JSON.stringify(result)
    } catch (error) {
      console.error('SSH configuration encryption failed:', error)
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('用户取消') || error.message.includes('签名')) {
          throw new Error('User cancelled the signing operation, encryption process interrupted')
        }
        if (error.message.includes('钱包连接已断开') || error.message.includes('Connector not found')) {
          throw new Error('Wallet connection lost, please reconnect wallet and try again')
        }
        if (error.message.includes('网络') || error.message.includes('连接')) {
          throw new Error('Network connection error, please check network and try again')
        }
        
        // If it's a known error, throw directly
        throw error
      }
      
      throw new Error('Unknown error occurred during configuration encryption, please try again')
    }
  }

  /**
   * Decrypt SSH configuration using user wallet address
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
      // 1. Parse encrypted data
      const encrypted = JSON.parse(encryptedData)
      const { nonce, ciphertext, keyVersion } = encrypted

      // Check version - support new deterministic signature versions
      if (keyVersion !== '3.0' && keyVersion !== '2.0') {
        throw new Error(`Unsupported encryption version: ${keyVersion || 'unknown'}. Please upgrade the application or recreate the configuration.`)
      }

      // 2. Get encryption key (may require user signature)
      const encryptionKey = await this.deriveEncryptionKey(walletAddress, signMessageAsync)

      // 3. Decrypt data
      const nonceArray = new Uint8Array(nonce)
      const ciphertextArray = new Uint8Array(ciphertext)
      const cipher = xchacha20poly1305(encryptionKey, nonceArray)
      const plaintext = cipher.decrypt(ciphertextArray)

      // 4. Parse configuration data
      const configData = JSON.parse(new TextDecoder().decode(plaintext))
      
      // 5. Build complete decrypted configuration object
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
      console.error('SSH configuration decryption failed:', error)
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('不支持的加密版本')) {
          throw new Error('Configuration version incompatible, please recreate this configuration')
        }
        if (error.message.includes('用户取消') || error.message.includes('签名')) {
          throw new Error('Signature verification required to decrypt configuration')
        }
        if (error.message.includes('钱包连接已断开') || error.message.includes('Connector not found')) {
          throw new Error('Wallet connection lost, please reconnect')
        }
        if (error.message.includes('invalid') || error.message.includes('SyntaxError')) {
          throw new Error('Configuration data is corrupted or format error')
        }
        if (error.message.includes('decrypt')) {
          throw new Error('Decryption failed, possible key mismatch')
        }
        
        // If it's a known error, throw directly
        throw error
      }
      
      throw new Error('Unknown error occurred during configuration decryption')
    }
  }

  /**
   * Validate the integrity of encrypted data
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
        data.ciphertext.length > 16 && // At least contains authentication tag
        (data.keyVersion === '3.0' || data.keyVersion === '2.0')
      )
    } catch {
      return false
    }
  }

  /**
   * Generate configuration summary (for display, does not contain sensitive information)
   */
  static generateConfigSummary(config: DecryptedSSHConfig): string {
    return `${config.name} (${config.username}@${config.host}:${config.port})`
  }

  /**
   * Test deterministic signature support (debugging feature)
   */
  static async testDeterministicSignature(
    signMessageAsync: (message: { message: string }) => Promise<string>
  ): Promise<boolean> {
    return await DeterministicSignatureService.testDeterministicSignature(signMessageAsync)
  }
}
