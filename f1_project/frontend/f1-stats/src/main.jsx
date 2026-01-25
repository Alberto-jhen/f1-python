import React from 'react'
import ReactDOM from 'react-dom/client'
import { Header } from './Header.jsx'
import { Footer } from './Footer.jsx'
import { Form } from './Form.jsx'
import { GraphicsDashboard } from './Graphics.jsx'

const url = import.meta.env.VITE_API_URL
console.log(url)

const rootIndex = document.getElementById('root-index')
if (rootIndex) {
    rootIndex.className = "bg-slate-950 min-h-screen"
    ReactDOM.createRoot(rootIndex).render(
      <>
        <Header />
        <Footer />
      </>
    )
}

const rootForm = document.getElementById('root-form')
if (rootForm) {
    rootForm.className = "bg-slate-950 min-h-screen"
    ReactDOM.createRoot(rootForm).render(
      <>
        <Form />
      </>
    )
}

const rootGraphics = document.getElementById('root-graphics')
if(rootGraphics) {
  rootGraphics.className = "bg-slate-950 min-h-screen"
  ReactDOM.createRoot(rootGraphics).render(
    <>
      <div className="relative flex flex-col"> 
        <div className="relative z-9999">
          <Header />
        </div>
        
        <main className="relative z-0">
          <GraphicsDashboard />
        </main>
        
        <Footer />
      </div>
    </>
  )
}

