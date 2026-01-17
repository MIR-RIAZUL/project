import sqlite3

conn = sqlite3.connect("hotel_booking.db")
cursor = conn.cursor()

cursor.execute("""
SELECT name FROM sqlite_master 
WHERE type='table'
ORDER BY name;
""")

tables = cursor.fetchall()

print("📌 Tables in database:")
for table in tables:
    print("-", table[0])

conn.close()


import sqlite3

conn = sqlite3.connect("hotel_booking.db")
cursor = conn.cursor()

cursor.execute("SELECT * FROM rooms")
print(cursor.fetchall())

conn.close()
