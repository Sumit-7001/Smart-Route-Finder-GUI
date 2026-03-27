import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Notification from './Notification';
import './Login.css'; // Reuse Login.css for consistent base styles

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const navigate = useNavigate();

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5010/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      if (response.ok) {
        showNotification('Signup successful! Please login.', 'success');
        setTimeout(() => navigate('/'), 2000);
      } else {
        showNotification(data.message || 'Signup failed', 'error');
      }
    } catch (err) {
      showNotification('Connection error. Is the server running?', 'error');
    }
  };

  return (
    <div className="login-container">
      <div className="card-wrapper" style={{ position: 'relative' }}>
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification({ message: '', type: '' })} 
        />
        <div className="login-card">
          <div className="login-header">
            <div className="siri-logo-orbit">
              <div className="siri-orb"></div>
            </div>
            <h1>Create Account</h1>
            <p>Join our premium platform</p>
          </div>
          
          <form className="login-form" onSubmit={handleSignup}>
          <div className="input-group">
            <input 
              type="text" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=" "
            />
            <label>Full Name</label>
            <div className="input-glow"></div>
          </div>

          <div className="input-group">
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
            />
            <label>Email Address</label>
            <div className="input-glow"></div>
          </div>
          
          <div className="input-group">
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
            />
            <label>Password</label>
            <div className="input-glow"></div>
          </div>
          
          <button type="submit" className="login-btn">
            Sign Up
          </button>
        </form>
        
        <div className="login-footer">
          <p>Already have an account? <Link to="/">Sign In</Link></p>
        </div>
          </div>
        </div>
      </div>
    );
  };

export default Signup;
