# AI Flirt Studio - Backend API

Complete backend implementation for the AI Flirt Translator with:
- **Credits & Subscription Engine** - Daily resets, atomic deductions, purchase flows
- **AI Provider Routing** - Cohere (Pro), OpenAI GPT-4 (Max), Claude (VIP)
- **Premium Upgrades** - Single-request upgrade to premium AI
- **Stripe Integration** - Checkout, webhooks, subscriptions
- **Rate Limiting & Idempotency** - Protection against abuse and duplicate requests

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Stripe account (for payments)

### Installation

```bash
cd backend
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env` (or create `.env` manually)
2. Fill in your credentials:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# AI Providers (at least one required for real AI, otherwise uses mock mode)
COHERE_API_KEY=your_cohere_key
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# Legacy AI Service (optional, for backward compatibility)
AI_SERVICE_KEY=sk-...
AI_SERVICE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4-turbo-preview

# Application
PORT=3001
NODE_ENV=development
CURRENCY=EUR
CREDIT_TOKEN_RATIO=20

# Auto refund on AI failure (optional)
AUTO_REFUND_ON_FAIL=false

# Rate limiting (optional)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10

# Admin
ADMIN_API_KEY=your_secure_admin_key

# Cron
DAILY_RESET_TIME=00:00
DAILY_RESET_TIMEZONE=Europe/Amsterdam
```

### Database Setup

1. Go to your Supabase project SQL Editor
2. Run `src/db/schema.sql` to create all tables
3. Run `src/db/triggers.sql` to set up user signup triggers

### Running the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

The API will be available at `http://localhost:3001/api`

## 📚 API Endpoints

### User Endpoints

All user endpoints require authentication via `Authorization: Bearer <token>` header.

#### `GET /api/user/credits`
Get current user's credit balance and limits.

**Response:**
```json
{
  "user_id": "uuid",
  "credits_remaining": 100,
  "daily_limit": 100,
  "last_reset_date": "2024-01-01T00:00:00Z"
}
```

#### `POST /api/user/action`
Execute an analysis action (consumes credits). Uses AI provider based on subscription tier, or premium upgrade.

**Request:**
```json
{
  "action_type": "short_chat" | "long_chat" | "image_analysis",
  "input_text": "Her message text...",
  "image_url": "https://...", // optional
  "use_premium": false // optional: upgrade to premium AI (+30 credits)
}
```

**AI Provider Routing:**
- **Pro/Free:** Cohere Command R (fast, concise)
- **Max:** OpenAI GPT-4 (deep analysis)
- **VIP:** Claude (psychological depth)
- **Premium upgrade:** Forces OpenAI GPT-4 regardless of tier (+30 credits)

**Costs:**
- `short_chat`: 5 credits (35 with premium)
- `long_chat`: 20 credits (50 with premium)
- `image_analysis`: 50 credits (80 with premium)

**Response:**
```json
{
  "analysis_id": "uuid",
  "status": "queued",
  "credits_remaining": 95,
  "message": "Analysis started"
}
```

**Error (402):** Insufficient credits
```json
{
  "error": "insufficient_credits",
  "message": "Not enough credits to perform this action",
  "credits_needed": 5
}
```

#### `POST /api/user/buy_pack`
Purchase a credit pack via Stripe Checkout.

