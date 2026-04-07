from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import time
from algorithms import yens_k_shortest_paths

app = Flask(__name__)
CORS(app)

# Load graph data
DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'map_graph.json')

def load_data():
    try:
        with open(DATA_PATH, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"nodes": [], "edges": []}

@app.route('/api/nodes', methods=['GET'])
def get_nodes():
    data = load_data()
    return jsonify(data['nodes'])

@app.route('/api/route', methods=['POST'])
def find_route():
    req_data = request.json
    source_id = req_data.get('source')
    destination_id = req_data.get('destination')
    
    if not source_id or not destination_id:
        return jsonify({"message": "Source and destination are required"}), 400
        
    data = load_data()
    nodes = data['nodes']
    edges = data['edges']
    
    # Check if IDs exist
    node_ids = {n['id'] for n in nodes}
    if source_id not in node_ids or destination_id not in node_ids:
        return jsonify({"message": "Invalid source or destination city"}), 400

    start_time = time.perf_counter()
    # Yen's algorithm to get top 3 shortest paths
    k_paths = yens_k_shortest_paths(nodes, edges, source_id, destination_id, k=3)
    end_time = time.perf_counter()
    
    execution_time = round((end_time - start_time) * 1000, 2)
    
    if not k_paths:
        return jsonify({"message": "No path found between selected locations"}), 404
        
    node_map = {n['id']: n for n in nodes}
    
    formatted_routes = []
    for idx, path_data in enumerate(k_paths):
        path_nodes = [node_map[node_id] for node_id in path_data['path']]
        # Simulated travel time: simple formula distance / avg_speed (e.g. 60km/h)
        travel_time_hours = path_data['distance'] / 60
        travel_time_mins = round(travel_time_hours * 60)
        
        formatted_routes.append({
            "id": f"route_{idx}",
            "path": path_nodes,
            "distance": path_data['distance'],
            "travel_time": travel_time_mins,
            "exec_time": execution_time
        })
        
    return jsonify({
        "routes": formatted_routes
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
