/**
 * Electron 持久化中间件
 * 使用 electron-store 通过 IPC 进行数据持久化
 */
import type { StateCreator, StoreMutatorIdentifier } from 'zustand'

declare global {
  interface Window {
    ipcRenderer?: {
      store: {
        get: (key: string) => Promise<{ success: boolean; data: any }>
        set: (key: string, value: any) => Promise<{ success: boolean }>
        delete: (key: string) => Promise<{ success: boolean }>
        clear: () => Promise<{ success: boolean }>
        has: (key: string) => Promise<{ success: boolean; has: boolean }>
      }
    }
  }
}

export interface ElectronPersistOptions {
  name: string
  partialize?: (state: any) => any
}

type ElectronPersist = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  options: ElectronPersistOptions
) => StateCreator<T, Mps, Mcs>

const electronPersistImpl: ElectronPersist = (f, options) => (set, get, store) => {
  type T = ReturnType<typeof f>

  let hasHydrated = false
  const storageKey = options.name

  // 初始化时从 electron-store 加载数据
  const hydrate = async () => {
    try {
      if (!window.ipcRenderer?.store) {
        console.warn('ElectronPersist: IPC renderer not available, falling back to localStorage')
        return
      }

      const result = await window.ipcRenderer.store.get(storageKey)
      if (result.success && result.data) {
        const persistedState = result.data
        console.log(`ElectronPersist: Loaded state for ${storageKey}:`, persistedState)
        
        // 合并持久化状态到当前状态
        set((state) => ({
          ...state,
          ...persistedState,
        }), true)
      }
    } catch (error) {
      console.error(`ElectronPersist: Failed to load state for ${storageKey}:`, error)
    } finally {
      hasHydrated = true
    }
  }

  // 保存状态到 electron-store
  const persist = async (state: T) => {
    try {
      if (!window.ipcRenderer?.store || !hasHydrated) {
        return
      }

      const stateToStore = options.partialize ? options.partialize(state) : state
      const result = await window.ipcRenderer.store.set(storageKey, stateToStore)
      
      if (!result.success) {
        console.error(`ElectronPersist: Failed to save state for ${storageKey}`)
      }
    } catch (error) {
      console.error(`ElectronPersist: Error saving state for ${storageKey}:`, error)
    }
  }

  // 创建包装后的 set 函数
  const wrappedSet: typeof set = (partial, replace) => {
    set(partial, replace)
    const newState = get()
    persist(newState)
  }

  // 初始化
  const stateCreator = f(wrappedSet, get, store)
  
  // 异步加载持久化数据
  hydrate()

  return {
    ...stateCreator,
    // 添加清除持久化数据的方法
    clearPersistentStorage: async () => {
      try {
        if (window.ipcRenderer?.store) {
          await window.ipcRenderer.store.delete(storageKey)
          console.log(`ElectronPersist: Cleared persistent storage for ${storageKey}`)
        }
      } catch (error) {
        console.error(`ElectronPersist: Failed to clear persistent storage for ${storageKey}:`, error)
      }
    }
  } as T & { clearPersistentStorage: () => Promise<void> }
}

export const electronPersist = electronPersistImpl as ElectronPersist