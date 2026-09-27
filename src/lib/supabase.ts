import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://rnvlwsirdspnttztnyoc.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_nvETGa1c5MnRWnivq8oxHg_dMUVfz8n';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
