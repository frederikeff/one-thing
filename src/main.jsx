import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { requestPersistence } from './db.js'
import './styles.css'

requestPersistence()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
