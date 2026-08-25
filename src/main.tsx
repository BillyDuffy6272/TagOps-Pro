import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './lib/ThemeContext.tsx'

// Applied synchronously, before React's first render, so an explicit
// light/dark choice takes effect on first paint rather than flashing the
// default dark theme for a frame — ThemeProvider re-derives the same value
// on mount and keeps it in sync from there.
const storedTheme = localStorage.getItem('tagops-theme')
if (storedTheme === 'light' || storedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', storedTheme)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
