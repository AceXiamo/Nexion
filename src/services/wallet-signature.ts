import * as secp256k1 from '@noble/secp256k1'
import { sha256 } from '@noble/hashes/sha2'
import { keccak_256 } from '@noble/hashes/sha3'

/**
 * 钱包签名服务 - 用于获取真实公钥
 */
export class WalletSignatureService {
  private static readonly SIGNATURE_MESSAGE = 'SSH Manager: Derive encryption key'
  private static readonly MESSAGE_PREFIX = '\x19Ethereum Signed Message:\n'

  /**
   * 请求用户签名来获取公钥
   */
  static async getPublicKeyFromSignature(walletAddress: string): Promise<Uint8Array> {
    try {
      // 检查是否支持 ethereum
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('需要安装支持以太坊的钱包（如MetaMask、OKX Wallet）')
      }

      // 构造待签名消息
      const message = `${this.SIGNATURE_MESSAGE}\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`
      
      // 请求用户签名
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      })

      // 从签名中恢复公钥
      const publicKey = await this.recoverPublicKeyFromSignature(message, signature)
      
      // 验证恢复的公钥对应的地址是否匹配
      const recoveredAddress = this.publicKeyToAddress(publicKey)
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('公钥恢复失败：地址不匹配')
      }

      return publicKey
    } catch (error) {
      console.error('获取公钥失败:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('签名过程中发生未知错误')
    }
  }

  /**
   * 从签名中恢复公钥
   */
  private static async recoverPublicKeyFromSignature(
    message: string,
    signature: string
  ): Promise<Uint8Array> {
    try {
      // 移除0x前缀
      const sig = signature.startsWith('0x') ? signature.slice(2) : signature
      
      if (sig.length !== 130) {
        throw new Error('无效的签名格式')
      }

      // 解析签名组件
      const r = BigInt('0x' + sig.slice(0, 64))
      const s = BigInt('0x' + sig.slice(64, 128))
      const v = parseInt(sig.slice(128, 130), 16)

      // 处理 v 值 (27/28 or 0/1)
      const recovery = v >= 27 ? v - 27 : v

      // 构造以太坊消息哈希
      const messageHash = this.hashMessage(message)

      // 构造签名对象
      const rBytes = this.hexToBytes(this.bigIntToBytes(r, 32))
      const sBytes = this.hexToBytes(this.bigIntToBytes(s, 32))
      
      const signature = new secp256k1.Signature(r, s).addRecoveryBit(recovery)
      const publicKey = signature.recoverPublicKey(messageHash)

      return publicKey.toRawBytes(false) // 返回非压缩格式
    } catch (error) {
      console.error('公钥恢复失败:', error)
      throw new Error('无法从签名中恢复公钥')
    }
  }

  /**
   * 计算以太坊消息哈希
   */
  private static hashMessage(message: string): Uint8Array {
    const messageBytes = new TextEncoder().encode(message)
    const prefixBytes = new TextEncoder().encode(this.MESSAGE_PREFIX + messageBytes.length.toString())
    
    const combined = new Uint8Array(prefixBytes.length + messageBytes.length)
    combined.set(prefixBytes)
    combined.set(messageBytes, prefixBytes.length)
    
    return keccak_256(combined)
  }

  /**
   * 将公钥转换为以太坊地址
   */
  private static publicKeyToAddress(publicKey: Uint8Array): string {
    // 移除0x04前缀（如果存在）
    const pubKey = publicKey.length === 65 ? publicKey.slice(1) : publicKey
    const hash = keccak_256(pubKey)
    // 取后20字节作为地址
    const address = hash.slice(-20)
    return '0x' + Array.from(address).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * 将BigInt转换为字节数组
   */
  private static bigIntToBytes(value: bigint, length: number): string {
    return value.toString(16).padStart(length * 2, '0')
  }

  /**
   * 将十六进制字符串转换为Uint8Array
   */
  private static hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
    }
    return bytes
  }

  /**
   * 检查是否可以使用钱包签名
   */
  static isWalletSignatureAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum
  }

  /**
   * 获取缓存的公钥（如果存在）
   */
  static getCachedPublicKey(walletAddress: string): Uint8Array | null {
    try {
      const cacheKey = `pubkey_${walletAddress.toLowerCase()}`
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const data = JSON.parse(cached)
        // 检查缓存是否过期（24小时）
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          return new Uint8Array(data.publicKey)
        } else {
          sessionStorage.removeItem(cacheKey)
        }
      }
      return null
    } catch (error) {
      console.warn('读取公钥缓存失败:', error)
      return null
    }
  }

  /**
   * 缓存公钥
   */
  static cachePublicKey(walletAddress: string, publicKey: Uint8Array): void {
    try {
      const cacheKey = `pubkey_${walletAddress.toLowerCase()}`
      const cacheData = {
        publicKey: Array.from(publicKey),
        timestamp: Date.now(),
      }
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('公钥缓存失败:', error)
    }
  }
}

// 扩展Window接口以支持ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isMetaMask?: boolean
      isOKXWallet?: boolean
    }
  }
}