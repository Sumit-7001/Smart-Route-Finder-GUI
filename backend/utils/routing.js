/**
 * Calculate the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
};

export const runDijkstra = (nodes, edges, startNodeId, endNodeId) => {
  const distances = {};
  const previous = {};
  const pq = [];

  nodes.forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
    pq.push(node.id);
  });

  distances[startNodeId] = 0;

  while (pq.length > 0) {
    pq.sort((a, b) => distances[a] - distances[b]);
    const currId = pq.shift();

    if (distances[currId] === Infinity) break;
    if (currId === endNodeId) break;

    const currNode = nodes.find(n => n.id === currId);
    
    edges.filter(e => e.from === currId || e.to === currId).forEach(edge => {
      const neighborId = edge.from === currId ? edge.to : edge.from;
      const neighborNode = nodes.find(n => n.id === neighborId);
      
      const weight = calculateDistance(currNode.lat, currNode.lon, neighborNode.lat, neighborNode.lon);
      const alt = distances[currId] + weight;
      
      if (alt < distances[neighborId]) {
        distances[neighborId] = alt;
        previous[neighborId] = currId;
      }
    });
  }

  if (!previous[endNodeId] && startNodeId !== endNodeId) return null;

  const path = [];
  let curr = endNodeId;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return { path, distance: distances[endNodeId] };
};

export const runFloydWarshall = (nodes, edges, startNodeId, endNodeId) => {
  const dist = {};
  const next = {};
  const nodeIds = nodes.map(n => n.id);

  nodeIds.forEach(u => {
    dist[u] = {};
    next[u] = {};
    nodeIds.forEach(v => {
      dist[u][v] = u === v ? 0 : Infinity;
      next[u][v] = null;
    });
  });

  edges.forEach(edge => {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    const weight = calculateDistance(fromNode.lat, fromNode.lon, toNode.lat, toNode.lon);
    
    dist[edge.from][edge.to] = weight;
    dist[edge.to][edge.from] = weight;
    next[edge.from][edge.to] = edge.to;
    next[edge.to][edge.from] = edge.from;
  });

  nodeIds.forEach(k => {
    nodeIds.forEach(i => {
      nodeIds.forEach(j => {
        if (dist[i][j] > dist[i][k] + dist[k][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
          next[i][j] = next[i][k];
        }
      });
    });
  });

  if (dist[startNodeId][endNodeId] === Infinity) return null;

  const path = [startNodeId];
  let u = startNodeId;
  while (u !== endNodeId) {
    u = next[u][endNodeId];
    if (u === null) return null;
    path.push(u);
  }

  return { path, distance: dist[startNodeId][endNodeId] };
};
