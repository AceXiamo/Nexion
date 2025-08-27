import { useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { format } from 'date-fns'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import type { DecryptedSSHConfig } from '@/types/ssh'

// 动画变体配置 - 与 Dialog 组件保持一致
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  

  // 处理删除确认
  const handleDeleteConfirm = () => {
    onDelete(config.id)
    setShowDeleteConfirm(false)
  }

  // 处理 ESC 键关闭删除弹框
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
      {/* OKX 风格卡片布局 */}
      <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg shadow-sm hover:bg-[#1a1a1a] hover:border-[#333333] transition-all duration-200 ease-out">
        <div className="p-4">
          {/* 卡片内容 - flex 布局 */}
          <div className="flex items-center justify-between">
            {/* 左侧信息 */}
            <div className="flex-1 min-w-0">
              {/* IP 地址 */}
              <div className="text-white font-medium text-sm mb-1 font-mono truncate">
                {config.host}
              </div>
              
              {/* 创建时间 */}
              <div className="text-[#888888] text-xs">
                {format(config.createdAt, 'MM-dd HH:mm')}
              </div>
            </div>

            {/* 右侧操作按钮 */}
            <div className="flex items-center space-x-2 ml-3">
              {/* 编辑按钮 */}
              <button
                onClick={() => onEdit(config)}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent border border-[#333333] text-[#CCCCCC] hover:border-[#BCFF2F] hover:text-[#BCFF2F] transition-all duration-200"
                title="编辑配置"
              >
                <Icon icon="mdi:pencil" className="w-4 h-4" />
              </button>

              {/* 删除按钮 */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-transparent border border-[#333333] text-[#CCCCCC] hover:border-red-400 hover:text-red-400 transition-all duration-200"
                title="删除配置"
              >
                <Icon icon="mdi:delete" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 删除确认对话框 - 使用 Framer Motion 动画 */}
      <AnimatePresence mode="wait">
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" key="delete-dialog">
            {/* 背景遮罩 */}
            <motion.div
              key="delete-overlay"
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)}
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            />

            {/* 对话框内容 */}
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
                  <h3 className="text-lg font-semibold text-[#FFFFFF] mb-2">确认删除配置</h3>
                  <p className="text-sm text-[#CCCCCC] leading-relaxed">
                    您确定要删除配置 <span className="text-[#FFFFFF] font-medium">"{config.host}"</span> 吗？
                    <br />
                    <span className="text-red-400">此操作无法撤销</span>，配置将从区块链上永久移除。
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)} 
                    className="h-9 px-4 bg-transparent border border-[#333333] text-[#CCCCCC] rounded-md hover:border-[#BCFF2F] hover:text-[#BCFF2F] transition-all duration-200"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleDeleteConfirm} 
                    className="h-9 px-4 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Icon icon="mdi:delete" className="w-4 h-4" />
                    <span>确认删除</span>
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
