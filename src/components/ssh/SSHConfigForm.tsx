import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import type { SSHConfigInput, DecryptedSSHConfig } from '@/types/ssh'

// 表单验证 Schema
const sshConfigSchema = z
  .object({
    name: z.string().min(1, '配置名称不能为空').max(50, '配置名称不能超过 50 个字符'),
    host: z
      .string()
      .min(1, '主机地址不能为空')
      .refine((value) => {
        // 验证 IP 地址或域名格式
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/
        return ipRegex.test(value) || domainRegex.test(value)
      }, '请输入有效的 IP 地址或域名'),
    port: z.number().min(1, '端口号不能小于 1').max(65535, '端口号不能大于 65535').int('端口号必须是整数'),
    username: z
      .string()
      .min(1, '用户名不能为空')
      .max(32, '用户名不能超过 32 个字符')
      .regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和连字符'),
    authType: z.enum(['password', 'key'], {
      required_error: '请选择认证类型',
    }),
    password: z.string().optional(),
    privateKey: z.string().optional(),
    passphrase: z.string().optional(),
  })
  .refine(
    (data) => {
      // 根据认证类型验证对应字段
      if (data.authType === 'password') {
        return data.password && data.password.length >= 1
      } else {
        return data.privateKey && data.privateKey.length >= 1
      }
    },
    {
      message: '请填写对应的认证信息',
      path: ['authType'],
    }
  )

type FormData = z.infer<typeof sshConfigSchema>

interface SSHConfigFormProps {
  config?: DecryptedSSHConfig
  onSubmit: (config: SSHConfigInput) => Promise<void>
  onCancel: () => void
  onSubmitStart?: () => void
  onSubmitError?: (error: any) => void
  isSubmitting?: boolean
  submitLabel?: string
  showActions?: boolean
}

