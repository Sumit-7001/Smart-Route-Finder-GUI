import os
from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
from models import db, User
from routes import main
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configuration — reads from environment variables (set in Vercel dashboard)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_key_only_for_local')
    
    # Use DATABASE_URL from env (Neon PostgreSQL on Vercel), fallback to SQLite locally
    db_url = os.environ.get('DATABASE_URL', 'sqlite:///site.db')
    # Fix for older SQLAlchemy versions that don't accept "postgres://" scheme
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions
    db.init_app(app)
    CORS(app)
    
    login_manager = LoginManager()
    login_manager.login_view = 'main.login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Register blueprints
    app.register_blueprint(main)

    with app.app_context():
        db.create_all()

    return app

# Expose app at module level for Vercel's WSGI runtime
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
