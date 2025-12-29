import { Router } from 'express';
import userRoutes from './user.routes.js';
import stripeRoutes from './stripe.routes.js';
import subscriptionRoutes from './subscription.routes.js';
import adminRoutes from './admin.routes.js';
import testRoutes from './test.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/webhook', stripeRoutes);
router.use('/user', subscriptionRoutes);
router.use('/admin', adminRoutes);
router.use('/test', testRoutes);

export default router;