export function SSHConfigForm({ config, onSubmit, onCancel, onSubmitStart, onSubmitError, isSubmitting = false, submitLabel = '保存配置', showActions = true }: SSHConfigFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showPassphrase, setShowPassphrase] = useState(false)

  const isEditing = !!config

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(sshConfigSchema),
    defaultValues: config
      ? {
          name: config.name,
          host: config.host,
          port: config.port,
          username: config.username,
          authType: config.authType,
          password: config.password || '',
          privateKey: config.privateKey || '',
          passphrase: config.passphrase || '',
        }
      : {
          name: '',
          host: '',
          port: 22,
          username: '',
          authType: 'password',
          password: '',
          privateKey: '',
          passphrase: '',
        },
    mode: 'onChange',
  })

  const authType = watch('authType')

  const handleFormSubmit = async (data: FormData) => {
    try {
      onSubmitStart?.()
      await onSubmit(data)
    } catch (error) {
      console.error('表单提交失败:', error)
      onSubmitError?.(error)
    }
  }

  return (
    <div className="space-y-2">
      {/* 表单标题 */}
      <div className="text-center">
        <div className="w-12 h-12 bg-lime-400/10 rounded-xl flex items-center justify-center mx-auto mb-1">
          <Icon icon={isEditing ? 'mdi:pencil' : 'mdi:server-plus'} className="w-6 h-6 text-lime-400" />
        </div>
      </div>

      {/* 表单内容 */}
      <form id="ssh-config-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-2">
        {/* 基础信息 */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-white flex items-center space-x-2">
            <Icon icon="mdi:information" className="w-4 h-4 text-lime-400" />
            <span>基础信息</span>
          </h3>

          {/* 配置名称 */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-200">
              配置名称 <span className="text-red-400">*</span>
            </label>
            <input {...register('name')} className="input" placeholder="例如: 生产环境服务器" />
            {errors.name && (
              <p className="text-sm text-red-400 flex items-center space-x-1">
                <Icon icon="mdi:alert-circle" className="w-4 h-4" />
                <span>{errors.name.message}</span>
              </p>
            )}
          </div>

          {/* 主机地址和端口 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1">
              <label className="block text-sm font-medium text-neutral-200">
                主机地址 <span className="text-red-400">*</span>
              </label>
              <input {...register('host')} className="input" placeholder="192.168.1.100 或 example.com" />
              {errors.host && (
                <p className="text-sm text-red-400 flex items-center space-x-1">
                  <Icon icon="mdi:alert-circle" className="w-4 h-4" />
                  <span>{errors.host.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-200">
                端口 <span className="text-red-400">*</span>
              </label>
              <input {...register('port', { valueAsNumber: true })} type="number" className="input" placeholder="22" min="1" max="65535" />
              {errors.port && (
                <p className="text-sm text-red-400 flex items-center space-x-1">
                  <Icon icon="mdi:alert-circle" className="w-4 h-4" />
                  <span>{errors.port.message}</span>
                </p>
              )}
            </div>
          </div>

          {/* 用户名 */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-200">
              用户名 <span className="text-red-400">*</span>
            </label>
            <input {...register('username')} className="input" placeholder="root, admin, ubuntu 等" />
            {errors.username && (
              <p className="text-sm text-red-400 flex items-center space-x-1">
                <Icon icon="mdi:alert-circle" className="w-4 h-4" />
                <span>{errors.username.message}</span>
              </p>
            )}
          </div>
        </div>

        {/* 认证配置 */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-white flex items-center space-x-2">
            <Icon icon="mdi:key" className="w-4 h-4 text-lime-400" />
            <span>认证配置</span>
          </h3>

          {/* 认证类型选择 */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-200">
              认证方式 <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue('authType', 'password')}
                className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                  authType === 'password' ? 'border-lime-400 bg-lime-400/10 text-white' : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600'
                }`}
              >
                <Icon icon="mdi:lock" className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm font-medium">密码认证</div>
                <div className="text-xs text-neutral-400 mt-1">使用用户名和密码</div>
              </button>

              <button
                type="button"
                onClick={() => setValue('authType', 'key')}
                className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                  authType === 'key' ? 'border-lime-400 bg-lime-400/10 text-white' : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600'
                }`}
              >
                <Icon icon="mdi:key-variant" className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm font-medium">密钥认证</div>
                <div className="text-xs text-neutral-400 mt-1">使用私钥文件</div>
              </button>
            </div>
            {errors.authType && (
              <p className="text-sm text-red-400 flex items-center space-x-1">
                <Icon icon="mdi:alert-circle" className="w-4 h-4" />
                <span>{errors.authType.message}</span>
              </p>
            )}
          </div>

          {/* 密码认证字段 */}
          {authType === 'password' && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-200">
                密码 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input {...register('password')} type={showPassword ? 'text' : 'password'} className="input pr-12" placeholder="输入 SSH 登录密码" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 btn-icon">
                  <Icon icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} className="w-4 h-4" />
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-400 flex items-center space-x-1">
                  <Icon icon="mdi:alert-circle" className="w-4 h-4" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>
          )}

          {/* 密钥认证字段 */}
          {authType === 'key' && (
            <div className="space-y-2">
              {/* 私钥 */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-neutral-200">
                  私钥内容 <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <textarea
                    {...register('privateKey')}
                    className="input min-h-32 font-mono text-sm resize-y"
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----
请粘贴完整的私钥内容...
-----END OPENSSH PRIVATE KEY-----"
                    style={{ display: showPrivateKey ? 'block' : 'none' }}
                  />
                  {!showPrivateKey && (
                    <div className="input min-h-32 flex items-center justify-center cursor-pointer border-dashed" onClick={() => setShowPrivateKey(true)}>
                      <div className="text-center text-neutral-400">
                        <Icon icon="mdi:key-variant" className="w-8 h-8 mx-auto mb-1" />
                        <p className="text-sm">点击显示私钥输入框</p>
                        <p className="text-xs mt-1">私钥将被端到端加密存储</p>
                      </div>
                    </div>
                  )}
                  {showPrivateKey && (
                    <button type="button" onClick={() => setShowPrivateKey(false)} className="absolute top-2 right-2 btn-icon">
                      <Icon icon="mdi:eye-off" className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {errors.privateKey && (
                  <p className="text-sm text-red-400 flex items-center space-x-1">
                    <Icon icon="mdi:alert-circle" className="w-4 h-4" />
                    <span>{errors.privateKey.message}</span>
                  </p>
                )}
              </div>

              {/* 私钥密码 (可选) */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-neutral-200">
                  私钥密码 <span className="text-neutral-500">(可选)</span>
                </label>
                <div className="relative">
                  <input {...register('passphrase')} type={showPassphrase ? 'text' : 'password'} className="input pr-12" placeholder="如果私钥有密码保护，请输入" />
                  <button type="button" onClick={() => setShowPassphrase(!showPassphrase)} className="absolute right-3 top-1/2 transform -translate-y-1/2 btn-icon">
                    <Icon icon={showPassphrase ? 'mdi:eye-off' : 'mdi:eye'} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 安全提示 */}
        <div className="bg-lime-400/5 border border-lime-400/20 rounded-lg p-2 mb-4">
          <div className="flex items-start space-x-2">
            <Icon icon="mdi:shield-check" className="w-4 h-4 text-lime-400 mt-0.5" />
            <div className="text-xs text-neutral-300 leading-relaxed">
              <p className="font-medium text-lime-400 mb-1">🔒 安全保障</p>
              <ul className="space-y-0.5 text-xs">
                <li>• 端到端加密，使用您的钱包地址</li>
                <li>• 数据安全存储在区块链上</li>
                <li>• 只有您的钱包可以解密访问</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 表单按钮 */}
        {showActions && (
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-800">
            <button type="button" onClick={onCancel} disabled={isSubmitting} className="btn-secondary disabled:opacity-50">
              <span>取消</span>
            </button>

            <button type="submit" disabled={!isValid || isSubmitting} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? (
                <>
                  <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                  <span>{isEditing ? '更新中...' : '提交中...'}</span>
                </>
              ) : (
                <>
                  <Icon icon={isEditing ? 'mdi:check' : 'mdi:plus'} className="w-4 h-4" />
                  <span>{submitLabel}</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
