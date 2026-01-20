from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import hashlib
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Database connection
def get_db():
    conn = sqlite3.connect("hotel_booking.db")
    conn.row_factory = sqlite3.Row
    return conn

# Password hashing
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Create tables if they don't exist
def init_database():
    db = get_db()
    
    # Users table
    db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Admins table
    db.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'admin'
        )
    """)
    
    # Rooms table
    db.execute("""
        CREATE TABLE IF NOT EXISTS rooms (
            room_id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_number TEXT UNIQUE NOT NULL,
            room_type TEXT,
            price REAL NOT NULL,
            status TEXT DEFAULT 'Available',
            description TEXT,
            photo_url TEXT
        )
    """)
    
    # Bookings table
    db.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            room_id INTEGER NOT NULL,
            check_in DATE NOT NULL,
            check_out DATE NOT NULL,
            booking_status TEXT DEFAULT 'Pending',
            arrival_status TEXT DEFAULT 'Not Arrived',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id),
            FOREIGN KEY (room_id) REFERENCES rooms(room_id)
        )
    """)
    
    # Create default admin if not exists
    admin_exists = db.execute("SELECT * FROM admins WHERE username = ?", ("admin",)).fetchone()
    if not admin_exists:
        hashed_pass = hash_password("admin123")
        db.execute("INSERT INTO admins (username, password, role) VALUES (?, ?, ?)", 
                   ("admin", hashed_pass, "super_admin"))
    
    # Add photo_url column to rooms table if it doesn't exist
    try:
        db.execute("ALTER TABLE rooms ADD COLUMN photo_url TEXT")
        print("✅ Added photo_url column to rooms table")
    except sqlite3.OperationalError:
        # Column already exists
        pass
    
    # Create sample rooms if none exist
    room_count = db.execute("SELECT COUNT(*) as count FROM rooms").fetchone()['count']
    if room_count == 0:
        sample_rooms = [
            ("101", "Single", 1500.0, "Cozy single room with AC", ""),
            ("102", "Double", 2500.0, "Spacious double room with balcony", ""),
            ("201", "Suite", 4000.0, "Luxury suite with premium amenities", ""),
            ("202", "Deluxe", 3200.0, "Deluxe room with city view", "")
        ]
        for room_num, room_type, price, desc, photo_url in sample_rooms:
            db.execute("INSERT INTO rooms (room_number, room_type, price, description, photo_url) VALUES (?, ?, ?, ?, ?)",
                      (room_num, room_type, price, desc, photo_url))
    
    db.commit()
    db.close()
    print("✅ Database initialized successfully!")

