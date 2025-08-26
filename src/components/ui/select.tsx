import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

interface SelectValueProps {
  placeholder?: string
}

interface SelectContentProps {
  children: React.ReactNode
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  onSelect?: () => void
}

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
} | null>(null)

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = useState(false)
  
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ className, children, ...props }: SelectTriggerProps) {
  const context = React.useContext(SelectContext)
  
  return (
    <button
      type="button"
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-neutral-600',
        'bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-offset-2 focus:ring-offset-neutral-900',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      onClick={() => context?.setOpen(!context.open)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const context = React.useContext(SelectContext)
  
  return (
    <span>
      {context?.value || placeholder}
    </span>
  )
}

export function SelectContent({ children }: SelectContentProps) {
  const context = React.useContext(SelectContext)
  const contentRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        context?.setOpen(false)
      }
    }
    
    if (context?.open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [context?.open])
  
  if (!context?.open) return null
  
  return (
    <div
      ref={contentRef}
      className="absolute top-full z-50 mt-1 w-full rounded-md border border-neutral-600 bg-neutral-800 shadow-lg"
    >
      <div className="max-h-60 overflow-auto p-1">
        {children}
      </div>
    </div>
  )
}

export function SelectItem({ value, children, onSelect }: SelectItemProps) {
  const context = React.useContext(SelectContext)
  
  const handleSelect = () => {
    context?.onValueChange?.(value)
    context?.setOpen(false)
    onSelect?.()
  }
  
  return (
    <div
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm',
        'text-white hover:bg-neutral-700 focus:bg-neutral-700 focus:outline-none',
        context?.value === value && 'bg-neutral-700'
      )}
      onClick={handleSelect}
    >
      {children}
    </div>
  )
}