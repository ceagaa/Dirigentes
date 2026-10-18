import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const alvo = document.getElementById('root')
if (!alvo) throw new Error('Elemento #root não encontrado.')

createRoot(alvo).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
