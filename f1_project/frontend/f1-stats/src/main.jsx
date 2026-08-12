import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from './context/AuthProvider.jsx';


const rootIndex = document.getElementById('root-index')
if (rootIndex) {
    rootIndex.className = "bg-slate-950 min-h-screen"
    ReactDOM.createRoot(rootIndex).render(
      <>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </>
    )
}

