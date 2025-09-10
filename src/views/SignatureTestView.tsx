import { useState } from 'react'
import { Icon } from '@iconify/react'
import { WalletBasedEncryptionService } from '@/services/encryption'
import { DeterministicSignatureService } from '@/services/deterministic-signature'
import { useWalletStore } from '@/stores/walletStore'
import toast from 'react-hot-toast'

interface SignatureTestResult {
  signature1: string
  signature2: string
  isDeterministic: boolean
  masterKey1: string
  masterKey2: string
  isKeyConsistent: boolean
  timestamp: string
}

export function SignatureTestView() {
  const { account, isConnected, signMessage } = useWalletStore()
  
  const [isTestingDeterministic, setIsTestingDeterministic] = useState(false)
  const [isTestingEncryption, setIsTestingEncryption] = useState(false)
  const [testResults, setTestResults] = useState<SignatureTestResult[]>([])
  
  // Test deterministic signature
  const testDeterministicSignature = async () => {
    if (!account || !isConnected) {
      toast.error('Please connect wallet first')
      return
    }

    setIsTestingDeterministic(true)
    
    try {
      console.log('Starting deterministic signature test...')
      
      // Get fixed message
      const testMessage = DeterministicSignatureService.getMasterKeyMessage()
      
      // Sign twice consecutively
      const signature1 = await signMessage(testMessage)
      const signature2 = await signMessage(testMessage)
      
      // Check if signatures are the same
      const isDeterministic = signature1 === signature2
      
      // Derive master key from signature
      const masterKey1 = Array.from(
        await DeterministicSignatureService.deriveMasterKey(address, 
          () => Promise.resolve(signature1)
        )
      ).map(b => b.toString(16).padStart(2, '0')).join('')
      
      const masterKey2 = Array.from(
        await DeterministicSignatureService.deriveMasterKey(address, 
          () => Promise.resolve(signature2)
        )
      ).map(b => b.toString(16).padStart(2, '0')).join('')
      
      const isKeyConsistent = masterKey1 === masterKey2
      
      const result: SignatureTestResult = {
        signature1: signature1.substring(0, 20) + '...',
        signature2: signature2.substring(0, 20) + '...',
        isDeterministic,
        masterKey1: masterKey1.substring(0, 20) + '...',
        masterKey2: masterKey2.substring(0, 20) + '...',
        isKeyConsistent,
        timestamp: new Date().toLocaleString(),
      }
      
      setTestResults(prev => [result, ...prev])
      
      if (isDeterministic && isKeyConsistent) {
        toast.success('✅ Wallet supports deterministic signatures!')
      } else if (isKeyConsistent) {
        toast.success('✅ Keys are consistent! (Although signatures differ, keys are the same)')
      } else {
        toast.error('❌ Wallet does not support deterministic signatures, keys are inconsistent')
      }
      
      console.log('Test result:', result)
      
    } catch (error) {
      console.error('Test failed:', error)
      toast.error('Test failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsTestingDeterministic(false)
    }
  }
  
  // Test encryption and decryption flow
  const testEncryptionFlow = async () => {
    if (!account || !isConnected) {
      toast.error('Please connect wallet first')
      return
    }

    setIsTestingEncryption(true)
    
    try {
      console.log('Starting encryption and decryption flow test...')
      
      const testConfig = {
        name: 'Test Configuration',
        host: '127.0.0.1',
        port: 22,
        username: 'test',
        authType: 'password' as const,
        password: 'test123',
      }
      
      // First encryption
      const encrypted1 = await WalletBasedEncryptionService.encryptSSHConfig(
        testConfig, account, signMessage
      )
      
      // Second encryption of the same data
      const _encrypted2 = await WalletBasedEncryptionService.encryptSSHConfig(
        testConfig, account, signMessage
      )
      
      // Decrypt the first data
      const decrypted1 = await WalletBasedEncryptionService.decryptSSHConfig(
        encrypted1, account, 'test1', new Date(), true, signMessage
      )
      
      // Use the second key to decrypt the first data
      const decrypted2 = await WalletBasedEncryptionService.decryptSSHConfig(
        encrypted1, account, 'test2', new Date(), true, signMessage
      )
      
      const isDecryptionConsistent = 
        decrypted1.name === testConfig.name && 
        decrypted2.name === testConfig.name &&
        decrypted1.password === testConfig.password &&
        decrypted2.password === testConfig.password
      
      if (isDecryptionConsistent) {
        toast.success('✅ Encryption and decryption flow is normal! Data consistency verification passed')
      } else {
        toast.error('❌ Encryption and decryption has issues!')
      }
      
      console.log('Decryption result 1:', decrypted1)
      console.log('Decryption result 2:', decrypted2)
      
    } catch (error) {
      console.error('Encryption test failed:', error)
      toast.error('Encryption test failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsTestingEncryption(false)
    }
  }
  
  // Clear test results
  const clearResults = () => {
    setTestResults([])
    toast.success('Test results cleared')
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Icon icon="mdi:wallet" className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Wallet Connection Required</h2>
          <p className="text-neutral-400">Please connect your wallet first to test deterministic signatures</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Deterministic Signature Test</h1>
          <p className="text-neutral-400">
            Test whether the current wallet supports EIP-191 deterministic signatures and verify the stability of encryption and decryption
          </p>
          <div className="mt-4 p-4 bg-neutral-900 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Current Wallet:</span> {address}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Deterministic signature test */}
          <div className="bg-neutral-900 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Icon icon="mdi:key-variant" className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-xl font-semibold">Deterministic Signature Test</h2>
            </div>
            <p className="text-neutral-400 text-sm mb-6">
              Test whether the wallet produces consistent signatures and master keys for the same message
            </p>
            <button
              onClick={testDeterministicSignature}
              disabled={isTestingDeterministic}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-colors"
            >
              {isTestingDeterministic ? (
                <>
                  <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Icon icon="mdi:play" className="w-4 h-4 mr-2" />
                  Start Test
                </>
              )}
            </button>
          </div>

          {/* Encryption flow test */}
          <div className="bg-neutral-900 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Icon icon="mdi:shield-key" className="w-6 h-6 text-green-400 mr-3" />
              <h2 className="text-xl font-semibold">Encryption Flow Test</h2>
            </div>
            <p className="text-neutral-400 text-sm mb-6">
              Test the complete encryption and decryption flow, verify data consistency
            </p>
            <button
              onClick={testEncryptionFlow}
              disabled={isTestingEncryption}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-colors"
            >
              {isTestingEncryption ? (
                <>
                  <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Icon icon="mdi:play" className="w-4 h-4 mr-2" />
                  Start Test
                </>
              )}
            </button>
          </div>
        </div>

        {/* Test results */}
        {testResults.length > 0 && (
          <div className="bg-neutral-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Test Results</h2>
              <button
                onClick={clearResults}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <Icon icon="mdi:trash-can" className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className="border border-neutral-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-neutral-400">
                      {result.timestamp}
                    </span>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        result.isDeterministic 
                          ? 'bg-blue-900 text-blue-200' 
                          : 'bg-yellow-900 text-yellow-200'
                      }`}>
                        {result.isDeterministic ? 'Signatures Match' : 'Signatures Differ'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        result.isKeyConsistent 
                          ? 'bg-green-900 text-green-200' 
                          : 'bg-red-900 text-red-200'
                      }`}>
                        {result.isKeyConsistent ? 'Keys Match' : 'Keys Differ'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-neutral-400 mb-1">Signature 1:</p>
                      <p className="font-mono">{result.signature1}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 mb-1">Signature 2:</p>
                      <p className="font-mono">{result.signature2}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 mb-1">Key 1:</p>
                      <p className="font-mono">{result.masterKey1}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 mb-1">Key 2:</p>
                      <p className="font-mono">{result.masterKey2}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
