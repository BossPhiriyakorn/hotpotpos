import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool from './config/database.js';

// Routes
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import settingsRoutes from './routes/settings.js';
import authRoutes from './routes/auth.js';
import kitchenRoutes from './routes/kitchen.js';
import queueRoutes from './routes/queue.js';
import reportsRoutes from './routes/reports.js';
import lineRoutes from './routes/line.js';
import branchRoutes from './routes/branches.js';
import userRoutes from './routes/users.js';
import paymentRoutes from './routes/payments.js';
import driveRoutes from './routes/drive.js';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

// Normalize FRONTEND_URL (remove trailing slash) - Must be declared before use
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));
// Increase body size limit to 50MB to support Base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].now,
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
    });
  }
});

// Test database query endpoint
app.get('/api/test', async (req, res) => {
  try {
    const addonsResult = await pool.query('SELECT * FROM addons LIMIT 5');
    const soupsResult = await pool.query('SELECT * FROM soups LIMIT 5');
    const settingsResult = await pool.query('SELECT * FROM settings LIMIT 5');

    res.json({
      success: true,
      data: {
        addons: addonsResult.rows,
        soups: soupsResult.rows,
        settings: settingsResult.rows,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/line', lineRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/drive', driveRoutes);

// Socket.io for real-time updates
io.on('connection', (socket) => {
  socket.on('kitchen:subscribe', () => {
    socket.join('kitchen');
  });

  socket.on('queue:subscribe', () => {
    socket.join('queue');
  });

  socket.on('disconnect', () => {
    // Client disconnected
  });
});

// Export io for use in controllers
export { io };

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🔌 Socket.io enabled for real-time updates`);
});

