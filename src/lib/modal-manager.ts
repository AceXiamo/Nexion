/**
 * Modal Manager - 管理多个弹框的层级和ESC键处理
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
   * 注册一个弹框
   */
  register(modalId: string, onClose: () => void): void {
    // 如果已存在，先移除
    this.unregister(modalId)
    
    // 添加到栈顶
    this.modalStack.push(modalId)
    this.modalCallbacks.set(modalId, onClose)
    
    // 如果这是第一个弹框，开始监听ESC键
    if (this.modalStack.length === 1) {
      document.addEventListener('keydown', this.handleKeyDown, { capture: true })
    }
  }

  /**
   * 注销一个弹框
   */
  unregister(modalId: string): void {
    const index = this.modalStack.indexOf(modalId)
    if (index !== -1) {
      this.modalStack.splice(index, 1)
      this.modalCallbacks.delete(modalId)
    }
    
    // 如果没有弹框了，停止监听ESC键
    if (this.modalStack.length === 0) {
      document.removeEventListener('keydown', this.handleKeyDown, { capture: true } as any)
    }
  }

  /**
   * 处理ESC键 - 只关闭最顶层的弹框
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.modalStack.length > 0) {
      event.preventDefault()
      event.stopPropagation()
      
      // 获取最顶层弹框
      const topModalId = this.modalStack[this.modalStack.length - 1]
      const callback = this.modalCallbacks.get(topModalId)
      
      if (callback) {
        callback()
      }
    }
  }

  /**
   * 获取弹框的z-index
   */
  getZIndex(modalId: string): number {
    const index = this.modalStack.indexOf(modalId)
    return index !== -1 ? 50 + index : 50
  }

  /**
   * 检查是否是最顶层弹框
   */
  isTopModal(modalId: string): boolean {
    return this.modalStack.length > 0 && this.modalStack[this.modalStack.length - 1] === modalId
  }

  /**
   * 检查是否有模态框打开
   */
  hasModalsOpen(): boolean {
    return this.modalStack.length > 0
  }
}

export const modalManager = ModalManager.getInstance()
export { ModalManager }