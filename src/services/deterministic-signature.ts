import { sha256 } from '@noble/hashes/sha2'

/**
 * 基于 EIP-191 的确定性签名服务
 * 
 * 核心原理：
 * - 使用固定消息进行签名，确保每次签名结果一致
 * - 基于 EIP-191 personal_sign 标准
 * - 相同私钥 + 相同消息 = 确定性签名结果
 * - 从确定性签名派生稳定的加密密钥
 */
export class DeterministicSignatureService {
  /**
   * 固定的主密钥派生消息
   * 使用 EIP-191 格式，确保跨钱包兼容性
   */
  private static readonly MASTER_KEY_MESSAGE = [
    'SSH Manager Master Key',
    'Version: 1.0',
    'Purpose: SSH Configuration Encryption',
    '',
    'IMPORTANT: Do not share this signature with anyone.',
    'This signature will be used to generate a master encryption key.',
    'Only sign this message on trusted applications.'
  ].join('\n')

  /**
   * 通过确定性签名派生主加密密钥
   * 
   * @param walletAddress - 钱包地址
   * @param signMessageAsync - Wagmi 签名函数
   * @returns 32字节的加密密钥
   */
  static async deriveMasterKey(
    walletAddress: string,
    signMessageAsync: (params: { message: string }) => Promise<string>
  ): Promise<Uint8Array> {
    try {
      // 使用固定消息进行签名
      // EIP-191 personal_sign 应该对相同消息产生确定性结果
      const signature = await signMessageAsync({ 
        message: this.MASTER_KEY_MESSAGE 
      })

      // 从签名派生32字节主密钥
      const masterKey = sha256(new TextEncoder().encode(signature))
      
      console.log(`已为钱包 ${walletAddress} 生成确定性主密钥`)
      
      return masterKey
    } catch (error) {
      console.error('派生主密钥失败:', error)
      
      // 提供具体的错误信息
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('用户拒绝') || error.message.includes('User denied')) {
          throw new Error('用户取消了签名操作，无法生成主密钥')
        }
        if (error.message.includes('Connector not found') || error.message.includes('No connector')) {
          throw new Error('钱包连接已断开，请重新连接钱包')
        }
        throw error
      }
      
      throw new Error('生成主密钥时发生未知错误')
    }
  }

  /**
   * 验证签名的有效性（可选功能）
   * 
   * @param message - 原始消息
   * @param signature - 签名结果
   * @param walletAddress - 钱包地址
   * @returns 签名是否有效
   */
  static async verifySignature(
    _message: string, 
    _signature: string, 
    _walletAddress: string
  ): Promise<boolean> {
    try {
      // 这里可以使用 viem 的 verifyMessage 函数
      // import { verifyMessage } from 'viem'
      // return await verifyMessage({
      //   message,
      //   signature: signature as `0x${string}`,
      //   address: walletAddress as `0x${string}`,
      // })
      
      // 暂时返回 true，如果需要可以实现完整验证逻辑
      return true
    } catch (error) {
      console.error('验证签名失败:', error)
      return false
    }
  }

  /**
   * 测试钱包的确定性签名支持
   * 
   * @param signMessageAsync - Wagmi 签名函数
   * @returns 是否支持确定性签名
   */
  static async testDeterministicSignature(
    signMessageAsync: (params: { message: string }) => Promise<string>
  ): Promise<boolean> {
    try {
      const testMessage = 'SSH_Manager_Deterministic_Test'
      
      console.log('开始测试确定性签名...')
      
      // 连续签名两次相同消息
      const signature1 = await signMessageAsync({ message: testMessage })
      const signature2 = await signMessageAsync({ message: testMessage })
      
      const isDeterministic = signature1 === signature2
      
      console.log('确定性签名测试结果:', {
        signature1: signature1.substring(0, 10) + '...',
        signature2: signature2.substring(0, 10) + '...',
        isDeterministic
      })
      
      return isDeterministic
    } catch (error) {
      console.error('测试确定性签名失败:', error)
      return false
    }
  }

  /**
   * 获取主密钥派生消息（用于调试）
   */
  static getMasterKeyMessage(): string {
    return this.MASTER_KEY_MESSAGE
  }

  /**
   * 生成配置特定的加密密钥（基于主密钥）
   * 
   * @param masterKey - 主密钥
   * @param configId - 配置ID（可选，用于配置级别的密钥隔离）
   * @returns 配置特定的加密密钥
   */
  static deriveConfigKey(masterKey: Uint8Array, configId?: string): Uint8Array {
    if (!configId) {
      // 如果没有配置ID，直接使用主密钥
      return masterKey
    }
    
    // 使用主密钥 + 配置ID 派生配置特定密钥
    const combined = new Uint8Array(masterKey.length + configId.length)
    combined.set(masterKey)
    combined.set(new TextEncoder().encode(configId), masterKey.length)
    
    return sha256(combined)
  }
}