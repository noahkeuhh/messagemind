# Frontend Component to API Endpoint Mapping

This document maps the Lovable frontend components to their corresponding backend API endpoints.

## Component: `CreditMeter`

**Location:** `src/components/CreditMeter.tsx`

**API Endpoint:** `GET /api/user/credits`

**Request:**
```typescript
fetch('/api/user/credits', {
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
  },
});
```

**Response:**
```typescript
{
  user_id: string;
  credits_remaining: number;  // Use for `current` prop
  daily_limit: number;        // Use for `max` prop
  last_reset_date: string;
}
```

**Usage:**
```tsx
<CreditMeter 
  current={credits_remaining} 
  max={daily_limit} 
/>
```

---

## Component: `AnalysisWorkspace`

**Location:** `src/components/dashboard/AnalysisWorkspace.tsx`

### Analyze Button (Line 189-205)

**API Endpoint:** `POST /api/user/action`

**Request:**
```typescript
fetch('/api/user/action', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action_type: 'short_chat' | 'long_chat' | 'image_analysis',
    input_text: inputText,  // from textarea
    image_url: imageUrl,     // optional, from upload
  }),
});
```

**Response (Success - 200):**
```typescript
{
  analysis_id: string;
  status: 'queued';
  credits_remaining: number;  // Update credit meter
  message: 'Analysis started';
}
```

**Response (Insufficient Credits - 402):**
```typescript
{
  error: 'insufficient_credits';
  message: 'Not enough credits to perform this action';
  credits_needed: number;
}
```

**Frontend Action:**
- On 200: Show loading state, poll `/api/user/analysis/:id` until `status === 'done'`
- On 402: Show `InsufficientCreditsModal`

### Polling for Results

**API Endpoint:** `GET /api/user/analysis/:id`

**Request:**
```typescript
const pollAnalysis = async (analysisId: string) => {
  const response = await fetch(`/api/user/analysis/${analysisId}`, {
    headers: {
      'Authorization': `Bearer ${supabaseToken}`,
    },
  });
  const analysis = await response.json();
  
  if (analysis.status === 'done') {
    // Use analysis.analysis_result to populate UI
    setResult(analysis.analysis_result);
  } else if (analysis.status === 'failed') {
    // Handle error
  } else {
    // Continue polling
    setTimeout(() => pollAnalysis(analysisId), 2000);
  }
};
```

**Response:**
```typescript
{
  id: string;
  input_text: string;
  image_url: string | null;
  analysis_result: {
    intent: string;
    intentLabel: 'positive' | 'neutral' | 'negative';
    toneScore: number;
    interestLevel: number;
    flags: string[];
    suggested_replies: Array<{
      type: string;
      text: string;
    }>;
    recommended_timing: string;
  };
  credits_used: number;
  status: 'queued' | 'processing' | 'done' | 'failed';
  created_at: string;
}
```

### Save Reply Button (Line 107-117)

**API Endpoint:** `POST /api/user/save_reply`

**Request:**
```typescript
fetch('/api/user/save_reply', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reply_text: reply.text,
    reply_type: reply.type,
    analysis_id: analysisId,  // optional
  }),
});
```

---

## Component: `BuyCreditsModal`

**Location:** `src/components/modals/BuyCreditsModal.tsx`

**API Endpoint:** `POST /api/user/buy_pack`

**Request:**
```typescript
fetch('/api/user/buy_pack', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    pack_id: selectedPack,  // 'pack_50' | 'pack_120' | 'pack_300'
  }),
});
```

**Response:**
```typescript
{
  checkout_url: string;  // Redirect user to this URL
  session_id: string;
}
```

**Frontend Action:**
```typescript
const handlePurchase = async () => {
  const response = await fetch('/api/user/buy_pack', { ... });
  const { checkout_url } = await response.json();
  window.location.href = checkout_url;  // Redirect to Stripe Checkout
};
```

**After Payment:**
- Stripe redirects to `success_url` (configured in backend)
- Frontend should refresh credits: `GET /api/user/credits`

---

## Component: `InsufficientCreditsModal`

**Location:** `src/components/modals/InsufficientCreditsModal.tsx`

**Actions:**
1. **Buy Credits:** Open `BuyCreditsModal` (see above)
2. **Upgrade:** Navigate to `/pricing` page

---

## Page: `History`

**Location:** `src/pages/History.tsx`

**API Endpoint:** `GET /api/user/history`

**Request:**
```typescript
fetch('/api/user/history?limit=20&offset=0', {
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
  },
});
```

**Response:**
```typescript
{
  analyses: Array<{
    id: string;
    input_text: string | null;
    image_url: string | null;
    status: string;
    credits_used: number;
    created_at: string;
    analysis_result: any;  // null if not done
  }>;
  total: number;
}
```

---

## Page: `SavedReplies`

**Location:** `src/pages/SavedReplies.tsx`

**API Endpoint:** `GET /api/user/saved_replies`

**Request:**
```typescript
fetch('/api/user/saved_replies', {
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
  },
});
```

**Response:**
```typescript
{
  replies: Array<{
    id: string;
    reply_text: string;
    reply_type: string | null;
    analysis_id: string | null;
    created_at: string;
  }>;
}
```

---

## Authentication Setup

All endpoints require a Supabase JWT token in the `Authorization` header.

**Getting the token:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// After sign in
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Use in all API calls
headers: {
  'Authorization': `Bearer ${token}`,
}
```

**Token refresh:**
Supabase SDK handles token refresh automatically. Use `supabase.auth.onAuthStateChange()` to update tokens.

---

## Error Handling

### 401 Unauthorized
- Token expired or invalid
- Action: Redirect to login or refresh token

### 402 Payment Required (Insufficient Credits)
- Not enough credits for action
- Action: Show `InsufficientCreditsModal`

### 404 Not Found
- Resource not found
- Action: Show error message

### 500 Internal Server Error
- Server error
- Action: Show generic error, log for debugging

---

## Example Integration

```typescript
// src/lib/api.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Redirect to login
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (response.status === 402) {
    const data = await response.json();
    throw new Error(data.error); // 'insufficient_credits'
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

// Usage
const credits = await apiRequest('/user/credits');
const result = await apiRequest('/user/action', {
  method: 'POST',
  body: JSON.stringify({ action_type: 'short_chat', input_text: '...' }),
});
```



