import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Notification from './Notification';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { name: 'User' };
  });
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [algorithm, setAlgorithm] = useState('dijkstra');
  const [results, setResults] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [history, setHistory] = useState([]);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  
  // Custom node/edge state
  const [newNodeName, setNewNodeName] = useState('');
  const [newEdgeFrom, setNewEdgeFrom] = useState('');
  const [newEdgeTo, setNewEdgeTo] = useState('');
  const [newEdgeWeight, setNewEdgeWeight] = useState('');

  const [locations, setLocations] = useState([
    { id: 'A', name: 'Downtown', x: 80, y: 150 },
    { id: 'B', name: 'Suburb East', x: 380, y: 80 },
    { id: 'C', name: 'North Park', x: 420, y: 250 },
    { id: 'D', name: 'West Side', x: 120, y: 380 },
    { id: 'E', name: 'Central Station', x: 250, y: 250 },
  ]);

  const [edges, setEdges] = useState([
    { from: 'A', to: 'B', weight: 4 },
    { from: 'A', to: 'D', weight: 3 },
    { from: 'B', to: 'C', weight: 2 },
    { from: 'B', to: 'E', weight: 3 },
    { from: 'C', to: 'E', weight: 1 },
    { from: 'D', to: 'E', weight: 5 },
    { from: 'C', to: 'D', weight: 6 },
  ]);

  useEffect(() => {
    drawGraph();
  }, [results]);

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach(edge => {
      const from = locations.find(l => l.id === edge.from);
      const to = locations.find(l => l.id === edge.to);
      const isHighlighted = results?.path?.includes(edge.from) && results?.path?.includes(edge.to) && 
                            Math.abs(results.path.indexOf(edge.from) - results.path.indexOf(edge.to)) === 1;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      
      if (isHighlighted) {
        ctx.strokeStyle = '#007AFF';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#007AFF';
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();

      // Reset shadow for text
      ctx.shadowBlur = 0;

      // Draw weight
      ctx.fillStyle = isHighlighted ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
      ctx.font = isHighlighted ? 'bold 13px Inter' : '11px Inter';
      ctx.textAlign = 'center';
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      ctx.fillText(edge.weight, midX, midY - 10);
    });

    // Draw nodes
    locations.forEach(loc => {
      const isSelected = source === loc.id || destination === loc.id;
      const isInPath = results?.path?.includes(loc.id);

      // Node shadow/glow
      ctx.beginPath();
      ctx.arc(loc.x, loc.y, 12, 0, Math.PI * 2);
      ctx.shadowBlur = (isSelected || isInPath) ? 20 : 0;
      ctx.shadowColor = '#007AFF';
      ctx.fillStyle = isSelected ? '#ffffff' : (isInPath ? '#007AFF' : '#1c1c1e');
      ctx.fill();

      // Node border
      ctx.strokeStyle = isSelected ? '#ffffff' : '#007AFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Reset shadow for text
      ctx.shadowBlur = 0;
      ctx.fillStyle = isSelected || isInPath ? '#ffffff' : 'rgba(255, 255, 255, 0.7)';
      ctx.font = (isSelected || isInPath) ? 'bold 14px Inter' : '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(loc.name, loc.x, loc.y + 30);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const findRoute = () => {
    if (!source || !destination) {
      setNotification({ message: 'Select both source and destination', type: 'error' });
      return;
    }
    if (source === destination) {
       setNotification({ message: 'Source and destination cannot be the same', type: 'error' });
       return;
    }

    const startTime = performance.now();
    let result;
    
    if (algorithm === 'dijkstra') {
      result = runDijkstra(source, destination);
    } else {
      result = runFloydWarshall(source, destination);
    }
    
    const endTime = performance.now();
    const executionTime = (endTime - startTime).toFixed(4);

    if (result) {
      const newResult = {
        ...result,
        time: executionTime,
        algorithm: algorithm === 'dijkstra' ? 'Dijkstra' : 'Floyd-Warshall'
      };
      setResults(newResult);
      setComparison(null);
      setHistory([newResult, ...history]);
      setNotification({ message: `Path found via ${newResult.algorithm}!`, type: 'success' });
    } else {
      setNotification({ message: 'No path found between these locations', type: 'error' });
    }
  };

  const compareAlgorithms = () => {
    if (!source || !destination || source === destination) {
       setNotification({ message: 'Select distinct source and destination', type: 'error' });
       return;
    }

    const t0 = performance.now();
    const dResult = runDijkstra(source, destination);
    const t1 = performance.now();
    
    const t2 = performance.now();
    const fResult = runFloydWarshall(source, destination);
    const t3 = performance.now();

    setComparison({
      dijkstra: { time: (t1 - t0).toFixed(4), distance: dResult?.distance },
      floyd: { time: (t3 - t2).toFixed(4), distance: fResult?.distance },
      diff: Math.abs((t1 - t0) - (t3 - t2)).toFixed(4)
    });
    setResults(dResult); // Default visualize Dijkstra
    setNotification({ message: 'Comparison complete!', type: 'success' });
  };

  const addNode = () => {
    const trimmedName = newNodeName.trim();
    if (!trimmedName) {
      setNotification({ message: 'Please enter a node name', type: 'error' });
      return;
    }
    
    // Check if name already exists
    if (locations.find(l => l.name.toLowerCase() === trimmedName.toLowerCase())) {
      setNotification({ message: 'A node with this name already exists', type: 'error' });
      return;
    }

    const id = trimmedName.charAt(0).toUpperCase() + Math.floor(Math.random() * 100);
    const x = 50 + Math.random() * 400;
    const y = 50 + Math.random() * 350;
    
    setLocations([...locations, { id, name: trimmedName, x, y }]);
    setNewNodeName('');
    setNotification({ message: `Node "${trimmedName}" added!`, type: 'success' });
  };

  const addEdge = () => {
    if (!newEdgeFrom || !newEdgeTo || !newEdgeWeight) {
      setNotification({ message: 'Select both nodes and enter weight', type: 'error' });
      return;
    }

    if (newEdgeFrom === newEdgeTo) {
      setNotification({ message: 'Cannot connect a node to itself', type: 'error' });
      return;
    }

    const weight = Number(newEdgeWeight);
    if (isNaN(weight) || weight <= 0) {
      setNotification({ message: 'Weight must be a positive number', type: 'error' });
      return;
    }

    // Check if edge already exists (undirected)
    const exists = edges.find(e => 
      (e.from === newEdgeFrom && e.to === newEdgeTo) || 
      (e.from === newEdgeTo && e.to === newEdgeFrom)
    );

    if (exists) {
      setNotification({ message: 'Edge already exists between these nodes', type: 'error' });
      return;
    }

    setEdges([...edges, { from: newEdgeFrom, to: newEdgeTo, weight }]);
    setNewEdgeFrom('');
    setNewEdgeTo('');
    setNewEdgeWeight('');
    setNotification({ message: 'Edge added successfully!', type: 'success' });
  };

  const runDijkstra = (startNode, endNode) => {
    const distances = {};
    const previous = {};
    const nodes = locations.map(l => l.id);
    const pq = [...nodes];

    nodes.forEach(node => {
      distances[node] = Infinity;
      previous[node] = null;
    });
    distances[startNode] = 0;

    while (pq.length > 0) {
      pq.sort((a, b) => distances[a] - distances[b]);
      const closestNode = pq.shift();

      if (distances[closestNode] === Infinity) break;
      if (closestNode === endNode) break;

      edges.filter(e => e.from === closestNode || e.to === closestNode).forEach(edge => {
        const neighbor = edge.from === closestNode ? edge.to : edge.from;
        const alt = distances[closestNode] + edge.weight;
        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = closestNode;
        }
      });
    }

    if (!previous[endNode] && startNode !== endNode) return null;

    const path = [];
    let curr = endNode;
    while (curr) {
      path.unshift(curr);
      curr = previous[curr];
    }
    return { path, distance: distances[endNode] };
  };

  const runFloydWarshall = (startNode, endNode) => {
    const dist = {};
    const next = {};
    const nodes = locations.map(l => l.id);

    nodes.forEach(u => {
      dist[u] = {};
      next[u] = {};
      nodes.forEach(v => {
        dist[u][v] = u === v ? 0 : Infinity;
        next[u][v] = null;
      });
    });

    edges.forEach(edge => {
      dist[edge.from][edge.to] = edge.weight;
      dist[edge.to][edge.from] = edge.weight;
      next[edge.from][edge.to] = edge.to;
      next[edge.to][edge.from] = edge.from;
    });

    nodes.forEach(k => {
      nodes.forEach(i => {
        nodes.forEach(j => {
          if (dist[i][j] > dist[i][k] + dist[k][j]) {
            dist[i][j] = dist[i][k] + dist[k][j];
            next[i][j] = next[i][k];
          }
        });
      });
    });

    if (dist[startNode][endNode] === Infinity) return null;

    const path = [startNode];
    let u = startNode;
    while (u !== endNode) {
      u = next[u][endNode];
      if (u === null) return null;
      path.push(u);
    }
    return { path, distance: dist[startNode][endNode] };
  };

  const clearInputs = () => {
    setSource('');
    setDestination('');
    setResults(null);
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <div className="siri-logo-orbit">
            <div className="siri-orb"></div>
          </div>
          <span>Smart Route Finder</span>
        </div>
        <div className="nav-profile">
          <button onClick={() => navigate('/map-route')} className="about-nav-link">Map Route</button>
          <button onClick={() => navigate('/about')} className="about-nav-link">About</button>
          <span className="user-name-display">{user.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <main className="dashboard-content">
        <section className="controls-section glass-panel">
          <h2>Find Your Route</h2>
          <div className="input-row">
            <div className="dash-input-group">
              <label>Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="">Select Source</option>
                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            </div>
            <div className="dash-input-group">
              <label>Destination</label>
              <select value={destination} onChange={(e) => setDestination(e.target.value)}>
                <option value="">Select Destination</option>
                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            </div>
          </div>

          <div className="algorithm-selection">
            <label>Algorithm</label>
            <div className="radio-group">
              <label className="radio-btn">
                <input type="radio" value="dijkstra" checked={algorithm === 'dijkstra'} onChange={(e) => setAlgorithm(e.target.value)} />
                <span>Dijkstra</span>
              </label>
              <label className="radio-btn">
                <input type="radio" value="floyd" checked={algorithm === 'floyd'} onChange={(e) => setAlgorithm(e.target.value)} />
                <span>Floyd-Warshall</span>
              </label>
            </div>
          </div>

          <div className="button-group">
            <button className="find-btn" onClick={findRoute}>Find Shortest Route</button>
            <button className="compare-btn" onClick={compareAlgorithms}>Compare</button>
            <button className="reset-btn" onClick={clearInputs}>Reset</button>
          </div>
        </section>

        <section className="testing-section glass-panel">
          <h2>Testing Hub</h2>
          <div className="add-controls">
            <div className="add-group">
              <input value={newNodeName} onChange={e => setNewNodeName(e.target.value)} placeholder="Node Name" />
              <button onClick={addNode}>Add Node</button>
            </div>
            <div className="add-group">
              <select value={newEdgeFrom} onChange={e => setNewEdgeFrom(e.target.value)}>
                <option value="">From</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <select value={newEdgeTo} onChange={e => setNewEdgeTo(e.target.value)}>
                <option value="">To</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <input type="number" value={newEdgeWeight} onChange={e => setNewEdgeWeight(e.target.value)} placeholder="Weight" />
              <button onClick={addEdge}>Add Edge</button>
            </div>
          </div>
        </section>

        <section className="visualization-section glass-panel">
          <h2>Network Visualization</h2>
          <div className="canvas-container">
            <canvas ref={canvasRef} width="500" height="450"></canvas>
          </div>
        </section>

        {results && (
          <section className="results-section glass-panel">
            <h2>Search Results</h2>
            <div className="result-stats">
              <div className="stat-card">
                <span className="stat-label">Distance</span>
                <span className="stat-value">{results.distance} km</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Used Algorithm</span>
                <span className="stat-value">{results.algorithm}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Execution Time</span>
                <span className="stat-value">{results.time} ms</span>
              </div>
            </div>
            <div className="path-display">
              <span className="stat-label">Optimal Path:</span>
              <div className="path-steps">
                {results.path.map((nodeId, index) => {
                  const loc = locations.find(l => l.id === nodeId);
                  return (
                    <React.Fragment key={index}>
                      <span className="path-node">{loc ? loc.name : nodeId}</span>
                      {index < results.path.length - 1 && <span className="path-arrow">→</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {comparison && (
          <section className="comparison-section glass-panel">
            <h2>Algorithm Comparison</h2>
            <div className="comparison-table">
               <div className="comp-row head">
                  <span>Metric</span>
                  <span>Dijkstra</span>
                  <span>Floyd-Warshall</span>
               </div>
               <div className="comp-row">
                  <span>Exec Time</span>
                  <span>{comparison.dijkstra.time} ms</span>
                  <span>{comparison.floyd.time} ms</span>
               </div>
               <div className="comp-row">
                  <span>Distance</span>
                  <span>{comparison.dijkstra.distance || 'N/A'}</span>
                  <span>{comparison.floyd.distance || 'N/A'}</span>
               </div>
            </div>
            <p className="comp-note">Performance Gap: {comparison.diff} ms</p>
          </section>
        )}

        {history.length > 0 && (
          <section className="history-section glass-panel">
            <h2>Recent Searches</h2>
            <div className="history-list">
              {history.map((item, index) => {
                const srcLoc = locations.find(l => l.id === item.source);
                const destLoc = locations.find(l => l.id === item.destination);
                return (
                  <div key={index} className="history-item">
                    <span>{srcLoc ? srcLoc.name : item.source} → {destLoc ? destLoc.name : item.destination} ({item.algorithm})</span>
                    <span>{item.distance} km</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <div className="fixed-notification-wrapper">
         <Notification 
            message={notification.message} 
            type={notification.type} 
            onClose={() => setNotification({ message: '', type: '' })} 
         />
      </div>
    </div>
  );
};

export default Dashboard;
