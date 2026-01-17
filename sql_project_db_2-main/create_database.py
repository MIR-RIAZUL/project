import sqlite3

# Connect to SQLite database (creates file if not exists)
conn = sqlite3.connect("hotel_booking.db")

# Enable foreign key support
conn.execute("PRAGMA foreign_keys = ON")

cursor = conn.cursor()

# ================= USERS TABLE =================
cursor.execute("""
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

# ================= ADMINS TABLE =================
cursor.execute("""
CREATE TABLE IF NOT EXISTS admins (
    admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin'
)
""")

# ================= ROOMS TABLE =================
cursor.execute("""
CREATE TABLE IF NOT EXISTS rooms (
    room_id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_number TEXT UNIQUE NOT NULL,
    room_type TEXT,
    price REAL NOT NULL,
    status TEXT DEFAULT 'Available',
    description TEXT
)
""")

# ================= ROOM FEATURES =================
cursor.execute("""
CREATE TABLE IF NOT EXISTS room_features (
    feature_id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_name TEXT UNIQUE NOT NULL
)
""")

# ================= ROOM SERVICES =================
cursor.execute("""
CREATE TABLE IF NOT EXISTS room_services (
    service_id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT UNIQUE NOT NULL
)
""")

# ================= ROOM FEATURE MAP =================
cursor.execute("""
CREATE TABLE IF NOT EXISTS room_feature_map (
    room_id INTEGER,
    feature_id INTEGER,
    PRIMARY KEY (room_id, feature_id),
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (feature_id) REFERENCES room_features(feature_id) ON DELETE CASCADE
)
""")

# ================= ROOM SERVICE MAP =================
cursor.execute("""
CREATE TABLE IF NOT EXISTS room_service_map (
    room_id INTEGER,
    service_id INTEGER,
    PRIMARY KEY (room_id, service_id),
    FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES room_services(service_id) ON DELETE CASCADE
)
""")

# ================= BOOKINGS TABLE =================
cursor.execute("""
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

# ================= PAYMENTS TABLE =================
cursor.execute("""
CREATE TABLE IF NOT EXISTS payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER UNIQUE,
    amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'Paytm',
    payment_status TEXT DEFAULT 'Pending',
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
)
""")

# ================= REFUNDS TABLE =================
cursor.execute("""
CREATE TABLE IF NOT EXISTS refunds (
    refund_id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER,
    refund_amount REAL,
    refund_status TEXT DEFAULT 'Initiated',
    refund_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
)
""")

# ================= REVIEWS TABLE =================
cursor.execute("""
CREATE TABLE IF NOT EXISTS reviews (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    room_id INTEGER,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
)
""")

# ================= INVOICES TABLE =================
cursor.execute("""
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER UNIQUE,
    total_amount REAL,
    invoice_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
)
""")

# ================= SYSTEM SETTINGS TABLE =================
cursor.execute("""
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT
)
""")

# Commit changes and close connection
conn.commit()
conn.close()

print("✅ Hotel Booking Database and all tables created successfully!")
