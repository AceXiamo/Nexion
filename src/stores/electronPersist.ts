/**
 * Electron persistence middleware
 * Uses electron-store for data persistence through IPC
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

  // Load data from electron-store during initialization
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
        
        // Merge persisted state into current state
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

  // Save state to electron-store
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

  // Create wrapped set function
  const wrappedSet: typeof set = (partial, replace) => {
    set(partial, replace)
    const newState = get()
    persist(newState)
  }

  // Initialize
  const stateCreator = f(wrappedSet, get, store)
  
  // Asynchronously load persisted data
  hydrate()

  return {
    ...stateCreator,
    // Add method to clear persistent data
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
