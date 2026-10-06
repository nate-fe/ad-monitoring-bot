import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import './make.css'
import { MakeApp } from './MakeApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MakeApp />
  </StrictMode>,
)
