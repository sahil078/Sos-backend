# Employee SOS Application - Backend Server

Express.js backend with Supabase PostgreSQL database for the Employee SOS Application.

## 📋 Features

- ✅ User Authentication (Register, Login, Email Verification)
- ✅ JWT-based Authentication
- ✅ User Profile Management
- ✅ SOS Alert System with GPS Location Tracking
- ✅ Reverse Geocoding (Coordinates to Address)
- ✅ Emergency Contact Management
- ✅ Admin Dashboard API
- ✅ Notifications System
- ✅ Role-based Access Control (Employee/Admin)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Set Up Supabase

1. Create a project at [https://supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL to create all tables
5. Go to **Settings** → **API** to get your credentials:
   - Project URL (SUPABASE_URL)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY)
   - anon key (SUPABASE_ANON_KEY)

### 3. Configure Environment

```bash
cp env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
PORT=4000
JWT_SECRET=your-strong-random-secret-key
JWT_EXPIRES=7d
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

NODE_ENV=development
```

### 4. Run the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on `http://localhost:4000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify-email/:token` - Verify email address
- `POST /api/auth/resend-verification` - Resend verification email

### Profile
- `GET /api/profile` - Get user profile (auth required)
- `PUT /api/profile` - Update profile (auth required)

### SOS Alerts
- `POST /api/sos/start` - Start SOS alert with location (auth required)
- `POST /api/sos/cancel` - Cancel active SOS (auth required)
- `GET /api/sos/active` - Get active SOS alert (auth required)

### Notifications
- `GET /api/notifications` - Get all notifications (auth required)
- `POST /api/notifications/:id/read` - Mark notification as read (auth required)

### Admin (Admin role required)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/sos-alerts` - Get all SOS alerts (with filters)
- `GET /api/admin/sos-alerts/:id` - Get alert details
- `POST /api/admin/sos-alerts/:id/resolve` - Resolve alert
- `GET /api/admin/emergency-contacts` - Get all emergency contacts
- `POST /api/admin/emergency-contacts` - Create emergency contact
- `PUT /api/admin/emergency-contacts/:id` - Update emergency contact
- `DELETE /api/admin/emergency-contacts/:id` - Delete emergency contact
- `GET /api/admin/stats` - Get dashboard statistics

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Tokens are issued on login and expire after 7 days (configurable via `JWT_EXPIRES`).

## 👤 Creating an Admin User

After registering a user through the app:

1. Go to Supabase dashboard → **Table Editor** → **users**
2. Find your user
3. Change the `role` field from `employee` to `admin`
4. Save

Now you can access the admin dashboard!

## 🗄️ Database Schema

The database includes:
- **users** - Employee accounts
- **emergency_contacts** - Contacts to notify during SOS
- **sos_alerts** - All SOS alert records
- **notifications** - User notifications
- **sos_alert_recipients** - Tracks who was notified

See `supabase-schema.sql` for full schema.

## 📧 Email Configuration

In development, verification emails are logged to the console. For production:

1. Configure an email service (SendGrid, AWS SES, Nodemailer, etc.)
2. Update `src/utils/email.js` with your email service configuration
3. Set `NODE_ENV=production` in your `.env` file

## 🗺️ Location Services

The backend uses OpenStreetMap for reverse geocoding (converting GPS coordinates to addresses). This is free and doesn't require an API key.

## 🔒 Security Notes

- Never commit your `.env` file
- Use a strong, random `JWT_SECRET` in production
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret (it bypasses Row Level Security)
- Use HTTPS in production
- Regularly rotate API keys

## 🐛 Troubleshooting

### "Supabase credentials not found"
- Check that `.env` file exists in `server/` directory
- Verify all Supabase variables are set correctly

### "relation does not exist"
- Make sure you ran `supabase-schema.sql` in Supabase SQL Editor
- Check that tables exist in Supabase Table Editor

### "Invalid or expired token"
- Token may have expired (default: 7 days)
- User may have been deleted from database
- Check JWT_SECRET matches between server restarts

### CORS errors
- Add your frontend URL to `CORS_ORIGIN` in `.env`
- Restart server after changing CORS settings

## 📝 Project Structure

```
server/
├── index.js                 # Server entry point
├── src/
│   ├── app.js              # Express app configuration
│   ├── routes/             # API route handlers
│   │   ├── auth.js         # Authentication routes
│   │   ├── profile.js      # Profile routes
│   │   ├── sos.js          # SOS alert routes
│   │   ├── notifications.js # Notification routes
│   │   └── admin.js        # Admin routes
│   ├── middleware/         # Express middleware
│   │   └── auth.js         # Authentication middleware
│   └── utils/              # Utility functions
│       ├── supabase.js     # Supabase client
│       ├── password.js     # Password hashing
│       └── email.js        # Email utilities
├── supabase-schema.sql     # Database schema
├── package.json
├── env.example             # Environment variables template
└── README.md               # This file
```

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure real email service
4. Set up proper CORS origins
5. Use environment variables (never hardcode secrets)
6. Consider using a process manager like PM2
7. Set up SSL/HTTPS

## 📞 Support

For issues or questions, check the main project README or create an issue in the repository.

# Sos-backend