**Request:**
```json
{
  "pack_id": "pack_50" | "pack_120" | "pack_300"
}
```

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/...",
  "session_id": "cs_..."
}
```

#### `POST /api/user/buy_quick_pack`
Quick purchase with immediate payment intent.

**Request:** Same as `buy_pack`

**Response:**
```json
{
  "client_secret": "pi_...",
  "payment_intent_id": "pi_..."
}
```

#### `GET /api/user/history`
Get analysis history.

**Query params:**
- `limit` (default: 20)
- `offset` (default: 0)

**Response:**
```json
{
  "analyses": [...],
  "total": 10
}
```

#### `GET /api/user/analysis/:id`
Get specific analysis details.

#### `POST /api/user/save_reply`
Save a suggested reply.

**Request:**
```json
{
  "reply_text": "Your reply...",
  "reply_type": "Direct", // optional
  "analysis_id": "uuid" // optional
}
```

#### `GET /api/user/saved_replies`
Get all saved replies.

### Subscription Endpoints

#### `POST /api/user/subscribe`
Create a subscription.

**Request:**
```json
{
  "tier": "pro" | "max" | "vip",
  "interval": "month" | "year"
}
```

**Note:** Requires Stripe price IDs configured in environment:
- `STRIPE_PRICE_PRO_MONTH`
- `STRIPE_PRICE_PRO_YEAR`
- etc.

#### `POST /api/user/cancel_subscription`
Cancel active subscription.

**Request:**
```json
{
  "immediate": true // optional, defaults to false (cancel at period end)
}
```

### Stripe Webhook

#### `POST /api/webhook/stripe`
Handles Stripe webhook events:
- `checkout.session.completed`
- `payment_intent.succeeded`
- `invoice.paid`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Setup:**
1. In Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhook/stripe`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`, `invoice.*`, `customer.subscription.*`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### Admin Endpoints

All admin endpoints require `x-admin-api-key` header.

#### `GET /api/admin/metrics`
Get aggregated metrics.

**Query params:**
- `date_from` (default: 30 days ago)
- `date_to` (default: today)

#### `GET /api/admin/users`
List all users (paginated).

#### `POST /api/admin/adjust_credits`
Manually adjust user credits.

**Request:**
```json
{
  "user_id": "uuid",
  "amount": 100, // can be negative
  "reason": "Promotional bonus"
}
```

## 🔄 Daily Credit Reset

The system automatically resets credits daily at the configured time (default: 00:00 Amsterdam time).

**Manual reset:**
```typescript
import { runDailyResetNow } from './jobs/daily-reset.job.js';
await runDailyResetNow();
```

**Cron configuration:**
- Set `DAILY_RESET_TIME` (format: "HH:MM")
- Set `DAILY_RESET_TIMEZONE` (e.g., "Europe/Amsterdam")

## 🤖 AI Integration

The AI service supports multiple providers with intelligent routing:

### Providers
- **Cohere Command R** - Fast, concise advice (Pro/Free tier)
- **OpenAI GPT-4** - Deep analysis with nuance (Max tier, premium upgrade)
- **Claude** - Psychological depth (VIP tier)

### Features
- **Automatic routing** based on subscription tier
- **Premium upgrade** option for single requests (+30 credits)
- **Mock mode** when providers not configured (for development)
- **Prompt templates** tailored per provider and action type
- **Token tracking** per provider in admin metrics

**Configuration:**
Set `COHERE_API_KEY`, `OPENAI_API_KEY`, and/or `CLAUDE_API_KEY` in `.env`

See [AI_ROUTING_GUIDE.md](./AI_ROUTING_GUIDE.md) for detailed documentation.

## 🔒 Security

- All user endpoints require JWT authentication
- Admin endpoints require API key
- Row Level Security (RLS) enabled in Supabase
- Webhook signature verification for Stripe
- **Atomic credit operations** prevent race conditions
- **Rate limiting** per user (configurable)
- **Idempotency keys** prevent duplicate requests
- **Concurrent request protection** with optimistic locking

## 📊 Database Schema

See `src/db/schema.sql` for complete schema.

**Key tables:**
- `users` - User accounts and credits
- `credits_transactions` - All credit movements
- `analyses` - Analysis history
- `saved_replies` - Saved suggested replies
- `credit_packs` - Available credit packs
- `admin_metrics` - Daily aggregated metrics
- `stripe_webhook_events` - Webhook idempotency

## 🧪 Testing

```bash
npm run test
```

**Test Endpoints** (development only):
- `GET /api/test/mock-analysis` - Test AI without using credits
- `GET /api/test/providers` - Test all AI providers
- `POST /api/test/concurrent-actions` - Test atomic credit operations

**Note:** Tests require valid auth tokens. Set `TEST_AUTH_TOKEN` and `TEST_USER_ID` in environment.

## 📦 Deployment

### Vercel / Netlify Functions

1. Build: `npm run build`
2. Set environment variables
3. Deploy `dist/` folder

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]
```

### Environment Variables

Ensure all required environment variables are set in your deployment platform.

## 🔗 Frontend Integration

The frontend should:

1. **Authenticate:** Get JWT token from Supabase Auth
2. **Include token:** Add `Authorization: Bearer <token>` to all requests
3. **Handle errors:** Check for `402` (insufficient credits) and `401` (unauthorized)

**Example:**
```typescript
const response = await fetch('/api/user/credits', {
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
  },
});
```

## 📝 Frontend Component Mapping

| Frontend Component | Endpoint | Method |
|-------------------|----------|--------|
| `CreditMeter` | `/api/user/credits` | GET |
| `AnalysisWorkspace` (Analyze button) | `/api/user/action` | POST |
| `BuyCreditsModal` | `/api/user/buy_pack` | POST |
| `History` page | `/api/user/history` | GET |
| Save reply button | `/api/user/save_reply` | POST |
| Saved replies | `/api/user/saved_replies` | GET |

## 🐛 Troubleshooting

**Credits not resetting:**
- Check cron job is running
- Verify `DAILY_RESET_TIME` and timezone
- Check server logs

**Stripe webhook not working:**
- Verify webhook secret
- Check endpoint URL in Stripe dashboard
- Ensure raw body is used (not JSON parsed)

**Authentication failing:**
- Verify Supabase keys
- Check token expiration
- Ensure `Authorization` header format is correct

## 📄 License

MIT


