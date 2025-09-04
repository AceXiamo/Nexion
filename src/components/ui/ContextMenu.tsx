import React, { useState, useEffect, useRef } from 'react'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface ContextMenuItem {
  id: string
  label: string
  icon: string
  onClick: () => void
  disabled?: boolean
  separator?: boolean
  danger?: boolean
}

interface ContextMenuProps {
  items: ContextMenuItem[]
  position: { x: number; y: number }
  isOpen: boolean
  onClose: () => void
}

export function ContextMenu({ items, position, isOpen, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Adjust position to keep menu within viewport
  const adjustedPosition = React.useMemo(() => {
    if (!menuRef.current) return position

    const menuRect = menuRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let { x, y } = position

    // Adjust horizontal position
    if (x + menuRect.width > viewportWidth) {
      x = viewportWidth - menuRect.width - 10
    }

    // Adjust vertical position
    if (y + menuRect.height > viewportHeight) {
      y = viewportHeight - menuRect.height - 10
    }

    // Ensure minimum distance from edges
    x = Math.max(10, x)
    y = Math.max(10, y)

    return { x, y }
  }, [position])

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled) {
      item.onClick()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          className="fixed z-[9999] bg-neutral-900 border overflow-hidden border-neutral-700 rounded-lg shadow-xl min-w-[160px]"
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
          }}
          initial={{ opacity: 0, scale: 0.95, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -5 }}
          transition={{ duration: 0.1, ease: 'easeOut' }}
        >
          {items.map((item) => (
            <React.Fragment key={item.id}>
              <button
                className={cn(
                  "flex items-center gap-3 p-3 text-sm w-full text-left transition-colors",
                  item.disabled 
                    ? "text-neutral-500 cursor-not-allowed" 
                    : item.danger
                      ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      : "text-gray-200 hover:bg-neutral-800 hover:text-white"
                )}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
              >
                <Icon 
                  icon={item.icon} 
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    item.danger && !item.disabled && "text-red-400"
                  )}
                />
                <span className="truncate">{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook for context menu functionality
export function useContextMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const openContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    setPosition({
      x: event.clientX,
      y: event.clientY,
    })
    setIsOpen(true)
  }

  const closeContextMenu = () => {
    setIsOpen(false)
  }

  return {
    isOpen,
    position,
    openContextMenu,
    closeContextMenu,
  }
}
