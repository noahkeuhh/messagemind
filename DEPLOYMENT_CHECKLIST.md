## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment Verification

**Configuration:**
- [ ] `.env` file has all required AI provider keys (GROQ_API_KEY, OPENAI_API_KEY)
- [ ] Stripe API keys configured (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY)
- [ ] Supabase keys configured (SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY)
- [ ] DAILY_RESET_TIME set correctly (default: 00:00:00)
- [ ] DAILY_RESET_TIMEZONE set correctly (default: Europe/Amsterdam)

**Stripe Prices Created:**
- [ ] Free: $0 (or Stripe product ID set to environment)
- [ ] Pro: $17/month (STRIPE_PRICE_PRO_MONTH=price_xxx)
- [ ] Plus: $29/month (STRIPE_PRICE_PLUS_MONTH=price_xxx)
- [ ] Max: $59/month (STRIPE_PRICE_MAX_MONTH=price_xxx)

**Database:**
- [ ] Run all migrations: `npm run migrate`
- [ ] Schema includes: users, analyses, credits_transactions
- [ ] Indexes created on user_id, created_at for performance

### Build Steps

```bash
# Backend
cd backend
npm install
npm run build

# Frontend
cd ../
npm install
npm run build
```

### Testing (Optional but Recommended)

```bash
# Run integration tests
npm run test:pricing

# Manual testing checklist:
- [ ] Free tier: Create account, 1 snapshot works, then blocked
- [ ] Pro: Can do snapshot + expanded with proper credits deduction
- [ ] Plus: Can do all modes including images
- [ ] Max: Can use deep mode
- [ ] Credits deduct before AI call (check backend logs)
- [ ] API returns: provider_used, model_used, mode_used, credits_remaining
- [ ] UI displays all required info
- [ ] No mock data in responses
```

### Deployment

```bash
# Deploy to your platform (Vercel, Railway, etc.)
# For example, with Vercel:
vercel --prod

# Or with Railway:
railway deploy
```

### Post-Deployment

**Monitoring (First 24 Hours):**
- [ ] Monitor backend logs for errors
- [ ] Check for failed analyses
- [ ] Verify credit deductions are correct
- [ ] Monitor API response times
- [ ] Check daily credit reset happens at correct time

**Smoke Tests:**
- [ ] Sign up as new user → should be Free tier
- [ ] Submit Free tier analysis → should succeed once then fail
- [ ] Subscribe to Pro → should have 100 daily credits
- [ ] Submit Pro analysis → credits should deduct correctly
- [ ] Check analysis history shows correct model/mode used

**Customer Communication:**
- [ ] Notify users of new pricing tiers
- [ ] Explain tier features and pricing
- [ ] Point to FAQ for common questions

### Rollback Plan

If critical issues occur:

```bash
# Revert to previous deployment
vercel rollback

# Or redeploy previous version
git revert <commit>
git push
vercel --prod
```

**Fallback Options:**
- Groq API failing? System will throw clear error (no fallback)
- OpenAI API failing? System will throw clear error (no fallback)
- Daily reset job missing? Run manually: `npm run job:daily-reset`

### Success Criteria

✅ All tiers have correct pricing
✅ All tiers have correct daily credit limits
✅ All credit cost rules applied correctly
✅ All model routing works for each tier
✅ All JSON responses validated
✅ UI displays model, mode, credits
✅ No mock data in production
✅ Atomic credit deduction working
✅ Daily reset happening on schedule
✅ Users can't exceed tier limits

---

## Quick Reference: Tier Limits

| Tier  | Price    | Credits/Day | Modes                    | Model                  |
|-------|----------|-------------|--------------------------|------------------------|
| Free  | €0       | 1 total     | snapshot only            | Groq llama3-8b         |
| Pro   | €17/mo   | 100         | snapshot, expanded       | GPT-4o-mini            |
| Plus  | €29/mo   | 180         | snapshot, expanded, img  | GPT-4o-mini            |
| Max   | €59/mo   | 300         | snapshot, expanded, deep | GPT-4o(-mini)          |

## Credit Costs

| Type              | Cost  |
|-------------------|-------|
| Short text (≤200) | 5     |
| Long text (>200)  | 12    |
| Image             | 30    |
| Deep multiplier   | 1.2x  |

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Status:** _______________
