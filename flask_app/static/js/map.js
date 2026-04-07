document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Map
    const map = L.map('map-container').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    let nodes = [];
    let markers = {};
    let routeLine = null;
    let glowLine = null; // Background glow for route
    let travelMarker = null; // The moving "vehicle"
    let isTraveling = false;

    // 2. Fetch Graph Data (Nodes & Edges)
    fetch('/api/map-nodes')
        .then(res => res.json())
        .then(data => {
            const { nodes: graphNodes, edges: graphEdges } = data;
            nodes = graphNodes;
            const cityList = document.getElementById('city-list');

            // Draw Edges first (so they are under markers)
            graphEdges.forEach(edge => {
                const sourceNode = nodes.find(n => n.id === edge.from);
                const destNode = nodes.find(n => n.id === edge.to);
                if (sourceNode && destNode) {
                    L.polyline([[sourceNode.lat, sourceNode.lon], [destNode.lat, destNode.lon]], {
                        color: 'rgba(255, 255, 255, 0.1)',
                        weight: 1.5,
                        dashArray: '5, 5',
                        opacity: 1
                    }).addTo(map);
                }
            });

            // Populate Autocomplete and Draw Nodes
            nodes.forEach(node => {
                const option = document.createElement('option');
                option.value = node.name;
                cityList.appendChild(option);

                const marker = L.circleMarker([node.lat, node.lon], {
                    radius: 5,
                    fillColor: "#0076df",
                    color: "#fff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.9
                }).addTo(map).bindPopup(`<strong>${node.name}</strong>`);
                
                markers[node.id] = marker;
            });
        });

    // 3. Algorithm Selection Logic (Visual Toggle)
    const pills = document.querySelectorAll('.radio-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            pill.querySelector('input').checked = true;
        });
    });

    // 4. Get Current Location
    document.getElementById('get-location').addEventListener('click', () => {
        if (!navigator.geolocation) {
            showNotification('Geolocation not supported', 'error');
            return;
        }

        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude } = pos.coords;
            let nearest = null;
            let minDistance = Infinity;

            nodes.forEach(node => {
                const dist = calculateDistance(latitude, longitude, node.lat, node.lon);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearest = node;
                }
            });

            if (nearest) {
                document.getElementById('source').value = nearest.id;
                map.setView([latitude, longitude], 10);
                if (userMarker) map.removeLayer(userMarker);
                userMarker = L.circleMarker([latitude, longitude], {
                    color: '#0076df',
                    radius: 8,
                    fillOpacity: 0.8
                }).addTo(map).bindPopup("You are here");
            }
        });
    });

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // 5. Find Path
    document.getElementById('find-path').addEventListener('click', async () => {
        const sourceName = document.getElementById('source').value;
        const destName = document.getElementById('destination').value;
        const algorithm = document.querySelector('input[name="algorithm"]:checked').value;

        const sourceNode = nodes.find(n => n.name === sourceName);
        const destNode = nodes.find(n => n.name === destName);

        if (!sourceNode || !destNode) {
            showNotification('Please enter valid city names from the list', 'error');
            return;
        }

        const source = sourceNode.id;
        const dest = destNode.id;

        const btn = document.getElementById('find-path');
        btn.innerText = 'Calculating...';
        btn.disabled = true;

        try {
            const res = await fetch('/api/map-route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceNode: source, destNode: dest, algorithm })
            });

            const data = await res.json();
            if (res.ok) {
                renderRoute(data);
                showNotification(`Optimizing route via ${algorithm}...`, 'success');
                // Start Simulation after a short delay
                setTimeout(() => animateTravel(data), 1500);
            } else {
                showNotification(data.message || 'Error finding route', 'error');
            }
        } catch (err) {
            showNotification('Server error', 'error');
        } finally {
            btn.innerText = 'Find Path';
            btn.disabled = false;
        }
    });

    function renderRoute(data) {
        if (routeLine) map.removeLayer(routeLine);
        if (glowLine) map.removeLayer(glowLine);
        
        const coords = data.path.map(n => [n.lat, n.lon]);
        
        // Add a "glowing" effect with a second wider translucent line
        glowLine = L.polyline(coords, {
            color: '#0076df',
            weight: 12,
            opacity: 0.15
        }).addTo(map);

        routeLine = L.polyline(coords, { 
            color: '#0076df', 
            weight: 4, 
            opacity: 0.8,
            lineJoin: 'round'
        }).addTo(map);

        map.fitBounds(routeLine.getBounds(), { padding: [100, 100] });

        // Update Summary
        document.getElementById('results-summary').style.display = 'block';
        document.getElementById('result-dist').innerHTML = `${data.distance} km <span class="badge" style="font-size: 10px; background: var(--primary-color); padding: 2px 8px; border-radius: 10px; margin-left: 5px;">Shortest</span>`;
        document.getElementById('result-time').innerText = `${data.time} ms`;
        
        const pathEl = document.getElementById('result-path');
        pathEl.innerHTML = `
            <div style="margin-bottom: 12px; font-weight: 500; color: var(--text-secondary); font-size: 11px; text-transform: uppercase;">Optimal Path Strategy</div>
            ${data.path.map((n, i) => `
                <div class="path-step">
                    <span class="path-step-node">${n.name}</span>
                    ${i < data.path.length - 1 ? '<span class="path-step-arrow">→</span>' : ''}
                </div>
            `).join('')}
        `;
    }

    function animateTravel(data) {
        if (isTraveling) return;
        isTraveling = true;

        const overlay = document.getElementById('live-travel-overlay');
        const progressBar = document.getElementById('travel-progress-bar');
        const speedEl = document.getElementById('live-speed');
        const etaEl = document.getElementById('live-eta');

        overlay.style.display = 'block';
        if (travelMarker) map.removeLayer(travelMarker);

        const pathCoords = data.path.map(n => [n.lat, n.lon]);
        let step = 0;
        const totalSteps = pathCoords.length;

        travelMarker = L.circleMarker(pathCoords[0], {
            radius: 8,
            fillColor: '#fff',
            color: '#0076df', 
            weight: 3,
            fillOpacity: 1,
            zIndexOffset: 1000
        }).addTo(map);

        const move = () => {
            if (step >= totalSteps) {
                isTraveling = false;
                speedEl.innerText = 'Arrived';
                etaEl.innerText = '0 km';
                progressBar.style.width = '100% ';
                showNotification('Destination reached!', 'success');
                return;
            }

            const currentPos = pathCoords[step];
            travelMarker.setLatLng(currentPos);
            
            // Simulation updates
            const progress = (step / (totalSteps - 1)) * 100;
            progressBar.style.width = `${progress}% `;
            speedEl.innerText = `${Math.floor(70 + Math.random() * 20)} km/h`;
            
            // Approximate remaining distance
            const remainingNodes = data.path.length - 1 - step;
            const avgDistPerNode = data.distance / (data.path.length - 1);
            const remainingDist = Math.max(0, Math.round(remainingNodes * avgDistPerNode));
            etaEl.innerText = `${remainingDist} km`;

            step++;
            setTimeout(move, 600); // Step every 600ms for a "fast" real-time feel
        };

        move();
    }

    document.getElementById('clear-map').addEventListener('click', () => {
        if (routeLine) map.removeLayer(routeLine);
        document.getElementById('results-summary').style.display = 'none';
        document.getElementById('source').value = '';
        document.getElementById('destination').value = '';
    });
});
