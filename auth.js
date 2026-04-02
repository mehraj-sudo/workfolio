const DB_USERS_KEY = 'workfolio_users';
const SESSION_KEY = 'workfolio_session';

// === 1. REGISTRATION & LOGIN LOGIC ===
function registerUser(username, contact, password) {
    let users = JSON.parse(localStorage.getItem(DB_USERS_KEY)) || [];
    
    // Check if user already exists
    if (users.find(u => u.username === username)) {
        return { success: false, message: "Username already exists!" };
    }
    
    // Save new user to localStorage so their account is permanent
    users.push({ username, contact, password, joined: new Date().toLocaleString() });
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
    
    return { success: true, message: "Registered Successfully!" };
}

function loginUser(identifier, password) {
    let users = JSON.parse(localStorage.getItem(DB_USERS_KEY)) || [];
    
    // Find matching user
    const user = users.find(u => (u.username === identifier || u.contact === identifier) && u.password === password);
    
    if (user) {
        // Save the active session to sessionStorage (clears when browser closes)
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        return { success: true };
    }
    return { success: false, message: "Invalid Login Details" };
}

function logout(event) {
    if(event) event.preventDefault();
    // Remove the session from sessionStorage
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
}

// === 2. PROCESS LOGIN FORM SUBMISSION ===
function processLogin(event) {
    event.preventDefault();
    
    const identifier = document.getElementById('loginId').value;
    const password = document.getElementById('loginPassword').value;

    const result = loginUser(identifier, password);
    if(result.success) {
        window.location.href = 'index.html';
    } else {
        alert("❌ " + result.message);
    }
}

// === 3. PASSWORD VISIBILITY TOGGLE ===
function togglePasswordVisibility() {
    const passwordInput = document.getElementById("loginPassword");
    const eyeIcon = document.getElementById("toggleEye");
    
    if (passwordInput && eyeIcon) {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            eyeIcon.classList.remove("fa-eye");
            eyeIcon.classList.add("fa-eye-slash");
        } else {
            passwordInput.type = "password";
            eyeIcon.classList.remove("fa-eye-slash");
            eyeIcon.classList.add("fa-eye");
        }
    }
}

// === 4. ROUTE PROTECTION (THE SECURITY GUARDS) ===
function checkAccess(event, targetUrl) {
    if(event) event.preventDefault();
    
    // Check sessionStorage for active login
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    
    if (!session) {
        alert("🔒 Please sign in or create an account to access our premium features.");
        window.location.href = 'login.html';
    } else {
        window.location.href = targetUrl; 
    }
}

function requireLogin() {
    // Check sessionStorage for active login on protected pages
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (!session) {
        alert("🔒 Please sign in to access this page.");
        window.location.href = 'login.html';
    }
}

// === 5. UI UPDATER (Toggles Sign In / Logout Buttons) ===
window.authUIUpdate = function() {
    // Check sessionStorage to update the navigation bar
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    
    const userDisplays = document.querySelectorAll('.userDisplay');
    const authBtns = document.querySelectorAll('.authBtn'); 
    const logoutBtns = document.querySelectorAll('.logoutBtn'); 

    if(session) {
        // User is logged in
        userDisplays.forEach(el => el.innerText = "👋 Hello, " + session.username);
        authBtns.forEach(btn => btn.style.display = 'none');
        logoutBtns.forEach(btn => btn.style.display = 'inline-block');
    } else {
        // User is logged out
        userDisplays.forEach(el => el.innerText = "");
        authBtns.forEach(btn => btn.style.display = 'inline-block');
        logoutBtns.forEach(btn => btn.style.display = 'none');
    }
};

// Run the UI updater every time a page loads
window.addEventListener('load', window.authUIUpdate);