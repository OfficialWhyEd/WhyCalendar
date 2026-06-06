import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/chakra-petch/400.css'
import '@fontsource/chakra-petch/600.css'
import '@fontsource/chakra-petch/700.css'
import './styles/fonts.css'
import './styles/globals.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
