import React from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export const Toggle: React.FC<ToggleProps> = ({ 
  checked, 
  onChange, 
  disabled = false, 
  className = '' 
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#BCFF2F] focus:ring-offset-2 focus:ring-offset-[#0f0f0f]
        ${checked 
          ? 'bg-[#BCFF2F]' 
          : 'bg-[#333333]'
        }
        ${disabled 
          ? 'cursor-not-allowed opacity-50' 
          : 'hover:bg-opacity-80'
        }
        ${className}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block h-5 w-5 rounded-full shadow transform ring-0 transition duration-200 ease-in-out
          ${checked 
            ? 'translate-x-5 bg-[#1C260A]' 
            : 'translate-x-0 bg-[#CCCCCC]'
          }
        `}
      />
    </button>
  )
}