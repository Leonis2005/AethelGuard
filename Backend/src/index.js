require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crmRouter = require('./routes/crm');
const authRouter = require('./routes/auth');
const { createRateLimiter } = require('./lib/security');
const {
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
} = require('./config/database');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many requests from this IP.',
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts from this IP.',
});

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);

app.get('/health', async (_req, res) => {
  try {
    const db = await checkDatabaseHealth();
    res.json({ status: 'ok', service: 'AethelGuard API', ...db });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      service: 'AethelGuard API',
      database: 'unavailable',
      message: 'Service temporarily unavailable',
    });
  }
});

app.use('/api/auth', authRouter);
app.use('/api', crmRouter);

app.use((err, _req, res, _next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

async function startServer() {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.log(`AethelGuard API running on port ${PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
