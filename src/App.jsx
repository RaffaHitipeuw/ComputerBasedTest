import { useState } from 'react'
import questions from './questions'
import { useExamSecurity } from './examSecurity'
import { useExamHardening } from './examHardening'

function FormCard({ answers, onAnswerChange, onSubmit, onReset }) {
  return (
    <>
      {questions.map((question) => (
        <section className="question-card" aria-labelledby={`question-${question.id}`} key={question.id}>
          <p id={`question-${question.id}`} className="question-label">
            {question.id}. {question.question}
          </p>
          <fieldset className="options" aria-label={`Pilihan jawaban soal ${question.id}`}>
            {question.options.map((option) => (
              <label className="radio-option" key={option}>
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={(event) => onAnswerChange(question.id, event.target.value)}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
        </section>
      ))}

      <div className="form-actions">
        <button className="submit-button" type="button" onClick={onSubmit}>
          Kirim
        </button>
        <button className="reset-button" type="button" onClick={onReset}>
          Kosongkan formulir
        </button>
      </div>
    </>
  )
}

function ConfirmationCard({ onAnotherResponse }) {
  return (
    <section className="confirmation-content" aria-live="polite">
      <p>Jawaban Anda telah direkam</p>
      <button className="another-response" type="button" onClick={onAnotherResponse}>
        Kirim jawaban lain
      </button>
    </section>
  )
}

function SecurityOverlay({ warningCount, onReactivate }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-warning-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: 'rgba(32, 33, 36, 0.96)',
        color: '#ffffff',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '420px' }}>
        <h2 id="security-warning-title" style={{ margin: '0 0 12px', fontSize: '24px' }}>
          Mode keamanan ujian aktif
        </h2>
        <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}>
          Fokus halaman berubah atau mode layar penuh ditutup. Kembali ke halaman ujian untuk melanjutkan.
        </p>
        <p style={{ margin: '0 0 20px', color: '#d9d5ff', fontSize: '14px' }}>
          Peringatan: {warningCount}
        </p>
        <button
          type="button"
          onClick={onReactivate}
          style={{
            minHeight: '42px',
            padding: '0 20px',
            borderRadius: '3px',
            background: '#6b4ce6',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Kembali ke ujian
        </button>
      </div>
    </div>
  )
}

function App() {
  const [answers, setAnswers] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const {
    containerRef,
    warningCount,
    isSecurityOverlayVisible,
    activateSecureMode,
  } = useExamSecurity()
  const { tamperCount, hasTampering, clearTampering } = useExamHardening()

  const updateAnswer = (questionId, answer) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: answer,
    }))
  }

  const resetForm = () => {
    setAnswers({})
    setIsSubmitted(false)
  }

  const reactivateSecurity = () => {
    clearTampering()
    activateSecureMode()
  }

  return (
    <main className="page-shell">
      <section
        ref={containerRef}
        className="form-container"
        onPointerDown={activateSecureMode}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          maxHeight: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
        }}
      >
        <header className="title-card">
          <h1>Formulir tanpa judul</h1>
        </header>

        {isSubmitted ? (
          <ConfirmationCard onAnotherResponse={resetForm} />
        ) : (
          <FormCard
            answers={answers}
            onAnswerChange={updateAnswer}
            onSubmit={() => setIsSubmitted(true)}
            onReset={resetForm}
          />
        )}

        {(isSecurityOverlayVisible || hasTampering) && (
          <SecurityOverlay
            warningCount={warningCount + tamperCount}
            onReactivate={reactivateSecurity}
          />
        )}
      </section>
    </main>
  )
}

export default App
