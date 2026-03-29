import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only initialize if URL is valid, otherwise export a dummy version or null
// Using a placeholder that looks like a URL so createClient doesn't throw, 
// even if it can't actually connect.
const isConfigured = supabaseUrl && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('YOUR_SUPABASE_URL');

export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co', 
  isConfigured ? supabaseAnonKey : 'placeholder-key'
);

