// Supabase configuration
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_w7pyTtGMwt-PmGFmb4JIVQ_94EWsQ98';

// Initialize the Supabase client
if (SUPABASE_URL.includes('your-project-id')) {
    console.warn('Supabase URL is not configured. Please update config.js with your project credentials.');
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make it globally accessible
window.supabase = supabaseClient;
