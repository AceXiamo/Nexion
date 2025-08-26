import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { Web3Provider } from '@/components/providers/Web3Provider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </React.StrictMode>,
)

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})
