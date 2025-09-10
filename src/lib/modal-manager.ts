/**
 * Modal Manager - Manages the layering and ESC key handling of multiple modals
 */
class ModalManager {
  private static instance: ModalManager
  private modalStack: string[] = []
  private modalCallbacks: Map<string, () => void> = new Map()

  private constructor() {}

  static getInstance(): ModalManager {
    if (!this.instance) {
      this.instance = new ModalManager()
    }
    return this.instance
  }

  /**
   * Register a modal
   */
  register(modalId: string, onClose: () => void): void {
    // If already exists, remove it first
    this.unregister(modalId)
    
    // Add to the top of the stack
    this.modalStack.push(modalId)
    this.modalCallbacks.set(modalId, onClose)
    
    // If this is the first modal, start listening for ESC key
    if (this.modalStack.length === 1) {
      document.addEventListener('keydown', this.handleKeyDown, { capture: true })
    }
  }

  /**
   * Unregister a modal
   */
  unregister(modalId: string): void {
    const index = this.modalStack.indexOf(modalId)
    if (index !== -1) {
      this.modalStack.splice(index, 1)
      this.modalCallbacks.delete(modalId)
    }
    
    // If no modals left, stop listening for ESC key
    if (this.modalStack.length === 0) {
      document.removeEventListener('keydown', this.handleKeyDown, { capture: true } as any)
    }
  }

  /**
   * Handle the ESC key - only closes the topmost modal
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.modalStack.length > 0) {
      event.preventDefault()
      event.stopPropagation()
      
      // Get the topmost modal
      const topModalId = this.modalStack[this.modalStack.length - 1]
      const callback = this.modalCallbacks.get(topModalId)
      
      if (callback) {
        callback()
      }
    }
  }

  /**
   * Get the z-index of a modal
   */
  getZIndex(modalId: string): number {
    const index = this.modalStack.indexOf(modalId)
    return index !== -1 ? 50 + index : 50
  }

  /**
   * Check if it is the topmost modal
   */
  isTopModal(modalId: string): boolean {
    return this.modalStack.length > 0 && this.modalStack[this.modalStack.length - 1] === modalId
  }

  /**
   * Check if any modals are open
   */
  hasModalsOpen(): boolean {
    return this.modalStack.length > 0
  }
}

export const modalManager = ModalManager.getInstance()
export { ModalManager }
