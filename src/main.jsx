import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AppProvider } from './state/AppContext'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* defaultView: 'dashboard' | 'entry' | 'fixed' | 'acc'; currencyShort shows ₹1.2L-style headline figures */}
    <AppProvider defaultView="dashboard" currencyShort={false}>
      <App />
    </AppProvider>
  </StrictMode>,
)
