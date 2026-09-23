import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (<>
  <p>
    Gastosaurus.
  </p>

  <h1>
    Master Your Budget, Effortlessly.
  </h1>

  <p>Track expenses, save smarter, and take control of your finances.</p>

  <button>Start Saving</button>

  <div className = "bar">
    <p>Smart Categorization</p>
    <p>Clarifies and gamifies money's categorization to expenses.</p>
  </div>
  </>

  )
}

export default App
