// React import not needed for functional components
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import { useFileTransferStore } from '@/store/file-transfer-store'
import { formatBytes } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { TransferTask } from '@/types/file-transfer'

const getStatusIcon = (status: TransferTask['status']) => {
  switch (status) {
    case 'pending':
      return <Icon icon="mdi:clock-outline" className="w-4 h-4 text-yellow-400" />
    case 'transferring':
      return <Icon icon="mdi:loading" className="w-4 h-4 animate-spin text-lime-400" />
    case 'completed':
      return <Icon icon="mdi:check-circle" className="w-4 h-4 text-green-400" />
    case 'error':
      return <Icon icon="mdi:alert-circle" className="w-4 h-4 text-red-400" />
    case 'paused':
      return <Icon icon="mdi:pause-circle" className="w-4 h-4 text-orange-400" />
    default:
      return <Icon icon="mdi:help-circle" className="w-4 h-4 text-gray-400" />
  }
}


const calculateProgress = (task: TransferTask): number => {
  if (task.fileSize === 0) return 100
  return Math.round((task.transferred / task.fileSize) * 100)
}

const calculateSpeed = (task: TransferTask): string => {
  if (!task.startTime || task.status !== 'transferring') return ''
  
  const elapsed = Date.now() - task.startTime.getTime()
  if (elapsed < 1000) return '' // Wait at least 1 second
  
  const bytesPerSecond = (task.transferred / elapsed) * 1000
  return `${formatBytes(bytesPerSecond)}/s`
}

const calculateETA = (task: TransferTask): string => {
  if (!task.startTime || task.status !== 'transferring' || task.transferred === 0) return ''
  
  const elapsed = Date.now() - task.startTime.getTime()
  const remaining = task.fileSize - task.transferred
  const bytesPerSecond = (task.transferred / elapsed) * 1000
  
  if (bytesPerSecond <= 0) return ''
  
  const secondsRemaining = remaining / bytesPerSecond
  
  if (secondsRemaining < 60) {
    return `${Math.round(secondsRemaining)}s`
  } else if (secondsRemaining < 3600) {
    return `${Math.round(secondsRemaining / 60)}m`
  } else {
    return `${Math.round(secondsRemaining / 3600)}h`
  }
}

interface TransferTaskItemProps {
  task: TransferTask
}

function TransferTaskItem({ task }: TransferTaskItemProps) {
  const { removeTransferTask, updateTransferTask } = useFileTransferStore()
  
  const progress = calculateProgress(task)
  const speed = calculateSpeed(task)
  const eta = calculateETA(task)

  const handleCancel = () => {
    if (task.status === 'transferring' || task.status === 'pending') {
      updateTransferTask(task.id, { status: 'error', error: 'Cancelled by user' })
    }
    removeTransferTask(task.id)
  }

  const handleRetry = () => {
    if (task.status === 'error') {
      updateTransferTask(task.id, { 
        status: 'pending', 
        error: undefined,
        transferred: 0,
        startTime: new Date()
      })
    }
  }

  const handlePause = () => {
    if (task.status === 'transferring') {
      updateTransferTask(task.id, { status: 'paused' })
    } else if (task.status === 'paused') {
      updateTransferTask(task.id, { status: 'transferring' })
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-neutral-800/30 rounded-lg border border-neutral-700">
      {/* Status Icon */}
      <div className="flex-shrink-0">
        {getStatusIcon(task.status)}
      </div>

      {/* Task Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-white truncate" title={task.fileName}>
            {task.fileName}
          </span>
          
          <div className="flex items-center gap-2 text-xs text-gray-400 ml-2">
            <Icon 
              icon={task.type === 'upload' ? 'mdi:upload' : 'mdi:download'} 
              className="w-3 h-3" 
            />
            <span>{task.type === 'upload' ? 'Upload' : 'Download'}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="w-full bg-neutral-700 rounded-full h-1.5 mb-1">
            <div
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                task.status === 'completed' ? "bg-green-400" : 
                task.status === 'error' ? "bg-red-400" :
                task.status === 'paused' ? "bg-orange-400" : "bg-lime-400"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">
              {formatBytes(task.transferred)} / {formatBytes(task.fileSize)} ({progress}%)
            </span>
            
            <div className="flex items-center gap-2 text-gray-400">
              {speed && <span>{speed}</span>}
              {eta && <span>Remaining {eta}</span>}
            </div>
          </div>
        </div>

        {/* Path Info */}
        <div className="text-xs text-gray-500 truncate">
          <Icon icon="mdi:folder-arrow-right" className="w-3 h-3 inline mr-1" />
          {task.source} → {task.destination}
        </div>

        {/* Error Message */}
        {task.error && (
          <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
            <Icon icon="mdi:alert" className="w-3 h-3" />
            {task.error}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {task.status === 'transferring' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePause}
            className="h-8 w-8 p-0"
            title="Pause"
          >
            <Icon icon="mdi:pause" className="w-4 h-4" />
          </Button>
        )}

        {task.status === 'paused' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePause}
            className="h-8 w-8 p-0"
            title="Continue"
          >
            <Icon icon="mdi:play" className="w-4 h-4" />
          </Button>
        )}

        {task.status === 'error' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            className="h-8 w-8 p-0"
            title="Retry"
          >
            <Icon icon="mdi:refresh" className="w-4 h-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="h-8 w-8 p-0 hover:text-red-400"
          title="Cancel"
        >
          <Icon icon="mdi:close" className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export function TransferQueue() {
  const { transferQueue, clearCompletedTasks } = useFileTransferStore()

  const completedTasks = transferQueue.filter(task => task.status === 'completed')
  const activeTasks = transferQueue.filter(task => task.status !== 'completed')

  return (
    <div className="space-y-3">
      {/* Queue Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>Transferring: {activeTasks.length}</span>
          <span>Completed: {completedTasks.length}</span>
        </div>

        {completedTasks.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCompletedTasks}
            className="text-xs"
          >
            <Icon icon="mdi:broom" className="w-4 h-4 mr-1" />
            Clear Completed
          </Button>
        )}
      </div>

      {/* Transfer Tasks */}
      <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent space-y-2">
        {transferQueue.map(task => (
          <TransferTaskItem key={task.id} task={task} />
        ))}
      </div>

      {transferQueue.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          <Icon icon="mdi:transfer" className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <span className="text-sm">No transfer tasks</span>
        </div>
      )}
    </div>
  )
}
