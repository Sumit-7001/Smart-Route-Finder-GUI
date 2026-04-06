import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import About from './components/About'
import MapRouteFinder from './components/MapRouteFinder'

function App() {
  return (
    <Router>
      <div className="App">
        <div className="siri-bg">
          <div className="siri-orb orb-1"></div>
          <div className="siri-orb orb-2"></div>
          <div className="siri-orb orb-3"></div>
          <div className="siri-orb orb-4"></div>
          <div className="siri-orb orb-5"></div>
          <div className="siri-orb orb-6"></div>
          <div className="siri-aura"></div>
          <div className="siri-glow"></div>
        </div>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/map-route" element={<MapRouteFinder />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
