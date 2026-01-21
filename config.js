// Supabase configuration
const SUPABASE_URL = 'https://vvuorwxkestuzfpbnxxf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2dW9yd3hrZXN0dXpmcGJueHhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDU1MjIsImV4cCI6MjA4NDU4MTUyMn0.ld2waAqEnLyMoeXnrbEgo_I_WCw0tfmQuUDNGvS4XEQ';

// Initialize the Supabase client
console.log('Initializing Supabase with URL:', SUPABASE_URL);

if (!SUPABASE_URL || SUPABASE_URL.includes('your-project-id')) {
    alert('Missing Supabase URL! Please check config.js');
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabaseClient;
