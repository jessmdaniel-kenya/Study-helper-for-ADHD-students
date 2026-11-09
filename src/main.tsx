import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/opendyslexic/400.css'
import '@fontsource/opendyslexic/700.css'
// Reading fonts offered in the Display menu. @font-face files download only when a font is used.
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource/lexend/400.css'
import '@fontsource/lexend/600.css'
import '@fontsource/literata/400.css'
import '@fontsource/literata/700.css'
import '@fontsource/comic-neue/400.css'
import '@fontsource/comic-neue/700.css'
import './index.css'
import { applyStoredPreferences } from './lib/preferences'
import { startSpotlight } from './lib/spotlight'

applyStoredPreferences()
startSpotlight()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)