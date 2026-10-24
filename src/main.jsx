import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

function syncVisualViewport() {
  const viewport = window.visualViewport
  const height = viewport?.height || window.innerHeight
  const top = viewport?.offsetTop || 0
  document.documentElement.style.setProperty('--app-height', `${height}px`)
  document.documentElement.style.setProperty('--app-top', `${top}px`)
}

syncVisualViewport()
window.addEventListener('resize', syncVisualViewport)
window.visualViewport?.addEventListener('resize', syncVisualViewport)
window.visualViewport?.addEventListener('scroll', syncVisualViewport)

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}
