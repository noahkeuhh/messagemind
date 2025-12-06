# Deployment Guide

This guide covers deploying the AI Flirt Studio backend to various platforms.

## Prerequisites

- All environment variables configured
- Supabase database schema and triggers applied
- Stripe webhook endpoint configured
- Domain name (for production)

## Environment Variables Checklist

Ensure these are set in your deployment platform:

```env
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_ANON_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PUBLISHABLE_KEY=

# Optional: AI
AI_SERVICE_KEY=
AI_SERVICE_URL=
AI_MODEL=

# App
PORT=3001
NODE_ENV=production
CURRENCY=EUR
CREDIT_TOKEN_RATIO=20

# Admin
ADMIN_API_KEY=

# Cron
DAILY_RESET_TIME=00:00
DAILY_RESET_TIMEZONE=Europe/Amsterdam

# Frontend (for CORS)
FRONTEND_URL=https://your-frontend-domain.com
```

## Deployment Options

### 1. Vercel

**Setup:**

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

3. Deploy:
```bash
vercel --prod
```

4. Set environment variables in Vercel dashboard

**Note:** Vercel serverless functions have execution time limits. For cron jobs, use Vercel Cron or external service.

### 2. Railway

**Setup:**

1. Connect GitHub repository to Railway
2. Railway auto-detects Node.js
3. Set environment variables in Railway dashboard
4. Deploy automatically on push

**Cron Jobs:** Use Railway Cron or external service (see below)

### 3. Render

**Setup:**

1. Create new Web Service
2. Connect repository
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Set environment variables

**Cron Jobs:** Use Render Cron Jobs or external service

### 4. DigitalOcean App Platform

**Setup:**

1. Create new App
2. Connect GitHub repository
3. Configure:
   - Build command: `npm install && npm run build`
   - Run command: `npm start`
4. Set environment variables

### 5. Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      # Add other env vars or use .env file
    env_file:
      - .env
    restart: unless-stopped
```

**Deploy:**
```bash
docker-compose up -d
```

### 6. AWS (EC2 / ECS / Lambda)

**EC2:**
1. Launch EC2 instance (Ubuntu)
2. Install Node.js 18+
3. Clone repository
4. Set environment variables
5. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start dist/index.js --name api
pm2 save
pm2 startup
```

**ECS:**
- Use Docker image (see above)
- Configure task definition with environment variables
- Set up Application Load Balancer

**Lambda:**
- Requires serverless framework or AWS SAM
- Note: Cron jobs need EventBridge

## Cron Jobs / Scheduled Tasks

The daily credit reset needs to run on a schedule. Options:

### Option 1: External Cron Service

Use services like:
- **Cron-job.org** (free tier available)
- **EasyCron**
- **Uptime Robot** (with monitoring)

**Setup:**
1. Create HTTP endpoint for manual reset (add to routes):
```typescript
// In routes/index.ts
router.post('/admin/reset-credits', requireAdmin, async (req, res) => {
  await runDailyResetNow();
  res.json({ success: true });
});
```

2. Configure cron service to call: `POST https://your-api.com/api/admin/reset-credits` with admin API key

### Option 2: Vercel Cron

Add `vercel.json` cron config:
```json
{
  "crons": [{
    "path": "/api/admin/reset-credits",
    "schedule": "0 0 * * *"
  }]
}
```

### Option 3: AWS EventBridge / CloudWatch Events

Create scheduled rule to trigger Lambda or call API endpoint.

### Option 4: Keep Server Running

If using EC2/Docker with persistent server, the built-in cron job will work automatically.

## Stripe Webhook Setup

1. **Get webhook URL:**
   - Production: `https://your-api-domain.com/api/webhook/stripe`
   - Development: Use Stripe CLI for local testing

2. **Configure in Stripe Dashboard:**
   - Go to Developers → Webhooks
   - Add endpoint URL
   - Select events:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

3. **Copy webhook secret** to `STRIPE_WEBHOOK_SECRET`

4. **Test webhook:**
   - Use Stripe CLI: `stripe listen --forward-to localhost:3001/api/webhook/stripe`
   - Or use test events in Stripe dashboard

## Database Migration

1. **Run schema:**
   - Go to Supabase SQL Editor
   - Run `src/db/schema.sql`
   - Run `src/db/triggers.sql`

2. **Verify tables:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

3. **Seed credit packs:**
   - Should be auto-inserted by schema
   - Verify: `SELECT * FROM credit_packs;`

## Health Checks

Add health check endpoint (already included):
- `GET /api/health`

Configure in your deployment platform to monitor:
- Response time
- Status code 200
- Automatic restart on failure

## Monitoring & Logging

### Recommended Tools

1. **Sentry** - Error tracking
2. **LogRocket** - Session replay
3. **Datadog** - APM and metrics
4. **Supabase Logs** - Database monitoring

### Logging Setup

The application logs to console. For production:
- Use structured logging (Winston, Pino)
- Send logs to centralized service
- Set up alerts for errors

## Security Checklist

- [ ] All environment variables set and secure
- [ ] `ADMIN_API_KEY` is strong and unique
- [ ] CORS configured for frontend domain only
- [ ] Stripe webhook secret verified
- [ ] Supabase RLS policies enabled
- [ ] Rate limiting configured (if needed)
- [ ] HTTPS enabled
- [ ] Database backups configured

## Post-Deployment

1. **Test endpoints:**
   - Health check: `GET /api/health`
   - Test with Postman collection

2. **Verify webhooks:**
   - Make test purchase
   - Check Stripe dashboard for webhook delivery
   - Verify credits added to user

3. **Monitor:**
   - Check logs for errors
   - Monitor credit resets
   - Track API response times

4. **Update frontend:**
   - Set `VITE_API_URL` to production API URL
   - Test full flow: signup → action → purchase

## Troubleshooting

**Webhook not receiving events:**
- Check webhook URL is correct
- Verify webhook secret
- Check server logs for errors
- Test with Stripe CLI locally

**Credits not resetting:**
- Verify cron job is running
- Check timezone configuration
- Manually trigger reset endpoint
- Check server logs

**Database connection errors:**
- Verify Supabase URL and keys
- Check network connectivity
- Verify RLS policies

**CORS errors:**
- Check `FRONTEND_URL` environment variable
- Verify CORS middleware configuration
- Check browser console for specific errors

## Scaling Considerations

- **Database:** Supabase handles scaling automatically
- **API:** Use load balancer for multiple instances
- **Cron Jobs:** Use external service or queue system
- **Rate Limiting:** Add middleware for production
- **Caching:** Consider Redis for frequently accessed data

## Backup & Recovery

- **Database:** Supabase automatic backups
- **Code:** Git repository
- **Environment:** Store securely (1Password, AWS Secrets Manager)
- **Stripe:** Automatic transaction history

## Support

For issues:
1. Check logs
2. Review error messages
3. Test with Postman collection
4. Verify environment variables
5. Check Supabase and Stripe dashboards