# Authentication routes
@app.route("/auth/register", methods=["POST"])
def register():
    try:
        data = request.json
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        phone = data.get("phone")
        
        if not all([name, email, password]):
            return jsonify({"error": "Name, email, and password are required"}), 400
        
        db = get_db()
        
        # Check if user exists
        existing = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            db.close()
            return jsonify({"error": "User already exists"}), 400
        
        # Create user
        hashed_password = hash_password(password)
        db.execute(
            "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
            (name, email, hashed_password, phone)
        )
        db.commit()
        user_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        db.close()
        
        return jsonify({
            "message": "Registration successful",
            "user_id": user_id
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/auth/login", methods=["POST"])
def login():
    try:
        data = request.json
        username = data.get("username")
        password = data.get("password")
        user_type = data.get("user_type", "user")
        
        if not all([username, password]):
            return jsonify({"error": "Username and password required"}), 400
            
        db = get_db()
        hashed_password = hash_password(password)
        
        if user_type == "admin":
            # Admin login
            admin = db.execute(
                "SELECT * FROM admins WHERE username = ? AND password = ?", 
                (username, hashed_password)
            ).fetchone()
            
            if admin:
                db.close()
                return jsonify({
                    "token": f"admin_{admin['admin_id']}",
                    "user": {
                        "id": admin['admin_id'],
                        "username": admin['username'],
                        "role": admin['role'],
                        "type": "admin"
                    }
                }), 200
        else:
            # User login
            user = db.execute(
                "SELECT * FROM users WHERE email = ? AND password = ?", 
                (username, hashed_password)
            ).fetchone()
            
            if user:
                db.close()
                return jsonify({
                    "token": f"user_{user['user_id']}",
                    "user": {
                        "id": user['user_id'],
                        "name": user['name'],
                        "email": user['email'],
                        "phone": user['phone'],
                        "type": "user"
                    }
                }), 200
        
        db.close()
        return jsonify({"error": "Invalid credentials"}), 401
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Public routes
@app.route("/rooms", methods=["GET"])
def get_rooms():
    try:
        db = get_db()
        rooms = db.execute("SELECT * FROM rooms WHERE status = 'Available'").fetchall()
        db.close()
        return jsonify([dict(room) for room in rooms]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/rooms/<int:room_id>", methods=["GET"])
def get_room(room_id):
    try:
        db = get_db()
        room = db.execute("SELECT * FROM rooms WHERE room_id = ?", (room_id,)).fetchone()
        db.close()
        if room:
            return jsonify(dict(room)), 200
        return jsonify({"error": "Room not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Token verification middleware

def verify_token(token):
    """Simple token verification - in production, use proper JWT"""
    if not token:
        return None
    
    # Extract user type and ID from token
    if token.startswith('user_'):
        try:
            user_id = int(token.split('_')[1])
            db = get_db()
            user = db.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
            db.close()
            return {'type': 'user', 'id': user_id, 'data': dict(user) if user else None}
        except:
            return None
    elif token.startswith('admin_'):
        try:
            admin_id = int(token.split('_')[1])
            db = get_db()
            admin = db.execute("SELECT * FROM admins WHERE admin_id = ?", (admin_id,)).fetchone()
            db.close()
            return {'type': 'admin', 'id': admin_id, 'data': dict(admin) if admin else None}
        except:
            return None
    return None

# User protected routes
@app.route("/user/bookings", methods=["GET"])
def get_user_bookings():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization required'}), 401
        
        token = auth_header.split(' ')[1]
        token_data = verify_token(token)
        
        if not token_data or token_data['type'] != 'user':
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        db = get_db()
        bookings = db.execute("""
            SELECT b.*, r.room_number, r.room_type, r.price
            FROM bookings b
            JOIN rooms r ON b.room_id = r.room_id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        """, (token_data['id'],)).fetchall()
        db.close()
        
        return jsonify([dict(booking) for booking in bookings]), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/user/bookings", methods=["POST"])
def create_user_booking():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization required'}), 401
        
        token = auth_header.split(' ')[1]
        token_data = verify_token(token)
        
        if not token_data or token_data['type'] != 'user':
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        data = request.json
        room_id = data.get('room_id')
        check_in = data.get('check_in')
        check_out = data.get('check_out')
        
        if not all([room_id, check_in, check_out]):
            return jsonify({'error': 'Room ID, check-in, and check-out dates are required'}), 400
        
        db = get_db()
        
        # Check if room exists
        room = db.execute("SELECT * FROM rooms WHERE room_id = ?", (room_id,)).fetchone()
        if not room:
            db.close()
            return jsonify({'error': 'Room does not exist'}), 400
        
        # Check if room is already booked for the requested dates
        existing_booking = db.execute("""
            SELECT * FROM bookings 
            WHERE room_id = ? 
            AND booking_status != 'Cancelled'
            AND check_in < ?
            AND check_out > ?
        """, (room_id, check_out, check_in)).fetchone()
        
        if existing_booking:
            db.close()
            return jsonify({'error': 'Room is already booked for the selected dates'}), 400
        
        # Check if room is marked as unavailable
        if room['status'] != 'Available':
            db.close()
            return jsonify({'error': 'Room is not available'}), 400
        
        # Create booking
        db.execute("""
            INSERT INTO bookings (user_id, room_id, check_in, check_out) 
            VALUES (?, ?, ?, ?)
        """, (token_data['id'], room_id, check_in, check_out))
        
        db.commit()
        booking_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        db.close()
        
        return jsonify({'message': 'Booking created successfully', 'booking_id': booking_id}), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/user/bookings/<int:booking_id>", methods=["DELETE"])
def cancel_user_booking(booking_id):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization required'}), 401
        
        token = auth_header.split(' ')[1]
        token_data = verify_token(token)
        
        if not token_data or token_data['type'] != 'user':
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        db = get_db()
        
        # Check if booking belongs to user
        booking = db.execute("""
            SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?
        """, (booking_id, token_data['id'])).fetchone()
        
        if not booking:
            db.close()
            return jsonify({'error': 'Booking not found or unauthorized'}), 404
        
        # Cancel booking
        db.execute("""
            UPDATE bookings SET booking_status = 'Cancelled' WHERE booking_id = ?
        """, (booking_id,))
        
        db.commit()
        db.close()
        
        return jsonify({'message': 'Booking cancelled successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Admin protected routes
@app.route("/admin/dashboard", methods=["GET"])
def admin_dashboard():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization required'}), 401
        
        token = auth_header.split(' ')[1]
        token_data = verify_token(token)
        
        if not token_data or token_data['type'] != 'admin':
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        db = get_db()
        stats = {
            'total_users': db.execute("SELECT COUNT(*) as count FROM users").fetchone()['count'],
            'total_rooms': db.execute("SELECT COUNT(*) as count FROM rooms").fetchone()['count'],
            'total_bookings': db.execute("SELECT COUNT(*) as count FROM bookings").fetchone()['count'],
            'pending_bookings': db.execute("SELECT COUNT(*) as count FROM bookings WHERE booking_status = 'Pending'").fetchone()['count'],
            'confirmed_bookings': db.execute("SELECT COUNT(*) as count FROM bookings WHERE booking_status = 'Confirmed'").fetchone()['count'],
            'cancelled_bookings': db.execute("SELECT COUNT(*) as count FROM bookings WHERE booking_status = 'Cancelled'").fetchone()['count'],
            'total_revenue': db.execute("""
                SELECT COALESCE(SUM(r.price * (julianday(b.check_out) - julianday(b.check_in))), 0) as revenue
                FROM bookings b
                JOIN rooms r ON b.room_id = r.room_id
                WHERE b.booking_status = 'Confirmed'
            """).fetchone()['revenue']
        }
        db.close()
        
        return jsonify(stats), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/admin/users", methods=["GET"])
def admin_get_users():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization required'}), 401
        
        token = auth_header.split(' ')[1]
        token_data = verify_token(token)
        
        if not token_data or token_data['type'] != 'admin':
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        db = get_db()
        users = db.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
        db.close()
        
        return jsonify([dict(user) for user in users]), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/admin/bookings", methods=["GET"])
def admin_get_bookings():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization required'}), 401
        
        token = auth_header.split(' ')[1]
        token_data = verify_token(token)
        
        if not token_data or token_data['type'] != 'admin':
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        db = get_db()
        bookings = db.execute("""
            SELECT b.*, u.name as user_name, u.email as user_email, r.room_number, r.room_type
            FROM bookings b
            JOIN users u ON b.user_id = u.user_id
            JOIN rooms r ON b.room_id = r.room_id
            ORDER BY b.created_at DESC
        """).fetchall()
        db.close()
        
        return jsonify([dict(booking) for booking in bookings]), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Booking update route
@app.route("/bookings/<int:booking_id>", methods=["PUT"])
def update_booking(booking_id):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization required'}), 401
        
        token = auth_header.split(' ')[1]
        token_data = verify_token(token)
        
        if not token_data or token_data['type'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.json
        new_status = data.get('booking_status')
        
        if not new_status:
            return jsonify({'error': 'Booking status is required'}), 400
        
        # Validate status
        valid_statuses = ['Pending', 'Confirmed', 'Cancelled']
        if new_status not in valid_statuses:
            return jsonify({'error': 'Invalid booking status'}), 400
        
        db = get_db()
        
        # Check if booking exists
        booking = db.execute("SELECT * FROM bookings WHERE booking_id = ?", (booking_id,)).fetchone()
        if not booking:
            db.close()
            return jsonify({'error': 'Booking not found'}), 404
        
        # Update booking status
        db.execute("""
            UPDATE bookings SET booking_status = ? WHERE booking_id = ?
        """, (new_status, booking_id))
        
        db.commit()
        db.close()
        
        return jsonify({'message': 'Booking status updated successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Additional room management routes
@app.route("/rooms", methods=["POST"])
def create_room():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization required'}), 401
        
        token = auth_header.split(' ')[1]
        token_data = verify_token(token)
        
        if not token_data or token_data['type'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.json
        room_number = data.get('room_number')
        room_type = data.get('room_type')
        price = data.get('price')
        description = data.get('description', '')
        status = data.get('status', 'Available')
        photo_url = data.get('photo_url', '')
        
        if not all([room_number, room_type, price]):
            return jsonify({'error': 'Room number, type, and price are required'}), 400
        
        db = get_db()
        
        # Check if room number already exists
        existing = db.execute("SELECT * FROM rooms WHERE room_number = ?", (room_number,)).fetchone()
        if existing:
            db.close()
            return jsonify({'error': 'Room number already exists'}), 400
        
        db.execute("""
            INSERT INTO rooms (room_number, room_type, price, description, status, photo_url)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (room_number, room_type, float(price), description, status, photo_url))
        
        db.commit()
        room_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        db.close()
        
        return jsonify({'message': 'Room created successfully', 'room_id': room_id}), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/rooms/<int:room_id>", methods=["PUT"])
def update_room(room_id):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization required'}), 401
        
        token = auth_header.split(' ')[1]
        token_data = verify_token(token)
        
        if not token_data or token_data['type'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.json
        db = get_db()
        
        # Check if room exists
        room = db.execute("SELECT * FROM rooms WHERE room_id = ?", (room_id,)).fetchone()
        if not room:
            db.close()
            return jsonify({'error': 'Room not found'}), 404
        
        # Update room
        db.execute("""
            UPDATE rooms SET
            room_number = COALESCE(?, room_number),
            room_type = COALESCE(?, room_type),
            price = COALESCE(?, price),
            description = COALESCE(?, description),
            status = COALESCE(?, status),
            photo_url = COALESCE(?, photo_url)
            WHERE room_id = ?
        """, (
            data.get('room_number'),
            data.get('room_type'),
            data.get('price'),
            data.get('description'),
            data.get('status'),
            data.get('photo_url'),
            room_id
        ))
        
        db.commit()
        db.close()
        
        return jsonify({'message': 'Room updated successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/rooms/<int:room_id>", methods=["DELETE"])
def delete_room(room_id):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization required'}), 401
        
        token = auth_header.split(' ')[1]
        token_data = verify_token(token)
        
        if not token_data or token_data['type'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        db = get_db()
        
        # Check if room exists
        room = db.execute("SELECT * FROM rooms WHERE room_id = ?", (room_id,)).fetchone()
        if not room:
            db.close()
            return jsonify({'error': 'Room not found'}), 404
        
        # Check if room has active bookings
        active_bookings = db.execute("""
            SELECT COUNT(*) as count FROM bookings 
            WHERE room_id = ? AND booking_status IN ('Pending', 'Confirmed')
        """, (room_id,)).fetchone()['count']
        
        if active_bookings > 0:
            db.close()
            return jsonify({'error': 'Cannot delete room with active bookings'}), 400
        
        # Delete room
        db.execute("DELETE FROM rooms WHERE room_id = ?", (room_id,))
        db.commit()
        db.close()
        
        return jsonify({'message': 'Room deleted successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Available rooms route (different from general rooms route)
@app.route("/rooms/available", methods=["GET"])
def get_available_rooms():
    try:
        db = get_db()
        rooms = db.execute("SELECT * FROM rooms WHERE status = 'Available'").fetchall()
        db.close()
        return jsonify([dict(room) for room in rooms]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route("/")
def home():
    return jsonify({
        "message": "🏨 Hotel Booking Management System API",
        "status": "Running",
        "version": "1.0",
        "endpoints": {
            "auth": {
                "register": "POST /auth/register",
                "login": "POST /auth/login"
            },
            "public": {
                "rooms": "GET /rooms",
                "room_detail": "GET /rooms/{id}"
            }
        },
        "test_accounts": {
            "admin": {
                "username": "admin",
                "password": "admin123"
            }
        }
    })

if __name__ == "__main__":
    init_database()
    app.run(debug=True, port=5000, host='0.0.0.0')