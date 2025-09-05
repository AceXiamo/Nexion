export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  defaultKey: string;
  currentKey: string;
  category: 'session' | 'navigation' | 'general';
  action: string;
}

export interface ShortcutKeyEvent {
  key: string;
  ctrl: boolean;
  cmd: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

export interface KeyboardShortcutConfig {
  shortcuts: Record<string, KeyboardShortcut>;
  enabled: boolean;
}

export type ShortcutAction = 
  | 'switchToTab1'
  | 'switchToTab2' 
  | 'switchToTab3'
  | 'switchToTab4'
  | 'switchToTab5'
  | 'switchToTab6'
  | 'switchToTab7'
  | 'switchToTab8'
  | 'switchToTab9'
  | 'nextTab'
  | 'previousTab'
  | 'newSession'
  | 'closeSession'
  | 'duplicateSession'
  | 'openFileTransfer';

export const DEFAULT_SHORTCUTS: Record<ShortcutAction, KeyboardShortcut> = {
  switchToTab1: {
    id: 'switchToTab1',
    name: '切换到标签页 1',
    description: '切换到第1个标签页',
    defaultKey: 'Ctrl+1',
    currentKey: 'Ctrl+1',
    category: 'navigation',
    action: 'switchToTab1'
  },
  switchToTab2: {
    id: 'switchToTab2',
    name: '切换到标签页 2',
    description: '切换到第2个标签页',
    defaultKey: 'Ctrl+2',
    currentKey: 'Ctrl+2',
    category: 'navigation',
    action: 'switchToTab2'
  },
  switchToTab3: {
    id: 'switchToTab3',
    name: '切换到标签页 3',
    description: '切换到第3个标签页',
    defaultKey: 'Ctrl+3',
    currentKey: 'Ctrl+3',
    category: 'navigation',
    action: 'switchToTab3'
  },
  switchToTab4: {
    id: 'switchToTab4',
    name: '切换到标签页 4',
    description: '切换到第4个标签页',
    defaultKey: 'Ctrl+4',
    currentKey: 'Ctrl+4',
    category: 'navigation',
    action: 'switchToTab4'
  },
  switchToTab5: {
    id: 'switchToTab5',
    name: '切换到标签页 5',
    description: '切换到第5个标签页',
    defaultKey: 'Ctrl+5',
    currentKey: 'Ctrl+5',
    category: 'navigation',
    action: 'switchToTab5'
  },
  switchToTab6: {
    id: 'switchToTab6',
    name: '切换到标签页 6',
    description: '切换到第6个标签页',
    defaultKey: 'Ctrl+6',
    currentKey: 'Ctrl+6',
    category: 'navigation',
    action: 'switchToTab6'
  },
  switchToTab7: {
    id: 'switchToTab7',
    name: '切换到标签页 7',
    description: '切换到第7个标签页',
    defaultKey: 'Ctrl+7',
    currentKey: 'Ctrl+7',
    category: 'navigation',
    action: 'switchToTab7'
  },
  switchToTab8: {
    id: 'switchToTab8',
    name: '切换到标签页 8',
    description: '切换到第8个标签页',
    defaultKey: 'Ctrl+8',
    currentKey: 'Ctrl+8',
    category: 'navigation',
    action: 'switchToTab8'
  },
  switchToTab9: {
    id: 'switchToTab9',
    name: '切换到标签页 9',
    description: '切换到第9个标签页',
    defaultKey: 'Ctrl+9',
    currentKey: 'Ctrl+9',
    category: 'navigation',
    action: 'switchToTab9'
  },
  // nextTab: {
  //   id: 'nextTab',
  //   name: '下一个标签页',
  //   description: '切换到下一个标签页',
  //   defaultKey: 'Ctrl+Tab',
  //   currentKey: 'Ctrl+Tab',
  //   category: 'navigation',
  //   action: 'nextTab'
  // },
  // previousTab: {
  //   id: 'previousTab',
  //   name: '上一个标签页',
  //   description: '切换到上一个标签页',
  //   defaultKey: 'Ctrl+Shift+Tab',
  //   currentKey: 'Ctrl+Shift+Tab',
  //   category: 'navigation',
  //   action: 'previousTab'
  // },
  newSession: {
    id: 'newSession',
    name: '新建会话',
    description: '创建新的SSH会话',
    defaultKey: 'Ctrl+T',
    currentKey: 'Ctrl+T',
    category: 'session',
    action: 'newSession'
  },
  closeSession: {
    id: 'closeSession',
    name: '关闭会话',
    description: '关闭当前会话',
    defaultKey: 'Ctrl+W',
    currentKey: 'Ctrl+W',
    category: 'session',
    action: 'closeSession'
  },
  // duplicateSession: {
  //   id: 'duplicateSession',
  //   name: '复制会话',
  //   description: '复制当前会话配置创建新会话',
  //   defaultKey: 'Ctrl+Shift+T',
  //   currentKey: 'Ctrl+Shift+T',
  //   category: 'session',
  //   action: 'duplicateSession'
  // },
  openFileTransfer: {
    id: 'openFileTransfer',
    name: 'Open File Transfer',
    description: 'Open the file transfer modal for the active session',
    defaultKey: 'Ctrl+E',
    currentKey: 'Ctrl+E',
    category: 'session',
    action: 'openFileTransfer'
  }
};

export const PLATFORM_MODIFIERS = {
  mac: {
    primary: 'Cmd',
    secondary: 'Ctrl'
  },
  windows: {
    primary: 'Ctrl',
    secondary: 'Alt'
  },
  linux: {
    primary: 'Ctrl',
    secondary: 'Alt'
  }
};

export function getPlatform(): 'mac' | 'windows' | 'linux' {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes('mac')) return 'mac';
  if (platform.includes('win')) return 'windows';
  return 'linux';
}

export function adaptShortcutsForPlatform(shortcuts: Record<string, KeyboardShortcut>): Record<string, KeyboardShortcut> {
  const platform = getPlatform();
  const adapted = { ...shortcuts };
  
  if (platform === 'mac') {
    Object.keys(adapted).forEach(key => {
      adapted[key] = {
        ...adapted[key],
        currentKey: adapted[key].currentKey.replace(/Ctrl/g, 'Cmd'),
        defaultKey: adapted[key].defaultKey.replace(/Ctrl/g, 'Cmd')
      };
    });
  }
  
  return adapted;
}
