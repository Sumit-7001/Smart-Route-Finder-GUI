import os
from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Shared MongoDB client & db — imported by routes.py
mongo_client = None
mongo_db = None


def create_app():
    global mongo_client, mongo_db

    app = Flask(__name__)

    # ── Security ────────────────────────────────────────────────────────────────
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_only_for_local')

    # ── MongoDB (Atlas on Vercel, local fallback) ────────────────────────────────
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/smart_route_finder')
    mongo_client = MongoClient(mongo_uri)

    # Database name — use "smart_route_finder" if URI has no db component
    db_name = os.environ.get('MONGO_DB_NAME', 'smart_route_finder')
    mongo_db = mongo_client[db_name]

    # Ensure unique index on email
    mongo_db.users.create_index('email', unique=True)

    # ── Flask-Login ──────────────────────────────────────────────────────────────
    CORS(app)
    login_manager = LoginManager()
    login_manager.login_view = 'main.login'
    login_manager.init_app(app)

    from models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.from_id(mongo_db, user_id)

    # ── Blueprints ───────────────────────────────────────────────────────────────
    from routes import main
    app.register_blueprint(main)

    return app


# Expose at module level for Vercel's WSGI runtime
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
