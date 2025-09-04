import type { FileItem } from '@/types/file-transfer'

export type SortBy = 'name' | 'modifiedAt'
export type SortOrder = 'asc' | 'desc'

export interface FileSortOptions {
  sortBy: SortBy
  sortOrder: SortOrder
  showHiddenFiles: boolean
}

/**
 * Filter files based on visibility preferences
 */
export function filterFiles(files: FileItem[], showHiddenFiles: boolean): FileItem[] {
  if (showHiddenFiles) {
    return files
  }
  
  return files.filter(file => !file.name.startsWith('.'))
}

/**
 * Sort files based on the specified criteria
 * Directories are always sorted before files
 */
export function sortFiles(files: FileItem[], sortBy: SortBy, sortOrder: SortOrder): FileItem[] {
  return [...files].sort((a, b) => {
    // Directories first
    if (a.type !== b.type) {
      if (a.type === 'directory') return -1
      if (b.type === 'directory') return 1
    }

    let comparison = 0

    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name, undefined, { 
        numeric: true, 
        sensitivity: 'base' 
      })
    } else if (sortBy === 'modifiedAt') {
      const timeA = new Date(a.modifiedAt).getTime()
      const timeB = new Date(b.modifiedAt).getTime()
      comparison = timeA - timeB
    }

    return sortOrder === 'desc' ? -comparison : comparison
  })
}

/**
 * Apply both filtering and sorting to files
 */
export function processFiles(
  files: FileItem[], 
  options: FileSortOptions
): FileItem[] {
  const filtered = filterFiles(files, options.showHiddenFiles)
  const sorted = sortFiles(filtered, options.sortBy, options.sortOrder)
  return sorted
}