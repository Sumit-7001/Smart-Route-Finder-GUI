import math
import heapq
import copy

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth's radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (math.sin(d_lat / 2)**2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lon / 2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def dijkstra(nodes, edges, start_node_id, end_node_id, excluded_nodes=None, excluded_edges=None):
    if excluded_nodes is None: excluded_nodes = set()
    if excluded_edges is None: excluded_edges = set()
    
    if start_node_id in excluded_nodes or end_node_id in excluded_nodes:
        return None

    distances = {node['id']: float('inf') for node in nodes}
    previous = {node['id']: None for node in nodes}
    distances[start_node_id] = 0
    
    pq = [(0, start_node_id)]
    
    node_map = {node['id']: node for node in nodes}
    
    # Adjacency list
    adj = {node['id']: [] for node in nodes}
    for edge in edges:
        u, v = edge['from'], edge['to']
        if (u, v) in excluded_edges or (v, u) in excluded_edges:
            continue
        if u in excluded_nodes or v in excluded_nodes:
            continue
        
        u_node, v_node = node_map[u], node_map[v]
        weight = calculate_distance(u_node['lat'], u_node['lon'], v_node['lat'], v_node['lon'])
        adj[u].append((v, weight))
        adj[v].append((u, weight))

    while pq:
        curr_dist, curr_id = heapq.heappop(pq)

        if curr_dist > distances[curr_id]:
            continue
        if curr_id == end_node_id:
            break

        for neighbor_id, weight in adj[curr_id]:
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

def yens_k_shortest_paths(nodes, edges, start_node_id, end_node_id, k=3):
    # Determine the shortest path from start to end
    first_path = dijkstra(nodes, edges, start_node_id, end_node_id)
    if first_path is None:
        return []

    # Initialize the set of shortest paths and the set of potential shortest paths
    A = [first_path]
    B = []

    for i in range(1, k):
        # The previous shortest path
        prev_path = A[-1]['path']
        
        # Iterate through every node except the last in the previous shortest path
        for j in range(len(prev_path) - 1):
            spur_node = prev_path[j]
            root_path = prev_path[:j + 1]
            
            excluded_edges = set()
            for p in A:
                if p['path'][:j + 1] == root_path:
                    # Exclude the edge that matches the current shortest path
                    excluded_edges.add((p['path'][j], p['path'][j+1]))
            
            excluded_nodes = set(prev_path[:j])
            
            # Find the shortest path from spur_node to end in the modified graph
            spur_path_res = dijkstra(nodes, edges, spur_node, end_node_id, excluded_nodes, excluded_edges)
            
            if spur_path_res:
                total_path = root_path[:-1] + spur_path_res['path']
                
                # Calculate total distance
                total_dist = 0
                node_map = {n['id']: n for n in nodes}
                for idx in range(len(total_path) - 1):
                    n1 = node_map[total_path[idx]]
                    n2 = node_map[total_path[idx+1]]
                    total_dist += calculate_distance(n1['lat'], n1['lon'], n2['lat'], n2['lon'])
                
                new_path = {"path": total_path, "distance": round(total_dist, 2)}
                if new_path not in B:
                    B.append(new_path)
        
        if not B:
            break
            
        B.sort(key=lambda x: x['distance'])
        A.append(B.pop(0))
        
    return A
