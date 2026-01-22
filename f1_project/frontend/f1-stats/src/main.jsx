import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.jsx'
import { Header } from './Header.jsx'
import { Footer } from './Footer.jsx'
import { Form } from './Form.jsx'

const url = import.meta.env.VITE_API_URL
console.log(url)

const rootIndex = document.getElementById('root-index')
if (rootIndex) {
    rootIndex.className = "bg-gradient-to-b from-slate-950 to-slate-900 min-h-screen"
    ReactDOM.createRoot(rootIndex).render(
      <>
        <Header />
        <App />
        <Footer />
      </>
    )
}

const rootForm = document.getElementById('root-form')
if (rootForm) {
    rootForm.className = "bg-gradient-to-b from-slate-950 to-slate-900 min-h-screen"
    ReactDOM.createRoot(rootForm).render(
      <>
        <Form />
      </>
    )
}

