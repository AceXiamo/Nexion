/**
 * Platform detection and configuration utilities
 * Provides cross-platform compatibility helpers for the Electron app
 */

export type Platform = 'windows' | 'macos' | 'linux' | 'unknown'

/**
 * Detect the current platform
 */
export function getPlatform(): Platform {
  if (typeof window === 'undefined') {
    return 'unknown'
  }

  const userAgent = window.navigator.userAgent.toLowerCase()

  if (userAgent.includes('win')) {
    return 'windows'
  } else if (userAgent.includes('mac')) {
    return 'macos'
  } else if (userAgent.includes('linux')) {
    return 'linux'
  }

  return 'unknown'
}

/**
 * Check if running on Windows
 */
export function isWindows(): boolean {
  return getPlatform() === 'windows'
}

/**
 * Check if running on macOS
 */
export function isMacOS(): boolean {
  return getPlatform() === 'macos'
}

/**
 * Check if running on Linux
 */
export function isLinux(): boolean {
  return getPlatform() === 'linux'
}

/**
 * Get platform-specific title bar configuration
 */
export function getTitleBarConfig() {
  const platform = getPlatform()

  return {
    showCustomTitleBar: platform === 'windows',
    showTrafficLights: platform === 'macos',
    titleBarHeight: platform === 'windows' ? 32 : platform === 'macos' ? 28 : 32,
    dragRegionSelector: platform === 'windows' ? '.windows-drag-region' : '.macos-drag-region'
  }
}

/**
 * Get platform-specific CSS classes
 */
export function getPlatformClasses(): string {
  const platform = getPlatform()

  const classes = [
    `platform-${platform}`,
  ]

  if (platform === 'windows') {
    classes.push('has-custom-titlebar')
  } else if (platform === 'macos') {
    classes.push('has-traffic-lights')
  }

  return classes.join(' ')
}

/**
 * Check if the current platform supports custom title bars
 */
export function supportsCustomTitleBar(): boolean {
  return isWindows()
}