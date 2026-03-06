import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ToastProvider } from './lib/toast.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { registerServiceWorker } from './lib/push.js'
import './index.css'

if ('serviceWorker' in navigator) {
  registerServiceWorker().catch(() => {})
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
        <ToastProvider>
            <App />
        </ToastProvider>
    </ErrorBoundary>,
)
