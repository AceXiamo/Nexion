import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFileTransferStore } from '@/store/file-transfer-store'
import { formatBytes, cn } from '@/lib/utils'
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

const calculateSpeed = (task: TransferTask): string => {
  if (!task.startTime || task.status !== 'transferring') return ''

  const elapsed = Date.now() - task.startTime.getTime()
  if (elapsed < 1000) return ''

  const transferred = Number(task.transferred) || 0
  const bytesPerSecond = (transferred / elapsed) * 1000

  if (isNaN(bytesPerSecond) || bytesPerSecond <= 0) return ''

  return `${formatBytes(bytesPerSecond)}/s`
}

interface TransferProgressCardProps {
  task: TransferTask
  isExpanded: boolean
}

function TransferProgressCard({ task, isExpanded }: TransferProgressCardProps) {
  const [speed, setSpeed] = useState(calculateSpeed(task))

  // update progress on task change
  useEffect(() => {
    setSpeed(calculateSpeed(task))
  }, [task])

  return (
    <motion.div
      layout
      className="bg-neutral-900/95 border border-neutral-700 rounded-lg p-3 backdrop-blur-sm"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
    >
      <div className="flex items-center gap-3">
        {/* Status Icon */}
        <div className="flex-shrink-0">{getStatusIcon(task.status)}</div>

        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white truncate" title={task.fileName}>
              {task.fileName}
            </span>
            <div className="flex items-center gap-2 text-xs text-gray-400 ml-2">
              <Icon icon={task.type === 'upload' ? 'mdi:upload' : 'mdi:download'} className="w-3 h-3" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2">
            <div className="w-full bg-neutral-700 rounded-full h-1.5 mb-1">
              {/* <motion.div
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  task.status === 'completed' ? 'bg-green-400' : task.status === 'error' ? 'bg-red-400' : task.status === 'paused' ? 'bg-orange-400' : 'bg-lime-400'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${task.progress}%` }}
                transition={{ duration: 0.3 }}
              /> */}
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  task.status === 'completed' ? 'bg-green-400' : task.status === 'error' ? 'bg-red-400' : task.status === 'paused' ? 'bg-orange-400' : 'bg-lime-400'
                )}
                style={{ width: `${task.progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">{task.progress}%</span>

              {speed && <span className="text-gray-400">{speed}</span>}
            </div>
          </div>

          {/* Error Message */}
          {task.error && (
            <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <Icon icon="mdi:alert" className="w-3 h-3" />
              <span className="truncate">{task.error}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface AggregatedProgressProps {
  tasks: TransferTask[]
  onToggleExpand: () => void
  isExpanded: boolean
}

function AggregatedProgress({ tasks, onToggleExpand, isExpanded }: AggregatedProgressProps) {
  const activeTasks = tasks.filter((task) => task.status === 'transferring' || task.status === 'pending')
  const completedTasks = tasks.filter((task) => task.status === 'completed')
  const errorTasks = tasks.filter((task) => task.status === 'error')

  const totalProgress = tasks.length > 0 ? Math.round(tasks.reduce((sum, task) => sum + (task.progress || 0), 0) / tasks.length) : 0

  const getStatusColor = () => {
    if (errorTasks.length > 0) return 'bg-red-400'
    if (completedTasks.length === tasks.length) return 'bg-green-400'
    if (activeTasks.length > 0) return 'bg-lime-400'
    return 'bg-gray-400'
  }

  const getStatusText = () => {
    if (errorTasks.length > 0) return `${errorTasks.length} 个失败`
    if (completedTasks.length === tasks.length) return '全部完成'
    if (activeTasks.length > 0) return `传输中 ${activeTasks.length} 个文件`
    return '等待中'
  }

  return (
    <motion.div
      layout
      className="bg-neutral-900/95 border border-neutral-700 rounded-lg p-3 backdrop-blur-sm cursor-pointer"
      onClick={onToggleExpand}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Icon icon="mdi:folder-sync" className={cn('w-5 h-5', activeTasks.length > 0 ? 'animate-pulse text-lime-400' : 'text-gray-400')} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">{getStatusText()}</span>
            <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-up'} className="w-4 h-4 text-gray-400" />
          </div>

          <div className="mt-2">
            <div className="w-full bg-neutral-700 rounded-full h-1.5 mb-1">
              {/* <motion.div
                className={cn('h-1.5 rounded-full transition-all duration-300', getStatusColor())}
                initial={{ width: 0 }}
                animate={{ width: `${totalProgress}%` }}
                transition={{ duration: 0.3 }}
              /> */}
              <div
                className={cn('h-1.5 rounded-full transition-all duration-300', getStatusColor())}
                style={{ width: `${totalProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>总进度: {totalProgress}%</span>
              <span>{tasks.length} 个任务</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function FloatingTransferProgress() {
  const { transferQueue } = useFileTransferStore()
  const [isExpanded, setIsExpanded] = useState(false)

  // Filter active tasks (not completed, unless recently completed)
  const activeTasks = transferQueue.filter(
    (task) =>
      task.status === 'transferring' ||
      task.status === 'pending' ||
      task.status === 'error' ||
      task.status === 'paused' ||
      (task.status === 'completed' && task.startTime && Date.now() - task.startTime.getTime() < 3000) // Show completed tasks for 3 seconds
  )

  // Don't render if no active tasks
  if (activeTasks.length === 0) {
    return null
  }

  const shouldShowAggregated = activeTasks.length > 1

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-80">
      <AnimatePresence mode="wait">
        {shouldShowAggregated ? (
          <motion.div key="aggregated" layout>
            <AggregatedProgress tasks={activeTasks} onToggleExpand={() => setIsExpanded(!isExpanded)} isExpanded={isExpanded} />

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700"
                >
                  {activeTasks.map((task) => (
                    <TransferProgressCard key={task.id} task={task} isExpanded={isExpanded} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="single">
            <TransferProgressCard task={activeTasks[0]} isExpanded={false} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
