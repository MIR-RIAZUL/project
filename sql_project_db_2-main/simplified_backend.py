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
            "cancelled_bookings": db.execute("SELECT COUNT(*) as count FROM bookings WHERE booking_status = 'Cancelled'").fetchone()['count'],
            "total_revenue": db.execute("SELECT SUM(amount) as total FROM payments WHERE payment_status = 'Completed'").fetchone()['total'] or 0,
            "total_revenue_today": db.execute("SELECT SUM(amount) as total FROM payments WHERE payment_status = 'Completed' AND DATE(payment_date) = DATE('now')").fetchone()['total'] or 0,
            "bookings_today": db.execute("SELECT COUNT(*) as count FROM bookings WHERE DATE(created_at) = DATE('now')").fetchone()['count'],
            "active_users": db.execute("SELECT COUNT(DISTINCT user_id) as count FROM bookings WHERE booking_status = 'Confirmed'").fetchone()['count'],
            "occupancy_rate": round(db.execute("""
                SELECT CAST(SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) AS FLOAT) * 100 / COUNT(*) as rate
                FROM rooms
            """).fetchone()['rate'] or 0, 2)
        }
        db.close()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/analytics", methods=["GET"])
@token_required
def admin_analytics(payload):
    if payload['type'] != 'admin':
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        db = get_db()
        
        # Get booking trends for the last 30 days
        booking_trends = db.execute("""
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM bookings
            WHERE created_at >= date('now', '-30 days')
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
        """).fetchall()
        
        # Get revenue trends for the last 30 days
        revenue_trends = db.execute("""
            SELECT DATE(b.created_at) as date, SUM(p.amount) as revenue
            FROM bookings b
            JOIN payments p ON b.booking_id = p.booking_id
            WHERE p.payment_status = 'Completed' AND b.created_at >= date('now', '-30 days')
            GROUP BY DATE(b.created_at)
            ORDER BY DATE(b.created_at)
        """).fetchall()
        
        # Get popular room types
        popular_rooms = db.execute("""
            SELECT r.room_type, COUNT(*) as count
            FROM bookings b
            JOIN rooms r ON b.room_id = r.room_id
            GROUP BY r.room_type
            ORDER BY count DESC
            LIMIT 5
        """).fetchall()
        
        # Get monthly revenue
        monthly_revenue = db.execute("""
            SELECT strftime('%Y-%m', created_at) as month, SUM(amount) as revenue
            FROM payments
            WHERE payment_status = 'Completed'
            GROUP BY strftime('%Y-%m', created_at)
            ORDER BY month DESC
            LIMIT 12
        """).fetchall()
        
        analytics = {
            "booking_trends": [{"date": row["date"], "count": row["count"]} for row in booking_trends],
            "revenue_trends": [{"date": row["date"], "revenue": row["revenue"] or 0} for row in revenue_trends],
            "popular_rooms": [{"room_type": row["room_type"], "count": row["count"]} for row in popular_rooms],
            "monthly_revenue": [{"month": row["month"], "revenue": row["revenue"] or 0} for row in monthly_revenue]
        }
        
        db.close()
        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/reports", methods=["GET"])
