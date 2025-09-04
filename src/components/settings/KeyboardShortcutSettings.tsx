import React, { useState, useEffect } from 'react';
import { settingsStore } from '../../store/settings-store';
import { ShortcutInput } from '../ui/ShortcutInput';
import { KeyboardShortcut, ShortcutAction } from '../../types/keyboard-shortcuts';
import { keyboardShortcutManager } from '../../services/keyboard-shortcut-manager';

const CATEGORY_NAMES = {
  session: '会话管理',
  navigation: '导航切换',
  general: '通用功能'
};

export const KeyboardShortcutSettings: React.FC = () => {
  const [shortcuts, setShortcuts] = useState<Record<string, KeyboardShortcut>>({});
  const [enabled, setEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const loadSettings = () => {
      const config = settingsStore.getKeyboardShortcuts();
      setShortcuts(config.shortcuts);
      setEnabled(config.enabled);
    };

    loadSettings();
    const unsubscribe = settingsStore.subscribe(loadSettings);
    return unsubscribe;
  }, []);

  const handleShortcutChange = (action: ShortcutAction, newKey: string) => {
    if (settingsStore.updateKeyboardShortcut(action, newKey)) {
      setShortcuts(prev => ({
        ...prev,
        [action]: {
          ...prev[action],
          currentKey: newKey
        }
      }));
    }
  };

  const handleShortcutValidation = (action: ShortcutAction) => (shortcut: string) => {
    return !settingsStore.isShortcutConflict(shortcut, action);
  };

  const handleResetShortcut = (action: ShortcutAction) => {
    settingsStore.resetKeyboardShortcut(action);
  };

  const handleResetAll = () => {
    if (confirm('确定要重置所有快捷键为默认设置吗？')) {
      settingsStore.resetAllKeyboardShortcuts();
    }
  };

  const handleToggleEnabled = (newEnabled: boolean) => {
    settingsStore.toggleKeyboardShortcuts(newEnabled);
    setEnabled(newEnabled);
  };

  const handleExportSettings = () => {
    const exportData = settingsStore.exportSettings();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keyboard-shortcuts.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (settingsStore.importSettings(content)) {
          alert('设置导入成功！');
        } else {
          alert('设置导入失败，请检查文件格式。');
        }
      } catch (error) {
        alert('设置导入失败，请检查文件格式。');
      }
    };
    reader.readAsText(file);
    
    event.target.value = '';
  };

  const filteredShortcuts = Object.values(shortcuts).filter(shortcut => {
    const matchesSearch = shortcut.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shortcut.currentKey.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || shortcut.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const groupedShortcuts = filteredShortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, KeyboardShortcut[]>);

  const categories = Object.keys(CATEGORY_NAMES);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">键盘快捷键</h2>
          <p className="text-sm text-[#888888] mt-1">自定义应用程序的键盘快捷键</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleToggleEnabled(e.target.checked)}
              className="rounded border-[#333333] text-[#BCFF2F] bg-[#1a1a1a] focus:ring-[#BCFF2F] focus:ring-offset-[#0f0f0f]"
            />
            <span className="ml-2 text-sm text-[#CCCCCC]">启用快捷键</span>
          </label>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="搜索快捷键..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333333] text-white placeholder-[#666666] rounded-lg focus:ring-2 focus:ring-[#BCFF2F] focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#1a1a1a] border border-[#333333] text-white rounded-lg focus:ring-2 focus:ring-[#BCFF2F] focus:border-transparent"
          >
            <option value="all">所有分类</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES]}
              </option>
            ))}
          </select>
          
          <button
            onClick={handleResetAll}
            disabled={!enabled}
            className="px-4 py-2 text-sm text-[#CCCCCC] border border-[#333333] rounded-lg hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            重置全部
          </button>
        </div>
      </div>

      {/* 导入导出 */}
      <div className="flex gap-2">
        <button
          onClick={handleExportSettings}
          className="px-4 py-2 text-sm text-[#BCFF2F] border border-[#BCFF2F] rounded-lg hover:bg-[#BCFF2F] hover:bg-opacity-10"
        >
          导出设置
        </button>
        
        <label className="px-4 py-2 text-sm text-[#CCCCCC] border border-[#333333] rounded-lg hover:bg-[#1a1a1a] cursor-pointer">
          导入设置
          <input
            type="file"
            accept=".json"
            onChange={handleImportSettings}
            className="hidden"
          />
        </label>
      </div>

      {/* 快捷键列表 */}
      <div className="space-y-6">
        {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
          <div key={category} className="space-y-4">
            <h3 className="text-lg font-medium text-white border-b border-[#333333] pb-2">
              {CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES]}
            </h3>
            
            <div className="space-y-3">
              {categoryShortcuts.map((shortcut) => (
                <div
                  key={shortcut.id}
                  className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-[#333333]"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-medium text-white">
                        {shortcut.name}
                      </h4>
                      {shortcut.currentKey !== shortcut.defaultKey && (
                        <span className="px-2 py-1 text-xs bg-[#BCFF2F] bg-opacity-20 text-[#BCFF2F] rounded">
                          已自定义
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#888888] mt-1">{shortcut.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-48">
                      <ShortcutInput
                        value={shortcut.currentKey}
                        onChange={(newKey) => handleShortcutChange(shortcut.action as ShortcutAction, newKey)}
                        onValidate={handleShortcutValidation(shortcut.action as ShortcutAction)}
                        disabled={!enabled}
                        placeholder="未设置"
                      />
                    </div>
                    
                    <button
                      onClick={() => handleResetShortcut(shortcut.action as ShortcutAction)}
                      disabled={!enabled || shortcut.currentKey === shortcut.defaultKey}
                      className="px-3 py-1 text-xs text-[#888888] hover:text-[#CCCCCC] disabled:opacity-50 disabled:cursor-not-allowed"
                      title="重置为默认"
                    >
                      重置
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredShortcuts.length === 0 && (
        <div className="text-center py-8 text-[#666666]">
          {searchTerm ? '未找到匹配的快捷键' : '暂无快捷键配置'}
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-8 p-4 bg-[#1a1a1a] border border-[#333333] rounded-lg">
        <h4 className="text-sm font-medium text-[#BCFF2F] mb-2">使用说明</h4>
        <ul className="text-sm text-[#CCCCCC] space-y-1">
          <li>• 点击快捷键输入框开始录制新的快捷键组合</li>
          <li>• 快捷键必须包含修饰键（Ctrl、Cmd、Alt）和一个主键</li>
          <li>• 在输入框、文本区域等编辑区域中快捷键会被自动忽略</li>
          <li>• macOS 系统会自动将 Ctrl 替换为 Cmd 键</li>
        </ul>
      </div>
    </div>
  );
};