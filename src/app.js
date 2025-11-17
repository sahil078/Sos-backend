const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Load env from server/.env (relative) and also allow default .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config();

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const notificationsRoutes = require('./routes/notifications');
const sosRoutes = require('./routes/sos');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(express.json());

// Robust CORS: support comma-separated origins in CORS_ORIGIN, fallback to common dev origins
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
const rawOrigins = (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : defaultOrigins).map((s) => s.trim());
const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (rawOrigins.includes('*') || rawOrigins.includes(origin)) return callback(null, true);
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sos-backend' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/admin', adminRoutes);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

module.exports = app;

