import { useEffect, useState } from 'react'

const suspiciousPattern = /monica|tampermonkey|chatgpt|copilot|solver|autofill|answer-bot|extension/i
const cspContent = "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws: http: https:"

function describeNode(node) {
  if (!(node instanceof Element)) return ''

  return [
    node.id,
    node.className,
    node.getAttribute('aria-label'),
    node.getAttribute('title'),
    node.getAttribute('data-testid'),
  ].filter(Boolean).join(' ')
}

function isSuspiciousNode(node) {
  if (!(node instanceof Element)) return false

  const isForeignScript = node.tagName === 'SCRIPT' && node.src && new URL(node.src, window.location.href).origin !== window.location.origin
  return isForeignScript || suspiciousPattern.test(describeNode(node))
}

export function useExamHardening() {
  const [tamperCount, setTamperCount] = useState(0)

  useEffect(() => {
    const cspMeta = document.createElement('meta')
    cspMeta.httpEquiv = 'Content-Security-Policy'
    cspMeta.content = cspContent
    cspMeta.dataset.examSecurity = 'csp'
    document.head.appendChild(cspMeta)

    const observer = new MutationObserver((mutations) => {
      let detectedTampering = false

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (isSuspiciousNode(node)) {
            detectedTampering = true
            node.remove()
          }
        })
      })

      if (detectedTampering) {
        setTamperCount((count) => count + 1)
      }
    })

    observer.observe(document.documentElement, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      cspMeta.remove()
    }
  }, [])

  return {
    tamperCount,
    hasTampering: tamperCount > 0,
    clearTampering: () => setTamperCount(0),
  }
}
