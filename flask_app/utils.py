import math
import heapq
import json
import os

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth's radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2)**2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c)

def run_dijkstra(nodes, edges, start_node_id, end_node_id):
    distances = {node['id']: float('inf') for node in nodes}
    previous = {node['id']: None for node in nodes}
    distances[start_node_id] = 0
    
    pq = [(0, start_node_id)]
    
    node_map = {node['id']: node for node in nodes}
    
    # Pre-build adjacency list for efficiency
    adj = {node['id']: [] for node in nodes}
    for edge in edges:
        adj[edge['from']].append(edge['to'])
        adj[edge['to']].append(edge['from'])

    while pq:
        curr_dist, curr_id = heapq.heappop(pq)

        if curr_dist > distances[curr_id]:
            continue
        if curr_id == end_node_id:
            break

        curr_node = node_map[curr_id]
        
        for neighbor_id in adj[curr_id]:
            neighbor_node = node_map[neighbor_id]
            weight = calculate_distance(curr_node['lat'], curr_node['lon'], neighbor_node['lat'], neighbor_node['lon'])
            alt = curr_dist + weight
            
            if alt < distances[neighbor_id]:
                distances[neighbor_id] = alt
                previous[neighbor_id] = curr_id
                heapq.heappush(pq, (alt, neighbor_id))

    if previous[end_node_id] is None and start_node_id != end_node_id:
        return None

    path = []
    curr = end_node_id
    while curr:
        path.insert(0, curr)
        curr = previous[curr]

    return {"path": path, "distance": distances[end_node_id]}

def run_floyd_warshall(nodes, edges, start_node_id, end_node_id):
    node_ids = [n['id'] for n in nodes]
    node_map = {n['id']: n for n in nodes}
    n = len(node_ids)
    
    dist = {u: {v: float('inf') for v in node_ids} for u in node_ids}
    next_node = {u: {v: None for v in node_ids} for u in node_ids}

    for u in node_ids:
        dist[u][u] = 0

    for edge in edges:
        u, v = edge['from'], edge['to']
        u_node, v_node = node_map[u], node_map[v]
        weight = calculate_distance(u_node['lat'], u_node['lon'], v_node['lat'], v_node['lon'])
        dist[u][v] = weight
        dist[v][u] = weight
        next_node[u][v] = v
        next_node[v][u] = u

    for k in node_ids:
        for i in node_ids:
            for j in node_ids:
                if dist[i][j] > dist[i][k] + dist[k][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
                    next_node[i][j] = next_node[i][k]

    if dist[start_node_id][end_node_id] == float('inf'):
        return None

    path = [start_node_id]
    u = start_node_id
    while u != end_node_id:
        u = next_node[u][end_node_id]
        if u is None: return None
        path.append(u)

    return {"path": path, "distance": dist[start_node_id][end_node_id]}
