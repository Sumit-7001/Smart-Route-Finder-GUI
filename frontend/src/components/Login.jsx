import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Notification from './Notification';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const navigate = useNavigate();

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5010/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      if (response.ok) {
        showNotification(`Welcome back, ${data.user.name}!`, 'success');
      } else {
        showNotification(data.message || 'Login failed', 'error');
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
            <h1>Welcome Back</h1>
            <p>Sign in to your account</p>
          </div>
          
          <form className="login-form" onSubmit={handleLogin}>
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
            Sign In
          </button>
        </form>
        
        <div className="login-footer">
          <a href="#">Forgot Password?</a>
          <p>Don't have an account? <Link to="/signup">Create one now.</Link></p>
        </div>
          </div>
        </div>
      </div>
    );
  };

export default Login;
