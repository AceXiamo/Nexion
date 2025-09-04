import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { format } from 'date-fns'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import type { DecryptedSSHConfig } from '@/types/ssh'

// Animation variant configuration - consistent with Dialog component
const overlayVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

const dialogVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

interface SSHConfigCardProps {
  config: DecryptedSSHConfig
  onEdit: (config: DecryptedSSHConfig) => void
  onDelete: (configId: string) => void
}

export function SSHConfigCard({ config, onEdit, onDelete }: SSHConfigCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  // Handle connection to terminal - create new session
  const handleConnect = async () => {
    if (!window.ipcRenderer.ssh) {
      console.error('SSH IPC not available')
      return
    }

    setIsConnecting(true)

    try {
      const result = await window.ipcRenderer.ssh.createSession(config)

      if (result.success && result.sessionId) {
        // Navigate to the newly created session terminal page
        navigate(`/terminal/${result.sessionId}`)
      } else {
        console.error('Failed to create session:', result.error)
        // TODO: Show error notification
      }
    } catch (error) {
      console.error('Error creating session:', error)
      // TODO: Show error notification
    } finally {
      setIsConnecting(false)
    }
  }

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    onDelete(config.id)
    setShowDeleteConfirm(false)
  }

  // Handle ESC key to close delete dialog
  useEffect(() => {
    if (!showDeleteConfirm) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDeleteConfirm(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showDeleteConfirm])

  return (
    <>
      {/* OKX style card layout */}
      <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg shadow-sm hover:bg-[#1a1a1a] hover:border-[#333333] transition-all duration-200 ease-out">
        <div className="p-4">
          {/* Card content - flex layout */}
          <div className="flex items-center justify-between">
            {/* Left side information */}
            <div className="flex-1 min-w-0 mr-2">
              {/* IP address */}
              <div className="text-white font-medium text-sm mb-1 font-mono truncate">{config.host}</div>

              {/* Creation time */}
              <div className="text-[#888888] text-xs">{format(config.createdAt, 'MM-dd HH:mm')}</div>
            </div>

            {/* Right side action buttons */}
            <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
              {/* Connect button */}
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 ${
                  isConnecting ? 'bg-[#BCFF2F]/50 text-black cursor-not-allowed' : 'bg-[#BCFF2F] text-black hover:bg-[#a8e529]'
                }`}
                title={isConnecting ? t('ssh:creatingSession') : t('ssh:connectTerminal')}
              >
                <Icon icon={isConnecting ? 'mdi:loading' : 'mdi:console'} className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`} />
              </button>

              {/* Edit button */}
              <button
                onClick={() => onEdit(config)}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent border border-[#333333] text-[#CCCCCC] hover:border-[#BCFF2F] hover:text-[#BCFF2F] transition-all duration-200"
                title={t('ssh:editConfig')}
              >
                <Icon icon="mdi:pencil" className="w-4 h-4" />
              </button>

              {/* Delete button */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent border border-[#333333] text-[#CCCCCC] hover:border-red-400 hover:text-red-400 transition-all duration-200"
                title={t('ssh:deleteConfig')}
              >
                <Icon icon="mdi:delete" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog - using Framer Motion animation */}
      <AnimatePresence mode="wait">
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" key="delete-dialog">
            {/* Background overlay */}
            <motion.div
              key="delete-overlay"
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            />

            {/* Dialog content */}
            <motion.div key="delete-content" className="relative z-50 w-full max-w-md mx-4" variants={dialogVariants} initial="hidden" animate="visible" exit="exit">
              <motion.div
                className="bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-xl p-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon icon="mdi:alert-circle" className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#FFFFFF] mb-2">{t('ssh:confirmDeleteConfig')}</h3>
                  <p className="text-sm text-[#CCCCCC] leading-relaxed">
                    {t('ssh:confirmDeleteConfigDesc')} <span className="text-[#FFFFFF] font-medium">"{config.host}"</span>?
                    <br />
                    <span className="text-red-400">{t('ssh:cannotUndo')}</span>. {t('ssh:configWillBeRemoved')}.
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="h-9 px-4 bg-transparent border border-[#333333] text-[#CCCCCC] rounded-md hover:border-[#BCFF2F] hover:text-[#BCFF2F] transition-all duration-200"
                  >
                    {t('common:cancel')}
                  </button>
                  <button onClick={handleDeleteConfirm} className="h-9 px-4 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors duration-200 flex items-center space-x-2">
                    <Icon icon="mdi:delete" className="w-4 h-4" />
                    <span>{t('ssh:confirmDelete')}</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
