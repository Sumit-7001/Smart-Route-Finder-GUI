from flask import Blueprint, request, jsonify, render_template, redirect, url_for, flash, current_app
from flask_login import login_user, logout_user, login_required, current_user
from models import User
import json
import os
import time

main = Blueprint('main', __name__)


def get_mongo_db():
    """Retrieve the shared MongoDB database instance from the app module."""
    import app as app_module
    return app_module.mongo_db


# ── Auth routes ──────────────────────────────────────────────────────────────

@main.route('/')
def index():
    # Go straight to dashboard — no login required
    return redirect(url_for('main.dashboard'))


@main.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        db = get_mongo_db()
        user = User.find_by_email(db, email)

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
        db = get_mongo_db()

        existing = User.find_by_email(db, email)
        if existing:
            flash('Email already registered', 'error')
            return redirect(url_for('main.signup'))

        new_user = User.create(db, name, email, password)
        login_user(new_user)
        return redirect(url_for('main.dashboard'))
    return render_template('signup.html')


@main.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.login'))


# ── Page routes ───────────────────────────────────────────────────────────────

@main.route('/dashboard')
def dashboard():
    # No login required — show dashboard to everyone
    name = current_user.name if current_user.is_authenticated else "Guest"
    return render_template('dashboard.html', name=name)


@main.route('/about')
def about():
    return render_template('about.html')


@main.route('/map')
def map():
    # No login required
    return render_template('map.html')


# ── API routes ────────────────────────────────────────────────────────────────

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
def get_route():
    try:
        from utils import run_dijkstra, run_floyd_warshall
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
