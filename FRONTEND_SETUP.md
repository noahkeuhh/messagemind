# Frontend Setup & Integration

De frontend is nu volledig geïntegreerd met de backend API.

## Environment Variabelen

Maak een `.env` bestand in de root van het project:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://pjijprbtcajlsuuttcti.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_yXD4f-XR7uj4XPVbcqyFSw_GgzRuUwN

# Backend API URL
VITE_API_URL=http://localhost:3001/api
```

Voor productie, gebruik je productie URLs:
```env
VITE_API_URL=https://your-api-domain.com/api
```

## Installatie

```bash
npm install
```

Dit installeert alle dependencies inclusief:
- `@supabase/supabase-js` - Voor authenticatie
- `@tanstack/react-query` - Voor data fetching
- Alle UI componenten

## Start Development Server

```bash
npm run dev
```

De frontend draait op `http://localhost:5173` (of een andere poort als 5173 bezet is).

## Features Geïmplementeerd

### ✅ Authenticatie
- Supabase Auth integratie
- Sign up / Sign in functionaliteit
- Session management
- Auto token refresh

### ✅ Credits Systeem
- Real-time credit meter
- Auto-refresh elke 30 seconden
- Credit updates na acties

### ✅ Analysis Workspace
- Echte API calls naar backend
- Premium upgrade toggle (+30 credits)
- Polling voor analysis results
- Error handling voor insufficient credits
- Image upload support (basis)

### ✅ Purchase Flow
- Stripe Checkout integratie
- Credit pack selectie
- Redirect naar Stripe
- Auto-refresh credits na betaling

### ✅ History Page
- Echte data van backend
- Filtering op status
- Search functionaliteit
- Provider badges (Cohere/OpenAI/Claude)
- Real-time updates

### ✅ Saved Replies
- API integratie voor opslaan
- Toast notifications

## Component Updates

### AnalysisWorkspace
- ✅ Echte API calls
- ✅ Premium upgrade toggle
- ✅ Polling voor results
- ✅ Error handling
- ✅ Credit updates

### CreditMeter
- ✅ Real-time data fetching
- ✅ Auto-refresh
- ✅ Loading states

### BuyCreditsModal
- ✅ Stripe checkout redirect
- ✅ Payment success detection
- ✅ Credit refresh na betaling

### DashboardHeader
- ✅ Echte user data
- ✅ Sign out functionaliteit
- ✅ Credit meter integratie

### History Page
- ✅ Echte API data
- ✅ Status filtering
- ✅ Provider badges
- ✅ Date formatting

## API Integratie

Alle API calls gaan via `src/lib/api.ts`:

```typescript
import { api } from '@/lib/api';

// Get credits
const credits = await api.getCredits();

// Execute action
const result = await api.executeAction({
  action_type: 'short_chat',
  input_text: 'Hey, how are you?',
  use_premium: false,
});

// Get analysis
const analysis = await api.getAnalysis(analysisId);

// Buy pack
const checkout = await api.buyPack('pack_120');
```

## Error Handling

De frontend handelt automatisch af:
- **401 Unauthorized** - Redirect naar login
- **402 Insufficient Credits** - Toont modal
- **429 Rate Limit** - Toont error message
- **500 Server Error** - Toont generic error

## Premium Upgrade

Gebruikers kunnen per request upgraden naar premium AI:
- Toggle in AnalysisWorkspace
- +30 credits extra kosten
- Gebruikt OpenAI GPT-4 ongeacht tier

## Testing

1. **Start backend**: `cd backend && npm run dev`
2. **Start frontend**: `npm run dev`
3. **Sign up** via SignupModal
4. **Test analysis** met verschillende inputs
5. **Test premium upgrade**
6. **Test purchase flow** (gebruik Stripe test mode)

## Troubleshooting

**"Not authenticated" errors:**
- Check of Supabase credentials correct zijn
- Check of user ingelogd is
- Refresh de pagina

**API calls falen:**
- Check of backend draait op `http://localhost:3001`
- Check `VITE_API_URL` in `.env`
- Check browser console voor errors

**Credits niet updaten:**
- Check of credits query correct is
- Check network tab voor API responses
- Refresh pagina

**Stripe checkout werkt niet:**
- Check of Stripe keys correct zijn in backend
- Check of webhook is geconfigureerd
- Gebruik Stripe test mode

## Volgende Stappen

1. Image upload naar storage (Supabase Storage)
2. Real-time updates via Supabase Realtime
3. Push notifications voor analysis completion
4. Advanced filtering in History
5. Analysis detail view
6. Export functionaliteit


