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
  
  // 测试确定性签名
  const testDeterministicSignature = async () => {
    if (!account || !isConnected) {
      toast.error('请先连接钱包')
      return
    }

    setIsTestingDeterministic(true)
    
    try {
      console.log('开始测试确定性签名...')
      
      // 获取固定消息
      const testMessage = DeterministicSignatureService.getMasterKeyMessage()
      
      // 连续签名两次
      const signature1 = await signMessage(testMessage)
      const signature2 = await signMessage(testMessage)
      
      // 检查签名是否相同
      const isDeterministic = signature1 === signature2
      
      // 从签名派生主密钥
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
        toast.success('✅ 钱包支持确定性签名！')
      } else if (isKeyConsistent) {
        toast.success('✅ 密钥一致！（虽然签名不同，但密钥相同）')
      } else {
        toast.error('❌ 钱包不支持确定性签名，密钥不一致')
      }
      
      console.log('测试结果:', result)
      
    } catch (error) {
      console.error('测试失败:', error)
      toast.error('测试失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setIsTestingDeterministic(false)
    }
  }
  
  // 测试加密解密流程
  const testEncryptionFlow = async () => {
    if (!account || !isConnected) {
      toast.error('请先连接钱包')
      return
    }

    setIsTestingEncryption(true)
    
    try {
      console.log('开始测试加密解密流程...')
      
      const testConfig = {
        name: '测试配置',
        host: '127.0.0.1',
        port: 22,
        username: 'test',
        authType: 'password' as const,
        password: 'test123',
      }
      
      // 第一次加密
      const encrypted1 = await WalletBasedEncryptionService.encryptSSHConfig(
        testConfig, account, signMessage
      )
      
      // 第二次加密相同数据
      const _encrypted2 = await WalletBasedEncryptionService.encryptSSHConfig(
        testConfig, account, signMessage
      )
      
      // 解密第一次的数据
      const decrypted1 = await WalletBasedEncryptionService.decryptSSHConfig(
        encrypted1, account, 'test1', new Date(), true, signMessage
      )
      
      // 用第二次的密钥解密第一次的数据
      const decrypted2 = await WalletBasedEncryptionService.decryptSSHConfig(
        encrypted1, account, 'test2', new Date(), true, signMessage
      )
      
      const isDecryptionConsistent = 
        decrypted1.name === testConfig.name && 
        decrypted2.name === testConfig.name &&
        decrypted1.password === testConfig.password &&
        decrypted2.password === testConfig.password
      
      if (isDecryptionConsistent) {
        toast.success('✅ 加密解密流程正常！数据一致性验证通过')
      } else {
        toast.error('❌ 加密解密存在问题！')
      }
      
      console.log('解密结果1:', decrypted1)
      console.log('解密结果2:', decrypted2)
      
    } catch (error) {
      console.error('加密测试失败:', error)
      toast.error('加密测试失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setIsTestingEncryption(false)
    }
  }
  
  // 清除测试结果
  const clearResults = () => {
    setTestResults([])
    toast.success('测试结果已清除')
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Icon icon="mdi:wallet" className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">需要连接钱包</h2>
          <p className="text-neutral-400">请先连接钱包以测试确定性签名</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">确定性签名测试</h1>
          <p className="text-neutral-400">
            测试当前钱包是否支持 EIP-191 确定性签名，验证加密解密的稳定性
          </p>
          <div className="mt-4 p-4 bg-neutral-900 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">当前钱包:</span> {address}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 确定性签名测试 */}
          <div className="bg-neutral-900 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Icon icon="mdi:key-variant" className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-xl font-semibold">确定性签名测试</h2>
            </div>
            <p className="text-neutral-400 text-sm mb-6">
              测试钱包对相同消息是否产生一致的签名和主密钥
            </p>
            <button
              onClick={testDeterministicSignature}
              disabled={isTestingDeterministic}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-colors"
            >
              {isTestingDeterministic ? (
                <>
                  <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                  测试中...
                </>
              ) : (
                <>
                  <Icon icon="mdi:play" className="w-4 h-4 mr-2" />
                  开始测试
                </>
              )}
            </button>
          </div>

          {/* 加密流程测试 */}
          <div className="bg-neutral-900 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Icon icon="mdi:shield-key" className="w-6 h-6 text-green-400 mr-3" />
              <h2 className="text-xl font-semibold">加密流程测试</h2>
            </div>
            <p className="text-neutral-400 text-sm mb-6">
              测试完整的加密解密流程，验证数据一致性
            </p>
            <button
              onClick={testEncryptionFlow}
              disabled={isTestingEncryption}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-medium transition-colors"
            >
              {isTestingEncryption ? (
                <>
                  <Icon icon="mdi:loading" className="w-4 h-4 mr-2 animate-spin" />
                  测试中...
                </>
              ) : (
                <>
                  <Icon icon="mdi:play" className="w-4 h-4 mr-2" />
                  开始测试
                </>
              )}
            </button>
          </div>
        </div>

        {/* 测试结果 */}
        {testResults.length > 0 && (
          <div className="bg-neutral-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">测试结果</h2>
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
                        {result.isDeterministic ? '签名一致' : '签名不同'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        result.isKeyConsistent 
                          ? 'bg-green-900 text-green-200' 
                          : 'bg-red-900 text-red-200'
                      }`}>
                        {result.isKeyConsistent ? '密钥一致' : '密钥不同'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-neutral-400 mb-1">签名1:</p>
                      <p className="font-mono">{result.signature1}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 mb-1">签名2:</p>
                      <p className="font-mono">{result.signature2}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 mb-1">密钥1:</p>
                      <p className="font-mono">{result.masterKey1}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 mb-1">密钥2:</p>
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