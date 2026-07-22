/**
 * Supabase client singleton.
 *
 * Expects VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the environment.
 * Import the `supabase` instance directly wherever needed.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[supabaseClient] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. " +
    "Add them to your .env file."
  );
}

let _client: SupabaseClient | null = null;

/**
 * Return a singleton Supabase client.
 *
 * Usage:
 *   import { supabase } from "./services/supabaseClient";
 *   const { data } = await supabase.from("profiles").select("*");
 */
export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

/** Convenience re-export. */
export const supabase = getSupabase();
