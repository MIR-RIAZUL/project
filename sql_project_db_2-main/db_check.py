import sqlite3

conn = sqlite3.connect('hotel_booking.db')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Database Tables:")
for table in tables:
    print(f"- {table[0]}")

# Count records
cursor.execute("SELECT COUNT(*) FROM users")
user_count = cursor.fetchone()[0]
print(f"Total Users: {user_count}")

cursor.execute("SELECT COUNT(*) FROM rooms")
room_count = cursor.fetchone()[0]
print(f"Total Rooms: {room_count}")

cursor.execute("SELECT COUNT(*) FROM admins")
admin_count = cursor.fetchone()[0]
print(f"Total Admins: {admin_count}")

conn.close()