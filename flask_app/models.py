from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId


class User(UserMixin):
    """User model backed by MongoDB instead of SQLAlchemy."""

    def __init__(self, user_doc):
        self._id = user_doc['_id']
        self.name = user_doc['name']
        self.email = user_doc['email']
        self.password_hash = user_doc['password_hash']

    def get_id(self):
        return str(self._id)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @staticmethod
    def from_id(mongo_db, user_id):
        """Load a user from MongoDB by their string _id."""
        try:
            doc = mongo_db.users.find_one({'_id': ObjectId(user_id)})
            return User(doc) if doc else None
        except Exception:
            return None

    @staticmethod
    def find_by_email(mongo_db, email):
        """Find a user document by email."""
        doc = mongo_db.users.find_one({'email': email})
        return User(doc) if doc else None

    @staticmethod
    def create(mongo_db, name, email, password):
        """Insert a new user and return a User object."""
        hashed = generate_password_hash(password)
        result = mongo_db.users.insert_one({
            'name': name,
            'email': email,
            'password_hash': hashed,
        })
        doc = mongo_db.users.find_one({'_id': result.inserted_id})
        return User(doc)
