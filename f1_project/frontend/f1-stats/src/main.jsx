import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.jsx'
import { Header } from './Header.jsx'
import { Footer } from './Footer.jsx'

const url = import.meta.env.VITE_API_URL
console.log(url)

const rootIndex = document.getElementById('root-index')

rootIndex.className = "bg-gradient-to-b from-slate-950 to-slate-900 min-h-screen"

ReactDOM.createRoot(rootIndex).render(
  <>
    <Header />
    <App />
    <Footer />
  </>
)
