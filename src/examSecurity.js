import { useCallback, useEffect, useRef, useState } from 'react'

const blockedShortcutKeys = new Set([
  'F12',
  'Escape',
  'Tab',
  'PrintScreen',
])

function isBlockedShortcut(event) {
  const key = event.key
  const lowerKey = key.toLowerCase()
  const hasCtrlOrMeta = event.ctrlKey || event.metaKey

  if (blockedShortcutKeys.has(key)) return true
  if (event.altKey && ['Tab', 'F4'].includes(key)) return true
  if ((event.ctrlKey || event.metaKey) && ['Tab', 't', 'n', 'w', 'f', 'p', 'u', 'a', 'c', 'v', 'x'].includes(lowerKey)) return true
  if (hasCtrlOrMeta && event.shiftKey && ['i', 'j', 'tab'].includes(lowerKey)) return true

  return false
}

export function useExamSecurity() {
  const containerRef = useRef(null)
  const [isSecurityOverlayVisible, setIsSecurityOverlayVisible] = useState(false)
  const [warningCount, setWarningCount] = useState(0)
  const hasEnteredFullscreen = useRef(false)

  const registerSecurityWarning = useCallback(() => {
    setWarningCount((count) => count + 1)
    setIsSecurityOverlayVisible(true)
  }, [])

  const activateSecureMode = useCallback(async () => {
    const container = containerRef.current

    try {
      if (container && document.fullscreenElement !== container) {
        await container.requestFullscreen()
      }
      hasEnteredFullscreen.current = true
      if (container && document.pointerLockElement !== container) {
        container.requestPointerLock()
      }
      setIsSecurityOverlayVisible(false)
    } catch {
      setIsSecurityOverlayVisible(false)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isBlockedShortcut(event)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        registerSecurityWarning()
      }
    }

    const handleWindowBlur = () => {
      registerSecurityWarning()
    }

    const handleFullscreenChange = () => {
      if (hasEnteredFullscreen.current && !document.fullscreenElement) {
        registerSecurityWarning()
      }
    }

    const blockDocumentAction = (event) => {
      event.preventDefault()
    }

    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('contextmenu', blockDocumentAction)
    document.addEventListener('copy', blockDocumentAction)
    document.addEventListener('cut', blockDocumentAction)
    document.addEventListener('paste', blockDocumentAction)
    document.addEventListener('selectstart', blockDocumentAction)
    document.addEventListener('dragstart', blockDocumentAction)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('contextmenu', blockDocumentAction)
      document.removeEventListener('copy', blockDocumentAction)
      document.removeEventListener('cut', blockDocumentAction)
      document.removeEventListener('paste', blockDocumentAction)
      document.removeEventListener('selectstart', blockDocumentAction)
      document.removeEventListener('dragstart', blockDocumentAction)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [registerSecurityWarning])

  return {
    containerRef,
    warningCount,
    isSecurityOverlayVisible,
    activateSecureMode,
  }
}
