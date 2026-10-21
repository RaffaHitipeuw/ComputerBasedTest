import { useEffect, useState } from 'react'
import { removeExamHoneypot, scanExamEnvironment } from './securityEngine'

function readManagedRuntimeStatus() {
  try {
    const runtime = window.examRuntime
    const status = typeof runtime?.getStatus === 'function'
      ? runtime.getStatus()
      : runtime

    let extensions = status?.extensions
    if (typeof runtime?.getExtensions === 'function') {
      extensions = runtime.getExtensions()
    }

    const hasExtensionAudit = Array.isArray(extensions)
    const activeExtensions = hasExtensionAudit
      ? extensions.filter((extension) => extension && extension.enabled !== false)
      : []

    console.group('[Exam Runtime] Extension audit')
    console.info('Runtime terkelola:', status?.managed === true)
    console.info('Mode kiosk:', status?.kiosk === true)
    console.info('Ekstensi diblokir:', status?.extensionsBlocked === true)

    if (!hasExtensionAudit) {
      console.warn('Fakta audit: runtime tidak menyediakan daftar ekstensi. Tidak ada ekstensi yang terdeteksi oleh audit ini; ujian dilanjutkan.')
    } else if (activeExtensions.length === 0) {
      console.info('Fakta audit: tidak ada ekstensi aktif. Ujian boleh dimulai.')
    } else {
      console.table(activeExtensions)
      console.warn(
        'Fakta audit: ekstensi aktif terdeteksi:',
        activeExtensions.map((extension) => extension.name || extension.id || 'Ekstensi tanpa nama'),
      )
    }
    console.groupEnd()

    const environmentScan = scanExamEnvironment()

    return {
      isTrustedRuntime: Boolean(
        activeExtensions.length === 0 && environmentScan.clean,
      ),
      hasExtensionAudit,
      activeExtensions,
      environmentScan,
    }
  } catch (error) {
    console.error('[Exam Runtime] Audit ekstensi gagal:', error)
    return {
      isTrustedRuntime: false,
      hasExtensionAudit: false,
      activeExtensions: [],
      environmentScan: { clean: false, signals: ['audit-error'] },
    }
  }
}

function RuntimeBlockedScreen({ audit }) {
  const hasActiveExtensions = audit.activeExtensions.length > 0

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: '#f1f0ff',
        color: '#202124',
        fontFamily: 'Arial, Helvetica, sans-serif',
        textAlign: 'center',
      }}
    >
      <section style={{ maxWidth: '520px' }}>
        <h1 style={{ marginBottom: '12px' }}>Ujian tidak dapat dimulai</h1>
        {audit.environmentScan && !audit.environmentScan.clean ? (
          <>
            <p style={{ lineHeight: 1.6 }}>
              Jejak userscript atau injector terdeteksi. Matikan script/ekstensi yang mencurigakan lalu refresh halaman.
            </p>
            <ul style={{ textAlign: 'left', lineHeight: 1.8 }}>
              {(audit.environmentScan.detections || []).map((detection, index) => (
                <li key={`${detection.type}-${detection.source}-${index}`}>
                  <strong>{detection.type}</strong>: {detection.source}
                </li>
              ))}
            </ul>
          </>
        ) : hasActiveExtensions ? (
          <>
            <p style={{ lineHeight: 1.6 }}>
              Ekstensi aktif terdeteksi. Tutup atau nonaktifkan ekstensi berikut lalu buka ulang Exam Browser:
            </p>
            <ul style={{ textAlign: 'left', lineHeight: 1.8 }}>
              {audit.activeExtensions.map((extension, index) => (
                <li key={extension.id || extension.name || index}>
                  {extension.name || extension.id || 'Ekstensi tanpa nama'}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p style={{ lineHeight: 1.6 }}>
            Daftar ekstensi tidak dapat diverifikasi. Ujian hanya dapat dibuka melalui Exam Browser terkelola yang menyediakan audit ekstensi.
          </p>
        )}
      </section>
    </main>
  )
}

export default function ExamRuntimeGate({ children }) {
  const [audit, setAudit] = useState(null)

  useEffect(() => {
    setAudit(readManagedRuntimeStatus())

    return () => removeExamHoneypot()
  }, [])

  if (!audit) {
    return <main aria-live="polite">Memeriksa keamanan Exam Browser...</main>
  }

  if (!audit.isTrustedRuntime) {
    return <RuntimeBlockedScreen audit={audit} />
  }

  return children
}
