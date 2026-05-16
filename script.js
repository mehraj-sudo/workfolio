// ============================================================
// WORKFOLIO SCRIPT.JS — UPGRADED v2.0
// Features: Dark mode sync, keyboard shortcuts, scroll-to-top,
//           autosave badge, beforeunload guard, improved ATS,
//           cover letter stub, template rendering
// ============================================================

// === HAMBURGER MENU TOGGLE ===
function toggleMenu() {
    const menu = document.getElementById('navMenu');
    if (menu) menu.classList.toggle('active');
}

// === DARK THEME SYNC (applied across all pages) ===
(function applyTheme() {
    const saved = localStorage.getItem('wf_theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', saved);
})();

// === SCROLL REVEAL ANIMATIONS ===
document.addEventListener('DOMContentLoaded', function () {
    function reveal() {
        document.querySelectorAll('.reveal').forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight - 80)
                el.classList.add('active');
        });
    }
    setTimeout(() => {
        const nav  = document.querySelector('.reveal-down');
        const hero = document.querySelector('#home.reveal');
        if (nav)  nav.classList.add('active');
        if (hero) hero.classList.add('active');
    }, 100);
    window.addEventListener('scroll', reveal);
    reveal();
});

// === AUTOSAVE STATUS BADGE ===
window.showSaveBadge = function (message = 'Saved', type = 'success') {
    const badge = document.getElementById('autosaveBadge');
    if (!badge) return;
    const colors = { success: '#10b981', warning: '#f59e0b', error: '#ef4444' };
    badge.innerText = (type === 'success' ? '✓ ' : '⚠ ') + message;
    badge.style.color      = colors[type] || colors.success;
    badge.style.opacity    = '1';
    setTimeout(() => (badge.style.opacity = '0'), 3000);
};

// === KEYBOARD SHORTCUTS (Global) ===
document.addEventListener('keydown', function (e) {
    // Ctrl+S → Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (typeof window.saveData === 'function') {
            window.saveData();
            if (typeof window.showSaveBadge === 'function') window.showSaveBadge('Saved!');
        } else if (typeof window.saveProject === 'function') {
            window.saveProject();
        }
    }
    // Ctrl+P → PDF Export
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        const pdfBtn = document.getElementById('pdfExportBtn');
        if (pdfBtn) { e.preventDefault(); pdfBtn.click(); }
    }
    // Esc → close any open modal
    if (e.key === 'Escape') {
        document.querySelectorAll('.deploy-modal.active, .modal-overlay.active').forEach(m => m.classList.remove('active'));
        const hist = document.getElementById('historyModal');
        if (hist && hist.style.display !== 'none') {
            if (typeof window.closeHistory === 'function') window.closeHistory();
        }
    }
});

// === BACK BUTTON LOGIC (Resume Builder multi-step) ===
function handleBackButton(event) {
    event.preventDefault();
    const step3 = document.getElementById('step-3-editor');
    const step2 = document.getElementById('step-2-templates');
    if (step3 && step3.classList.contains('active-step')) goToStep(2);
    else if (step2 && step2.classList.contains('active-step')) goToStep(1);
    else window.location.href = 'index.html';
}

// === MULTI-STEP WIZARD ===
function goToStep(stepNumber) {
    document.querySelectorAll('.builder-step').forEach(s => s.classList.remove('active-step'));
    const ids    = { 1: 'step-1-onboarding', 2: 'step-2-templates', 3: 'step-3-editor' };
    const target = document.getElementById(ids[stepNumber]);
    if (target) target.classList.add('active-step');
    document.body.style.overflow = stepNumber === 3 ? 'hidden' : 'auto';
}

// === RESUME BUILDER HELPERS ===
function setThemeColor(hexColor) {
    const paper = document.getElementById('resumePreview');
    if (paper) paper.style.setProperty('--res-theme', hexColor);
}

