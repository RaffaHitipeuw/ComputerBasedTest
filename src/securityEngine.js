const appScriptId = 'app-core'
const suspiciousGlobalNames = ['GM_info', 'GM', '__TAMPERMONKEY__', '__VIOLENTMONKEY__']
const suspiciousText = /monica|chatgpt|copilot|tampermonkey|violentmonkey|solver|autofill|answer[- ]?bot|ask ai/i

function getSuspiciousGlobals() {
  return suspiciousGlobalNames
    .filter((name) => name in window)
    .map((name) => `window.${name}`)
}

function getUnknownScripts() {
  return Array.from(document.scripts)
    .filter((script) => {
      const source = script.getAttribute('src') || ''
      const scriptId = script.getAttribute('id') || ''
      return scriptId !== appScriptId && source && !source.startsWith(window.location.origin)
    })
    .map((script) => script.src)
}

function createHoneypot() {
  const honeypot = document.createElement('div')
  honeypot.id = 'exam-honeypot-question'
  honeypot.setAttribute('aria-hidden', 'true')
  honeypot.textContent = 'Soal umpan: 7 × 8 = ?'
  honeypot.style.cssText = [
    'position:fixed',
    'width:1px',
    'height:1px',
    'overflow:hidden',
    'opacity:0',
    'pointer-events:none',
    'left:-10000px',
    'top:-10000px',
  ].join(';')
  document.body.appendChild(honeypot)
  return honeypot
}

function getHoneypotSignals(honeypot) {
  const injectedChildren = Array.from(honeypot.children)
  const suspiciousAttributes = Array.from(honeypot.attributes)
    .filter((attribute) => attribute.name !== 'id' && attribute.name !== 'aria-hidden' && attribute.name !== 'style')

  const injectedNames = [
    ...injectedChildren.flatMap((node) => [
      node.tagName.toLowerCase(),
      node.textContent || '',
      node.id || '',
      typeof node.className === 'string' ? node.className : '',
    ]),
    ...suspiciousAttributes.map((attribute) => `${attribute.name}=${attribute.value}`),
  ].filter((value) => suspiciousText.test(value))

  return injectedNames
}

function isNativeFunction(value) {
  try {
    return typeof value === 'function' && Function.prototype.toString.call(value).includes('[native code]')
  } catch {
    return false
  }
}

export function detectPrototypeTampering() {
  const anomalies = []

  const nativeTargets = [
    [EventTarget.prototype.addEventListener, 'EventTarget.prototype.addEventListener', 'Fungsi addEventListener telah di-hook atau dimanipulasi.'],
    [Document.prototype.createElement, 'Document.prototype.createElement', 'Fungsi createElement telah di-hook atau dimanipulasi.'],
  ]

  nativeTargets.forEach(([functionValue, target, detail]) => {
    if (!isNativeFunction(functionValue)) {
      anomalies.push({ type: 'Prototype Override', source: target, detail })
    }
  })

  const hiddenDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden')
  if (hiddenDescriptor?.get && !isNativeFunction(hiddenDescriptor.get)) {
    anomalies.push({
      type: 'Property Poisoning',
      source: 'Document.prototype.hidden',
      detail: 'Getter document.hidden telah dipalsukan atau di-hook.',
    })
  }

  getSuspiciousGlobals().forEach((globalName) => {
    anomalies.push({
      type: 'Userscript Environment',
      source: globalName,
      detail: `Environment userscript terlihat melalui ${globalName}.`,
    })
  })

  if (anomalies.length > 0) {
    console.warn('[Exam Security] Anomali prototype/environment:', anomalies)
  }

  return anomalies
}

export function scanExamEnvironment() {
  const honeypot = document.getElementById('exam-honeypot-question') || createHoneypot()
  const detectedExtensions = []

  document.querySelectorAll('script').forEach((script) => {
    const src = script.src || ''
    const textContent = script.textContent || ''

    if (src && !src.includes(window.location.origin) && !src.includes('vite/client')) {
      detectedExtensions.push({
        type: 'External Script',
        source: src,
        detail: `Script luar dimuat dari: ${src}`,
      })
    }

    if (/tampermonkey|violentmonkey/i.test(textContent) || window.GM_info || window.GM) {
      detectedExtensions.push({
        type: 'Userscript Manager',
        source: 'Tampermonkey / Violentmonkey',
        detail: 'Signature userscript manager terlihat di halaman.',
      })
    }

    if (src.startsWith('chrome-extension://') || src.startsWith('moz-extension://')) {
      detectedExtensions.push({
        type: 'Browser Extension',
        source: src,
        detail: `Extension resource terlihat dari ID: ${src.split('/')[2]}`,
      })
    }
  })

  const honeypotSignals = getHoneypotSignals(honeypot)
  honeypotSignals.forEach((signal) => {
    detectedExtensions.push({
      type: 'Honeypot Injection',
      source: signal,
      detail: 'Node atau atribut mencurigakan ditemukan di elemen honeypot.',
    })
  })

  const detectedByName = getSuspiciousGlobals()
  detectedByName.forEach((signal) => {
    detectedExtensions.push({
      type: 'Userscript Global',
      source: signal,
      detail: `Global userscript terlihat: ${signal}`,
    })
  })

  const prototypeAnomalies = detectPrototypeTampering()
  const uniqueDetections = [...detectedExtensions, ...prototypeAnomalies].filter((detection, index, all) => (
    all.findIndex((item) => item.type === detection.type && item.source === detection.source) === index
  ))

  console.group('[Exam Security] Honeypot scan')
  if (uniqueDetections.length === 0) {
    console.info('Tidak ada jejak userscript atau injector yang terdeteksi. Ujian boleh dimulai.')
  } else {
    console.warn('Jejak script/ekstensi yang terlihat:', uniqueDetections)
  }
  console.groupEnd()

  return {
    clean: uniqueDetections.length === 0,
    signals: uniqueDetections.map((detection) => `${detection.type}: ${detection.source}`),
    detections: uniqueDetections,
  }
}

export function removeExamHoneypot() {
  document.getElementById('exam-honeypot-question')?.remove()
}
