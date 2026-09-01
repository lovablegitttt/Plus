import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log('✅ Supabase client initialized with URL:', url);
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseClient;
}

export function getSupabaseSQLSetup(): string {
  return `-- ==========================================
-- PAYPLUS SUPABASE DATABASE SCHEMA
-- For Admin @paulallens
-- ==========================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  balance NUMERIC DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  ads_watched INTEGER DEFAULT 0,
  ads_watched_today INTEGER DEFAULT 0,
  last_ad_date TEXT,
  channel_unlocked BOOLEAN DEFAULT FALSE,
  channel_approved BOOLEAN DEFAULT FALSE,
  channel_joined BOOLEAN DEFAULT FALSE,
  channel_unlocked_at TIMESTAMPTZ,
  invited_by TEXT,
  friends_invited INTEGER DEFAULT 0,
  earned_from_invites NUMERIC DEFAULT 0,
  tasks_completed JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE
);

-- 2. Create Ads Log Table
CREATE TABLE IF NOT EXISTS public.ads_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  reward NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  username TEXT,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for super-fast queries
CREATE INDEX IF NOT EXISTS idx_users_ads_watched ON public.users(ads_watched);
CREATE INDEX IF NOT EXISTS idx_users_channel_unlocked ON public.users(channel_unlocked);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
`;
}
