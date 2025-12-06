import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { startDailyResetJob } from './jobs/daily-reset.job.js';

const app = express();

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:8080',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://[::1]:8080',
    'http://[::1]:5173',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
}));

// Stripe webhook needs raw body - must be before json middleware
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));

// JSON middleware for all other routes
app.use(express.json());

// Routes
app.use('/api', routes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.app.nodeEnv === 'development' ? err.message : undefined,
  });
});

// Start server
const PORT = config.app.port;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.app.nodeEnv}`);
  console.log(`🔗 API available at http://localhost:${PORT}/api`);
});

// Start daily reset cron job
if (config.app.nodeEnv !== 'test') {
  startDailyResetJob();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

