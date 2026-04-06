/**
 * Siri-Style Notification System
 * Replicates the original React Notification component behavior.
 */

function showNotification(message, type = 'success', duration = 3000) {
    const root = document.getElementById('notification-root');
    if (!root) return;

    // Create container
    const container = document.createElement('div');
    container.className = `notification-container ${type}`;

    // Create content
    const content = document.createElement('div');
    content.className = 'notification-content';

    const icon = document.createElement('div');
    icon.className = 'notification-icon';
    icon.innerText = type === 'success' ? '✓' : '!';

    const messageSpan = document.createElement('span');
    messageSpan.className = 'notification-message';
    messageSpan.innerText = message;

    content.appendChild(icon);
    content.appendChild(messageSpan);
    container.appendChild(content);

    // Create progress bar
    const progress = document.createElement('div');
    progress.className = 'notification-progress';
    // Match the animation duration to the dismissal timer
    progress.style.animationDuration = `${duration}ms`;
    container.appendChild(progress);

    // Append to root
    root.appendChild(container);

    // Auto-dismiss
    setTimeout(() => {
        container.style.opacity = '0';
        container.style.transform = 'translateY(-20px)';
        container.style.transition = 'all 0.4s ease';
        
        setTimeout(() => {
            container.remove();
        }, 400);
    }, duration);
}

// Global exposure
window.showNotification = showNotification;
