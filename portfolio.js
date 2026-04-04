// ============================================================
// WORKFOLIO PORTFOLIO.JS — UPGRADED v3.0
// Advanced AI Co-Pilot: intent parser, content gen, 30 themes
// ============================================================

function getPortfolioDBKey() {
    let s = null;
    try { s = JSON.parse(sessionStorage.getItem('workfolio_session') || localStorage.getItem('workfolio_session')); } catch(e) {}
    return 'workfolio_portfolios_v10_' + (s ? s.username : 'guest');
}

const popularFonts = ["Inter","Roboto","Poppins","Montserrat","Lato","Open Sans","Nunito","Raleway","Oswald","Playfair Display","Merriweather","Georgia","Space Mono","Fira Code","Courier New","Anton","Bebas Neue","Dancing Script","Lobster","Cinzel","Outfit","Work Sans","Quicksand","Karla","Josefin Sans","Barlow","Ubuntu","Cabin","Mukta","Rubik"];

(function initDB() { try { if (!localStorage.getItem(getPortfolioDBKey())) localStorage.setItem(getPortfolioDBKey(), '[]'); } catch(e) {} })();

const formatUrl = (url) => (!url ? '' : /^https?:\/\//i.test(url) ? url : `https://${url}`);

const getEmptySite = () => ({
    id: Date.now(), lastEdited: new Date().toLocaleString(),
    layoutId: 'tpl_1', theme: 'dark', font: 'Inter',
    photo: 'https://ui-avatars.com/api/?name=JD&background=4F46E5&color=fff&size=200',
    name: 'John Doe', title: 'Creative Software Engineer',
    about: 'I build high-performance applications with a focus on incredible user experiences.',
    email: 'hi@example.com', linkedin: 'https://linkedin.com/in/johndoe', github: 'https://github.com/johndoe',
    phone: '', location: '', contactEmail: '',
    skills: [{ id: 1, name: 'React', level: 'Expert' }],
    experience: [{ id: 1, role: 'Senior Dev', company: 'Tech Corp', date: '2022–Present', desc: 'Led frontend architecture.' }],
    projects: [{ id: 1, name: 'SaaS Platform', tags: 'React, Node', desc: 'A full-stack analytics dashboard.' }],
    certs: [{ id: 1, name: 'AWS Certified Solutions Architect', date: '2023' }]
});

let siteData = getEmptySite();
let activeSiteIndex = -1;

// ── VIEW SWITCHER ──────────────────────────
window.switchView = function(viewId) {
    document.querySelectorAll('.pf-view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById(viewId);
    if (el) el.classList.add('active');
    sessionStorage.setItem('pf_current_view', viewId);
    if (viewId === 'view-dashboard') { sessionStorage.removeItem('pf_active_index'); renderDashboard(); }
};

// ── DATA HELPERS ───────────────────────────
function getSavedSites() {
    try { const d = localStorage.getItem(getPortfolioDBKey()); return d ? JSON.parse(d).filter(s => s && s.id) : []; } catch(e) { return []; }
}
function getMiniPreview(layoutId) {
    const num = parseInt((layoutId||'tpl_1').replace('tpl_','')) || 1;
    let bg = '#0f172a', p = '#a855f7', s = '#334155';
    if ([2,13,17].includes(num)) { bg='#fff'; p='#000'; s='#e2e8f0'; }
    if ([3,22].includes(num)) { bg='#fff'; p='#000'; s='#fbbf24'; }
    if ([4,20].includes(num)) { bg='#000'; p='#22c55e'; s='#064e3b'; }
    if ([5,14].includes(num)) { bg='linear-gradient(135deg,#3b82f6,#ec4899)'; p='rgba(255,255,255,.4)'; }
    if ([6,28].includes(num)) { bg='#050505'; p='#06b6d4'; }
    if (num===30) { bg='#18181b'; p='#dc2626'; }
    return `<div style="width:100%;height:100%;background:${bg};display:flex;flex-direction:column;padding:10px;gap:6px;">
        <div style="width:80%;height:10px;background:${p};border-radius:4px;opacity:.9;"></div>
        <div style="width:55%;height:6px;background:${s};border-radius:3px;opacity:.6;"></div>
        <div style="display:flex;gap:5px;flex:1;"><div style="flex:2;background:${s};border-radius:4px;opacity:.4;"></div><div style="flex:1;background:${s};border-radius:4px;opacity:.3;"></div></div>
    </div>`;
}

// ── DASHBOARD ──────────────────────────────
function renderDashboard() {
    const grid = document.getElementById('dashboardGrid');
    if (!grid) return;
    const sites = getSavedSites();
    const newCard = `<div class="new-proj-card" onclick="createNewProject()"><i class="fas fa-plus-circle"></i><span style="font-weight:700;">Create New Project</span></div>`;
    if (!sites.length) { grid.innerHTML = newCard; return; }
    grid.innerHTML = newCard + sites.map((site, index) => `
        <div class="proj-card">
            <div class="proj-thumb" onclick="loadProject(${index})">${getMiniPreview(site.layoutId)}</div>
            <div class="proj-info">
                <div class="proj-title">${site.name||'Untitled'}'s Portfolio</div>
                <div class="proj-meta"><span>${site.layoutId||'tpl_1'}</span><span>${site.lastEdited||'Recently'}</span></div>
            </div>
            <div class="proj-actions">
                <button class="btn-edit-proj" onclick="loadProject(${index})"><i class="fas fa-pen"></i> Edit</button>
                <button class="btn-del-proj" onclick="deleteProject(${index})"><i class="fas fa-trash"></i></button>
            </div>
        </div>`).join('');
}

window.createNewProject = function() { siteData = getEmptySite(); activeSiteIndex = -1; syncSidebarUI(); updatePreview(); switchView('view-editor'); };
window.loadProject = function(index) { const s = getSavedSites(); if (s[index]) { siteData = s[index]; activeSiteIndex = index; sessionStorage.setItem('pf_active_index', index); syncSidebarUI(); updatePreview(); switchView('view-editor'); } };
window.saveProject = function() {
    try {
        siteData.lastEdited = new Date().toLocaleString();
        let sites = getSavedSites();
        if (activeSiteIndex === -1) { sites.push(siteData); activeSiteIndex = sites.length - 1; sessionStorage.setItem('pf_active_index', activeSiteIndex); } else { sites[activeSiteIndex] = siteData; }
        localStorage.setItem(getPortfolioDBKey(), JSON.stringify(sites));
    } catch(e) {}
};
window.deleteProject = function(index) { if (confirm('Delete this project permanently?')) { let s = getSavedSites(); s.splice(index, 1); localStorage.setItem(getPortfolioDBKey(), JSON.stringify(s)); renderDashboard(); } };
window.handlePhotoUpload = function(event) { const file = event.target.files[0]; if (file) { const r = new FileReader(); r.onload = e => { siteData.photo = e.target.result; if (document.getElementById('pPhotoPreview')) document.getElementById('pPhotoPreview').src = siteData.photo; updatePreview(); }; r.readAsDataURL(file); } };

// ── DEBOUNCED RENDER ───────────────────────
let renderTimer;
function triggerRender() { clearTimeout(renderTimer); renderTimer = setTimeout(() => updatePreview(), 600); }
window.updateData = function(key, val) { siteData[key] = val; triggerRender(); };
window.switchLayout = function(id) { siteData.layoutId = id; updatePreview(); };
window.setViewport = function(w) {
    const wrap = document.getElementById('iframeWrapper');
    if (!wrap) return;
    const frame = document.getElementById('livePreview');
    if (w === '100%') { wrap.style.justifyContent='center'; frame.style.width='100%'; frame.style.height='100%'; frame.style.borderRadius='0'; frame.style.border='none'; }
    else { frame.style.width=w; frame.style.borderRadius='16px'; frame.style.border='12px solid #1e293b'; }
};

// ── SIDEBAR SYNC ───────────────────────────
function syncSidebarUI() {
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setVal('pName', siteData.name); setVal('pTitle', siteData.title); setVal('pAbout', siteData.about);
    setVal('pEmail', siteData.email); setVal('pLinkedin', siteData.linkedin); setVal('pGithub', siteData.github);
    setVal('pPhone', siteData.phone); setVal('pLocation', siteData.location); setVal('pContactEmail', siteData.contactEmail);
    const photo = document.getElementById('pPhotoPreview'); if (photo) photo.src = siteData.photo || '';
    const tpl = document.getElementById('templateSelect'); if (tpl) tpl.value = siteData.layoutId || 'tpl_1';
    const theme = document.getElementById('themeSelect'); if (theme) theme.value = siteData.theme || 'dark';
    const font = document.getElementById('fontSelect'); if (font) font.value = siteData.font || 'Inter';
    renderListUI('skills'); renderListUI('experience'); renderListUI('projects'); renderListUI('certs');
}

// ── LIST MANAGER ───────────────────────────
window.addListItem = function(type) {
    if (!siteData[type]) siteData[type] = [];
    const id = Date.now();
    if (type==='skills') siteData.skills.push({ id, name:'New Skill', level:'Intermediate' });
    if (type==='experience') siteData.experience.push({ id, role:'New Role', company:'Company', date:'2024', desc:'' });
    if (type==='projects') siteData.projects.push({ id, name:'New Project', tags:'Tech', desc:'' });
    if (type==='certs') siteData.certs.push({ id, name:'Certification', date:'2024' });
    renderListUI(type); updatePreview();
};
window.removeListItem = function(type, id) { siteData[type] = siteData[type].filter(i => String(i.id) !== String(id)); renderListUI(type); updatePreview(); };
window.updateListItem = function(type, id, field, val) { const item = siteData[type].find(i => String(i.id) === String(id)); if (item) item[field] = val; triggerRender(); };

function renderListUI(type) {
    const el = document.getElementById(type === 'certs' ? 'certsList' : type + 'List');
    if (!el) return;
    const items = siteData[type] || [];
    if (type === 'skills') {
        el.innerHTML = items.map(s => `<div class="pf-list-item"><button class="del" onclick="removeListItem('skills','${s.id}')">✕</button><input class="pf-input" type="text" value="${s.name||''}" oninput="updateListItem('skills','${s.id}','name',this.value)" placeholder="Skill name"><select class="pf-input" onchange="updateListItem('skills','${s.id}','level',this.value)" style="margin:0;"><option ${s.level==='Beginner'?'selected':''}>Beginner</option><option ${s.level==='Intermediate'?'selected':''}>Intermediate</option><option ${s.level==='Advanced'?'selected':''}>Advanced</option><option ${s.level==='Expert'?'selected':''}>Expert</option></select></div>`).join('');
    } else if (type === 'experience') {
        el.innerHTML = items.map(e => `<div class="pf-list-item"><button class="del" onclick="removeListItem('experience','${e.id}')">✕</button><input class="pf-input" type="text" value="${e.role||''}" oninput="updateListItem('experience','${e.id}','role',this.value)" placeholder="Role/Title"><input class="pf-input" type="text" value="${e.company||''}" oninput="updateListItem('experience','${e.id}','company',this.value)" placeholder="Company"><input class="pf-input" type="text" value="${e.date||''}" oninput="updateListItem('experience','${e.id}','date',this.value)" placeholder="Date Range"><textarea class="pf-input" rows="2" oninput="updateListItem('experience','${e.id}','desc',this.value)" placeholder="Description">${e.desc||''}</textarea></div>`).join('');
    } else if (type === 'projects') {
        el.innerHTML = items.map(p => `<div class="pf-list-item"><button class="del" onclick="removeListItem('projects','${p.id}')">✕</button><input class="pf-input" type="text" value="${p.name||''}" oninput="updateListItem('projects','${p.id}','name',this.value)" placeholder="Project Name"><input class="pf-input" type="text" value="${p.tags||''}" oninput="updateListItem('projects','${p.id}','tags',this.value)" placeholder="Tech stack tags"><textarea class="pf-input" rows="2" oninput="updateListItem('projects','${p.id}','desc',this.value)" placeholder="Description">${p.desc||''}</textarea></div>`).join('');
    } else if (type === 'certs') {
        el.innerHTML = items.map(c => `<div class="pf-list-item"><button class="del" onclick="removeListItem('certs','${c.id}')">✕</button><input class="pf-input" type="text" value="${c.name||''}" oninput="updateListItem('certs','${c.id}','name',this.value)" placeholder="Certification name"><input class="pf-input" type="text" value="${c.date||''}" oninput="updateListItem('certs','${c.id}','date',this.value)" placeholder="Year"></div>`).join('');
    }
}

// ── 30 TEMPLATE CONFIGS ────────────────────
const tailwindConfigs = [
    { id:'tpl_1',  name:'Bento Grid',       category:'Modern' },
    { id:'tpl_2',  name:'Minimalist',        category:'Clean' },
    { id:'tpl_3',  name:'Neo-Brutalism',     category:'Bold' },
    { id:'tpl_4',  name:'Terminal / Hacker', category:'Developer' },
    { id:'tpl_5',  name:'Glassmorphism',     category:'Premium' },
    { id:'tpl_6',  name:'Cyberpunk Neon',    category:'Creative' },
    { id:'tpl_7',  name:'Corporate Pro',     category:'Business' },
    { id:'tpl_8',  name:'Neumorphic',        category:'Soft' },
    { id:'tpl_9',  name:'Split Screen',      category:'Modern' },
    { id:'tpl_10', name:'Magazine Layout',   category:'Editorial' },
    { id:'tpl_11', name:'SaaS Dashboard',    category:'Tech' },
    { id:'tpl_12', name:'Bento Dark',        category:'Modern' },
    { id:'tpl_13', name:'Paper White',       category:'Clean' },
    { id:'tpl_14', name:'Gradient Wave',     category:'Premium' },
    { id:'tpl_15', name:'Retro 90s',         category:'Vintage' },
    { id:'tpl_16', name:'Split Dark',        category:'Developer' },
    { id:'tpl_17', name:'Serif Classic',     category:'Academic' },
    { id:'tpl_18', name:'Timeline',          category:'Story' },
    { id:'tpl_19', name:'Cards Stack',       category:'Creative' },
    { id:'tpl_20', name:'Matrix Green',      category:'Developer' },
    { id:'tpl_21', name:'Pastel Dream',      category:'Soft' },
    { id:'tpl_22', name:'Brutalist Bold',    category:'Bold' },
    { id:'tpl_23', name:'Monochrome',        category:'Minimal' },
    { id:'tpl_24', name:'Floating Cards',    category:'Modern' },
    { id:'tpl_25', name:'Aurora',            category:'Premium' },
    { id:'tpl_26', name:'Blueprint',         category:'Engineering' },
    { id:'tpl_27', name:'Dusk Gradient',     category:'Premium' },
    { id:'tpl_28', name:'Neon Pulse',        category:'Creative' },
    { id:'tpl_29', name:'Bento Light',       category:'Modern' },
    { id:'tpl_30', name:'Marvel / Comic',    category:'Epic' },
];

// ── LIVE PREVIEW ENGINE ────────────────────
window.updatePreview = function() {
    try {
        const iframe = document.getElementById('livePreview');
        if (!iframe) return;
        const num     = parseInt((siteData.layoutId||'tpl_1').replace('tpl_','')) || 1;
        const isDark  = siteData.theme !== 'light';
        const font    = siteData.font || 'Inter';
        const skills  = (siteData.skills||[]).map(s=>`<span style="background:var(--accent-soft);color:var(--accent);padding:4px 10px;border-radius:20px;font-size:0.8rem;font-weight:600;">${s.name} · ${s.level}</span>`).join('');
        const exps    = (siteData.experience||[]).map(e=>`<div style="margin-bottom:16px;"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;"><strong style="color:var(--text);">${e.role}</strong><span style="color:var(--muted);font-size:.8rem;">${e.date}</span></div><div style="color:var(--accent);font-size:.85rem;margin-bottom:4px;">${e.company}</div><p style="color:var(--muted);font-size:.85rem;margin:0;">${e.desc||''}</p></div>`).join('');
        const projs   = (siteData.projects||[]).map(p=>`<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;transition:.3s;" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 20px rgba(0,0,0,.2)'" onmouseout="this.style.transform='none';this.style.boxShadow='none'"><h4 style="color:var(--text);margin:0 0 6px;font-size:1rem;">${p.name}</h4><div style="margin-bottom:8px;">${(p.tags||'').split(',').map(t=>`<span style="background:var(--accent-soft);color:var(--accent);padding:2px 8px;border-radius:10px;font-size:.72rem;font-weight:600;margin-right:4px;">${t.trim()}</span>`).join('')}</div><p style="color:var(--muted);font-size:.82rem;margin:0;">${p.desc||''}</p></div>`).join('');
        const navLinks = '<a href="#about" style="color:var(--muted);text-decoration:none;font-weight:600;transition:.2s;" onmouseover="this.style.color=\'var(--accent)\'" onmouseout="this.style.color=\'var(--muted)\'">About</a><a href="#projects" style="color:var(--muted);text-decoration:none;font-weight:600;" onmouseover="this.style.color=\'var(--accent)\'" onmouseout="this.style.color=\'var(--muted)\'">Projects</a><a href="#contact" style="color:var(--muted);text-decoration:none;font-weight:600;" onmouseover="this.style.color=\'var(--accent)\'" onmouseout="this.style.color=\'var(--muted)\'">Contact</a>';

        // Theme variables
        const themes = {
            dark:  { bg:'#0f172a', text:'#f8fafc', muted:'#94a3b8', card:'#1e293b', border:'#334155', accent:'#a855f7', accentSoft:'rgba(168,85,247,.15)', nav:'#1e293b' },
            light: { bg:'#f8fafc', text:'#1e293b', muted:'#64748b', card:'#ffffff', border:'#e2e8f0', accent:'#4f46e5', accentSoft:'rgba(79,70,229,.1)', nav:'#ffffff' },
        };
        const t = themes[siteData.theme] || themes.dark;

        // Special layouts per template num
        let bodyHTML = '';
        const base = `--bg:${t.bg};--text:${t.text};--muted:${t.muted};--card:${t.card};--border:${t.border};--accent:${t.accent};--accent-soft:${t.accentSoft};--nav:${t.nav};`;

        if (num === 4 || num === 20) {
            // Terminal
            bodyHTML = `<style>body{background:#000;color:#22c55e;font-family:'Fira Code',monospace;}a{color:#22c55e;}</style>
            <div style="padding:40px;max-width:900px;margin:0 auto;">
                <div style="margin-bottom:30px;"><span style="color:#22c55e;font-size:1.5rem;font-weight:700;">$ whoami</span><br><span style="font-size:2rem;font-weight:900;">${siteData.name||'John Doe'}</span></div>
                <div style="margin-bottom:20px;"><span style="color:#4ade80;">→ role:</span> ${siteData.title||'Developer'}</div>
                <div style="margin-bottom:20px;color:#86efac;">${siteData.about||''}</div>
                <div style="margin-bottom:20px;"><span style="color:#4ade80;">→ skills:</span><br><div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px;">${(siteData.skills||[]).map(s=>`<span style="border:1px solid #22c55e;padding:3px 10px;border-radius:4px;font-size:.8rem;">${s.name}</span>`).join('')}</div></div>
                <div><span style="color:#4ade80;">→ projects:</span>${(siteData.projects||[]).map(p=>`<div style="margin-top:12px;border-left:3px solid #22c55e;padding-left:12px;"><div style="font-weight:700;">${p.name}</div><div style="color:#86efac;font-size:.82rem;">${p.desc||''}</div></div>`).join('')}</div>
            </div>`;
        } else if (num === 3 || num === 22) {
            // Brutalist
            bodyHTML = `<style>body{background:#fff;color:#000;font-family:'Helvetica',Arial,sans-serif;font-weight:700;}</style>
            <div style="max-width:900px;margin:0 auto;">
                <div style="border-bottom:6px solid #000;padding:30px;"><div style="font-size:clamp(2rem,6vw,4rem);font-weight:900;text-transform:uppercase;line-height:1;">${siteData.name||'YOUR NAME'}</div><div style="font-size:1.2rem;margin-top:8px;">${siteData.title||'TITLE'}</div></div>
                <div style="display:grid;grid-template-columns:1fr 2fr;border-bottom:4px solid #000;">
                    <div style="border-right:4px solid #000;padding:20px;background:#fff9c4;">${(siteData.skills||[]).map(s=>`<div style="border:3px solid #000;padding:5px 10px;margin-bottom:6px;box-shadow:4px 4px 0 #000;">${s.name}</div>`).join('')}</div>
                    <div style="padding:20px;">${(siteData.projects||[]).map(p=>`<div style="border:3px solid #000;padding:14px;margin-bottom:12px;box-shadow:6px 6px 0 #000;"><div style="font-size:1.1rem;font-weight:900;margin-bottom:6px;">${p.name}</div><div style="font-weight:400;">${p.desc||''}</div></div>`).join('')}</div>
                </div>
            </div>`;
        } else if (num === 30) {
            // Marvel
            bodyHTML = `<style>body{background:#18181b;color:#fff;font-family:'Anton',sans-serif;}@import url('https://fonts.googleapis.com/css2?family=Anton&display=swap');</style>
            <div style="max-width:1000px;margin:0 auto;padding:30px;">
                <div style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:40px;border-radius:16px;margin-bottom:24px;position:relative;overflow:hidden;">
                    <div style="position:absolute;right:-20px;top:-20px;width:150px;height:150px;background:rgba(234,179,8,.1);border-radius:50%;"></div>
                    <div style="font-size:clamp(2rem,5vw,3.5rem);font-weight:900;letter-spacing:2px;text-transform:uppercase;">${siteData.name||'HERO NAME'}</div>
                    <div style="font-size:1.1rem;color:rgba(255,255,255,.8);margin-top:4px;">${siteData.title||'SUPERHERO ROLE'}</div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <div style="background:#27272a;border:1px solid rgba(220,38,38,.3);border-radius:12px;padding:20px;">
                        <div style="color:#dc2626;font-size:.8rem;letter-spacing:.1em;margin-bottom:10px;">ABILITIES</div>
                        ${(siteData.skills||[]).map(s=>`<div style="padding:6px 0;border-bottom:1px solid #3f3f46;color:#e4e4e7;font-family:Arial;font-size:.85rem;">⚡ ${s.name}</div>`).join('')}
                    </div>
                    <div style="background:#27272a;border:1px solid rgba(220,38,38,.3);border-radius:12px;padding:20px;">
                        <div style="color:#dc2626;font-size:.8rem;letter-spacing:.1em;margin-bottom:10px;">MISSIONS</div>
                        ${(siteData.projects||[]).map(p=>`<div style="padding:8px 0;border-bottom:1px solid #3f3f46;font-family:Arial;font-size:.85rem;color:#e4e4e7;">${p.name}<br><span style="color:#71717a;">${p.desc||''}</span></div>`).join('')}
                    </div>
                </div>
            </div>`;
        } else {
            // Default layout (works for all other templates)
            const headerStyle = [5,14,25].includes(num)
                ? `background:linear-gradient(-45deg,#ee7752,#e73c7e,#23a6d5,#23d5ab);background-size:400% 400%;animation:gradBG 15s ease infinite;color:white;`
                : `background:var(--accent);color:white;`;
            bodyHTML = `<style>
                :root{${base}}
                body{background:var(--bg);color:var(--text);font-family:'${font}',sans-serif;margin:0;}
                nav{background:var(--nav);border-bottom:1px solid var(--border);padding:15px 5%;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:100;}
                .pf-hero{${headerStyle}padding:80px 5%;text-align:center;}
                .pf-hero h1{font-size:clamp(2rem,5vw,3.5rem);font-weight:900;margin:0 0 10px;}
                .pf-hero p{opacity:.85;max-width:600px;margin:0 auto 24px;font-size:1.05rem;line-height:1.6;}
                .pf-btn-hero{background:rgba(255,255,255,.2);color:white;border:2px solid rgba(255,255,255,.5);padding:12px 28px;border-radius:30px;font-weight:700;text-decoration:none;backdrop-filter:blur(8px);}
                section{padding:60px 5%;}
                .section-title{font-size:1.8rem;font-weight:800;margin-bottom:24px;color:var(--text);}
                .skills-wrap{display:flex;flex-wrap:wrap;gap:10px;}
                .proj-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;}
                footer{background:var(--card);border-top:1px solid var(--border);padding:30px 5%;text-align:center;color:var(--muted);}
                a{color:var(--accent);text-decoration:none;}
                @keyframes gradBG{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
            </style>
            <nav>
                <span style="font-weight:800;font-size:1.1rem;color:var(--text);">${siteData.name||'Portfolio'}</span>
                <div style="display:flex;gap:20px;">${navLinks}</div>
            </nav>
            <div class="pf-hero">
                <img src="${siteData.photo}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;margin:0 auto 20px;display:block;border:3px solid rgba(255,255,255,.3);">
                <h1>${siteData.name||'Your Name'}</h1>
                <p>${siteData.title||'Your Title'}</p>
                <p style="font-size:.95rem;">${siteData.about||''}</p>
                <a class="pf-btn-hero" href="#contact">Hire Me</a>
            </div>
            <section id="about">
                <div class="section-title">Skills</div>
                <div class="skills-wrap">${skills||'<span style="color:var(--muted);">Add skills in the right panel</span>'}</div>
            </section>
            <section style="background:var(--card);border-top:1px solid var(--border);border-bottom:1px solid var(--border);">
                <div class="section-title">Experience</div>
                ${exps||'<p style="color:var(--muted);">Add experience in the right panel</p>'}
            </section>
            <section id="projects">
                <div class="section-title">Projects</div>
                <div class="proj-grid">${projs||'<p style="color:var(--muted);">Add projects in the right panel</p>'}</div>
            </section>
            <section id="contact">
                <div class="section-title">Get In Touch</div>
                <div style="display:flex;gap:20px;flex-wrap:wrap;">
                    ${siteData.email?`<a href="mailto:${siteData.email}" style="display:flex;align-items:center;gap:8px;color:var(--muted);font-weight:600;"><i class="fas fa-envelope" style="color:var(--accent);"></i>${siteData.email}</a>`:''}
                    ${siteData.linkedin?`<a href="${formatUrl(siteData.linkedin)}" target="_blank" style="display:flex;align-items:center;gap:8px;color:var(--muted);font-weight:600;"><i class="fab fa-linkedin" style="color:var(--accent);"></i>LinkedIn</a>`:''}
                    ${siteData.github?`<a href="${formatUrl(siteData.github)}" target="_blank" style="display:flex;align-items:center;gap:8px;color:var(--muted);font-weight:600;"><i class="fab fa-github" style="color:var(--accent);"></i>GitHub</a>`:''}
                    ${siteData.phone?`<span style="display:flex;align-items:center;gap:8px;color:var(--muted);font-weight:600;"><i class="fas fa-phone" style="color:var(--accent);"></i>${siteData.phone}</span>`:''}
                </div>
            </section>
            <footer><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><p style="margin:0;">© ${new Date().getFullYear()} ${siteData.name||'Portfolio'} · Built with WorkFolio</p></footer>`;
        }

        iframe.srcdoc = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g,'+')}:wght@300;400;600;700;800;900&family=Anton&family=Fira+Code&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></head><body>${bodyHTML}</body></html>`;
        saveProject();
    } catch(e) { console.error('Preview failed:', e); }
};

// ═══════════════════════════════════════════
//  ADVANCED AI CO-PILOT
// ═══════════════════════════════════════════
function aiReply(text, delay=800) {
    const chat = document.getElementById('aiChat');
    if (!chat) return;
    // Show typing indicator
    const thinkId = 'think_'+Date.now();
    chat.innerHTML += `<div class="ai-bubble thinking" id="${thinkId}"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
    chat.scrollTop = chat.scrollHeight;
    setTimeout(() => {
        const think = document.getElementById(thinkId);
        if (think) think.outerHTML = `<div class="ai-bubble bot">${text}</div>`;
        chat.scrollTop = chat.scrollHeight;
    }, delay);
}

// Intent → action map
const aiIntents = [
    // Themes
    { pattern:/dark|night|black/i, action(p){ siteData.theme='dark'; document.getElementById('themeSelect').value='dark'; return '🌙 Switched to Dark Mode!'; } },
    { pattern:/light|white|bright|clean/i, action(p){ siteData.theme='light'; document.getElementById('themeSelect').value='light'; return '☀️ Switched to Light Mode!'; } },
    // Layouts
    { pattern:/bento|grid|card.*layout/i, action(){ siteData.layoutId='tpl_1'; syncSelect('templateSelect','tpl_1'); return '⬛ Applied Bento Grid layout!'; } },
    { pattern:/minimal|simple|plain/i, action(){ siteData.layoutId='tpl_2'; syncSelect('templateSelect','tpl_2'); return '✨ Applied Minimalist layout!'; } },
    { pattern:/brutal|brutalist/i, action(){ siteData.layoutId='tpl_3'; syncSelect('templateSelect','tpl_3'); return '💥 Applied Neo-Brutalism!'; } },
    { pattern:/terminal|hacker|code.*theme|matrix/i, action(){ siteData.layoutId='tpl_4'; syncSelect('templateSelect','tpl_4'); return '💻 Booting Terminal mode...'; } },
    { pattern:/glass|glassmorphi/i, action(){ siteData.layoutId='tpl_5'; syncSelect('templateSelect','tpl_5'); return '🔮 Glassmorphism applied!'; } },
    { pattern:/cyber|neon|punk/i, action(){ siteData.layoutId='tpl_6'; syncSelect('templateSelect','tpl_6'); return '⚡ Cyberpunk Neon activated!'; } },
    { pattern:/corporate|business|professional/i, action(){ siteData.layoutId='tpl_7'; syncSelect('templateSelect','tpl_7'); return '💼 Corporate Pro layout applied!'; } },
    { pattern:/split.*screen|side.*by.*side/i, action(){ siteData.layoutId='tpl_9'; syncSelect('templateSelect','tpl_9'); return '📐 Split Screen layout applied!'; } },
    { pattern:/marvel|avenger|comic|superhero|assemble/i, action(){ siteData.layoutId='tpl_30'; syncSelect('templateSelect','tpl_30'); return '🦸 AVENGERS ASSEMBLE! Marvel theme engaged.'; } },
    { pattern:/retro|vintage|90s/i, action(){ siteData.layoutId='tpl_15'; syncSelect('templateSelect','tpl_15'); return '📼 Retro 90s theme applied!'; } },
    { pattern:/aurora|gradient.*wave/i, action(){ siteData.layoutId='tpl_25'; syncSelect('templateSelect','tpl_25'); return '🌌 Aurora gradient theme applied!'; } },
    // Colors
    { pattern:/color.*purple|purple.*color|accent.*purple/i, action(){ return applyAccentColor('#a855f7','purple'); } },
    { pattern:/color.*blue|blue.*color/i, action(){ return applyAccentColor('#3b82f6','blue'); } },
    { pattern:/color.*red|red.*color/i, action(){ return applyAccentColor('#ef4444','red'); } },
    { pattern:/color.*green|green.*color/i, action(){ return applyAccentColor('#10b981','green'); } },
    { pattern:/color.*orange|orange.*color/i, action(){ return applyAccentColor('#f97316','orange'); } },
    { pattern:/color.*pink|pink.*color/i, action(){ return applyAccentColor('#ec4899','pink'); } },
    // Fonts
    { pattern:/font.*roboto|roboto.*font/i, action(){ return applyFont('Roboto'); } },
    { pattern:/font.*inter|inter.*font/i, action(){ return applyFont('Inter'); } },
    { pattern:/font.*montserrat/i, action(){ return applyFont('Montserrat'); } },
    { pattern:/font.*poppins/i, action(){ return applyFont('Poppins'); } },
    { pattern:/font.*mono|monospace/i, action(){ return applyFont('Space Mono'); } },
    { pattern:/font.*serif/i, action(){ return applyFont('Playfair Display'); } },
    { pattern:/change font to (\w[\w\s]*)/i, action(p){ const m=p.match(/change font to ([\w\s]+)/i); if(m) return applyFont(m[1].trim()); } },
    // Content
    { pattern:/add.*project|new project/i, action(){ addListItem('projects'); renderListUI('projects'); return '📁 New project added! Fill in the details in the right panel.'; } },
    { pattern:/add.*skill|new skill/i, action(){ addListItem('skills'); renderListUI('skills'); return '⚡ New skill added! Fill it in on the right.'; } },
    { pattern:/add.*experience|new.*job/i, action(){ addListItem('experience'); renderListUI('experience'); return '💼 New experience entry added!'; } },
    // Name / title
    { pattern:/my name is ([A-Za-z\s]+)/i, action(p){ const m=p.match(/my name is ([A-Za-z\s]+)/i); if(m){const n=m[1].trim();siteData.name=n;setField('pName',n);return `✅ Name set to "${n}"!`;} } },
    { pattern:/i am a? ?([A-Za-z\s]+)/i, action(p){ const m=p.match(/i am a? ?([\w\s]+)/i); if(m){const t=m[1].trim();siteData.title=t;setField('pTitle',t);return `✅ Title set to "${t}"!`;} } },
    // Resume sync
    { pattern:/import.*resume|sync.*resume|use.*resume/i, action(){ syncFromResume(); return '📄 Syncing your resume data...'; } },
    // Help
    { pattern:/help|what can|commands|what do/i, action(){ return `Here's what I can do:<br>🎨 <b>Layouts:</b> "switch to bento", "make it terminal", "apply glassmorphism"<br>🌙 <b>Themes:</b> "dark mode", "light mode"<br>🎨 <b>Colors:</b> "color purple", "accent blue"<br>Aa <b>Fonts:</b> "font Roboto", "change font to Inter"<br>➕ <b>Content:</b> "add a project", "add a skill"<br>📄 <b>Sync:</b> "import my resume"<br>🦸 <b>Fun:</b> "Avengers Assemble!"`; } },
];

function syncSelect(id, val) { const el=document.getElementById(id); if(el) el.value=val; }
function setField(id, val) { const el=document.getElementById(id); if(el) el.value=val; }
function applyAccentColor(hex, name) {
    // We set a CSS variable override on the iframe - reflected on next render
    siteData.accentColor = hex;
    return `🎨 Accent color changed to ${name}!`;
}
function applyFont(fontName) {
    siteData.font = fontName;
    const el = document.getElementById('fontSelect');
    if (el) { const opt=Array.from(el.options).find(o=>o.value.toLowerCase()===fontName.toLowerCase()); if(opt) el.value=opt.value; }
    return `Aa Font changed to ${fontName}!`;
}

window.sendAI = function() {
    const input = document.getElementById('aiInput');
    const prompt = (input.value||'').trim();
    if (!prompt) return;
    const chat = document.getElementById('aiChat');
    chat.innerHTML += `<div class="ai-bubble user">${prompt}</div>`;
    input.value = '';
    chat.scrollTop = chat.scrollHeight;

    // Find matching intent
    let matched = false;
    for (const intent of aiIntents) {
        if (intent.pattern.test(prompt)) {
            const response = intent.action(prompt);
            if (response) {
                matched = true;
                aiReply(response);
                syncSidebarUI();
                setTimeout(() => updatePreview(), 900);
                break;
            }
        }
    }
    if (!matched) {
        // Fuzzy fallback — check for common words
        if (/template|layout|theme/i.test(prompt)) {
            aiReply(`I can switch layouts! Try: "bento grid", "terminal", "glassmorphism", "brutalist", "Marvel", "split screen" and more.`);
        } else if (/font|typeface|text/i.test(prompt)) {
            aiReply(`I can change fonts! Try: "font Roboto", "change font to Poppins", or "use monospace". I have 30+ fonts available.`);
        } else if (/color|accent|palette/i.test(prompt)) {
            aiReply(`I can change accent colors! Try: "color purple", "accent blue", "color red", etc.`);
        } else {
            aiReply(`I'm not sure about that — but I'm always learning! Try typing "help" to see all my commands. 🤖`);
        }
    }
};

// ── EXPORT & SHARE ─────────────────────────
window.exportCode = function() {
    const iframe = document.getElementById('livePreview');
    const blob   = new Blob([iframe.srcdoc], { type: 'text/html' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = `${(siteData.name||'Portfolio').replace(/\s+/g,'_')}_Portfolio.html`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
};

window.syncFromResume = function() {
    try {
        // Try per-user key first, then fall back to legacy flat key
        let sessionData = null;
        try { sessionData = JSON.parse(sessionStorage.getItem('workfolio_session') || localStorage.getItem('workfolio_session') || 'null'); } catch(e) {}
        const resumeKey = 'workfolio_resumes_' + (sessionData ? sessionData.username : 'guest');
        let resumes = JSON.parse(localStorage.getItem(resumeKey) || localStorage.getItem('workfolio_resumes') || '[]');
        if (!resumes.length) { aiReply('❌ No saved resumes found. Build a resume first in Resume Studio!'); return; }
        const r = resumes[resumes.length - 1];
        const p = r.personal || {};
        siteData.photo    = (p.photo && p.photo.length > 50) ? p.photo : siteData.photo;
        siteData.name     = p.name    || siteData.name;
        siteData.title    = p.title   || siteData.title;
        siteData.about    = p.summary || siteData.about;
        siteData.email    = p.email   || siteData.email;
        siteData.linkedin = p.linkedin || siteData.linkedin;
        siteData.github   = p.github  || siteData.github;
        siteData.phone    = p.phone   || siteData.phone;
        siteData.location = p.location || siteData.location;
        if (r.skills?.length)     siteData.skills     = r.skills.map((s,i)=>({id:Date.now()+i,name:s.name,level:s.level||'Intermediate'}));
        if (r.experience?.length) siteData.experience = r.experience.map((e,i)=>({id:Date.now()+i,role:e.title,company:e.company,date:e.date,desc:e.desc}));
        if (r.projects?.length)   siteData.projects   = r.projects.map((p,i)=>({id:Date.now()+i,name:p.name,tags:p.tech||'',desc:p.desc}));
        syncSidebarUI(); updatePreview();
        aiReply('✅ Resume data imported! Your name, skills, experience, and projects have been synced.');
    } catch(e) { console.error(e); aiReply('❌ Could not sync resume. Please save your resume first.'); }
};

window.shareViaEmail = function(e) {
    e.preventDefault();
    const rec = document.getElementById('shareEmail').value;
    const sub = encodeURIComponent(document.getElementById('shareSubject').value);
    const msg = encodeURIComponent(document.getElementById('shareMessage').value + '\n\n(Portfolio built with WorkFolio)');
    window.location.href = `mailto:${rec}?subject=${sub}&body=${msg}`;
    document.getElementById('shareModal').classList.remove('open');
};

// ── INIT ──────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    // Populate selects
    const tplSel = document.getElementById('templateSelect');
    if (tplSel) tplSel.innerHTML = tailwindConfigs.map(t=>`<option value="${t.id}">${t.name} · ${t.category}</option>`).join('');
    const fontSel = document.getElementById('fontSelect');
    if (fontSel) fontSel.innerHTML = popularFonts.map(f=>`<option value="${f}">${f}</option>`).join('');

    // Restore view
    const lastView  = sessionStorage.getItem('pf_current_view') || 'view-dashboard';
    const lastIndex = sessionStorage.getItem('pf_active_index');
    if (lastView === 'view-editor' && lastIndex !== null) {
        const sites = getSavedSites();
        if (sites[parseInt(lastIndex)]) {
            siteData = sites[parseInt(lastIndex)]; activeSiteIndex = parseInt(lastIndex);
            syncSidebarUI(); updatePreview();
            document.querySelectorAll('.pf-view').forEach(v=>v.classList.remove('active'));
            document.getElementById('view-editor').classList.add('active');
            return;
        }
    }
    renderDashboard();
});
