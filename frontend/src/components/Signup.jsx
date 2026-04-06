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
      <div className="fixed-notification-wrapper">
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification({ message: '', type: '' })} 
        />
      </div>
      <div className="card-wrapper">
        <div className="login-card">
          <div className="login-header">
            <div className="apple-brand-icon">
              <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            </div>
            <h1>Create Your Account</h1>
            <p>Join the future of route finding.</p>
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
          
          <button type="submit" className="login-btn continue-btn">
            Continue
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









