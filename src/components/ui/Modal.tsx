import { ReactNode, useEffect, useState, useId, useRef } from 'react'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { modalManager } from '@/lib/modal-manager'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  disableContentAnimation?: boolean
  disableBackdropBlur?: boolean
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
  disableContentAnimation = false,
  disableBackdropBlur = false
}: ModalProps) {
  const modalId = useId()
  const [isClosing, setIsClosing] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const modalContentRef = useRef<HTMLDivElement>(null)

  // Handle modal registration and ESC key
  useEffect(() => {
    if (isOpen) {
      if (closeOnEscape) {
        modalManager.register(modalId, onClose)
      }
      setShouldRender(true)
      setIsClosing(false)
    }

    return () => {
      modalManager.unregister(modalId)
    }
  }, [isOpen, modalId, onClose, closeOnEscape])

  // Handle closing with animation delay
  useEffect(() => {
    if (!isOpen && shouldRender) {
      setIsClosing(true)
      // 延迟移除DOM，等待动画完成
      const timer = setTimeout(() => {
        setShouldRender(false)
        setIsClosing(false)
      }, 250) // 匹配动画时长
      
      return () => clearTimeout(timer)
    } else if (isOpen) {
      setShouldRender(true)
      setIsClosing(false)
    }
  }, [isOpen, shouldRender])

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      // Delay restoring scroll to wait for exit animation to complete
      const timer = setTimeout(() => {
        document.body.style.overflow = 'unset'
      }, 250) // Match animation time, leave some buffer

      return () => clearTimeout(timer)
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Focus management
  useEffect(() => {
    if (isOpen && modalContentRef.current) {
      // Wait for animation to complete before focusing
      const timer = setTimeout(() => {
        if (modalContentRef.current) {
          // First try to find focusable elements like input, button, etc.
          const focusableElement = modalContentRef.current.querySelector(
            'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement
          
          if (focusableElement) {
            focusableElement.focus()
          } else {
            // If no focusable element found, focus the modal container itself
            modalContentRef.current.focus()
          }
        }
      }, 300) // Wait for animation to complete
      
      return () => clearTimeout(timer)
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
      case '2xl':
        return 'max-w-5xl'
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

  const zIndex = modalManager.getZIndex(modalId)

  // Animation variant configuration
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

  const modalVariants: Variants = {
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
        staggerChildren: 0.1,
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

  const contentVariants = disableContentAnimation ? {} : {
    hidden: {
      opacity: 0,
      y: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
  }

  return (
    <AnimatePresence mode="wait">
      {shouldRender && (
        <div className="fixed inset-0 overflow-y-auto" key="modal" style={{ zIndex }}>
          {/* Animated overlay */}
          <motion.div 
            key="overlay" 
            className={`fixed inset-0 bg-black/60 ${disableBackdropBlur ? '' : 'backdrop-blur-sm'}`}
            onClick={handleOverlayClick} 
            variants={overlayVariants} 
            initial="hidden" 
            animate={isOpen && !isClosing ? "visible" : "exit"}
            exit="exit" 
          />

          {/* Modal container */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              ref={modalContentRef}
              key="modal-content"
              className={`
                relative w-full ${getSizeClass()} 
                bg-black border border-neutral-800 rounded-2xl shadow-2xl
                max-h-[90vh] overflow-hidden flex flex-col
              `}
              variants={modalVariants}
              initial="hidden"
              animate={isOpen && !isClosing ? "visible" : "exit"}
              exit="exit"
              tabIndex={-1}
            >
              {/* Modal header */}
              {(title || showCloseButton) && (
                <motion.div 
                  key="modal-header" 
                  className="flex items-center justify-between p-6 pb-0" 
                  variants={contentVariants}
                  initial={disableContentAnimation ? false : "hidden"}
                  animate={disableContentAnimation ? false : "visible"}
                >
                  {title && <h2 className="text-xl font-bold text-white">{title}</h2>}

                  {showCloseButton && (
                    <motion.button 
                      onClick={onClose} 
                      className="btn-icon ml-auto" 
                      aria-label="Close" 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon icon="mdi:close" className="w-5 h-5" />
                    </motion.button>
                  )}
                </motion.div>
              )}

              {/* Modal content */}
              <motion.div 
                key="modal-body" 
                className="flex-1 overflow-y-auto" 
                variants={contentVariants}
                initial={disableContentAnimation ? false : "hidden"}
                animate={disableContentAnimation ? false : "visible"}
              >
                <div className="p-6">{children}</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
