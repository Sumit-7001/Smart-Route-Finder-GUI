import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import User from './models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runDijkstra, runFloydWarshall } from './utils/routing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5010;
const MONGO_URI = 'mongodb://localhost:27017/routeFinder';

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    user = new User({ name, email, password });
    await user.save();
    
    console.log('User signed up successfully:', user.email);
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    
    if (user) {
      res.json({ message: 'Login successful', user: { name: user.name, email: user.email } });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Map Route Finder Endpoints
app.get('/api/map-nodes', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'map_graph.json'), 'utf8'));
    res.json(data.nodes);
  } catch (err) {
    console.error('Error reading map data:', err);
    res.status(500).json({ message: 'Error reading map data' });
  }
});

app.post('/api/map-route', (req, res) => {
  try {
    const { sourceNode, destNode, algorithm } = req.body;
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'map_graph.json'), 'utf8'));
    
    const startTime = performance.now();
    let result;
    
    if (algorithm === 'dijkstra') {
      result = runDijkstra(data.nodes, data.edges, sourceNode, destNode);
    } else {
      result = runFloydWarshall(data.nodes, data.edges, sourceNode, destNode);
    }
    
    const endTime = performance.now();
    const executionTime = (endTime - startTime).toFixed(4);

    if (result) {
      const pathNodes = result.path.map(id => data.nodes.find(n => n.id === id));
      res.json({
        ...result,
        path: pathNodes,
        time: executionTime,
        algorithm: algorithm === 'dijkstra' ? 'Dijkstra' : 'Floyd-Warshall'
      });
    } else {
      res.status(404).json({ message: 'No path found' });
    }
  } catch (err) {
    console.error('Routing error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
