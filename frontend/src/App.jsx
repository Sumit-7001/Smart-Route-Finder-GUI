import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import Signup from './components/Signup'

function App() {
  return (
    <Router>
      <div className="App">
        <div className="siri-bg">
          <div className="siri-aura"></div>
          <div className="siri-glow"></div>
        </div>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
