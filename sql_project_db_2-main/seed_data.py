import sqlite3

conn = sqlite3.connect("hotel_booking.db")
cursor = conn.cursor()

# Enable foreign keys
cursor.execute("PRAGMA foreign_keys = ON")

# ================= ADMINS =================
cursor.executemany("""
INSERT INTO admins (username, password, role)
VALUES (?, ?, ?)
""", [
    ("admin", "admin123", "super_admin"),
    ("manager", "manager123", "admin")
])

# ================= USERS =================
cursor.executemany("""
INSERT INTO users (name, email, password, phone, status)
VALUES (?, ?, ?, ?, ?)
""", [
    ("Rahim Uddin", "rahim@gmail.com", "pass123", "01711111111", "active"),
    ("Karim Ahmed", "karim@gmail.com", "pass123", "01822222222", "active"),
    ("Nusrat Jahan", "nusrat@gmail.com", "pass123", "01933333333", "active"),
    ("Banned User", "banned@gmail.com", "pass123", "01644444444", "banned")
])

# ================= ROOMS =================
cursor.executemany("""
INSERT INTO rooms (room_number, room_type, price, status, description)
VALUES (?, ?, ?, ?, ?)
""", [
    ("101", "Single", 2000, "Available", "Single bed AC room"),
    ("102", "Double", 3000, "Available", "Double bed AC room"),
    ("201", "Deluxe", 4500, "Available", "Deluxe room with balcony"),
    ("202", "Suite", 6500, "Available", "Luxury suite room")
])

# ================= ROOM FEATURES =================
cursor.executemany("""
INSERT INTO room_features (feature_name)
VALUES (?)
""", [
    ("AC",),
    ("WiFi",),
    ("TV",),
    ("Balcony",),
    ("Mini Fridge",)
])

# ================= ROOM SERVICES =================
cursor.executemany("""
INSERT INTO room_services (service_name)
VALUES (?)
""", [
    ("Breakfast",),
    ("Laundry",),
    ("Room Service",),
    ("Airport Pickup",)
])

# ================= FEATURE MAPPING =================
cursor.executemany("""
INSERT INTO room_feature_map (room_id, feature_id)
VALUES (?, ?)
""", [
    (1, 1), (1, 2), (1, 3),
    (2, 1), (2, 2), (2, 3),
    (3, 1), (3, 2), (3, 3), (3, 4),
    (4, 1), (4, 2), (4, 3), (4, 4), (4, 5)
])

# ================= SERVICE MAPPING =================
cursor.executemany("""
INSERT INTO room_service_map (room_id, service_id)
VALUES (?, ?)
""", [
    (1, 1), (1, 3),
    (2, 1), (2, 2), (2, 3),
    (3, 1), (3, 2), (3, 3),
    (4, 1), (4, 2), (4, 3), (4, 4)
])

# ================= BOOKINGS =================
cursor.executemany("""
INSERT INTO bookings (user_id, room_id, check_in, check_out, booking_status, arrival_status)
VALUES (?, ?, ?, ?, ?, ?)
""", [
    (1, 1, "2026-02-10", "2026-02-12", "Confirmed", "Arrived"),
    (2, 2, "2026-02-15", "2026-02-18", "Confirmed", "Not Arrived"),
    (3, 3, "2026-03-01", "2026-03-05", "Pending", "Not Arrived")
])

# ================= PAYMENTS =================
cursor.executemany("""
INSERT INTO payments (booking_id, amount, payment_method, payment_status)
VALUES (?, ?, ?, ?)
""", [
    (1, 4000, "Paytm", "Success"),
    (2, 9000, "Paytm", "Success"),
    (3, 18000, "Paytm", "Pending")
])

# ================= REFUNDS =================
cursor.executemany("""
INSERT INTO refunds (payment_id, refund_amount, refund_status)
VALUES (?, ?, ?)
""", [
    (2, 3000, "Completed")
])

# ================= REVIEWS =================
cursor.executemany("""
INSERT INTO reviews (user_id, room_id, rating, comment)
VALUES (?, ?, ?, ?)
""", [
    (1, 1, 5, "Excellent service and clean room"),
    (2, 2, 4, "Very good experience"),
    (3, 3, 5, "Luxury stay, highly recommended")
])

# ================= INVOICES =================
cursor.executemany("""
INSERT INTO invoices (booking_id, total_amount)
VALUES (?, ?)
""", [
    (1, 4000),
    (2, 9000),
    (3, 18000)
])

# ================= SYSTEM SETTINGS =================
cursor.executemany("""
INSERT INTO system_settings (setting_key, setting_value)
VALUES (?, ?)
""", [
    ("site_status", "online"),
    ("booking_enabled", "true"),
    ("maintenance_mode", "false")
])

conn.commit()
conn.close()

print("✅ All seed data inserted successfully!")