@token_required
def admin_reports(payload):
    if payload['type'] != 'admin':
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        report_type = request.args.get('type', 'summary')
        start_date = request.args.get('start_date', '2020-01-01')
        end_date = request.args.get('end_date', '2030-12-31')
        
        db = get_db()
        
        if report_type == 'summary':
            report = {
                "period": f"{start_date} to {end_date}",
                "total_bookings": db.execute("""
                    SELECT COUNT(*) as count FROM bookings
                    WHERE created_at BETWEEN ? AND ?
                """, (start_date, end_date)).fetchone()['count'],
                "total_revenue": db.execute("""
                    SELECT SUM(amount) as total FROM payments
                    WHERE payment_status = 'Completed' AND payment_date BETWEEN ? AND ?
                """, (start_date, end_date)).fetchone()['total'] or 0,
                "avg_booking_value": db.execute("""
                    SELECT AVG(p.amount) as avg FROM payments p
                    JOIN bookings b ON p.booking_id = b.booking_id
                    WHERE p.payment_status = 'Completed' AND b.created_at BETWEEN ? AND ?
                """, (start_date, end_date)).fetchone()['avg'] or 0,
                "occupancy_rate": db.execute("""
                    SELECT CAST(SUM(CASE WHEN status = 'Occupied' THEN 1 ELSE 0 END) AS FLOAT) * 100 / COUNT(*) as rate
                    FROM rooms
                """).fetchone()['rate'] or 0,
                "top_customers": db.execute("""
                    SELECT u.name, u.email, COUNT(b.booking_id) as booking_count
                    FROM users u
                    JOIN bookings b ON u.user_id = b.user_id
                    WHERE b.created_at BETWEEN ? AND ?
                    GROUP BY u.user_id
                    ORDER BY booking_count DESC
                    LIMIT 5
                """, (start_date, end_date)).fetchall()
            }
        elif report_type == 'financial':
            report = {
                "period": f"{start_date} to {end_date}",
                "total_revenue": db.execute("""
                    SELECT SUM(amount) as total FROM payments
                    WHERE payment_status = 'Completed' AND payment_date BETWEEN ? AND ?
                """, (start_date, end_date)).fetchone()['total'] or 0,
                "refunds_processed": db.execute("""
                    SELECT SUM(refund_amount) as total FROM refunds
                    WHERE refund_date BETWEEN ? AND ?
                """, (start_date, end_date)).fetchone()['total'] or 0,
                "net_revenue": db.execute("""
                    SELECT 
                        COALESCE(SUM(p.amount), 0) - COALESCE(SUM(r.refund_amount), 0) as net
                    FROM payments p
                    LEFT JOIN refunds r ON p.payment_id = r.payment_id
                    WHERE p.payment_status = 'Completed' AND p.payment_date BETWEEN ? AND ?
                """, (start_date, end_date)).fetchone()['net'] or 0,
                "revenue_by_payment_method": db.execute("""
                    SELECT payment_method, SUM(amount) as total
                    FROM payments
                    WHERE payment_status = 'Completed' AND payment_date BETWEEN ? AND ?
                    GROUP BY payment_method
                """, (start_date, end_date)).fetchall()
            }
        elif report_type == 'booking':
            report = {
                "period": f"{start_date} to {end_date}",
                "total_bookings": db.execute("""
                    SELECT COUNT(*) as count FROM bookings
                    WHERE created_at BETWEEN ? AND ?
                """, (start_date, end_date)).fetchone()['count'],
                "confirmed_bookings": db.execute("""
                    SELECT COUNT(*) as count FROM bookings
                    WHERE booking_status = 'Confirmed' AND created_at BETWEEN ? AND ?
                """, (start_date, end_date)).fetchone()['count'],
                "cancelled_bookings": db.execute("""
                    SELECT COUNT(*) as count FROM bookings
                    WHERE booking_status = 'Cancelled' AND created_at BETWEEN ? AND ?
                """, (start_date, end_date)).fetchone()['count'],
                "avg_stay_duration": db.execute("""
                    SELECT AVG(julianday(check_out) - julianday(check_in)) as avg_days
                    FROM bookings
                    WHERE created_at BETWEEN ? AND ?
                """, (start_date, end_date)).fetchone()['avg_days'] or 0,
                "bookings_by_status": db.execute("""
                    SELECT booking_status, COUNT(*) as count
                    FROM bookings
                    WHERE created_at BETWEEN ? AND ?
                    GROUP BY booking_status
                """, (start_date, end_date)).fetchall()
            }
        
        db.close()
        return jsonify(report), 200
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
        destination = request.args.get('destination', '').lower()
        
        db = get_db()
        
        # Base query
        base_query = """
            SELECT r.*, 
                   rf.feature_name as feature,
                   GROUP_CONCAT(rf.feature_name) as features,
                   (SELECT AVG(rating) FROM reviews WHERE room_id = r.room_id) as avg_rating,
                   (SELECT COUNT(*) FROM reviews WHERE room_id = r.room_id) as reviews_count
            FROM rooms r
            LEFT JOIN room_feature_map rfm ON r.room_id = rfm.room_id
            LEFT JOIN room_features rf ON rfm.feature_id = rf.feature_id
            WHERE r.status = 'Available'
        """
        
        # Add date filtering if dates are provided
        params = []
        if check_in and check_out:
            booked_room_ids = db.execute("""
                SELECT DISTINCT room_id FROM bookings 
                WHERE (check_in <= ? AND check_out >= ?) 
                AND booking_status IN ('Pending', 'Confirmed')
            """, (check_out, check_in)).fetchall()
            
            booked_ids = [row['room_id'] for row in booked_room_ids]
            
            if booked_ids:
                placeholders = ','.join('?' * len(booked_ids))
                base_query += f" AND r.room_id NOT IN ({placeholders})"
                params.extend(booked_ids)
        
        # Add destination filtering if provided
        if destination:
            base_query += " AND (r.room_type LIKE ? OR r.description LIKE ?)"
            params.extend([f'%{destination}%', f'%{destination}%'])
        
        # Group by room and order
        base_query += " GROUP BY r.room_id ORDER BY r.price ASC"
        
        rooms = db.execute(base_query, params).fetchall()
        db.close()
        
        # Process the results to have proper features array
        processed_rooms = []
        for room in rooms:
            room_dict = dict(room)
            # Convert features string to array
            if room_dict['features']:
                room_dict['features'] = room_dict['features'].split(',')
            else:
                room_dict['features'] = []
            processed_rooms.append(room_dict)
        
        return jsonify(processed_rooms), 200
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
        
        # Get room reviews
        reviews = db.execute("""
            SELECT r.review_id, r.rating, r.comment, r.created_at, u.name as user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.room_id = ?
            ORDER BY r.created_at DESC
        """, (room_id,)).fetchall()
        
        room_dict = dict(room)
        room_dict['features'] = [f['feature_name'] for f in features]
        room_dict['services'] = [s['service_name'] for s in services]
        room_dict['reviews'] = [dict(review) for review in reviews]
        
        # Calculate average rating
        avg_rating = db.execute("""
            SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
            FROM reviews WHERE room_id = ?
        """, (room_id,)).fetchone()
        
        room_dict['avg_rating'] = round(avg_rating['avg_rating'], 1) if avg_rating['avg_rating'] else 0
        room_dict['review_count'] = avg_rating['review_count'] if avg_rating['review_count'] else 0
        
        db.close()
        return jsonify(room_dict), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================== NEW FEATURES ==================
