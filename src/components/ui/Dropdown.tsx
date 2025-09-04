import React, { useState, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

export interface DropdownItem {
  id: string
  label: string
  icon?: string
  disabled?: boolean
  onClick: () => void
}

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  className?: string
  align?: 'left' | 'right'
}

export function Dropdown({ trigger, items, className, align = 'left' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleTriggerClick = () => {
    setIsOpen(!isOpen)
  }

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled) {
      item.onClick()
      setIsOpen(false)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <div ref={triggerRef} onClick={handleTriggerClick}>
        {trigger}
      </div>
      {isOpen && (
        <div ref={dropdownRef} className={cn('absolute top-full mt-1 w-max bg-neutral-800 border border-neutral-700 rounded-md shadow-lg z-50', align === 'right' && 'right-0')}>
          <div>
            {items.map((item) => (
              <button
                key={item.id}
                className={cn('w-full px-3 py-2 text-left text-xs text-white hover:bg-neutral-700 flex items-center gap-2', item.disabled && 'text-gray-400 cursor-not-allowed')}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
              >
                {item.icon && <Icon icon={item.icon} className="w-4 h-4" />}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
