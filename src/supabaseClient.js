import { createClient } from '@supabase/supabase-js';

// Hardcoded for tonight so we can bypass the Vite .env bug.
// IMPORTANT: Do not commit this specific file to the tranished-mase repo yet!
const supabaseUrl = 'https://ggpbiyxukmolsbvtquzj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdncGJpeXh1a21vbHNidnRxdXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTM0NzksImV4cCI6MjEwNDg4OTQ3OX0.crWa3Hf9tVhclXDZjcKjnhU8-ND_f8rnt9dQuZ8k24E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);