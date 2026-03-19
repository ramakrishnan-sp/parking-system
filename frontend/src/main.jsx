import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ThemeProvider } from './components/common/ThemeProvider'
import { Toaster } from 'sonner'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{ duration: 4000 }}
      />
    </ThemeProvider>
  </StrictMode>
)
