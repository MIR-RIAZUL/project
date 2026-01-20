from flask import Flask, request, jsonify
from flask_swagger_ui import get_swaggerui_blueprint
from flask_cors import CORS
import sqlite3
from datetime import datetime, timedelta
import jwt
import os
from auth import *

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175"])

# JWT Secret Key
app.config['SECRET_KEY'] = 'hotel_booking_secret_key_2026_v2'

# Database connection helper
def get_db():
    conn = sqlite3.connect("hotel_booking.db")
    conn.row_factory = sqlite3.Row
    return conn

# JWT token generation
def create_token(user_data, user_type):
    payload = {
        'user': user_data,
        'type': user_type,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

# JWT token verification
def verify_token(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Middleware to verify token
def token_required(f):
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Token is invalid'}), 401
            
        return f(payload, *args, **kwargs)
    decorated.__name__ = f.__name__
    return decorated

# Initialize database and create admin
with app.app_context():
    create_initial_admin()

# ================== AUTHENTICATION ROUTES ==================
@app.route("/auth/login", methods=["POST"])
def login():
    try:
        data = request.json
        username = data.get("username")
        password = data.get("password")
        user_type = data.get("user_type", "user")  # user or admin
        
        if user_type == "admin":
            # Admin login
            admin = verify_admin_login(username, password)
            if admin:
                token = create_token(admin, 'admin')
                return jsonify({
                    "token": token,
                    "user": {
                        "id": admin['admin_id'],
                        "username": admin['username'],
                        "role": admin['role'],
                        "type": "admin"
                    }
                }), 200
        else:
            # User login
            user = verify_user_login(username, password)
            if user:
                token = create_token(user, 'user')
                return jsonify({
                    "token": token,
                    "user": {
                        "id": user['user_id'],
                        "name": user['name'],
                        "email": user['email'],
                        "phone": user['phone'],
                        "type": "user"
                    }
                }), 200
        
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
        
        user_id, message = register_user(name, email, password, phone)
        
        if user_id:
            return jsonify({"message": message, "user_id": user_id}), 201
        else:
            return jsonify({"error": message}), 400
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================== ADMIN ROUTES ==================
@app.route("/admin/dashboard", methods=["GET"])
@token_required
def admin_dashboard(payload):
    if payload['type'] != 'admin':
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        db = get_db()
        # Get dashboard statistics
        stats = {
            "total_users": db.execute("SELECT COUNT(*) as count FROM users").fetchone()['count'],
            "total_rooms": db.execute("SELECT COUNT(*) as count FROM rooms").fetchone()['count'],
            "total_bookings": db.execute("SELECT COUNT(*) as count FROM bookings").fetchone()['count'],
            "pending_bookings": db.execute("SELECT COUNT(*) as count FROM bookings WHERE booking_status = 'Pending'").fetchone()['count'],
            "confirmed_bookings": db.execute("SELECT COUNT(*) as count FROM bookings WHERE booking_status = 'Confirmed'").fetchone()['count'],
            "total_revenue": db.execute("SELECT SUM(amount) as total FROM payments WHERE payment_status = 'Completed'").fetchone()['total'] or 0
        }
        db.close()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/users", methods=["GET"])
@token_required
def admin_get_users(payload):
    if payload['type'] != 'admin':
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        db = get_db()
        users = db.execute("SELECT user_id, name, email, phone, status, created_at FROM users ORDER BY created_at DESC").fetchall()
        db.close()
        return jsonify([dict(user) for user in users]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/bookings", methods=["GET"])
@token_required
def admin_get_bookings(payload):
    if payload['type'] != 'admin':
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
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
        return jsonify({"error": str(e)}), 500

# ================== USER ROUTES ==================
@app.route("/user/bookings", methods=["GET"])
@token_required
def user_bookings(payload):
    if payload['type'] != 'user':
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        db = get_db()
        bookings = db.execute("""
            SELECT b.*, r.room_number, r.room_type, r.price, r.description
            FROM bookings b
            JOIN rooms r ON b.room_id = r.room_id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        """, (payload['user']['user_id'],)).fetchall()
        db.close()
        return jsonify([dict(booking) for booking in bookings]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/user/bookings", methods=["POST"])
@token_required
def create_booking(payload):
    if payload['type'] != 'user':
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        data = request.json
        user_id = payload['user']['user_id']
        room_id = data.get("room_id")
        check_in = data.get("check_in")
        check_out = data.get("check_out")
        
        db = get_db()
        # Check if room is available
        conflict = db.execute("""
            SELECT * FROM bookings 
            WHERE room_id = ? AND booking_status IN ('Pending', 'Confirmed')
            AND ((check_in <= ? AND check_out >= ?) OR (check_in <= ? AND check_out >= ?))
        """, (room_id, check_out, check_in, check_in, check_out)).fetchone()
        
        if conflict:
            db.close()
            return jsonify({"error": "Room not available for selected dates"}), 400
        
        # Create booking
        db.execute("""
            INSERT INTO bookings (user_id, room_id, check_in, check_out, booking_status, arrival_status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, room_id, check_in, check_out, "Pending", "Not Arrived"))
        
        db.commit()
        booking_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        db.close()
        
        return jsonify({"message": "Booking created successfully", "booking_id": booking_id}), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================== PUBLIC ROUTES ==================
@app.route("/rooms/available", methods=["GET"])
def get_available_rooms():
    try:
        check_in = request.args.get('check_in')
        check_out = request.args.get('check_out')
        
        db = get_db()
        
        if check_in and check_out:
            # Get rooms that are not booked in the given date range
            booked_room_ids = db.execute("""
                SELECT DISTINCT room_id FROM bookings 
                WHERE (check_in <= ? AND check_out >= ?) 
                AND booking_status IN ('Pending', 'Confirmed')
            """, (check_out, check_in)).fetchall()
            
            booked_ids = [row['room_id'] for row in booked_room_ids]
            
            if booked_ids:
                placeholders = ','.join('?' * len(booked_ids))
                rooms = db.execute(f"""
                    SELECT * FROM rooms 
                    WHERE status = 'Available' 
                    AND room_id NOT IN ({placeholders})
                    ORDER BY price ASC
                """, booked_ids).fetchall()
            else:
                rooms = db.execute("""
                    SELECT * FROM rooms 
                    WHERE status = 'Available' 
                    ORDER BY price ASC
                """).fetchall()
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

@app.route("/rooms/<int:room_id>", methods=["GET"])
def get_room_details(room_id):
    try:
        db = get_db()
        room = db.execute("SELECT * FROM rooms WHERE room_id = ?", (room_id,)).fetchone()
        if not room:
            return jsonify({"error": "Room not found"}), 404
        
        # Get room features and services
        features = db.execute("""
            SELECT rf.feature_name 
            FROM room_feature_map rfm
            JOIN room_features rf ON rfm.feature_id = rf.feature_id
            WHERE rfm.room_id = ?
        """, (room_id,)).fetchall()
        
        services = db.execute("""
            SELECT rs.service_name 
            FROM room_service_map rsm
            JOIN room_services rs ON rsm.service_id = rs.service_id
            WHERE rsm.room_id = ?
        """, (room_id,)).fetchall()
        
        room_dict = dict(room)
        room_dict['features'] = [f['feature_name'] for f in features]
        room_dict['services'] = [s['service_name'] for s in services]
        
        db.close()
        return jsonify(room_dict), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/")
def home():
    return jsonify({
        "message": "🏨 Hotel Booking Management System API v2.0",
        "version": "2.0",
        "documentation": "/swagger",
        "endpoints": {
            "authentication": {
                "login": "POST /auth/login",
                "register": "POST /auth/register"
            },
            "public": {
                "available_rooms": "GET /rooms/available",
                "room_details": "GET /rooms/{id}"
            },
            "user_protected": {
                "my_bookings": "GET /user/bookings",
                "create_booking": "POST /user/bookings"
            },
            "admin_protected": {
                "dashboard": "GET /admin/dashboard",
                "manage_users": "GET /admin/users",
                "manage_bookings": "GET /admin/bookings"
            }
        },
        "credentials": {
            "admin_login": {
                "username": "admin",
                "password": "admin123",
                "user_type": "admin"
            }
        }
    })

if __name__ == "__main__":
    create_initial_admin()
    app.run(debug=True, port=5000, host='0.0.0.0')