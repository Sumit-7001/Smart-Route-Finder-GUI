import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import Notification from './Notification';
import './MapRouteFinder.css';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map view updates
const RecenterMap = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coords, map]);
  return null;
};

// Component to handle map centering on user location
const CenterOnUser = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView([coords.lat, coords.lon], 12, { animate: true });
    }
  }, [coords, map]);
  return null;
};

const MapRouteFinder = () => {
  const [nodes, setNodes] = useState([]);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [algorithm, setAlgorithm] = useState('dijkstra');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    try {
      const response = await fetch('http://localhost:5010/api/map-nodes');
      const data = await response.json();
      setNodes(data);
    } catch (err) {
      console.error('Error fetching nodes:', err);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setNotification({ message: 'Geolocation not supported by your browser', type: 'error' });
      return;
    }

    setLoading(true);
    setNotification({ message: 'Determining your location...', type: 'info' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let nearest = null;
        let minDistance = Infinity;

        nodes.forEach((node) => {
          const dist = calculateDistance(latitude, longitude, node.lat, node.lon);
          if (dist < minDistance) {
            minDistance = dist;
            nearest = node;
          }
        });

        if (nearest) {
          setSource(nearest.id);
          setUserLocation({ lat: latitude, lon: longitude });
          setNotification({ message: `Location found! Nearest city: ${nearest.name}`, type: 'success' });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setNotification({ message: 'Unable to retrieve location. Please allow permissions.', type: 'error' });
        setLoading(false);
      }
    );
  };

  const handleRouteSearch = async () => {
    if (!source || !destination) {
      setNotification({ message: 'Select both source and destination', type: 'error' });
      return;
    }
    if (source === destination) {
      setNotification({ message: 'Source and destination cannot be the same', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5010/api/map-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceNode: source, destNode: destination, algorithm }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setResults(data);
        setNotification({ message: `Path found via ${data.algorithm}!`, type: 'success' });
      } else {
        setNotification({ message: data.message || 'No path found', type: 'error' });
      }
    } catch (err) {
      setNotification({ message: 'Server connection error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const pathCoords = results ? results.path.map(n => [n.lat, n.lon]) : [];

  return (
    <div className="map-page-container">
      <nav className="dashboard-nav">
        <div className="nav-brand" onClick={() => navigate('/dashboard')}>
          <div className="siri-logo-orbit">
            <div className="siri-orb"></div>
          </div>
          <span>Smart Route Finder</span>
        </div>
        <div className="nav-profile">
          <button onClick={() => navigate('/dashboard')} className="about-nav-link">Dashboard</button>
          <button onClick={() => navigate('/about')} className="about-nav-link">About</button>
        </div>
      </nav>

      <div className="map-content">
        <aside className="map-controls glass-panel">
          <h2>Map Route Finder</h2>
          <p className="subtitle">Real-world shortest path via backend custom algorithms.</p>
          
          <div className="input-group-map">
            <label>Source City</label>
            <div className="input-with-action">
              <select value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="">Select Source</option>
                {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
              <button 
                className="location-btn" 
                onClick={handleGetCurrentLocation} 
                title="Use Current Location"
                disabled={loading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="input-group-map">
            <label>Destination City</label>
            <select value={destination} onChange={(e) => setDestination(e.target.value)}>
              <option value="">Select Destination</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </div>

          <div className="algorithm-selection-map">
            <label>Algorithm</label>
            <div className="radio-group-map">
              <label className={`radio-pill ${algorithm === 'dijkstra' ? 'active' : ''}`}>
                <input type="radio" value="dijkstra" checked={algorithm === 'dijkstra'} onChange={(e) => setAlgorithm(e.target.value)} />
                <span>Dijkstra</span>
              </label>
              <label className={`radio-pill ${algorithm === 'floyd' ? 'active' : ''}`}>
                <input type="radio" value="floyd" checked={algorithm === 'floyd'} onChange={(e) => setAlgorithm(e.target.value)} />
                <span>Floyd-Warshall</span>
              </label>
            </div>
          </div>

          <div className="button-group-map">
            <button className="search-btn" onClick={handleRouteSearch} disabled={loading}>
              {loading ? 'Calculating...' : 'Find Path'}
            </button>
            <button className="clear-btn-map" onClick={() => setResults(null)}>
              Clear
            </button>
          </div>

          {results && (
            <div className="map-results-summary">
              <div className="summary-stat">
                <span>Distance</span>
                <strong>{results.distance} km</strong>
              </div>
              <div className="summary-stat">
                <span>Optimized Path Flow</span>
                <div className="path-text">
                  {results.path.map((n, i) => (
                    <React.Fragment key={i}>
                      <span className="path-step-node">{n.name}</span>
                      {i < results.path.length - 1 && <span className="path-step-arrow">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>

        <section className="map-display-container">
          <MapContainer center={[20, 78]} zoom={4} scrollWheelZoom={true} className="leaflet-map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {nodes.map(n => (
              <Marker key={n.id} position={[n.lat, n.lon]}>
                <Popup>{n.name}</Popup>
              </Marker>
            ))}
            {userLocation && (
              <Marker 
                position={[userLocation.lat, userLocation.lon]}
                icon={L.divIcon({
                  className: 'user-location-marker',
                  html: '<div class="pulsing-dot"></div>',
                  iconSize: [20, 20]
                })}
              >
                <Popup>You are here</Popup>
              </Marker>
            )}
            {results && <Polyline positions={pathCoords} color="#0076df" weight={5} opacity={0.8} />}
            <RecenterMap coords={pathCoords} />
            <CenterOnUser coords={userLocation} />
          </MapContainer>
        </section>
      </div>

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

export default MapRouteFinder;