@app.route("/rooms/search", methods=["GET"])
def search_rooms():
    """Advanced room search with filters"""
    try:
        check_in = request.args.get('check_in')
        check_out = request.args.get('check_out')
        destination = request.args.get('destination', '').lower()
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        room_type = request.args.get('room_type', '').lower()
        min_rating = request.args.get('min_rating', type=float)
        
        db = get_db()
        
        # Base query with joins for features and ratings
        base_query = """
            SELECT r.*,
                   GROUP_CONCAT(rf.feature_name) as features,
                   (SELECT AVG(rating) FROM reviews WHERE room_id = r.room_id) as avg_rating,
                   (SELECT COUNT(*) FROM reviews WHERE room_id = r.room_id) as reviews_count
            FROM rooms r
            LEFT JOIN room_feature_map rfm ON r.room_id = rfm.room_id
            LEFT JOIN room_features rf ON rfm.feature_id = rf.feature_id
            WHERE r.status = 'Available'
        """
        
        params = []
        
        # Add date filtering if dates are provided
        if check_in and check_out:
            booked_room_ids = db.execute("""
                SELECT DISTINCT room_id FROM bookings 
                WHERE (check_in <= ? AND check_out >= ?) 
                AND booking_status IN ('Pending', 'Confirmed')
            """, (check_out, check_in)).fetchall()
            
            booked_ids = [row['room_id'] for row in booked_room_ids]
            
            if booked_ids:
                placeholders = ','.join('?' * len(booked_ids))
                base_query += f" AND r.room_id NOT IN ({placeholders})"
                params.extend(booked_ids)
        
        # Add price filtering
        if min_price is not None:
            base_query += " AND r.price >= ?"
            params.append(min_price)
        if max_price is not None:
            base_query += " AND r.price <= ?"
            params.append(max_price)
        
        # Add room type filtering
        if room_type:
            base_query += " AND LOWER(r.room_type) LIKE ?"
            params.append(f'%{room_type}%')
        
        # Add destination filtering
        if destination:
            base_query += " AND (LOWER(r.room_type) LIKE ? OR LOWER(r.description) LIKE ?)"
            params.extend([f'%{destination}%', f'%{destination}%'])
        
        # Add rating filtering
        if min_rating is not None:
            base_query += " AND (SELECT AVG(rating) FROM reviews WHERE room_id = r.room_id) >= ?"
            params.append(min_rating)
        
        # Group by room and order by price
        base_query += " GROUP BY r.room_id ORDER BY r.price ASC"
        
        rooms = db.execute(base_query, params).fetchall()
        db.close()
        
        # Process the results
        processed_rooms = []
        for room in rooms:
            room_dict = dict(room)
            if room_dict['features']:
                room_dict['features'] = room_dict['features'].split(',')
            else:
                room_dict['features'] = []
            processed_rooms.append(room_dict)
        
        return jsonify(processed_rooms), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/reviews", methods=["GET"])
