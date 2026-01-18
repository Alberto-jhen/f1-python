import React from 'react'
import ReactDOM from 'react-dom/client'

const url = import.meta.env.VITE_API_URL
console.log(url)

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <h1 className="text-white bg-green-800 p-10">
      Tailwind y React funcionando.
    </h1>
  </>
)
