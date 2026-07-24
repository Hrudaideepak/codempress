/**
 * Supabase client singleton & database helper functions for Codempress.
 *
 * Expects VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the environment.
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
 * Return a singleton Supabase client instance.
 */
export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return _client;
}

/** Convenience re-export. */
export const supabase = getSupabase();

/**
 * Helper: Fetch all topics from Supabase catalog.
 */
export async function fetchTopicsFromSupabase() {
  const client = getSupabase();
  if (!client) return { data: null, error: new Error("Supabase client unconfigured") };
  return await client
    .from("topics")
    .select("*")
    .order("subject_name", { ascending: true })
    .order("_id", { ascending: true });
}

/**
 * Helper: Fetch questions for a specific topic ID.
 */
export async function fetchQuestionsFromSupabase(topicId: number) {
  const client = getSupabase();
  if (!client) return { data: null, error: new Error("Supabase client unconfigured") };
  return await client
    .from("questions")
    .select("*")
    .eq("topic_id", topicId);
}

/**
 * Helper: Fetch user progress from Supabase.
 */
export async function fetchUserProgressFromSupabase(userId: number) {
  const client = getSupabase();
  if (!client) return { data: null, error: new Error("Supabase client unconfigured") };
  return await client
    .from("user_progress")
    .select("*, topics(*)")
    .eq("user_id", userId);
}

/**
 * Helper: Save quiz attempt directly to Supabase.
 */
export async function saveQuizAttemptToSupabase(
  userId: number,
  topicId: number,
  scorePercent: number,
  xpEarned: number
) {
  const client = getSupabase();
  if (!client) return { data: null, error: new Error("Supabase client unconfigured") };
  return await client
    .from("quiz_attempts")
    .insert([
      {
        user_id: userId,
        topic_id: topicId,
        score_percent: scorePercent,
        xp_earned: xpEarned,
      },
    ]);
}
