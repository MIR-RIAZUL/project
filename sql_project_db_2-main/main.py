from flask import Flask, request, jsonify
from flask_swagger_ui import get_swaggerui_blueprint
from flask_cors import CORS
import sqlite3

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

# ---------------- Root ----------------
@app.route("/")
def home():
    return "<h2>Hotel Booking Management System API is running! Go to /swagger to see API docs.</h2>"

# ================== USERS ==================
@app.route("/users", methods=["GET", "POST"])
def users():
    db = get_db()
    if request.method == "GET":
        data = db.execute("SELECT * FROM users").fetchall()
        db.close()
        return jsonify([dict(x) for x in data])

    data = request.json
    db.execute(
        "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
        (data["name"], data["email"], data["password"], data.get("phone"))
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
        db.execute("""
            UPDATE users SET name=?, email=?, password=?, phone=?
            WHERE user_id=?
        """, (data["name"], data["email"], data["password"], data.get("phone"), user_id))
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

# ================== FEATURES ==================
@app.route("/features", methods=["GET", "POST"])
def features():
    db = get_db()
    if request.method == "GET":
        data = db.execute("SELECT * FROM room_features").fetchall()
        db.close()
        return jsonify([dict(x) for x in data])

    data = request.json
    db.execute("INSERT INTO room_features (feature_name) VALUES (?)", (data["name"],))
    db.commit()
    db.close()
    return jsonify({"message": "Feature added"}), 201

@app.route("/features/<int:feature_id>", methods=["PUT", "DELETE"])
def feature_detail(feature_id):
    db = get_db()
    if request.method == "PUT":
        data = request.json
        db.execute("UPDATE room_features SET feature_name=? WHERE feature_id=?", (data["name"], feature_id))
        db.commit()
        db.close()
        return jsonify({"message": "Feature updated"})
    elif request.method == "DELETE":
        db.execute("DELETE FROM room_features WHERE feature_id=?", (feature_id,))
        db.commit()
        db.close()
        return jsonify({"message": "Feature deleted"})

# ================== SERVICES ==================
@app.route("/services", methods=["GET", "POST"])
def services():
    db = get_db()
    if request.method == "GET":
        data = db.execute("SELECT * FROM room_services").fetchall()
        db.close()
        return jsonify([dict(x) for x in data])

    data = request.json
    db.execute("INSERT INTO room_services (service_name) VALUES (?)", (data["name"],))
    db.commit()
    db.close()
    return jsonify({"message": "Service added"}), 201

@app.route("/services/<int:service_id>", methods=["PUT", "DELETE"])
def service_detail(service_id):
    db = get_db()
    if request.method == "PUT":
        data = request.json
        db.execute("UPDATE room_services SET service_name=? WHERE service_id=?", (data["name"], service_id))
        db.commit()
        db.close()
        return jsonify({"message": "Service updated"})
    elif request.method == "DELETE":
        db.execute("DELETE FROM room_services WHERE service_id=?", (service_id,))
        db.commit()
        db.close()
        return jsonify({"message": "Service deleted"})

# ================== SETTINGS ==================
@app.route("/settings", methods=["GET"])
def settings():
    db = get_db()
    data = db.execute("SELECT * FROM system_settings").fetchall()
    db.close()
    return jsonify([dict(x) for x in data])

# ================== RUN SERVER ==================
if __name__ == "__main__":
    app.run(debug=True)
