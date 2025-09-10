import { sha256 } from '@noble/hashes/sha2'

/**
 * Deterministic signature service based on EIP-191
 *
 * Core principles:
 * - Uses fixed messages for signing to ensure consistent signature results
 * - Based on the EIP-191 personal_sign standard
 * - Same private key + same message = deterministic signature result
 * - Derives stable encryption keys from deterministic signatures
 */
export class DeterministicSignatureService {
  /**
   * Fixed master key derivation message
   * Uses EIP-191 format to ensure cross-wallet compatibility
   */
  private static readonly MASTER_KEY_MESSAGE = [
    'SSH Manager Master Key',
    'Version: 1.0',
    'Purpose: SSH Configuration Encryption',
    '',
    'IMPORTANT: Do not share this signature with anyone.',
    'This signature will be used to generate a master encryption key.',
    'Only sign this message on trusted applications.',
  ].join('\n')

  /**
   * Derive master encryption key through deterministic signature
   *
   * @param walletAddress - Wallet address
   * @param signMessageAsync - Wagmi signing function
   * @returns 32-byte encryption key
   */
  static async deriveMasterKey(walletAddress: string, signMessageAsync: (params: { message: string }) => Promise<string>): Promise<Uint8Array> {
    try {
      // Sign with fixed message
      // EIP-191 personal_sign should produce deterministic results for the same message
      const signature = await signMessageAsync({
        message: this.MASTER_KEY_MESSAGE,
      })

      // Derive 32-byte master key from signature
      const masterKey = sha256(new TextEncoder().encode(signature))

      console.log(`Generated deterministic master key for wallet ${walletAddress}`)

      return masterKey
    } catch (error) {
      console.error('Failed to derive master key:', error)

      // Provide specific error messages
      if (error instanceof Error) {
        if (error.message.includes('User rejected') || error.message.includes('用户拒绝') || error.message.includes('User denied')) {
          throw new Error('User cancelled the signing operation, unable to generate master key')
        }
        if (error.message.includes('Connector not found') || error.message.includes('No connector')) {
          throw new Error('Wallet connection lost, please reconnect your wallet')
        }
        throw error
      }

      throw new Error('Unknown error occurred while generating master key')
    }
  }

  /**
   * Test wallet's deterministic signature support
   *
   * @param signMessageAsync - Wagmi signing function
   * @returns Whether deterministic signatures are supported
   */
  static async testDeterministicSignature(signMessageAsync: (params: { message: string }) => Promise<string>): Promise<boolean> {
    try {
      const testMessage = 'SSH_Manager_Deterministic_Test'

      console.log('Starting deterministic signature test...')

      // Sign the same message twice consecutively
      const signature1 = await signMessageAsync({ message: testMessage })
      const signature2 = await signMessageAsync({ message: testMessage })

      const isDeterministic = signature1 === signature2

      console.log('Deterministic signature test results:', {
        signature1: signature1.substring(0, 10) + '...',
        signature2: signature2.substring(0, 10) + '...',
        isDeterministic,
      })

      return isDeterministic
    } catch (error) {
      console.error('Failed to test deterministic signature:', error)
      return false
    }
  }

  /**
   * Get master key derivation message (for debugging)
   */
  static getMasterKeyMessage(): string {
    return this.MASTER_KEY_MESSAGE
  }

  /**
   * Generate configuration-specific encryption key (based on master key)
   *
   * @param masterKey - Master key
   * @param configId - Configuration ID (optional, for configuration-level key isolation)
   * @returns Configuration-specific encryption key
   */
  static deriveConfigKey(masterKey: Uint8Array, configId?: string): Uint8Array {
    if (!configId) {
      // If no configuration ID, use master key directly
      return masterKey
    }

    // Use master key + configuration ID to derive configuration-specific key
    const combined = new Uint8Array(masterKey.length + configId.length)
    combined.set(masterKey)
    combined.set(new TextEncoder().encode(configId), masterKey.length)

    return sha256(combined)
  }
}
