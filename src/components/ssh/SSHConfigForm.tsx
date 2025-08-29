import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Icon } from '@iconify/react'
import { useTranslation } from 'react-i18next'
import type { SSHConfigInput, DecryptedSSHConfig } from '@/types/ssh'

// 表单验证 Schema 工厂函数
const createSSHConfigSchema = (t: any) => z
  .object({
    name: z.string().min(1, t('ssh:formErrors.nameRequired')).max(50, t('ssh:formErrors.nameMaxLength')),
    host: z
      .string()
      .min(1, t('ssh:formErrors.hostRequired'))
      .refine((value) => {
        // 验证 IP 地址或域名格式
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
        const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/
        return ipRegex.test(value) || domainRegex.test(value)
      }, t('ssh:formErrors.hostInvalid')),
    port: z.number().min(1, t('ssh:formErrors.portMin')).max(65535, t('ssh:formErrors.portMax')).int(t('ssh:formErrors.portInteger')),
    username: z
      .string()
      .min(1, t('ssh:formErrors.usernameRequired'))
      .max(32, t('ssh:formErrors.usernameMaxLength'))
      .regex(/^[a-zA-Z0-9_-]+$/, t('ssh:formErrors.usernameInvalid')),
    authType: z.enum(['password', 'key'], {
      required_error: t('ssh:formErrors.authTypeRequired'),
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
      message: t('ssh:formErrors.authInfoRequired'),
      path: ['authType'],
    }
  )

type FormData = z.infer<ReturnType<typeof createSSHConfigSchema>>

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

export function SSHConfigForm({ config, onSubmit, onCancel, onSubmitStart, onSubmitError, isSubmitting = false, submitLabel, showActions = true }: SSHConfigFormProps) {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showPassphrase, setShowPassphrase] = useState(false)

  const isEditing = !!config
  const sshConfigSchema = createSSHConfigSchema(t)

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
      console.error('Form submission failed:', error)
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
            <span>{t('ssh:basicInfo')}</span>
          </h3>

          {/* 配置名称 */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-200">
              {t('ssh:configName')} <span className="text-red-400">*</span>
            </label>
            <input {...register('name')} className="input" placeholder={t('ssh:configNamePlaceholder')} />
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
                {t('ssh:host')} <span className="text-red-400">*</span>
              </label>
              <input {...register('host')} className="input" placeholder={t('ssh:hostPlaceholder')} />
              {errors.host && (
                <p className="text-sm text-red-400 flex items-center space-x-1">
                  <Icon icon="mdi:alert-circle" className="w-4 h-4" />
                  <span>{errors.host.message}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-neutral-200">
                {t('ssh:port')} <span className="text-red-400">*</span>
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
              {t('ssh:username')} <span className="text-red-400">*</span>
            </label>
            <input {...register('username')} className="input" placeholder={t('ssh:usernamePlaceholder')} />
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
            <span>{t('ssh:authConfig')}</span>
          </h3>

          {/* 认证类型选择 */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-200">
              {t('ssh:authMethod')} <span className="text-red-400">*</span>
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
                <div className="text-sm font-medium">{t('ssh:passwordAuth')}</div>
                <div className="text-xs text-neutral-400 mt-1">{t('ssh:passwordAuthDesc')}</div>
              </button>

              <button
                type="button"
                onClick={() => setValue('authType', 'key')}
                className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                  authType === 'key' ? 'border-lime-400 bg-lime-400/10 text-white' : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-600'
                }`}
              >
                <Icon icon="mdi:key-variant" className="w-6 h-6 mx-auto mb-1" />
                <div className="text-sm font-medium">{t('ssh:keyAuth')}</div>
                <div className="text-xs text-neutral-400 mt-1">{t('ssh:keyAuthDesc')}</div>
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
                {t('ssh:password')} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input {...register('password')} type={showPassword ? 'text' : 'password'} className="input pr-12" placeholder={t('ssh:passwordPlaceholder')} />
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
                  {t('ssh:privateKey')} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <textarea
                    {...register('privateKey')}
                    className="input min-h-32 font-mono text-sm resize-y"
                    placeholder={t('ssh:privateKeyPlaceholder')}
                    style={{ display: showPrivateKey ? 'block' : 'none' }}
                  />
                  {!showPrivateKey && (
                    <div className="input min-h-32 flex items-center justify-center cursor-pointer border-dashed" onClick={() => setShowPrivateKey(true)}>
                      <div className="text-center text-neutral-400">
                        <Icon icon="mdi:key-variant" className="w-8 h-8 mx-auto mb-1" />
                        <p className="text-sm">{t('ssh:clickToShowPrivateKey')}</p>
                        <p className="text-xs mt-1">{t('ssh:privateKeySecurityNote')}</p>
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
                  {t('ssh:passphrase')} <span className="text-neutral-500">({t('common:optional')})</span>
                </label>
                <div className="relative">
                  <input {...register('passphrase')} type={showPassphrase ? 'text' : 'password'} className="input pr-12" placeholder={t('ssh:passphrasePlaceholder')} />
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
              <p className="font-medium text-lime-400 mb-1">{t('ssh:securityTitle')}</p>
              <ul className="space-y-0.5 text-xs">
                <li>{t('ssh:securityFeature1')}</li>
                <li>{t('ssh:securityFeature2')}</li>
                <li>{t('ssh:securityFeature3')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 表单按钮 */}
        {showActions && (
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-800">
            <button type="button" onClick={onCancel} disabled={isSubmitting} className="btn-secondary disabled:opacity-50">
              <span>{t('common:cancel')}</span>
            </button>

            <button type="submit" disabled={!isValid || isSubmitting} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? (
                <>
                  <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                  <span>{isEditing ? t('ssh:updating') : t('ssh:submitting')}</span>
                </>
              ) : (
                <>
                  <Icon icon={isEditing ? 'mdi:check' : 'mdi:plus'} className="w-4 h-4" />
                  <span>{submitLabel || t('ssh:saveConfig')}</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
