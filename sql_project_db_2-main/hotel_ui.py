import tkinter as tk
from tkinter import ttk, messagebox
import requests

BASE_URL = "http://127.0.0.1:5000"

class HotelBookingApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Hotel Booking Management System")
        self.root.geometry("900x600")

        self.tabControl = ttk.Notebook(root)

        # Tabs
        self.users_tab = ttk.Frame(self.tabControl)
        self.rooms_tab = ttk.Frame(self.tabControl)
        self.bookings_tab = ttk.Frame(self.tabControl)
        self.payments_tab = ttk.Frame(self.tabControl)
        self.reviews_tab = ttk.Frame(self.tabControl)

        self.tabControl.add(self.users_tab, text='Users')
        self.tabControl.add(self.rooms_tab, text='Rooms')
        self.tabControl.add(self.bookings_tab, text='Bookings')
        self.tabControl.add(self.payments_tab, text='Payments')
        self.tabControl.add(self.reviews_tab, text='Reviews')
        self.tabControl.pack(expand=1, fill="both")

        # Build each tab
        self.build_users_tab()
        self.build_rooms_tab()
        self.build_bookings_tab()
        self.build_payments_tab()
        self.build_reviews_tab()

    # ---------------- USERS TAB ----------------
    def build_users_tab(self):
        tk.Button(self.users_tab, text="Fetch Users", command=self.fetch_users).pack(pady=10)
        self.users_tree = ttk.Treeview(self.users_tab, columns=("ID","Name","Email","Phone"), show='headings')
        for col in self.users_tree["columns"]:
            self.users_tree.heading(col, text=col)
        self.users_tree.pack(expand=True, fill="both")

    def fetch_users(self):
        try:
            response = requests.get(f"{BASE_URL}/users")
            data = response.json()
            self.users_tree.delete(*self.users_tree.get_children())
            for user in data:
                self.users_tree.insert("", "end", values=(user["user_id"], user["name"], user["email"], user.get("phone","")))
        except Exception as e:
            messagebox.showerror("Error", str(e))

    # ---------------- ROOMS TAB ----------------
    def build_rooms_tab(self):
        tk.Button(self.rooms_tab, text="Fetch Rooms", command=self.fetch_rooms).pack(pady=10)
        self.rooms_tree = ttk.Treeview(self.rooms_tab, columns=("ID","Number","Type","Price","Status"), show='headings')
        for col in self.rooms_tree["columns"]:
            self.rooms_tree.heading(col, text=col)
        self.rooms_tree.pack(expand=True, fill="both")

    def fetch_rooms(self):
        try:
            response = requests.get(f"{BASE_URL}/rooms")
            data = response.json()
            self.rooms_tree.delete(*self.rooms_tree.get_children())
            for room in data:
                self.rooms_tree.insert("", "end", values=(room["room_id"], room["room_number"], room["room_type"], room["price"], room.get("status","Available")))
        except Exception as e:
            messagebox.showerror("Error", str(e))

    # ---------------- BOOKINGS TAB ----------------
    def build_bookings_tab(self):
        tk.Button(self.bookings_tab, text="Fetch Bookings", command=self.fetch_bookings).pack(pady=10)
        self.bookings_tree = ttk.Treeview(self.bookings_tab, columns=("ID","User","Room","Check-in","Check-out","Status"), show='headings')
        for col in self.bookings_tree["columns"]:
            self.bookings_tree.heading(col, text=col)
        self.bookings_tree.pack(expand=True, fill="both")

    def fetch_bookings(self):
        try:
            response = requests.get(f"{BASE_URL}/bookings")
            data = response.json()
            self.bookings_tree.delete(*self.bookings_tree.get_children())
            for b in data:
                self.bookings_tree.insert("", "end", values=(b["booking_id"], b.get("user_name",""), b.get("room_number",""), b["check_in"], b["check_out"], b.get("booking_status","")))
        except Exception as e:
            messagebox.showerror("Error", str(e))

    # ---------------- PAYMENTS TAB ----------------
    def build_payments_tab(self):
        tk.Button(self.payments_tab, text="Fetch Payments", command=self.fetch_payments).pack(pady=10)
        self.payments_tree = ttk.Treeview(self.payments_tab, columns=("ID","Booking ID","Amount","Method","Status"), show='headings')
        for col in self.payments_tree["columns"]:
            self.payments_tree.heading(col, text=col)
        self.payments_tree.pack(expand=True, fill="both")

    def fetch_payments(self):
        try:
            response = requests.get(f"{BASE_URL}/payments")
            data = response.json()
            self.payments_tree.delete(*self.payments_tree.get_children())
            for p in data:
                self.payments_tree.insert("", "end", values=(p["payment_id"], p["booking_id"], p["amount"], p.get("payment_method",""), p.get("payment_status","")))
        except Exception as e:
            messagebox.showerror("Error", str(e))

    # ---------------- REVIEWS TAB ----------------
    def build_reviews_tab(self):
        tk.Button(self.reviews_tab, text="Fetch Reviews", command=self.fetch_reviews).pack(pady=10)
        self.reviews_tree = ttk.Treeview(self.reviews_tab, columns=("ID","User","Room","Rating","Comment"), show='headings')
        for col in self.reviews_tree["columns"]:
            self.reviews_tree.heading(col, text=col)
        self.reviews_tree.pack(expand=True, fill="both")

    def fetch_reviews(self):
        try:
            response = requests.get(f"{BASE_URL}/reviews")
            data = response.json()
            self.reviews_tree.delete(*self.reviews_tree.get_children())
            for r in data:
                self.reviews_tree.insert("", "end", values=(r["review_id"], r.get("user_name",""), r.get("room_number",""), r["rating"], r.get("comment","")))
        except Exception as e:
            messagebox.showerror("Error", str(e))

# ---------------- Run App ----------------
if __name__ == "__main__":
    root = tk.Tk()
    app = HotelBookingApp(root)
    root.mainloop()
