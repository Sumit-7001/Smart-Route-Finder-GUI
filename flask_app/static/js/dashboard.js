document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial State (Copied from React)
    let locations = [
        { id: 'A', name: 'Downtown', x: 80, y: 150 },
        { id: 'B', name: 'Suburb East', x: 380, y: 80 },
        { id: 'C', name: 'North Park', x: 420, y: 250 },
        { id: 'D', name: 'West Side', x: 120, y: 380 },
        { id: 'E', name: 'Central Station', x: 250, y: 250 },
    ];

    let edges = [
        { from: 'A', to: 'B', weight: 4 },
        { from: 'A', to: 'D', weight: 3 },
        { from: 'B', to: 'C', weight: 2 },
        { from: 'B', to: 'E', weight: 3 },
        { from: 'C', to: 'E', weight: 1 },
        { from: 'D', to: 'E', weight: 5 },
        { from: 'C', to: 'D', weight: 6 },
    ];

    let currentResults = null;
    let history = [];

    const canvas = document.getElementById('graph-canvas');
    const ctx = canvas.getContext('2d');

    // 2. Core Dashboard Rendering Logic
    const drawGraph = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw edges
        edges.forEach(edge => {
            const from = locations.find(l => l.id === edge.from);
            const to = locations.find(l => l.id === edge.to);
            if (!from || !to) return;

            const isHighlighted = currentResults?.path?.includes(edge.from) && 
                                currentResults?.path?.includes(edge.to) && 
                                Math.abs(currentResults.path.indexOf(edge.from) - currentResults.path.indexOf(edge.to)) === 1;

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

            // Weight text
            ctx.shadowBlur = 0;
            ctx.fillStyle = isHighlighted ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
            ctx.font = isHighlighted ? 'bold 13px Inter' : '11px Inter';
            ctx.textAlign = 'center';
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            ctx.fillText(edge.weight, midX, midY - 10);
        });

        // Draw nodes
        locations.forEach(loc => {
            const source = document.getElementById('source-select').value;
            const dest = document.getElementById('dest-select').value;
            const isSelected = source === loc.id || dest === loc.id;
            const isInPath = currentResults?.path?.includes(loc.id);

            ctx.beginPath();
            ctx.arc(loc.x, loc.y, 12, 0, Math.PI * 2);
            ctx.shadowBlur = (isSelected || isInPath) ? 20 : 0;
            ctx.shadowColor = '#007AFF';
            ctx.fillStyle = isSelected ? '#ffffff' : (isInPath ? '#007AFF' : '#1c1c1e');
            ctx.fill();

            ctx.strokeStyle = isSelected ? '#ffffff' : '#007AFF';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.fillStyle = isSelected || isInPath ? '#ffffff' : 'rgba(255, 255, 255, 0.7)';
            ctx.font = (isSelected || isInPath) ? 'bold 14px Inter' : '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(loc.name, loc.x, loc.y + 30);
        });
    };

    // 3. Populate Select Inputs
    const updateSelectors = () => {
        const selects = ['source-select', 'dest-select', 'edge-from-select', 'edge-to-select'];
        selects.forEach(id => {
            const el = document.getElementById(id);
            const val = el.value;
            el.innerHTML = '<option value="">' + (id.includes('edge') ? (id.includes('from') ? 'From' : 'To') : 'Select Location') + '</option>';
            locations.forEach(loc => {
                const opt = new Option(loc.name, loc.id);
                el.add(opt);
            });
            el.value = val;
        });
    };

    // 4. Algorithm Implementations (Local Port for Dashboard Graph)
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
            const closest = pq.shift();
            if (distances[closest] === Infinity || closest === endNode) break;

            edges.filter(e => e.from === closest || e.to === closest).forEach(edge => {
                const neighbor = edge.from === closest ? edge.to : edge.from;
                const alt = distances[closest] + edge.weight;
                if (alt < distances[neighbor]) {
                    distances[neighbor] = alt;
                    previous[neighbor] = closest;
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

    // 5. Action Handlers
    document.getElementById('find-route-btn').addEventListener('click', () => {
        const source = document.getElementById('source-select').value;
        const dest = document.getElementById('dest-select').value;
        const algo = document.querySelector('input[name="algorithm"]:checked').value;

        if (!source || !dest || source === dest) {
            showNotification('Selection valid distinct locations', 'error');
            return;
        }

        const t0 = performance.now();
        const result = algo === 'dijkstra' ? runDijkstra(source, dest) : runFloydWarshall(source, dest);
        const t1 = performance.now();

        if (result) {
            currentResults = { 
                ...result, 
                time: (t1 - t0).toFixed(4), 
                algoName: algo === 'dijkstra' ? 'Dijkstra' : 'Floyd-Warshall' 
            };
            displayResults();
            drawGraph();
            history.unshift({ ...currentResults, source, dest });
            updateHistory();
            showNotification(`Path found via ${currentResults.algoName}!`, 'success');
        } else {
            showNotification('No path found', 'error');
        }
    });

    document.getElementById('compare-btn').addEventListener('click', () => {
        const source = document.getElementById('source-select').value;
        const dest = document.getElementById('dest-select').value;
        if (!source || !dest || source === dest) return;

        const t0 = performance.now();
        const dr = runDijkstra(source, dest);
        const t1 = performance.now();

        const t2 = performance.now();
        const fr = runFloydWarshall(source, dest);
        const t3 = performance.now();

        const dt = (t1 - t0).toFixed(4);
        const ft = (t3 - t2).toFixed(4);

        document.getElementById('comparison-panel').style.display = 'block';
        document.getElementById('comp-d-time').innerText = dt + ' ms';
        document.getElementById('comp-f-time').innerText = ft + ' ms';
        document.getElementById('comp-d-dist').innerText = (dr?.distance || 'N/A') + ' km';
        document.getElementById('comp-f-dist').innerText = (fr?.distance || 'N/A') + ' km';
        document.getElementById('comp-gap').innerText = Math.abs(dt - ft).toFixed(4);
        
        currentResults = dr;
        drawGraph();
        showNotification('Comparison complete!', 'success');
    });

    document.getElementById('add-node-btn').addEventListener('click', () => {
        const name = document.getElementById('new-node-name').value.trim();
        if (!name) return;
        const id = name.charAt(0).toUpperCase() + Math.floor(Math.random() * 100);
        locations.push({
            id,
            name,
            x: 50 + Math.random() * 400,
            y: 50 + Math.random() * 350
        });
        document.getElementById('new-node-name').value = '';
        updateSelectors();
        drawGraph();
        showNotification(`Node "${name}" added!`, 'success');
    });

    document.getElementById('add-edge-btn').addEventListener('click', () => {
        const from = document.getElementById('edge-from-select').value;
        const to = document.getElementById('edge-to-select').value;
        const weight = parseInt(document.getElementById('edge-weight').value);

        if (!from || !to || from === to || !weight) {
            showNotification('Invalid edge data', 'error');
            return;
        }
        edges.push({ from, to, weight });
        document.getElementById('edge-weight').value = '';
        drawGraph();
        showNotification('Edge added successfully!', 'success');
    });

    const displayResults = () => {
        const panel = document.getElementById('results-panel');
        panel.style.display = 'block';
        document.getElementById('res-distance').innerText = currentResults.distance + ' km';
        document.getElementById('res-algo').innerText = currentResults.algoName;
        document.getElementById('res-time').innerText = currentResults.time + ' ms';

        const pathEl = document.getElementById('res-path-steps');
        pathEl.innerHTML = currentResults.path.map((id, index) => {
            const loc = locations.find(l => l.id === id);
            return `
                <span class="path-node">${loc ? loc.name : id}</span>
                ${index < currentResults.path.length - 1 ? '<span class="path-arrow">→</span>' : ''}
            `;
        }).join('');
    };

    const updateHistory = () => {
        const panel = document.getElementById('history-panel');
        panel.style.display = 'block';
        const list = document.getElementById('history-list');
        list.innerHTML = history.slice(0, 5).map(item => {
            const srcLoc = locations.find(l => l.id === item.source);
            const destLoc = locations.find(l => l.id === item.destination);
            return `
                <div class="history-item">
                    <span>${srcLoc ? srcLoc.name : item.source} → ${destLoc ? destLoc.name : item.destination} (${item.algoName})</span>
                    <span>${item.distance} km</span>
                </div>
            `;
        }).join('');
    };

    document.getElementById('reset-btn').addEventListener('click', () => {
        document.getElementById('source-select').value = '';
        document.getElementById('dest-select').value = '';
        currentResults = null;
        document.getElementById('results-panel').style.display = 'none';
        document.getElementById('comparison-panel').style.display = 'none';
        drawGraph();
    });

    // 6. Initial Render
    updateSelectors();
    drawGraph();
});