def get_reviews():
    """Get reviews for a specific room or all reviews"""
    try:
        room_id = request.args.get('room_id', type=int)
        
        db = get_db()
        if room_id:
            reviews = db.execute("""
                SELECT r.*, u.name as user_name
                FROM reviews r
                JOIN users u ON r.user_id = u.user_id
                WHERE r.room_id = ?
                ORDER BY r.created_at DESC
            """, (room_id,)).fetchall()
        else:
            reviews = db.execute("""
                SELECT r.*, u.name as user_name, ro.room_type
                FROM reviews r
                JOIN users u ON r.user_id = u.user_id
                JOIN rooms ro ON r.room_id = ro.room_id
                ORDER BY r.created_at DESC
            """).fetchall()
        
        db.close()
        return jsonify([dict(review) for review in reviews]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/reviews", methods=["POST"])
@token_required
def add_review(payload):
    """Add a review for a room"""
    if payload['type'] != 'user':
        return jsonify({"error": "Unauthorized"}), 403
    
    try:
        data = request.json
        room_id = data.get("room_id")
        rating = data.get("rating")
        comment = data.get("comment")
        
        if not room_id or not rating or rating < 1 or rating > 5:
            return jsonify({"error": "Valid room_id and rating (1-5) are required"}), 400
        
        db = get_db()
        
        # Check if user has booked this room
        booking = db.execute("""
            SELECT * FROM bookings 
            WHERE user_id = ? AND room_id = ? AND booking_status = 'Confirmed'
        """, (payload['user']['user_id'], room_id)).fetchone()
        
        if not booking:
            db.close()
            return jsonify({"error": "You can only review rooms you have stayed in"}), 400
        
        # Check if user already reviewed this room
        existing_review = db.execute("""
            SELECT * FROM reviews 
            WHERE user_id = ? AND room_id = ?
        """, (payload['user']['user_id'], room_id)).fetchone()
        
        if existing_review:
            db.close()
            return jsonify({"error": "You have already reviewed this room"}), 400
        
        # Insert the review
        db.execute("""
            INSERT INTO reviews (user_id, room_id, rating, comment)
            VALUES (?, ?, ?, ?)
        """, (payload['user']['user_id'], room_id, rating, comment))
        
        db.commit()
        db.close()
        
        return jsonify({"message": "Review added successfully"}), 201
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
                "room_details": "GET /rooms/{id}",
                "search_rooms": "GET /rooms/search",
                "reviews": "GET /reviews"
            },
            "user_protected": {
                "my_bookings": "GET /user/bookings",
                "create_booking": "POST /user/bookings",
                "add_review": "POST /reviews"
            },
            "admin_protected": {
                "dashboard": "GET /admin/dashboard",
                "analytics": "GET /admin/analytics",
                "reports": "GET /admin/reports",
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