function selectTemplate(templateClass) {
    const paper = document.getElementById('resumePreview');
    if (paper) {
        paper.classList.remove('tpl-executive','tpl-innovator','tpl-creative','tpl-minimalist','tpl-classic','tpl-modern');
        paper.classList.add(templateClass);
    }
    goToStep(3);
}

function addInlineExperience() {
    const container = document.getElementById('canvasExperience');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'res-job-block editable-block';
    div.innerHTML = `
        <div class="res-job-header">
            <h4 contenteditable="true" class="editable-text">New Job Title</h4>
            <span contenteditable="true" class="editable-text" style="font-weight:600;color:var(--res-theme);">Company Name</span>
            <span contenteditable="true" class="editable-text" style="color:#666;font-size:0.9em;float:right;">Start – End</span>
        </div>
        <ul contenteditable="true" class="editable-text" style="margin-top:8px;padding-left:20px;color:#444;">
            <li>Click here to edit this bullet point.</li>
        </ul>
        <button onclick="this.parentElement.remove()" style="font-size:0.7rem;color:red;border:none;background:none;cursor:pointer;margin-top:5px;"><i class="fas fa-trash"></i> Delete</button>
    `;
    container.appendChild(div);
}

function addInlineEducation() {
    const container = document.getElementById('canvasEducation');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'editable-block';
    div.style.marginBottom = '15px';
    div.innerHTML = `
        <strong contenteditable="true" class="editable-text" style="display:block;">Degree Name</strong>
        <span contenteditable="true" class="editable-text" style="display:block;color:var(--res-theme);">University Name</span>
        <span contenteditable="true" class="editable-text" style="font-size:0.85em;color:#666;">Graduated: Year</span>
        <button onclick="this.parentElement.remove()" style="font-size:0.7rem;color:red;border:none;background:none;cursor:pointer;"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(div);
}

// === PDF DOWNLOADER ===
window.downloadPDF = async function (elementId, filename, btnEl) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const origText = btnEl ? btnEl.innerHTML : '';
    if (btnEl) { btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...'; btnEl.disabled = true; }

    const deleteBtns = element.querySelectorAll('button');
    const editables  = element.querySelectorAll('[contenteditable="true"]');
    deleteBtns.forEach(b => (b.style.display = 'none'));
    editables.forEach(el => { el.style.outline = 'none'; el.style.boxShadow = 'none'; el.style.background = 'transparent'; });
    element.style.transform = 'none';

    const opt = {
        margin:     0,
        filename:   filename + '.pdf',
        image:      { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF:      { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    if (window.html2pdf) {
        await html2pdf().set(opt).from(element).save();
    } else {
        alert('PDF library is still loading. Please wait a few seconds and try again.');
    }

    deleteBtns.forEach(b => (b.style.display = 'inline-block'));
    if (btnEl) { btnEl.innerHTML = origText; btnEl.disabled = false; }
    if (typeof window.showSaveBadge === 'function') window.showSaveBadge('PDF Downloaded!');
};

// === TEMPLATE LIBRARY (templates.html) ===
const allTemplates = [
    // Resumes
    { type: 'resume', name: 'The Executive',    color: '#0f172a', desc: 'Classic ATS-Friendly',        link: 'resume.html' },
    { type: 'resume', name: 'Tech Innovator',   color: '#3b82f6', desc: 'Light Left Sidebar',          link: 'resume.html' },
    { type: 'resume', name: 'Creative Director',color: '#8b5cf6', desc: 'Bold Top Header',             link: 'resume.html' },
    { type: 'resume', name: 'The Strategist',   color: '#1e293b', desc: 'Centered & Sophisticated',    link: 'resume.html' },
    { type: 'resume', name: 'Data Architect',   color: '#0ea5e9', desc: 'Perfect 50/50 Split',         link: 'resume.html' },
    { type: 'resume', name: 'Pure Minimalist',  color: '#000000', desc: 'High Whitespace',             link: 'resume.html' },
    { type: 'resume', name: 'Agency Pro',       color: '#111827', desc: 'Inverted Dark Sidebar',       link: 'resume.html' },
    { type: 'resume', name: 'The Scholar',      color: '#7f1d1d', desc: 'Dense & Boxed',               link: 'resume.html' },
    { type: 'resume', name: 'Startup Founder',  color: '#10b981', desc: 'Modern Two-Column',           link: 'resume.html' },
    { type: 'resume', name: 'Frontend Dev',     color: '#059669', desc: 'Code-Inspired Dark',          link: 'resume.html' },
    { type: 'resume', name: 'UX Researcher',    color: '#ec4899', desc: 'Clean & Soft',                link: 'resume.html' },
    { type: 'resume', name: 'Legal Counsel',    color: '#334155', desc: 'Strict Standard',             link: 'resume.html' },
    { type: 'resume', name: 'Product Manager',  color: '#0284c7', desc: 'Friendly & Open',             link: 'resume.html' },
    { type: 'resume', name: 'Sales Director',   color: '#ea580c', desc: 'Direct & Balanced',           link: 'resume.html' },
    { type: 'resume', name: 'HR Specialist',    color: '#14b8a6', desc: 'Approachable Sidebar',        link: 'resume.html' },
    { type: 'resume', name: 'Art Director',     color: '#be123c', desc: 'Dramatic Header',             link: 'resume.html' },
    { type: 'resume', name: 'Cloud Engineer',   color: '#0369a1', desc: 'Deep Tech',                   link: 'resume.html' },
    { type: 'resume', name: 'Consultant',       color: '#475569', desc: 'Corporate Reliable',          link: 'resume.html' },
    { type: 'resume', name: 'Educator',         color: '#15803d', desc: 'Academic Structured',         link: 'resume.html' },
    { type: 'resume', name: 'Civil Engineer',   color: '#b91c1c', desc: 'Structural Grid',             link: 'resume.html' },
    // Portfolios
    { type: 'portfolio', name: 'Bento Grid',      color: '#8b5cf6', desc: 'Modern asymmetric layout',  link: 'portfolio.html' },
    { type: 'portfolio', name: 'Split Screen',    color: '#3b82f6', desc: 'Hero left, content right',  link: 'portfolio.html' },
    { type: 'portfolio', name: 'Brutalist',       color: '#000000', desc: 'Bold borders, raw energy',  link: 'portfolio.html' },
    { type: 'portfolio', name: 'Terminal / Code', color: '#10b981', desc: 'Developer dark theme',      link: 'portfolio.html' },
    { type: 'portfolio', name: 'Glassmorphism',   color: '#4f46e5', desc: 'Frosted gradient panels',   link: 'portfolio.html' },
    { type: 'portfolio', name: 'Cyberpunk / Neon',color: '#06b6d4', desc: 'Neon glow effects',         link: 'portfolio.html' },
    { type: 'portfolio', name: 'Minimalist White',color: '#64748b', desc: 'Ultra-clean whitespace',    link: 'portfolio.html' },
    { type: 'portfolio', name: 'Timeline Story',  color: '#f59e0b', desc: 'Narrative scroll layout',   link: 'portfolio.html' },
    { type: 'portfolio', name: 'SaaS Dashboard',  color: '#6366f1', desc: 'App-style card grid',       link: 'portfolio.html' },
    { type: 'portfolio', name: 'Editorial Blog',  color: '#374151', desc: 'Long-form readable layout', link: 'portfolio.html' },
    { type: 'portfolio', name: 'Neumorphic',      color: '#94a3b8', desc: 'Soft shadow depth UI',      link: 'portfolio.html' },
    { type: 'portfolio', name: 'Retro 90s',       color: '#ea580c', desc: 'Vintage bold design',       link: 'portfolio.html' },
    { type: 'portfolio', name: 'Glassmorphic II', color: '#ec4899', desc: 'Animated gradient orbs',    link: 'portfolio.html' },
    { type: 'portfolio', name: 'Corporate Pro',   color: '#1e293b', desc: 'Trust-building B2B style',  link: 'portfolio.html' },
    { type: 'portfolio', name: 'Creative Grid',   color: '#a855f7', desc: 'Masonry photo layout',      link: 'portfolio.html' },
    { type: 'portfolio', name: 'Sidebar Nav',     color: '#0284c7', desc: 'Fixed left navigation',     link: 'portfolio.html' },
    { type: 'portfolio', name: '3D Tilt Cards',   color: '#f97316', desc: 'Interactive hover depth',   link: 'portfolio.html' },
    { type: 'portfolio', name: 'Marvel Comic',    color: '#dc2626', desc: 'Bold superhero theme',      link: 'portfolio.html' },
    { type: 'portfolio', name: 'Scroll Snap',     color: '#7c3aed', desc: 'Full-screen scroll sections',link: 'portfolio.html' },
    { type: 'portfolio', name: 'Gradient Modern', color: '#6366f1', desc: 'Colorful hero sections',    link: 'portfolio.html' },
];

window.renderTemplates = function (filter = 'all') {
    const container = document.getElementById('templateContainer');
    if (!container) return;
    const filtered = filter === 'all' ? allTemplates : allTemplates.filter(t => t.type === filter);

    container.innerHTML = filtered.map(t => `
        <div class="template-card-modern" onclick="useTemplate('${t.link}', '${t.name}')">
            <div class="template-preview-abstract">
                <div style="width:30%;background:${t.color};height:100%;"></div>
                <div style="flex:1;background:#f8fafc;display:flex;flex-direction:column;padding:12px;gap:8px;">
                    <div style="width:80%;height:10px;background:${t.color};border-radius:4px;opacity:0.8;"></div>
                    <div style="width:60%;height:6px;background:#e2e8f0;border-radius:3px;"></div>
                    <div style="width:90%;height:6px;background:#e2e8f0;border-radius:3px;"></div>
                    <div style="width:70%;height:6px;background:#e2e8f0;border-radius:3px;"></div>
                </div>
            </div>
            <h3 class="template-title">${t.name}</h3>
            <p style="font-size:0.78rem;color:#94a3b8;margin:-8px 0 15px;">${t.desc}</p>
            <div style="display:flex;gap:8px;width:100%;">
                <span style="background:${t.type==='resume'?'#e0e7ff':'#ede9fe'};color:${t.type==='resume'?'#4338ca':'#7c3aed'};padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">${t.type.charAt(0).toUpperCase()+t.type.slice(1)}</span>
            </div>
            <button class="template-choose-btn" style="background:${t.color};margin-top:12px;">Use Template</button>
        </div>
    `).join('');
};

window.filterTemplates = function (filter, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTemplates(filter);
};

function useTemplate(link, name) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            window.location.href = link;
        }, 1200);
    } else {
        window.location.href = link;
    }
}

// Auto-render on templates.html
document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderTemplates === 'function' && document.getElementById('templateContainer')) {
        renderTemplates('all');
    }
});

// === BASIC ATS LOGIC (used on index.html inline FAQ demo) ===
function calculateScore() {
    const resume = document.getElementById('atsResume')?.value.toLowerCase();
    const job    = document.getElementById('atsJob')?.value.toLowerCase();
    if (!resume || !job) { alert('Please paste text in both boxes.'); return; }
    const keywords = [...new Set((job.match(/\b[a-z]{4,}\b/g) || []))];
    const matched  = keywords.filter(w => resume.includes(w)).length;
    const score    = Math.round((matched / keywords.length) * 100) || 0;
    const circle   = document.getElementById('scoreDisplay');
    if (circle) {
        circle.innerText = score + '%';
        circle.style.borderColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
        circle.style.color = circle.style.borderColor;
    }
}

// === BEFOREUNLOAD GUARD (Resume Builder) ===
let hasUnsavedChanges = false;
window.markUnsaved = function () { hasUnsavedChanges = true; };
window.markSaved   = function () { hasUnsavedChanges = false; };
window.addEventListener('beforeunload', e => {
    if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Leave anyway?';
    }
});