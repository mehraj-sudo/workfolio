// ============================================================
// WORKFOLIO SUPABASE.JS — Cloud Database Integration v1.0
// ============================================================
// ⚠️  SETUP REQUIRED:
//   1. Go to https://supabase.com → New Project
//   2. Copy your Project URL and anon/public key below
//   3. Run the SQL schema in Supabase SQL Editor (see README)
//   4. Done — all data now syncs across devices!
// ============================================================

const SUPABASE_URL = 'https://kaejokcekuyrenvktxvw.supabase.co';         // e.g. https://abcdef.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZWpva2Nla3V5cmVudmt0eHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NzkzMjUsImV4cCI6MjA5MjA1NTMyNX0.SsVRBXRRD_vtAUU8dBZIZ4jhqh3ayJAaR0vhCO6vM1c'; // public anon key, safe to expose

// ── INIT CLIENT ──────────────────────────────────────────────
let _supabase = null;
let _supabaseReady = false;

(function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        // SDK not loaded yet — will retry when SDK script loads
        window.__wf_supabase_pending = true;
        return;
    }
    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,         // keeps user logged in across tabs
            autoRefreshToken: true,
            detectSessionInUrl: true,     // handles OAuth redirects
        }
    });
    _supabaseReady = true;
    window._supabase = _supabase;
    console.log('[WorkFolio] Supabase initialised');
    // Trigger any queued init callbacks
    if (window.__wf_on_ready) window.__wf_on_ready.forEach(fn => fn());
})();

// ── CONFIG CHECK ─────────────────────────────────────────────
// Returns true if credentials are real (not placeholder)
function isSupabaseConfigured() {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
           SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
           _supabaseReady;
}
window.isSupabaseConfigured = isSupabaseConfigured;

// ── HELPER: Get current logged-in user ───────────────────────
async function getCurrentUser() {
    if (!isSupabaseConfigured()) return null;
    const { data: { user } } = await _supabase.auth.getUser();
    return user; // null if not logged in
}
window.getCurrentUser = getCurrentUser;

// ============================================================
// ██ AUTH MODULE — replaces auth.js localStorage auth
// ============================================================

// ── REGISTER ─────────────────────────────────────────────────
window.sb_register = async function(email, password, username) {
    if (!isSupabaseConfigured()) return { success: false, message: 'Supabase not configured.' };
    const { data, error } = await _supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }   // stored in auth.users.raw_user_meta_data
    });
    if (error) return { success: false, message: error.message };
    // Also insert into public profiles table
    if (data.user) {
        await _supabase.from('profiles').upsert({
            id: data.user.id,
            username,
            email,
            created_at: new Date().toISOString()
        });
    }
    return { success: true, message: 'Check your email to confirm your account!' };
};

// ── LOGIN ─────────────────────────────────────────────────────
window.sb_login = async function(email, password) {
    if (!isSupabaseConfigured()) return { success: false, message: 'Supabase not configured.' };
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: error.message };
    // Mirror session to workfolio_session for legacy code compatibility
    _mirrorSessionToLegacy(data.user);
    return { success: true, user: data.user };
};

// ── GOOGLE OAUTH ─────────────────────────────────────────────
window.sb_loginWithGoogle = async function() {
    if (!isSupabaseConfigured()) {
        window.showToast('Supabase not configured yet.', 'warning');
        return;
    }
    const { error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/index.html' }
    });
    if (error) window.showToast('Google sign-in failed: ' + error.message, 'error');
};
window.signInWithGoogle = window.sb_loginWithGoogle; // override the stub

// ── LOGOUT ────────────────────────────────────────────────────
window.sb_logout = async function() {
    if (_supabaseReady) await _supabase.auth.signOut();
    // Also clear legacy session
    sessionStorage.removeItem('workfolio_session');
    localStorage.removeItem('workfolio_session');
    localStorage.removeItem('workfolio_session_expiry');
    window.location.href = 'index.html';
};

// ── MIRROR Supabase session → legacy workfolio_session ────────
// Lets all existing code that reads sessionStorage still work
function _mirrorSessionToLegacy(user) {
    if (!user) return;
    const legacySession = JSON.stringify({
        username: user.user_metadata?.username || user.email.split('@')[0],
        contact:  user.email
    });
    sessionStorage.setItem('workfolio_session', legacySession);
}

// On every page load, sync Supabase auth state → legacy session
(async function syncAuthState() {
    if (!isSupabaseConfigured()) return;
    const { data: { session } } = await _supabase.auth.getSession();
    if (session?.user) {
        _mirrorSessionToLegacy(session.user);
    }
    // Listen for auth changes (login/logout in other tabs)
    _supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            _mirrorSessionToLegacy(session.user);
            if (window.authUIUpdate) window.authUIUpdate();
        }
        if (event === 'SIGNED_OUT') {
            sessionStorage.removeItem('workfolio_session');
            if (window.authUIUpdate) window.authUIUpdate();
        }
    });
})();

