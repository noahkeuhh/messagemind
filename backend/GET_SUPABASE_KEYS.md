# How to Get Your Supabase Keys

## ✅ You Already Have:
- **SUPABASE_URL**: `https://pjijprbtcajlsuuttcti.supabase.co`
- **SUPABASE_ANON_KEY**: `sb_publishable_yXD4f-XR7uj4XPVbcqyFSw_GgzRuUwN`

## ⚠️ You Still Need:

### 1. SUPABASE_SERVICE_KEY (Required!)

This is the **service_role** key that allows the backend to bypass Row Level Security.

**How to get it:**
1. Go to your Supabase project: https://supabase.com/dashboard/project/pjijprbtcajlsuuttcti
2. Click on **Settings** (gear icon) in the left sidebar
3. Click on **API**
4. Scroll down to **Project API keys**
5. Find the **`service_role`** key (it's labeled as "secret" and has a warning)
6. Click the **eye icon** to reveal it
7. Copy the key
8. Paste it in `.env` as `SUPABASE_SERVICE_KEY`

**⚠️ Important:** Never expose this key publicly! It has full database access.

---

## Quick Steps:

1. Open: https://supabase.com/dashboard/project/pjijprbtcajlsuuttcti/settings/api
2. Find "service_role" key
3. Copy it
4. Update `backend/.env`:
   ```
   SUPABASE_SERVICE_KEY=paste_your_service_role_key_here
   ```

---

## After Getting the Service Key:

1. Update `.env` with the service key
2. Run: `npm run setup` to verify everything works
3. Start the server: `npm run dev`


