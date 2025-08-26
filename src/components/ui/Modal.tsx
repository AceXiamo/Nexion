import { ReactNode, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  // 处理 ESC 键关闭
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEscape])

  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      // 延迟恢复滚动，等待退场动画完成
      const timer = setTimeout(() => {
        document.body.style.overflow = 'unset'
      }, 250) // 与动画时间匹配，留一点缓冲
      
      return () => clearTimeout(timer)
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md'
      case 'md':
        return 'max-w-lg'
      case 'lg':
        return 'max-w-2xl'
      case 'xl':
        return 'max-w-4xl'
      case 'full':
        return 'max-w-full mx-4'
      default:
        return 'max-w-lg'
    }
  }

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  // 动画变体配置
  const overlayVariants = {
    hidden: { 
      opacity: 0,
    },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  }

  const modalVariants = {
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
        ease: [0.25, 0.46, 0.45, 0.94], // cubic-bezier easing
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    }
  }

  const contentVariants = {
    hidden: { 
      opacity: 0,
      y: 10 
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" key="modal">
          {/* 动画遮罩层 */}
          <motion.div 
            key="overlay"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleOverlayClick}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          />
          
          {/* 模态框容器 */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div 
              key="modal-content"
              className={`
                relative w-full ${getSizeClass()} 
                bg-black border border-neutral-800 rounded-2xl shadow-2xl
                max-h-[90vh] overflow-hidden flex flex-col
              `}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* 模态框头部 */}
              {(title || showCloseButton) && (
                <motion.div 
                  key="modal-header"
                  className="flex items-center justify-between p-6 pb-0"
                  variants={contentVariants}
                >
                  {title && (
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                  )}
                  
                  {showCloseButton && (
                    <motion.button
                      onClick={onClose}
                      className="btn-icon ml-auto"
                      aria-label="关闭"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon icon="mdi:close" className="w-5 h-5" />
                    </motion.button>
                  )}
                </motion.div>
              )}

              {/* 模态框内容 */}
              <motion.div 
                key="modal-body"
                className="flex-1 overflow-y-auto"
                variants={contentVariants}
              >
                <div className="p-6">
                  {children}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}