// ============================================================
// ██ RESUMES — cloud CRUD
// ============================================================

// ── GET all resumes for current user ─────────────────────────
window.sb_getResumes = async function() {
    if (!isSupabaseConfigured()) return null; // caller falls back to localStorage
    const user = await getCurrentUser();
    if (!user) return null;
    const { data, error } = await _supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
    if (error) { console.error('[WF] Resume fetch error:', error); return null; }
    return data.map(row => ({ ...row.data, _cloud_id: row.id }));
};

// ── SAVE / UPSERT one resume ──────────────────────────────────
window.sb_saveResume = async function(resumeData, cloudId) {
    if (!isSupabaseConfigured()) return null;
    const user = await getCurrentUser();
    if (!user) return null;
    const payload = {
        user_id:    user.id,
        name:       resumeData.name || 'Untitled Resume',
        data:       resumeData,
        updated_at: new Date().toISOString()
    };
    if (cloudId) payload.id = cloudId; // update existing row
    const { data, error } = await _supabase
        .from('resumes')
        .upsert(payload, { onConflict: 'id' })
        .select('id')
        .single();
    if (error) { console.error('[WF] Resume save error:', error); return null; }
    return data.id; // return the cloud UUID for this resume
};

// ── DELETE one resume ─────────────────────────────────────────
window.sb_deleteResume = async function(cloudId) {
    if (!isSupabaseConfigured() || !cloudId) return;
    const { error } = await _supabase.from('resumes').delete().eq('id', cloudId);
    if (error) console.error('[WF] Resume delete error:', error);
};

// ============================================================
// ██ PORTFOLIOS — cloud CRUD
// ============================================================

// ── GET all portfolios for current user ───────────────────────
window.sb_getPortfolios = async function() {
    if (!isSupabaseConfigured()) return null;
    const user = await getCurrentUser();
    if (!user) return null;
    const { data, error } = await _supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
    if (error) { console.error('[WF] Portfolio fetch error:', error); return null; }
    return data.map(row => ({ ...row.data, _cloud_id: row.id }));
};

// ── SAVE / UPSERT one portfolio ───────────────────────────────
window.sb_savePortfolio = async function(siteData, cloudId) {
    if (!isSupabaseConfigured()) return null;
    const user = await getCurrentUser();
    if (!user) return null;
    const payload = {
        user_id:    user.id,
        name:       siteData.name || 'Untitled Portfolio',
        data:       siteData,
        updated_at: new Date().toISOString()
    };
    if (cloudId) payload.id = cloudId;
    const { data, error } = await _supabase
        .from('portfolios')
        .upsert(payload, { onConflict: 'id' })
        .select('id')
        .single();
    if (error) { console.error('[WF] Portfolio save error:', error); return null; }
    return data.id;
};

// ── DELETE one portfolio ──────────────────────────────────────
window.sb_deletePortfolio = async function(cloudId) {
    if (!isSupabaseConfigured() || !cloudId) return;
    const { error } = await _supabase.from('portfolios').delete().eq('id', cloudId);
    if (error) console.error('[WF] Portfolio delete error:', error);
};

// ============================================================
// ██ CONTACT MESSAGES — save to cloud
// ============================================================
window.sb_saveMessage = async function(name, email, subject, message) {
    if (!isSupabaseConfigured()) return false;
    const { error } = await _supabase.from('messages').insert({
        name, email, subject, message,
        created_at: new Date().toISOString()
    });
    return !error;
};

// ============================================================
// ██ CLOUD STATUS BANNER (shown on pages when not configured)
// ============================================================
window.showCloudStatus = function() {
    const configured = isSupabaseConfigured();
    const banner = document.createElement('div');
    banner.style.cssText = `
        position:fixed; bottom:16px; right:16px; z-index:88888;
        background:${configured ? '#f0fdf4' : '#fff7ed'};
        border:1px solid ${configured ? '#86efac' : '#fed7aa'};
        border-radius:12px; padding:10px 16px; font-size:.8rem;
        font-weight:600; color:${configured ? '#15803d' : '#c2410c'};
        display:flex; align-items:center; gap:8px; cursor:pointer;
        box-shadow:0 4px 12px rgba(0,0,0,.08);
        font-family: 'Outfit', sans-serif;
    `;
    banner.innerHTML = configured
        ? '☁️ Cloud sync active'
        : '⚠️ Cloud sync off — <u>Setup Supabase</u>';
    if (!configured) {
        banner.onclick = () => window.open(
            'https://supabase.com/dashboard', '_blank', 'noopener'
        );
    }
    document.body.appendChild(banner);
    // Auto-hide after 4s if configured
    if (configured) setTimeout(() => banner.remove(), 4000);
};

// Show banner on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(window.showCloudStatus, 1500));
} else {
    setTimeout(window.showCloudStatus, 1500);
}