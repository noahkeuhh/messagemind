# Quick Start Guide

Get the AI Flirt Studio backend up and running in 5 minutes.

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Environment

Create `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_API_KEY=your_secure_key_here
PORT=3001
NODE_ENV=development
```

## Step 3: Setup Database

1. Go to your Supabase project → SQL Editor
2. Run `src/db/schema.sql` (creates all tables)
3. Run `src/db/triggers.sql` (creates user signup trigger)

## Step 4: Verify Setup

```bash
npm run setup
```

This checks:
- ✅ Configuration
- ✅ Database connection
- ✅ Tables exist
- ✅ Credit packs configured

## Step 5: Start Server

```bash
npm run dev
```

Server runs on `http://localhost:3001`

## Step 6: Test API

```bash
# Health check
curl http://localhost:3001/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

## Step 7: Import Postman Collection

1. Open Postman
2. Import `postman-collection.json`
3. Set variables:
   - `baseUrl`: `http://localhost:3001/api`
   - `authToken`: Your Supabase JWT token
   - `adminApiKey`: Your admin API key

## Step 8: Configure Stripe Webhook (Optional)

For local testing:
```bash
stripe listen --forward-to localhost:3001/api/webhook/stripe
```

For production:
1. Add webhook in Stripe Dashboard
2. URL: `https://your-api.com/api/webhook/stripe`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`, etc.

## Next Steps

- ✅ Read [README.md](./README.md) for full documentation
- ✅ Check [FRONTEND_MAPPING.md](./FRONTEND_MAPPING.md) for frontend integration
- ✅ Review [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment

## Troubleshooting

**"Missing Supabase configuration"**
→ Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`

**"Table 'users' missing"**
→ Run `src/db/schema.sql` in Supabase SQL Editor

**"Cannot connect to Supabase"**
→ Check your Supabase URL and service key
→ Verify network connectivity

**Port already in use**
→ Change `PORT` in `.env` or stop other service on port 3001

## Need Help?

- Check the main [README.md](./README.md)
- Review error messages in console
- Verify all environment variables are set
- Ensure database schema is applied



