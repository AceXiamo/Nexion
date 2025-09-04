import React from 'react'
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PathBreadcrumbProps {
  path: string
  onPathClick: (path: string) => void
  onEditClick: () => void
}

export function PathBreadcrumb({ path, onPathClick, onEditClick }: PathBreadcrumbProps) {
  // Parse path into segments
  const segments = path === '/' ? ['/'] : path.split('/').filter(Boolean)
  
  const handleSegmentClick = (index: number) => {
    if (index === 0 && segments[0] === '/') {
      onPathClick('/')
    } else {
      const newPath = '/' + segments.slice(0, index + 1).join('/')
      onPathClick(newPath)
    }
  }

  return (
    <div className="flex items-center gap-1 min-w-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={onEditClick}
        className="p-1 h-6 w-6 flex-shrink-0"
        title="编辑路径"
      >
        <Icon icon="mdi:pencil" className="w-3 h-3" />
      </Button>

      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
        {/* Root */}
        <button
          onClick={() => onPathClick('/')}
          className={cn(
            "px-2 py-1 text-xs rounded hover:bg-neutral-700 transition-colors flex-shrink-0",
            path === '/' ? "text-lime-400" : "text-gray-300 hover:text-white"
          )}
        >
          <Icon icon="mdi:home" className="w-3 h-3" />
        </button>

        {/* Path segments */}
        {path !== '/' && segments.map((segment, index) => (
          <React.Fragment key={index}>
            <Icon icon="mdi:chevron-right" className="w-3 h-3 text-gray-500 flex-shrink-0" />
            
            <button
              onClick={() => handleSegmentClick(index)}
              className={cn(
                "px-2 py-1 text-xs rounded hover:bg-neutral-700 transition-colors truncate max-w-[120px]",
                index === segments.length - 1 
                  ? "text-lime-400 font-medium" 
                  : "text-gray-300 hover:text-white"
              )}
              title={segment}
            >
              {segment}
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}