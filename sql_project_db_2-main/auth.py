import sqlite3
import hashlib
from datetime import datetime

def get_db():
    conn = sqlite3.connect("hotel_booking.db")
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password):
    """Simple password hashing using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_initial_admin():
    """Create initial admin user"""
    db = get_db()
    
    # Create admins table if not exists
    db.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Check if admin exists
    admin = db.execute("SELECT * FROM admins WHERE username = ?", ("admin",)).fetchone()
    if not admin:
        hashed_password = hash_password("admin123")
        db.execute(
            "INSERT INTO admins (username, password, role) VALUES (?, ?, ?)",
            ("admin", hashed_password, "super_admin")
        )
        db.commit()
        print("✅ Initial admin user created (username: admin, password: admin123)")
    
    db.close()

def verify_admin_login(username, password):
    """Verify admin credentials"""
    db = get_db()
    hashed_password = hash_password(password)
    admin = db.execute(
        "SELECT * FROM admins WHERE username = ? AND password = ?", 
        (username, hashed_password)
    ).fetchone()
    db.close()
    return dict(admin) if admin else None

def verify_user_login(email, password):
    """Verify user credentials"""
    db = get_db()
    hashed_password = hash_password(password)
    user = db.execute(
        "SELECT * FROM users WHERE email = ? AND password = ?", 
        (email, hashed_password)
    ).fetchone()
    db.close()
    return dict(user) if user else None

def register_user(name, email, password, phone):
    """Register new user"""
    db = get_db()
    
    # Check if user already exists
    existing_user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if existing_user:
        db.close()
        return None, "User already exists"
    
    # Create user
    hashed_password = hash_password(password)
    db.execute(
        "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
        (name, email, hashed_password, phone)
    )
    db.commit()
    user_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    db.close()
    
    return user_id, "User registered successfully"