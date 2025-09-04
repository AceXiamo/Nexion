import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, Variants } from 'framer-motion'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  // Handle ESC key to close
  useEffect(() => {
    if (!open) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onOpenChange])

  // Prevent background scrolling
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      // Delay restoring scroll to wait for exit animation to complete
      const timer = setTimeout(() => {
        document.body.style.overflow = 'unset'
      }, 250)

      return () => clearTimeout(timer)
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

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

  return (
    <AnimatePresence mode="wait">
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" key="dialog">
          {/* Animated Backdrop */}
          <motion.div
            key="dialog-overlay"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          />

          {/* Animated Dialog content */}
          <motion.div key="dialog-content" className="relative z-50 w-full max-w-lg mx-4" variants={dialogVariants} initial="hidden" animate="visible" exit="exit">
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function DialogContent({ className, children, ...props }: DialogContentProps) {
  return (
    <motion.div
      className={cn('bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl p-6', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function DialogHeader({ className, children, ...props }: DialogHeaderProps) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function DialogTitle({ className, children, ...props }: DialogTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold text-white mb-2', className)} {...props}>
      {children}
    </h2>
  )
}

export function DialogDescription({ className, children, ...props }: DialogDescriptionProps) {
  return (
    <p className={cn('text-sm text-gray-400', className)} {...props}>
      {children}
    </p>
  )
}
