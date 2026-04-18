// ============================================================
// SUPABASE OVERRIDES — if supabase.js is loaded and configured,
// these replace the localStorage-based auth functions below.
// ============================================================

// Wrapped register: tries Supabase first, falls back to localStorage
const _original_registerUser = window.registerUser;
window.registerUser = async function(username, contact, password) {
    if (window.sb_register && window.isSupabaseConfigured()) {
        const result = await window.sb_register(contact, password, username);
        if (result.success) return result;
        // If Supabase fails with "already registered", map to friendly message
        if (result.message && result.message.includes('already')) {
            return { success: false, message: 'Email already registered. Try signing in.' };
        }
        // Fall through to localStorage on network error
        console.warn('[WF] Supabase register failed, falling back to localStorage:', result.message);
    }
    // localStorage fallback (original function defined below)
    return registerUserLocal(username, contact, password);
};

// Wrapped login: tries Supabase first
const _original_loginUser = window.loginUser;
window.loginUser = async function(identifier, password, rememberMe) {
    if (window.sb_login && window.isSupabaseConfigured()) {
        const result = await window.sb_login(identifier, password);
        if (result.success) return result;
        console.warn('[WF] Supabase login failed, falling back to localStorage:', result.message);
    }
    return loginUserLocal(identifier, password, rememberMe);
};

// Wrapped logout: clears Supabase session too
const _orig_logout = window.logout;
window.logout = async function(event) {
    if (event) event.preventDefault();
    if (window.sb_logout) { await window.sb_logout(); return; }
    // fallback
    sessionStorage.removeItem('workfolio_session');
    localStorage.removeItem('workfolio_session');
    localStorage.removeItem('workfolio_session_expiry');
    window.location.href = 'index.html';
};

// ============================================================
// WORKFOLIO AUTH.JS — UPGRADED v2.0
// Features: SHA-256 hashing, Remember Me, session guards,
//           admin protection, XSS sanitization, OAuth stubs
// ============================================================

const DB_USERS_KEY   = 'workfolio_users';
const SESSION_KEY    = 'workfolio_session';
const ADMIN_PIN_KEY  = 'workfolio_admin_verified';

// === UTILITY: SHA-256 HASHING (replaces plain-text passwords) ===
async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// === UTILITY: XSS SANITIZER ===
window.sanitize = function(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/\//g, '&#x2F;');
};

// === 1. REGISTRATION ===
async function registerUserLocal(username, contact, password) {
    let users = JSON.parse(localStorage.getItem(DB_USERS_KEY)) || [];

    if (users.find(u => u.username === username)) {
        return { success: false, message: 'Username already exists!' };
    }
    if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters.' };
    }

    const hashedPwd = await hashPassword(password);
    users.push({
        username: sanitize(username),
        contact:  sanitize(contact),
        password: hashedPwd,           // ✅ hashed, never plain text
        joined:   new Date().toLocaleString()
    });
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
    return { success: true, message: 'Registered Successfully!' };
}

