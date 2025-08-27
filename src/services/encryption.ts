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
 * - 移除了 sessionStorage 缓存机制
 * - 使用确定性签名确保密钥一致性
 */
export class WalletBasedEncryptionService {

  /**
   * 通过确定性签名派生加密密钥
   * 
   * 新实现说明：
   * - 使用固定消息确保签名确定性
   * - 移除缓存机制，每次都能得到相同结果
   * - 简化错误处理逻辑
   */
  private static async deriveEncryptionKey(
    walletAddress: string, 
    signMessageAsync: (message: { message: string }) => Promise<string>
  ): Promise<Uint8Array> {
    try {
      // 使用确定性签名服务派生主密钥
      return await DeterministicSignatureService.deriveMasterKey(
        walletAddress,
        signMessageAsync
      )
    } catch (error) {
      console.error('派生加密密钥失败:', error)
      throw error // 直接抛出，让确定性签名服务处理具体错误
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
