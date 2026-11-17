import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Admin from './Admin.tsx'
import './evaluations.css'

const isReview = window.location.pathname.replace(/\/+$/, '') === '/review'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isReview ? <Admin /> : <App />}
  </StrictMode>,
)
