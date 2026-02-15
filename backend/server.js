
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const pool = require('./connections/db');
const { connectRedis } = require('./connections/redis');
const authRoutes = require('./routes/auth');
const supplyRoutes = require('./routes/supply');
const activityDetailsRoutes = require('./routes/dashboard_routes/activityDetails');
const demandRoutes = require('./routes/demand');
const categoriesRoutes = require('./routes/categories');
const requestsRoutes = require('./routes/requests');
const roomsRoutes = require('./routes/rooms');
const dealsRoutes = require('./routes/deals');
const notificationsRoutes = require('./routes/notifications');
const matchesRoutes = require('./routes/matches');
const authenticateToken = require('./middleware/authenticateToken');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    return res.status(503).json({ status: 'error', message: err.message });
  }
});

// auth routes (public)
app.use('/api/auth', authRoutes);

// FR-30: Public deal verification (no auth needed for QR scanning)
app.get('/api/deals/verify/:token', dealsRoutes);

// protected route guard
// all routes registered after this line require a valid JWT.
// add future protected routes below this middleware.
app.use('/api', authenticateToken);
app.use('/api/supply', supplyRoutes);
app.use('/api/demand', demandRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/activity-details', activityDetailsRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/matches', matchesRoutes);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// start server
async function start() {
  try {
    // verify mysql connection
    await pool.query('SELECT 1');
    console.log('[MySQL] Connected');

    // connect redis
    await connectRedis();
    console.log('[Redis] Ready');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] Listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

start();
