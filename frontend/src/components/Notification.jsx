import React, { useEffect } from 'react';
import './Notification.css';

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className={`notification-container ${type}`}>
      <div className="notification-content">
        <div className="notification-icon">
          {type === 'success' ? '✓' : '!'}
        </div>
        <span className="notification-message">{message}</span>
      </div>
      <div className="notification-progress"></div>
    </div>
  );
};

export default Notification;
