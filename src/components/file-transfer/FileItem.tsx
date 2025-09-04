import React from 'react'
import { Icon } from '@iconify/react'
import type { FileItem as FileItemType } from '@/types/file-transfer'
import { cn, formatBytes } from '@/lib/utils'
import { format } from 'date-fns'

interface FileItemProps {
  file: FileItemType
  isSelected: boolean
  isDragged: boolean
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: () => void
  onDragStart: (e: React.DragEvent) => void
  onContextMenu?: (e: React.MouseEvent) => void
}

const getFileIcon = (file: FileItemType): string => {
  if (file.type === 'directory') {
    return file.name.startsWith('.') ? 'mdi:folder-hidden' : 'mdi:folder'
  }

  // Get file extension
  const extension = file.name.split('.').pop()?.toLowerCase()

  // Map extensions to icons
  const iconMap: Record<string, string> = {
    // Text files
    txt: 'mdi:file-document',
    md: 'mdi:language-markdown',
    rtf: 'mdi:file-document',

    // Code files
    js: 'mdi:language-javascript',
    ts: 'mdi:language-typescript',
    jsx: 'mdi:react',
    tsx: 'mdi:react',
    py: 'mdi:language-python',
    java: 'mdi:language-java',
    cpp: 'mdi:language-cpp',
    c: 'mdi:language-c',
    cs: 'mdi:language-csharp',
    php: 'mdi:language-php',
    rb: 'mdi:language-ruby',
    go: 'mdi:language-go',
    rs: 'mdi:language-rust',
    swift: 'mdi:language-swift',
    kt: 'mdi:language-kotlin',

    // Web files
    html: 'mdi:language-html5',
    htm: 'mdi:language-html5',
    css: 'mdi:language-css3',
    scss: 'mdi:sass',
    sass: 'mdi:sass',
    less: 'mdi:language-css3',
    json: 'mdi:code-json',
    xml: 'mdi:code-tags',
    yaml: 'mdi:file-code',
    yml: 'mdi:file-code',

    // Images
    jpg: 'mdi:file-image',
    jpeg: 'mdi:file-image',
    png: 'mdi:file-image',
    gif: 'mdi:file-image',
    bmp: 'mdi:file-image',
    svg: 'mdi:file-image',
    webp: 'mdi:file-image',
    ico: 'mdi:file-image',

    // Audio
    mp3: 'mdi:file-music',
    wav: 'mdi:file-music',
    flac: 'mdi:file-music',
    m4a: 'mdi:file-music',
    ogg: 'mdi:file-music',

    // Video
    mp4: 'mdi:file-video',
    avi: 'mdi:file-video',
    mkv: 'mdi:file-video',
    mov: 'mdi:file-video',
    wmv: 'mdi:file-video',
    flv: 'mdi:file-video',
    webm: 'mdi:file-video',

    // Archives
    zip: 'mdi:archive',
    rar: 'mdi:archive',
    '7z': 'mdi:archive',
    tar: 'mdi:archive',
    gz: 'mdi:archive',
    bz2: 'mdi:archive',
    xz: 'mdi:archive',

    // Documents
    pdf: 'mdi:file-pdf-box',
    doc: 'mdi:file-word',
    docx: 'mdi:file-word',
    xls: 'mdi:file-excel',
    xlsx: 'mdi:file-excel',
    ppt: 'mdi:file-powerpoint',
    pptx: 'mdi:file-powerpoint',

    // Config files
    conf: 'mdi:file-cog',
    config: 'mdi:file-cog',
    ini: 'mdi:file-cog',
    cfg: 'mdi:file-cog',
    toml: 'mdi:file-cog',

    // Database
    db: 'mdi:database',
    sql: 'mdi:database',
    sqlite: 'mdi:database',

    // Executable
    exe: 'mdi:application',
    msi: 'mdi:application',
    deb: 'mdi:application',
    rpm: 'mdi:application',
    dmg: 'mdi:application',
    app: 'mdi:application',

    // Fonts
    ttf: 'mdi:format-font',
    otf: 'mdi:format-font',
    woff: 'mdi:format-font',
    woff2: 'mdi:format-font',

    // Others
    log: 'mdi:file-document-outline',
    tmp: 'mdi:file-hidden',
    bak: 'mdi:file-restore',
    lock: 'mdi:file-lock',
  }

  return iconMap[extension || ''] || 'mdi:file'
}

const getFileIconColor = (file: FileItemType): string => {
  if (file.type === 'directory') {
    return file.name.startsWith('.') ? 'text-gray-500' : 'text-blue-400'
  }

  const extension = file.name.split('.').pop()?.toLowerCase()

  const colorMap: Record<string, string> = {
    // Code files
    js: 'text-yellow-400',
    ts: 'text-blue-500',
    jsx: 'text-cyan-400',
    tsx: 'text-cyan-400',
    py: 'text-green-500',
    java: 'text-orange-600',
    cpp: 'text-blue-600',
    c: 'text-blue-600',
    cs: 'text-purple-500',
    php: 'text-purple-400',
    rb: 'text-red-500',
    go: 'text-cyan-500',
    rs: 'text-orange-500',
    swift: 'text-orange-400',

    // Web files
    html: 'text-orange-500',
    css: 'text-blue-500',
    scss: 'text-pink-400',
    sass: 'text-pink-400',
    json: 'text-yellow-500',
    xml: 'text-orange-400',

    // Images
    jpg: 'text-green-400',
    jpeg: 'text-green-400',
    png: 'text-green-400',
    gif: 'text-green-400',
    svg: 'text-yellow-500',

    // Audio/Video
    mp3: 'text-purple-400',
    mp4: 'text-red-400',
    avi: 'text-red-400',

    // Archives
    zip: 'text-yellow-600',
    rar: 'text-yellow-600',
    '7z': 'text-yellow-600',

    // Documents
    pdf: 'text-red-500',
    doc: 'text-blue-600',
    docx: 'text-blue-600',
    xls: 'text-green-600',
    xlsx: 'text-green-600',
    ppt: 'text-orange-600',
    pptx: 'text-orange-600',
  }

  return colorMap[extension || ''] || 'text-gray-400'
}

export function FileItem({ file, isSelected, isDragged, onClick, onDoubleClick, onDragStart, onContextMenu }: FileItemProps) {
  const icon = getFileIcon(file)
  const iconColor = getFileIconColor(file)

  return (
    <div
      data-file-item
      className={cn(
        'flex items-center gap-3 px-3 py-2 box-border border !border-transparent rounded-md cursor-pointer transition-all duration-150',
        'hover:bg-neutral-800/50',
        isSelected && 'bg-lime-400/5 !border-lime-400/30',
        isDragged && 'opacity-50',
        file.isHidden && 'opacity-60'
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      draggable
      onDragStart={onDragStart}
      title={file.path}
    >
      {/* File Icon */}
      <Icon icon={icon} className={cn('w-5 h-5 flex-shrink-0', iconColor)} />

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={cn('text-sm font-medium truncate', isSelected ? 'text-white' : 'text-gray-200', file.isHidden && 'italic')}>{file.name}</span>

          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{file.type === 'file' ? formatBytes(file.size) : ''}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span className="truncate">
            {file.permissions && (
              <>
                <Icon icon="mdi:shield-key" className="w-3 h-3 inline mr-1" />
                {file.permissions}
              </>
            )}
          </span>

          <span className="ml-2 flex-shrink-0">{format(file.modifiedAt, 'yyyy-MM-dd HH:mm')}</span>
        </div>
      </div>
    </div>
  )
}
