// auth.js

// Check session and setup logout on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Check session
    const { data: { session } } = await supabase.auth.getSession();
    updateAuthUI(session);

    // Setup logout handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                alert(error.message);
            } else {
                window.location.href = 'index.html'; // Explicitly redirect to home
            }
        });
    }
});

// Update UI based on auth state
function updateAuthUI(session) {
    const authRequiredElements = document.querySelectorAll('.auth-required');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (session) {
        authRequiredElements.forEach(el => el.classList.remove('hidden'));
        if (loginBtn) loginBtn.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
    } else {
        authRequiredElements.forEach(el => el.classList.add('hidden'));
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
    }
}
