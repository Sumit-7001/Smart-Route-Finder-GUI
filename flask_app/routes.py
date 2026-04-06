from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash, current_app
from flask_login import login_user, logout_user, login_required, current_user
from models import db, User
from utils import run_dijkstra, run_floyd_warshall
import json
import os
import time

main = Blueprint('main', __name__)

@main.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return redirect(url_for('main.login'))

@main.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('main.dashboard'))
        flash('Invalid email or password', 'error')
    return render_template('login.html')

@main.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        if user:
            flash('Email already registered', 'error')
            return redirect(url_for('main.signup'))
        
        new_user = User(name=name, email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        login_user(new_user)
        return redirect(url_for('main.dashboard'))
    return render_template('signup.html')

@main.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.login'))

@main.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', name=current_user.name)

@main.route('/about')
def about():
    return render_template('about.html')

@main.route('/map')
@login_required
def map():
    return render_template('map.html')

@main.route('/api/map-nodes')
def get_nodes():
    try:
        data_path = os.path.join(current_app.root_path, 'data', 'map_graph.json')
        with open(data_path, 'r') as f:
            data = json.load(f)
        return jsonify({
            "nodes": data.get('nodes', []),
            "edges": data.get('edges', [])
        })
    except Exception as e:
        return jsonify({"message": f"Error reading map data: {str(e)}"}), 500

@main.route('/api/map-route', methods=['POST'])
@login_required
def get_route():
    try:
        req_data = request.json
        source_id = req_data.get('sourceNode')
        dest_id = req_data.get('destNode')
        algorithm = req_data.get('algorithm', 'dijkstra')

        data_path = os.path.join(current_app.root_path, 'data', 'map_graph.json')
        with open(data_path, 'r') as f:
            data = json.load(f)
        
        nodes = data.get('nodes', [])
        edges = data.get('edges', [])

        start_time = time.perf_counter()
        if algorithm == 'dijkstra':
            result = run_dijkstra(nodes, edges, source_id, dest_id)
        else:
            result = run_floyd_warshall(nodes, edges, source_id, dest_id)
        end_time = time.perf_counter()
        
        execution_time = round((end_time - start_time) * 1000, 4)

        if result:
            # Map path IDs back to full node objects for the frontend
            node_map = {n['id']: n for n in nodes}
            path_nodes = [node_map[node_id] for node_id in result['path']]
            
            return jsonify({
                "path": path_nodes,
                "distance": result['distance'],
                "time": execution_time,
                "algorithm": "Dijkstra" if algorithm == 'dijkstra' else "Floyd-Warshall"
            })
        else:
            return jsonify({"message": "No path found"}), 404
    except Exception as e:
        return jsonify({"message": str(e)}), 500
