// lib/supabaseAdmin.ts

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("SUPABASE_URL missing");
  }

  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "x-hi5-backend": "hi5qr-v2",
      },
    },
  });
}