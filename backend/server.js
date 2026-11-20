
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import ownerRoutes from './routes/ownerRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import { processAppointmentReminders } from './services/notificationService.js';

dotenv.config({ path: new URL('./.env', import.meta.url) });

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy when deployed behind Render
app.set('trust proxy', 1);

// CORS configuration
const allowedOrigins = new Set([
  'https://saloon-maison-aurum.vercel.app',
  'http://localhost:5173',

  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean),

  ...(process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)
]);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    console.error('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },

  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ],

  credentials: true,
  optionsSuccessStatus: 204
};

// CORS must run before other middleware and API routes
app.use(cors(corsOptions));

// Secure HTTP headers
app.use(helmet());

// Parse JSON requests
app.use(express.json({ limit: '1mb' }));

// Rate limiting on authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Maison Aurum Salon API'
  });
});

// API routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode =
    err.status ||
    (err.message === 'Not allowed by CORS' ? 403 : 500);

  if (process.env.NODE_ENV !== 'production') {
    console.error(err.message);
  }

  const safeMessage =
    process.env.NODE_ENV === 'production' && statusCode >= 500
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(statusCode).json({
    message: safeMessage
  });
});

// Start server
async function startServer() {
  await connectDB();

  await processAppointmentReminders().catch((err) => {
    console.error('Initial reminder processing failed:', err.message);
  });

  setInterval(() => {
    processAppointmentReminders().catch((err) => {
      console.error('Reminder processing failed:', err.message);
    });
  }, 15 * 60 * 1000);

  app.listen(PORT, () => {
    console.log(`Maison Aurum API running on port ${PORT}`);
    console.log('Allowed frontend origins:', [...allowedOrigins]);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});