import React from 'react'
import ReactDOM from 'react-dom/client'
import { Header } from './components/Layout/Header.jsx'
import { Footer } from './components/Layout/Footer.jsx'
import { GraphicsDashboard } from './pages/Graphics.jsx'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";


const rootIndex = document.getElementById('root-index')
if (rootIndex) {
    rootIndex.className = "bg-slate-950 min-h-screen"
    ReactDOM.createRoot(rootIndex).render(
      <>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </>
    )
}

