import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ExamRuntimeGate from './examRuntimeGate.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ExamRuntimeGate>
      <App />
    </ExamRuntimeGate>
  </StrictMode>,
)
