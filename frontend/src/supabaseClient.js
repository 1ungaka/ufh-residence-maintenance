import { createClient } from '@supabase/supabase-js';

/**
 * Supabase connection.
 *
 * Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env to point
 * at a different project (copy .env.example). Without a .env file the app uses
 * the team's shared project below, so a fresh clone runs with no setup.
 *
 * The anon key is designed to be public: it only allows what the database's
 * row-level security policies allow. Never put the service_role key here.
 */
const SHARED_PROJECT_URL = 'https://ggpbiyxukmolsbvtquzj.supabase.co';
const SHARED_PROJECT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncGJpeXh1a21vbHNidnRxdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTM0NzksImV4cCI6MjEwNDg4OTQ3OX0.crWa3Hf9tVhclXDZjcKjnhU8-ND_f8rnt9dQuZ8k24E';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SHARED_PROJECT_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SHARED_PROJECT_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