// === 2. LOGIN ===
async function loginUserLocal(identifier, password, rememberMe = false) {
    let users = JSON.parse(localStorage.getItem(DB_USERS_KEY)) || [];
    const hashedPwd = await hashPassword(password);

    const user = users.find(u =>
        (u.username === identifier || u.contact === identifier) &&
        u.password === hashedPwd
    );

    if (user) {
        const sessionData = JSON.stringify({ username: user.username, contact: user.contact });
        sessionStorage.setItem(SESSION_KEY, sessionData);
        if (rememberMe) {
            // Persist for 30 days
            localStorage.setItem(SESSION_KEY, sessionData);
            localStorage.setItem('workfolio_session_expiry', Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        return { success: true };
    }
    return { success: false, message: 'Invalid username or password.' };
}

// === 3. AUTO-RESTORE persistent session on page load ===
(function restoreSession() {
    if (!sessionStorage.getItem(SESSION_KEY)) {
        const stored  = localStorage.getItem(SESSION_KEY);
        const expiry  = localStorage.getItem('workfolio_session_expiry');
        if (stored && expiry && Date.now() < parseInt(expiry)) {
            sessionStorage.setItem(SESSION_KEY, stored);
        } else {
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem('workfolio_session_expiry');
        }
    }
})();

// === 4. LOGOUT ===
function logout(event) {
    if (event) event.preventDefault();
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('workfolio_session_expiry');
    window.location.href = 'index.html';
}

// === 5. PROCESS LOGIN FORM ===
async function processLogin(event) {
    event.preventDefault();
    const identifier = document.getElementById('loginId').value.trim();
    const password   = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe')?.checked || false;
    const btn        = document.getElementById('loginBtn');

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...'; }

    const result = await loginUser(identifier, password, rememberMe);
    if (result.success) {
        window.location.href = 'index.html';
    } else {
        showFormError('loginError', result.message);
        if (btn) { btn.disabled = false; btn.innerHTML = 'Sign In'; }
    }
}

// === 6. PASSWORD VISIBILITY TOGGLE ===
function togglePasswordVisibility(inputId = 'loginPassword', iconId = 'toggleEye') {
    const input = document.getElementById(inputId);
    const icon  = document.getElementById(iconId);
    if (!input || !icon) return;
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// === 7. ROUTE PROTECTION ===
function checkAccess(event, targetUrl) {
    if (event) event.preventDefault();
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (!session) {
        sessionStorage.setItem('wf_redirect_after_login', targetUrl);
        showToast('🔒 Please sign in to access this feature.', 'warning');
        setTimeout(() => window.location.href = 'login.html', 1200);
    } else {
        window.location.href = targetUrl;
    }
}

function requireLogin() {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (!session) {
        window.location.href = 'login.html';
    }
}

// === 8. ADMIN PIN PROTECTION ===
window.requireAdmin = function() {
    if (sessionStorage.getItem(ADMIN_PIN_KEY) === 'true') return;
    const pin = prompt('🔐 Enter Admin PIN to continue:');
    const ADMIN_PIN = '1234'; // Change this to a strong PIN
    if (pin !== ADMIN_PIN) {
        alert('❌ Incorrect PIN. Access denied.');
        window.location.href = 'index.html';
    } else {
        sessionStorage.setItem(ADMIN_PIN_KEY, 'true');
    }
};

// === 9. SAVE CONTACT MESSAGE ===
window.saveMessage = function(name, email, message) {
    let messages = JSON.parse(localStorage.getItem('workfolio_messages') || '[]');
    messages.push({
        id:      Date.now(),
        date:    new Date().toLocaleString(),
        name:    sanitize(name),
        email:   sanitize(email),
        text:    sanitize(message)
    });
    localStorage.setItem('workfolio_messages', JSON.stringify(messages));
};

// === 10. UI STATE UPDATER ===
window.authUIUpdate = function() {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    document.querySelectorAll('.userDisplay').forEach(el =>
        el.innerText = session ? '👋 Hello, ' + session.username : ''
    );
    document.querySelectorAll('.authBtn').forEach(btn =>
        btn.style.display = session ? 'none' : 'inline-block'
    );
    document.querySelectorAll('.logoutBtn').forEach(btn =>
        btn.style.display = session ? 'inline-block' : 'none'
    );
};
window.addEventListener('load', window.authUIUpdate);

// === 11. TOAST NOTIFICATION HELPER ===
window.showToast = function(message, type = 'success') {
    let toast = document.getElementById('wf-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'wf-toast';
        toast.style.cssText = `
            position:fixed; bottom:30px; left:50%; transform:translateX(-50%) translateY(80px);
            background:white; padding:14px 24px; border-radius:50px;
            box-shadow:0 10px 30px rgba(0,0,0,0.12); font-weight:600; font-size:0.95rem;
            z-index:99999; transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s;
            border:1px solid #e2e8f0; display:flex; align-items:center; gap:10px; opacity:0;
        `;
        document.body.appendChild(toast);
    }
    const colors = { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#4f46e5' };
    toast.style.borderLeft = `4px solid ${colors[type] || colors.info}`;
    toast.innerText = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(80px)';
    }, 3500);
};

// === 12. FORM ERROR HELPER ===
function showFormError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.innerText = '❌ ' + message;
        el.style.display = 'block';
        setTimeout(() => el.style.display = 'none', 4000);
    } else {
        alert('❌ ' + message);
    }
}

// === 13. GOOGLE OAUTH STUB (ready to wire to real Google API) ===
window.signInWithGoogle = function() {
    // To enable: register your app at console.cloud.google.com
    // Then replace this with the real Google Identity Services flow
    showToast('Google Sign-In coming soon! Use email/password for now.', 'info');
};

window.registerUserLocal = registerUserLocal;
window.loginUserLocal    = loginUserLocal;