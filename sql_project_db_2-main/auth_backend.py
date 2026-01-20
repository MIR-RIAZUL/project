from flask import Flask, request, jsonify
from flask_swagger_ui import get_swaggerui_blueprint
from flask_cors import CORS
import sqlite3
import hashlib
from datetime import datetime

app = Flask(__name__, static_folder='static')
CORS(app)  # Enable CORS for all routes

# ---------------- Database connection ----------------
def get_db():
    conn = sqlite3.connect("hotel_booking.db")
    conn.row_factory = sqlite3.Row
    return conn

# ---------------- Swagger ----------------
SWAGGER_URL = "/swagger"
API_URL = "/static/swagger.json"

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={"app_name": "Hotel Booking Management System"}
)

app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

# ---------------- Helper Functions ----------------
def hash_password(password):
    """Simple password hashing using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_user_credentials(email, password):
    """Verify user credentials"""
    db = get_db()
    hashed_password = hash_password(password)
    user = db.execute(
        "SELECT * FROM users WHERE email = ? AND password = ?", 
        (email, hashed_password)
    ).fetchone()
    db.close()
    return dict(user) if user else None

def verify_admin_credentials(username, password):
    """Verify admin credentials"""
    db = get_db()
    # For admin, we'll check against a predefined admin user
    # In a real app, this would be in a database table
    if username == "admin" and password == "admin123":
        admin = {
            "admin_id": 1,
            "username": "admin",
            "role": "super_admin"
        }
        return admin
    db.close()
    return None

# ---------------- Authentication Routes ----------------
@app.route("/auth/login", methods=["POST"])
def login():
    try:
        data = request.json
        username = data.get("username")
        password = data.get("password")
        user_type = data.get("user_type", "user")  # user or admin
        
        if user_type == "admin":
            # Admin login
            admin = verify_admin_credentials(username, password)
            if admin:
                return jsonify({
                    "token": "admin_token_" + str(admin['admin_id']),
                    "user": {
                        "id": admin['admin_id'],
                        "username": admin['username'],
                        "role": admin['role'],
                        "type": "admin"
                    }
                }), 200
        else:
            # User login
            user = verify_user_credentials(username, password)
            if user:
                return jsonify({
                    "token": "user_token_" + str(user['user_id']),
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
        
        db = get_db()
        
        # Check if user already exists
        existing_user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if existing_user:
            db.close()
            return jsonify({"error": "User already exists"}), 400
        
        # Hash password and create user
        hashed_password = hash_password(password)
        db.execute(
            "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
            (name, email, hashed_password, phone)
        )
        db.commit()
        user_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
        db.close()
        
        return jsonify({
            "message": "User registered successfully", 
            "user_id": user_id
        }), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- Root ----------------
@app.route("/")
def home():
    return jsonify({
        "message": "🏨 Hotel Booking Management System API",
        "version": "2.1",
        "authentication": {
            "login": "POST /auth/login",
            "register": "POST /auth/register"
        },
        "endpoints": {
            "users": "GET/POST /users",
            "rooms": "GET/POST /rooms",
            "bookings": "GET/POST /bookings",
            "payments": "GET/POST /payments",
            "reviews": "GET/POST /reviews"
        },
        "test_credentials": {
            "admin": {
                "username": "admin",
                "password": "admin123",
                "user_type": "admin"
            }
        }
    })

# ================== USERS ==================
@app.route("/users", methods=["GET", "POST"])
def users():
    db = get_db()
    if request.method == "GET":
        data = db.execute("SELECT * FROM users").fetchall()
        db.close()
        return jsonify([dict(x) for x in data])

    data = request.json
    # Hash the password before storing
    hashed_password = hash_password(data["password"])
    db.execute(
        "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
        (data["name"], data["email"], hashed_password, data.get("phone"))
    )
    db.commit()
    db.close()
    return jsonify({"message": "User added"}), 201

@app.route("/users/<int:user_id>", methods=["GET", "PUT", "DELETE"])
def user_detail(user_id):
    db = get_db()
    if request.method == "GET":
        user = db.execute("SELECT * FROM users WHERE user_id=?", (user_id,)).fetchone()
        db.close()
        if user:
            return jsonify(dict(user))
        return jsonify({"error": "User not found"}), 404

    elif request.method == "PUT":
        data = request.json
        hashed_password = hash_password(data["password"])
        db.execute("""
            UPDATE users SET name=?, email=?, password=?, phone=?
            WHERE user_id=?
        """, (data["name"], data["email"], hashed_password, data.get("phone"), user_id))
        db.commit()
        db.close()
        return jsonify({"message": "User updated"})

    elif request.method == "DELETE":
        db.execute("DELETE FROM users WHERE user_id=?", (user_id,))
        db.commit()
        db.close()
        return jsonify({"message": "User deleted"})

# ================== ROOMS ==================
@app.route("/rooms", methods=["GET", "POST"])
def rooms():
    db = get_db()
    if request.method == "GET":
        data = db.execute("SELECT * FROM rooms").fetchall()
        db.close()
        return jsonify([dict(x) for x in data])

    data = request.json
    db.execute(
        "INSERT INTO rooms (room_number, room_type, price, status, description) VALUES (?, ?, ?, ?, ?)",
        (data["room_number"], data["room_type"], data["price"], data.get("status", "Available"), data.get("description"))
    )
    db.commit()
    db.close()
    return jsonify({"message": "Room added"}), 201

@app.route("/rooms/<int:room_id>", methods=["GET", "PUT", "DELETE"])
def room_detail(room_id):
    db = get_db()
    if request.method == "GET":
        room = db.execute("SELECT * FROM rooms WHERE room_id=?", (room_id,)).fetchone()
        db.close()
        if room:
            return jsonify(dict(room))
        return jsonify({"error": "Room not found"}), 404

    elif request.method == "PUT":
        data = request.json
        db.execute("""
            UPDATE rooms SET room_number=?, room_type=?, price=?, status=?, description=?
            WHERE room_id=?
        """, (data["room_number"], data["room_type"], data["price"], data.get("status"), data.get("description"), room_id))
        db.commit()
        db.close()
        return jsonify({"message": "Room updated"})

    elif request.method == "DELETE":
        db.execute("DELETE FROM rooms WHERE room_id=?", (room_id,))
        db.commit()
        db.close()
        return jsonify({"message": "Room deleted"})

# ================== BOOKINGS ==================
@app.route("/bookings", methods=["GET", "POST"])
def bookings():
    db = get_db()
    if request.method == "GET":
        data = db.execute("""
            SELECT b.*, u.name as user_name, r.room_number
            FROM bookings b
            JOIN users u ON b.user_id=u.user_id
            JOIN rooms r ON b.room_id=r.room_id
        """).fetchall()
        db.close()
        return jsonify([dict(x) for x in data])

    data = request.json
    db.execute(
        "INSERT INTO bookings (user_id, room_id, check_in, check_out, booking_status, arrival_status) VALUES (?, ?, ?, ?, ?, ?)",
        (data["user_id"], data["room_id"], data["check_in"], data["check_out"], data.get("booking_status", "Pending"), data.get("arrival_status", "Not Arrived"))
    )
    db.commit()
    db.close()
    return jsonify({"message": "Booking created"}), 201

@app.route("/bookings/<int:booking_id>", methods=["GET", "PUT", "DELETE"])
def booking_detail(booking_id):
    db = get_db()
    if request.method == "GET":
        b = db.execute("SELECT * FROM bookings WHERE booking_id=?", (booking_id,)).fetchone()
        db.close()
        if b:
            return jsonify(dict(b))
        return jsonify({"error": "Booking not found"}), 404

    elif request.method == "PUT":
        data = request.json
        db.execute("""
            UPDATE bookings SET user_id=?, room_id=?, check_in=?, check_out=?, booking_status=?, arrival_status=?
            WHERE booking_id=?
        """, (data["user_id"], data["room_id"], data["check_in"], data["check_out"], data.get("booking_status"), data.get("arrival_status"), booking_id))
        db.commit()
        db.close()
        return jsonify({"message": "Booking updated"})

    elif request.method == "DELETE":
        db.execute("DELETE FROM bookings WHERE booking_id=?", (booking_id,))
        db.commit()
        db.close()
        return jsonify({"message": "Booking deleted"})

# ================== PAYMENTS ==================
@app.route("/payments", methods=["GET", "POST"])
def payments():
    db = get_db()
    if request.method == "GET":
        data = db.execute("SELECT * FROM payments").fetchall()
        db.close()
        return jsonify([dict(x) for x in data])

    data = request.json
    db.execute(
        "INSERT INTO payments (booking_id, amount, payment_method, payment_status) VALUES (?, ?, ?, ?)",
        (data["booking_id"], data["amount"], data.get("payment_method", "Paytm"), data.get("payment_status", "Pending"))
    )
    db.commit()
    db.close()
    return jsonify({"message": "Payment added"}), 201

@app.route("/payments/<int:payment_id>", methods=["GET", "PUT", "DELETE"])
def payment_detail(payment_id):
    db = get_db()
    if request.method == "GET":
        p = db.execute("SELECT * FROM payments WHERE payment_id=?", (payment_id,)).fetchone()
        db.close()
        if p:
            return jsonify(dict(p))
        return jsonify({"error": "Payment not found"}), 404

    elif request.method == "PUT":
        data = request.json
        db.execute("""
            UPDATE payments SET booking_id=?, amount=?, payment_method=?, payment_status=?
            WHERE payment_id=?
        """, (data["booking_id"], data["amount"], data.get("payment_method"), data.get("payment_status"), payment_id))
        db.commit()
        db.close()
        return jsonify({"message": "Payment updated"})

    elif request.method == "DELETE":
        db.execute("DELETE FROM payments WHERE payment_id=?", (payment_id,))
        db.commit()
        db.close()
        return jsonify({"message": "Payment deleted"})

# ================== REVIEWS ==================
@app.route("/reviews", methods=["GET", "POST"])
def reviews():
    db = get_db()
    if request.method == "GET":
        data = db.execute("""
            SELECT r.*, u.name as user_name, rm.room_number
            FROM reviews r
            JOIN users u ON r.user_id=u.user_id
            JOIN rooms rm ON r.room_id=rm.room_id
        """).fetchall()
        db.close()
        return jsonify([dict(x) for x in data])

    data = request.json
    db.execute(
        "INSERT INTO reviews (user_id, room_id, rating, comment) VALUES (?, ?, ?, ?)",
        (data["user_id"], data["room_id"], data["rating"], data.get("comment"))
    )
    db.commit()
    db.close()
    return jsonify({"message": "Review added"}), 201

@app.route("/reviews/<int:review_id>", methods=["GET", "PUT", "DELETE"])
def review_detail(review_id):
    db = get_db()
    if request.method == "GET":
        r = db.execute("SELECT * FROM reviews WHERE review_id=?", (review_id,)).fetchone()
        db.close()
        if r:
            return jsonify(dict(r))
        return jsonify({"error": "Review not found"}), 404

    elif request.method == "PUT":
        data = request.json
        db.execute("""
            UPDATE reviews SET user_id=?, room_id=?, rating=?, comment=?
            WHERE review_id=?
        """, (data["user_id"], data["room_id"], data["rating"], data.get("comment"), review_id))
        db.commit()
        db.close()
        return jsonify({"message": "Review updated"})

    elif request.method == "DELETE":
        db.execute("DELETE FROM reviews WHERE review_id=?", (review_id,))
        db.commit()
        db.close()
        return jsonify({"message": "Review deleted"})

# ================== RUN SERVER ==================
if __name__ == "__main__":
    app.run(debug=True, port=5000)