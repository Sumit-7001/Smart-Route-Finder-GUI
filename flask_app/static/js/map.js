document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Map
    const map = L.map('map-container').setView([20, 78], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    let nodes = [];
    let markers = {};
    let routeLine = null;
    let userMarker = null;

    // 2. Fetch Nodes
    fetch('/api/map-nodes')
        .then(res => res.json())
        .then(data => {
            nodes = data;
            const sourceSelect = document.getElementById('source');
            const destSelect = document.getElementById('destination');

            nodes.forEach(node => {
                // Add to Select inputs
                const opt1 = new Option(node.name, node.id);
                const opt2 = new Option(node.name, node.id);
                sourceSelect.add(opt1);
                destSelect.add(opt2);

                // Add to Map
                const marker = L.marker([node.lat, node.lon]).addTo(map).bindPopup(node.name);
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
        const source = document.getElementById('source').value;
        const dest = document.getElementById('destination').value;
        const algorithm = document.querySelector('input[name="algorithm"]:checked').value;

        if (!source || !dest) {
            showNotification('Selection mission source and destination', 'error');
            return;
        }

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
                showNotification(`Route found using ${algorithm === 'dijkstra' ? 'Dijkstra' : 'Floyd-Warshall'}!`, 'success');
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
        
        const coords = data.path.map(n => [n.lat, n.lon]);
        routeLine = L.polyline(coords, { color: '#0076df', weight: 6, opacity: 0.8 }).addTo(map);
        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

        // Update Summary
        document.getElementById('results-summary').style.display = 'block';
        document.getElementById('result-dist').innerText = `${data.distance} km`;
        document.getElementById('result-time').innerText = `${data.time} ms`;
        
        const pathEl = document.getElementById('result-path');
        pathEl.innerHTML = data.path.map((n, i) => `
            <span class="path-step-node">${n.name}</span>
            ${i < data.path.length - 1 ? '<span class="path-step-arrow">→</span>' : ''}
        `).join('');
    }

    document.getElementById('clear-map').addEventListener('click', () => {
        if (routeLine) map.removeLayer(routeLine);
        document.getElementById('results-summary').style.display = 'none';
        document.getElementById('source').value = '';
        document.getElementById('destination').value = '';
    });
});
