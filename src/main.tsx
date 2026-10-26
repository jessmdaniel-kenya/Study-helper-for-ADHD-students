import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// No StrictMode on purpose: it would run the anonymous sign-in twice in development.
createRoot(document.getElementById('root')!).render(<App />)