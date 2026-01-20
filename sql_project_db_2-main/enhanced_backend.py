from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_swagger_ui import get_swaggerui_blueprint
from flask_cors import CORS
import sqlite3
import bcrypt
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = 'hotel_booking_secret_key_2026'  # Change this in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

# Database connection
def get_db():
    conn = sqlite3.connect("hotel_booking.db")
    conn.row_factory = sqlite3.Row
    return conn

# Create initial admin user if not exists
def create_initial_admin():
    db = get_db()
    # Check if admin exists
    admin = db.execute("SELECT * FROM admins WHERE username = ?", ("admin",)).fetchone()
    if not admin:
        hashed_password = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt())
        db.execute(
            "INSERT INTO admins (username, password, role) VALUES (?, ?, ?)",
            ("admin", hashed_password.decode('utf-8'), "super_admin")
        )
        db.commit()
        print("✅ Initial admin user created (username: admin, password: admin123)")
    db.close()

# ================== AUTHENTICATION ROUTES ==================
@app.route("/auth/login", methods=["POST"])
def login():
    try:
        data = request.json
        username = data.get("username")
        password = data.get("password")
        user_type = data.get("user_type", "user")  # user or admin
        
        db = get_db()
        
        if user_type == "admin":
            # Admin login
            admin = db.execute(
                "SELECT * FROM admins WHERE username = ?", 
                (username,)
            ).fetchone()
            
            if admin and bcrypt.checkpw(password.encode('utf-8'), admin['password'].encode('utf-8')):
                access_token = create_access_token(
                    identity={
                        'id': admin['admin_id'],
                        'username': admin['username'],
                        'role': admin['role'],
                        'type': 'admin'
                    }
                )
                db.close()
                return jsonify({
                    "access_token": access_token,
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
                "SELECT * FROM users WHERE email = ?", 
                (username,)
            ).fetchone()
            
            if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
                access_token = create_access_token(
                    identity={
                        'id': user['user_id'],
                        'email': user['email'],
                        'name': user['name'],
                        'type': 'user'
                    }
                )
                db.close()
                return jsonify({
                    "access_token": access_token,
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

@app.route("/auth/register", methods=["POST"])
def register():
    try:
        data = request.json
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        phone = data.get("phone")
        
        db = get_db()
        
        # Check if user already exists
        existing_user = db.execute(
            "SELECT * FROM users WHERE email = ?", 
            (email,)
        ).fetchone()
        
        if existing_user:
            db.close()
            return jsonify({"error": "User already exists"}), 400
        
        # Hash password and create user
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        db.execute(
            "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
            (name, email, hashed_password.decode('utf-8'), phone)
        )
        db.commit()
        db.close()
        
        return jsonify({"message": "User registered successfully"}), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/auth/profile", methods=["GET"])
@jwt_required()
def get_profile():
    try:
        current_user = get_jwt_identity()
        db = get_db()
        
        if current_user['type'] == 'admin':
            admin = db.execute(
                "SELECT admin_id, username, role FROM admins WHERE admin_id = ?",
                (current_user['id'],)
            ).fetchone()
            db.close()
            return jsonify(dict(admin)) if admin else jsonify({"error": "Admin not found"}), 404
        else:
            user = db.execute(
                "SELECT user_id, name, email, phone FROM users WHERE user_id = ?",
                (current_user['id'],)
            ).fetchone()
            db.close()
            return jsonify(dict(user)) if user else jsonify({"error": "User not found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================== ADMIN PROTECTED ROUTES ==================
@app.route("/admin/dashboard", methods=["GET"])
@jwt_required()
def admin_dashboard():
    current_user = get_jwt_identity()
    if current_user['type'] != 'admin':
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        db = get_db()
        # Get dashboard statistics
        stats = {
            "total_users": db.execute("SELECT COUNT(*) as count FROM users").fetchone()['count'],
            "total_rooms": db.execute("SELECT COUNT(*) as count FROM rooms").fetchone()['count'],
            "total_bookings": db.execute("SELECT COUNT(*) as count FROM bookings").fetchone()['count'],
            "pending_bookings": db.execute("SELECT COUNT(*) as count FROM bookings WHERE booking_status = 'Pending'").fetchone()['count'],
            "total_revenue": db.execute("SELECT SUM(amount) as total FROM payments WHERE payment_status = 'Completed'").fetchone()['total'] or 0
        }
        db.close()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================== USER PROTECTED ROUTES ==================
@app.route("/user/bookings", methods=["GET"])
@jwt_required()
def user_bookings():
    current_user = get_jwt_identity()
    if current_user['type'] != 'user':
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        db = get_db()
        bookings = db.execute("""
            SELECT b.*, r.room_number, r.room_type, r.price
            FROM bookings b
            JOIN rooms r ON b.room_id = r.room_id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        """, (current_user['id'],)).fetchall()
        db.close()
        return jsonify([dict(booking) for booking in bookings]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================== PUBLIC ROUTES ==================
@app.route("/rooms/available", methods=["GET"])
def get_available_rooms():
    try:
        check_in = request.args.get('check_in')
        check_out = request.args.get('check_out')
        guests = request.args.get('guests', 1)
        
        db = get_db()
        
        if check_in and check_out:
            # Get rooms that are not booked in the given date range
            booked_room_ids = db.execute("""
                SELECT DISTINCT room_id FROM bookings 
                WHERE (check_in <= ? AND check_out >= ?) 
                AND booking_status IN ('Pending', 'Confirmed')
            """, (check_out, check_in)).fetchall()
            
            booked_ids = [row['room_id'] for row in booked_room_ids]
            booked_ids_placeholder = ','.join('?' * len(booked_ids)) if booked_ids else '0'
            
            rooms = db.execute(f"""
                SELECT * FROM rooms 
                WHERE status = 'Available' 
                AND room_id NOT IN ({booked_ids_placeholder})
                ORDER BY price ASC
            """, booked_ids).fetchall()
        else:
            # Get all available rooms
            rooms = db.execute("""
                SELECT * FROM rooms 
                WHERE status = 'Available' 
                ORDER BY price ASC
            """).fetchall()
        
        db.close()
        return jsonify([dict(room) for room in rooms]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/")
def home():
    return jsonify({
        "message": "Hotel Booking Management System API",
        "version": "2.0",
        "endpoints": {
            "auth": "/auth/login, /auth/register",
            "public": "/rooms/available",
            "admin": "/admin/dashboard (protected)",
            "user": "/user/bookings (protected)"
        }
    })

if __name__ == "__main__":
    create_initial_admin()
    app.run(debug=True, port=5000)