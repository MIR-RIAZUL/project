# Professional Hotel Management System

A comprehensive hotel management system designed to provide a professional booking experience similar to Booking.com, featuring both user and admin ends.

## 🏨 Features

### User End
- **Professional UI/UX**: Clean, intuitive interface similar to Booking.com
- **Advanced Search**: Search by destination, dates, price range, room type, and ratings
- **Detailed Property Listings**: View photos, amenities, ratings, and reviews
- **Booking Management**: Create, view, and cancel reservations
- **Reviews & Ratings**: Leave reviews for properties you've stayed in
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Admin End
- **Comprehensive Dashboard**: Real-time analytics and statistics
- **Booking Management**: View, confirm, and manage all bookings
- **Property Management**: Add, update, and remove hotel rooms
- **User Management**: Monitor and manage user accounts
- **Analytics & Reporting**: Detailed reports on bookings, revenue, and trends
- **Revenue Tracking**: Monitor financial performance and occupancy rates

## 🛠️ Tech Stack

### Frontend
- **React**: Component-based UI development
- **CSS**: Custom styling with responsive design
- **JavaScript**: Interactive functionality
- **Vite**: Fast development server and build tool

### Backend
- **Python**: Server-side logic
- **Flask**: Web framework
- **SQLite**: Database management
- **PyJWT**: Authentication and authorization

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)

### Installation

#### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:5173`

#### Backend
1. Navigate to the backend directory:
   ```bash
   cd sql_project_db_2-main
   ```

2. Install required Python packages:
   ```bash
   pip install flask flask-cors flask-swagger-ui pyjwt
   ```

3. Start the backend server:
   ```bash
   python simplified_backend.py
   ```

4. The API will be available at `http://127.0.0.1:5000`

## 🔐 Authentication

### Default Credentials
- **Admin**: Username: `admin`, Password: `admin123`
- **User**: Register a new account or use existing test credentials

## 📊 API Endpoints

### Public Endpoints
- `GET /rooms/available` - Get available rooms
- `GET /rooms/search` - Advanced room search with filters
- `GET /rooms/:id` - Get room details
- `GET /reviews` - Get reviews

### User Protected Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /user/bookings` - Get user bookings
- `POST /user/bookings` - Create a booking
- `POST /reviews` - Add a review

### Admin Protected Endpoints
- `GET /admin/dashboard` - Admin dashboard stats
- `GET /admin/analytics` - Analytics data
- `GET /admin/reports` - Reports (summary, financial, booking)
- `GET /admin/users` - Manage users
- `GET /admin/bookings` - Manage bookings

## 🎨 UI/UX Highlights

- **Booking.com Inspired Design**: Professional interface with intuitive navigation
- **Advanced Filtering**: Search by price, rating, room type, and amenities
- **Real-time Availability**: Dynamic availability checking
- **Image Gallery**: Property photos for better visualization
- **Rating System**: User reviews and star ratings
- **Responsive Layout**: Optimized for all device sizes

## 📈 Analytics & Reporting

### Admin Dashboard Features
- Real-time booking statistics
- Revenue tracking and analysis
- Occupancy rate monitoring
- Customer behavior insights
- Financial reporting
- Trend analysis (daily, monthly)

## 🛡️ Security Features

- JWT-based authentication
- Secure password storage
- Role-based access control
- Input validation and sanitization
- Session management

## 📱 Mobile Responsiveness

The application is fully responsive and provides an optimal viewing experience across various devices:

- Desktop computers
- Tablets
- Smartphones

## 🚀 Production Deployment

For production deployment:

1. Set environment variables for security
2. Use a production-ready database (PostgreSQL, MySQL)
3. Deploy with a production WSGI server (Gunicorn, uWSGI)
4. Use a reverse proxy (Nginx)
5. Implement proper logging and monitoring

## 💡 Key Improvements Over Basic Version

1. **Professional UI/UX**: Booking.com-inspired design
2. **Advanced Search & Filters**: Comprehensive property search options
3. **Analytics Dashboard**: Real-time business intelligence
4. **Reporting System**: Detailed financial and operational reports
5. **Enhanced Booking Flow**: Improved reservation process
6. **Review System**: User feedback and ratings
7. **Admin Controls**: Comprehensive management tools
8. **Performance Optimization**: Efficient data handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.