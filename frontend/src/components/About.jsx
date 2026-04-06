import React from 'react';
import { useNavigate } from 'react-router-dom';
import './About.css';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="about-container">
      <div className="siri-bg">
        <div className="siri-orb main-orb"></div>
        <div className="siri-orb secondary-orb"></div>
      </div>

      <div className="about-card glass-panel">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <span>←</span> Back
        </button>

        <header className="about-header">
          <div className="app-icon">
            <div className="siri-logo-orbit small">
              <div className="siri-orb"></div>
            </div>
          </div>
          <h1>Smart Route Finder</h1>
          <p className="version">Version 1.0.0 • Premium Edition</p>
        </header>

        <div className="about-content">
          <section className="about-section">
            <h2>Our Purpose</h2>
            <p>
              Smart Route Finder is an effortless way to visualize complex networks, discover the most efficient paths, 
              and master graph analysis with speed and precision. Built with the strongest commitment to design 
              excellence and user privacy, it is the most intuitive pathfinding assistant for your professional workflow.
            </p>
          </section>

          <section className="about-section">
            <h2>Technological Core</h2>
            <div className="algo-grid">
              <div className="algo-card">
                <h3>Dijkstra's Algorithm</h3>
                <p>An efficient greedy approach for finding the shortest paths between nodes in a graph, ideal for real-time routing.</p>
              </div>
              <div className="algo-card">
                <h3>Floyd-Warshall</h3>
                <p>A robust all-pairs shortest path algorithm that ensures comprehensive network analysis for all possible connections.</p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>The Tech Stack</h2>
            <ul className="tech-list">
              <li><span>Frontend:</span> React, Vite, Vanilla CSS</li>
              <li><span>Backend:</span> Node.js, Express</li>
              <li><span>Persistence:</span> MongoDB, LocalStorage</li>
              <li><span>Design:</span> Siri-Inspired Glassmorphism</li>
            </ul>
          </section>
        </div>

        <footer className="about-footer">
          <p>© 2026 Smart Route Finder GUI. Made with ❤️ for pathfinding enthusiasts.</p>
        </footer>
      </div>
    </div>
  );
};

export default About;
