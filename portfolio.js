// =========================================================
// === AUTONOMOUS AI + 30 TEMPLATES ENGINE (PERFECT UX)  ===
// =========================================================

// --- DASHBOARD CSS ---
const dashboardStyles = document.createElement('style');
dashboardStyles.innerHTML = `
    .project-card.glass { background: rgba(30, 41, 59, 0.4) !important; backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important; border-radius: 16px !important; }
    .project-card.glass:hover { border-color: rgba(168, 85, 247, 0.5) !important; box-shadow: 0 12px 40px rgba(168, 85, 247, 0.25) !important; transform: translateY(-5px); }
    .project-preview.mini-layout { padding: 0 !important; position: relative; overflow: hidden; border-bottom: 1px solid rgba(255,255,255,0.1) !important; cursor: pointer; height: 160px; }
    .project-actions.glass-actions { background: rgba(0,0,0,0.2) !important; border-top: 1px solid rgba(255,255,255,0.05) !important; }
    .btn-edit.glass-btn { background: rgba(255,255,255,0.1) !important; color: white !important; border: 1px solid transparent !important; }
    .btn-edit.glass-btn:hover { background: rgba(255,255,255,0.2) !important; }
    .ai-suggestion-btn { background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.4); color: #d8b4fe; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; cursor: pointer; margin-top: 8px; display: inline-block; transition: 0.2s; }
    .ai-suggestion-btn:hover { background: rgba(168, 85, 247, 0.3); color: #fff; }
`;
document.head.appendChild(dashboardStyles);

function getPortfolioDBKey() {
    let session = null;
    try { session = JSON.parse(sessionStorage.getItem('workfolio_session') || localStorage.getItem('workfolio_session')); } catch(e) {}
    return 'workfolio_portfolios_v10_' + (session ? session.username : 'guest');
}

const popularFonts = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia", "Palatino", "Garamond", "Bookman", "Tahoma", "Trebuchet MS", "Arial Black", "Impact", "Comic Sans MS", "Century Gothic", "Lucida Console", "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald", "Source Sans Pro", "Raleway", "PT Sans", "Merriweather", "Noto Sans", "Nunito", "Poppins", "Playfair Display", "Rubik", "Ubuntu", "Work Sans", "Fira Sans", "Quicksand", "Inter", "Josefin Sans", "Karla", "Arimo", "Libre Baskerville", "Anton", "Bebas Neue", "Dancing Script", "Pacifico", "Lobster", "Righteous", "Cinzel", "Inconsolata", "Fjalla One", "Mukta", "Cabin", "Space Mono"];

(function initDB() { try { if (!localStorage.getItem(getPortfolioDBKey())) localStorage.setItem(getPortfolioDBKey(), '[]'); } catch(e) {} })();

const formatUrl = (url) => { if (!url) return ''; return /^https?:\/\//i.test(url) ? url : `https://${url}`; };

const getEmptySite = () => ({
    id: Date.now(), lastEdited: new Date().toLocaleString(),
    layoutId: 'tpl_1', theme: 'dark', font: 'Inter',
    photo: 'https://ui-avatars.com/api/?name=JD&background=4F46E5&color=fff&size=200',
    name: 'John Doe', title: 'Creative Software Engineer',
    about: 'I build high-performance applications with a focus on incredible user experiences and scalable architecture.',
    email: 'hi@example.com', linkedin: 'https://linkedin.com/in/johndoe', github: 'https://github.com/johndoe',
    phone: '', location: '', contactEmail: '',
    skills: [ { id: 1, name: 'React', level: 'Expert' } ],
    experience: [ { id: 1, role: 'Senior Dev', company: 'Tech Corp', date: '2022 - Present', desc: 'Led frontend architecture.' } ],
    projects: [ { id: 1, name: 'SaaS Platform', tags: 'React, Node', desc: 'A full-stack analytics dashboard.' } ],
    certs: [ { id: 1, name: 'AWS Certified Solutions Architect', date: '2023' } ]
});

let siteData = getEmptySite();
let activeSiteIndex = -1;

// --- 1. DASHBOARD & SYSTEM STATE ---
window.switchView = function(viewId) {
    document.getElementById('view-dashboard').style.display = 'none';
    document.getElementById('view-editor').style.display = 'none';
    document.getElementById(viewId).style.display = viewId === 'view-editor' ? 'flex' : 'block';
    sessionStorage.setItem('pf_current_view', viewId);
    if(viewId === 'view-dashboard') { sessionStorage.removeItem('pf_active_index'); renderDashboard(); }
};

function getSavedSites() { 
    try { const data = localStorage.getItem(getPortfolioDBKey()); return data ? JSON.parse(data).filter(s => s && s.id) : []; } catch(e) { return []; }
}

function getMiniPreview(layoutId) {
    const safeId = layoutId || 'tpl_1';
    const num = parseInt(safeId.replace('tpl_', '')) || 1;

    let bg = '#0f172a'; let p = '#a855f7'; let s = '#334155'; let layout = 'standard';
    
    if ([2, 13, 17, 26].includes(num)) { bg = '#ffffff'; p = '#000000'; s = '#e2e8f0'; } 
    if ([3, 22].includes(num)) { bg = '#fde047'; p = '#000000'; s = '#ffffff'; layout = 'brutal'; } 
    if ([4, 20].includes(num)) { bg = '#000000'; p = '#22c55e'; s = '#064e3b'; layout = 'terminal'; } 
    if ([5, 14, 25].includes(num)) { bg = 'linear-gradient(135deg, #3b82f6, #ec4899)'; p = 'rgba(255,255,255,0.4)'; s = 'rgba(255,255,255,0.2)'; } 
    if ([6, 28].includes(num)) { bg = '#020617'; p = '#06b6d4'; s = '#1e293b'; } 
    if ([9, 16].includes(num)) { layout = 'split'; p = '#3b82f6'; } 
    if ([1, 12, 29].includes(num)) { layout = 'bento'; p = '#8b5cf6'; } 
    if (num === 30) { bg = '#000000'; p = '#dc2626'; s = '#eab308'; layout = 'marvel'; } 

    let inner = '';
    if (layout === 'bento') {
        inner = `<div style="display:grid; grid-template-columns: 2fr 1fr; gap:6px; height:100%; padding:12px;"><div style="background:${p}; border-radius:8px; grid-row:span 2; opacity:0.8;"></div><div style="background:${s}; border-radius:8px; opacity:0.6;"></div><div style="background:${s}; border-radius:8px; opacity:0.6;"></div></div>`;
    } else if (layout === 'split') {
        inner = `<div style="display:flex; height:100%;"><div style="width:35%; background:${p}; opacity:0.9;"></div><div style="width:65%; background:transparent; padding:12px; display:flex; flex-direction:column; gap:6px;"><div style="width:80%; height:12px; background:${s}; border-radius:4px; opacity:0.5;"></div><div style="width:100%; height:30px; background:${s}; border-radius:4px; opacity:0.3;"></div></div></div>`;
    } else if (layout === 'marvel') {
        inner = `<div style="display:flex; align-items:center; justify-content:center; height:100%; position:relative;"><div style="position:absolute; width:100%; height:4px; background:${s}; opacity:0.5;"></div><div style="width:50px; height:50px; border-radius:50%; background:${p}; border:2px solid ${s}; box-shadow:0 0 15px ${p}; z-index:2;"></div></div>`;
    } else if (layout === 'terminal') {
         inner = `<div style="padding:12px; display:flex; flex-direction:column; gap:6px;"><div style="color:${p}; font-family:monospace; font-size:10px; font-weight:bold;">> init_</div><div style="width:60%; height:8px; background:${p}; opacity:0.7;"></div><div style="width:40%; height:8px; background:${p}; opacity:0.5;"></div></div>`;
    } else {
        inner = `<div style="display:flex; flex-direction:column; height:100%; padding:12px; gap:8px;"><div style="width:100%; height:35px; background:${p}; border-radius:6px; opacity:0.8;"></div><div style="width:50%; height:8px; background:${s}; border-radius:4px; opacity:0.5;"></div><div style="display:flex; gap:6px; flex-grow:1;"><div style="flex:1; background:${s}; border-radius:6px; opacity:0.4;"></div><div style="flex:1; background:${s}; border-radius:6px; opacity:0.4;"></div></div></div>`;
    }
    return `<div style="width:100%; height:100%; background:${bg}; position:absolute; inset:0;">${inner}</div>`;
}

function renderDashboard() {
    try {
        const grid = document.getElementById('dashboardGrid');
        const sites = getSavedSites();
        if (!sites || sites.length === 0) { grid.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; text-align: center; background: rgba(30,41,59,0.5); backdrop-filter: blur(12px); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); color: #94a3b8;">No projects found. Create your first portfolio!</div>`; return; }
        
        grid.innerHTML = sites.map((site, index) => {
            if(!site) return '';
            const tplName = tailwindConfigs.find(t => t.id === (site.layoutId || 'tpl_1'))?.name || 'Custom Theme';
            return `
            <div class="project-card glass">
                <div class="project-preview mini-layout" onclick="loadProject(${index})">${getMiniPreview(site.layoutId)}</div>
                <div class="project-info"><div class="project-title">${site.name || 'Untitled'}'s Portfolio</div><div class="project-meta"><span>${tplName}</span> <span>${site.lastEdited || 'Recently'}</span></div></div>
                <div class="project-actions glass-actions"><button class="btn-edit glass-btn" onclick="loadProject(${index})"><i class="fas fa-pen"></i> Edit</button><button class="btn-del" onclick="deleteProject(${index})"><i class="fas fa-trash"></i> Delete</button></div>
            </div>`
        }).join('');
    } catch(e) { console.error(e); }
}

window.createNewProject = function() { siteData = getEmptySite(); activeSiteIndex = -1; syncSidebarUI(); updatePreview(); switchView('view-editor'); };

window.loadProject = function(index) { const sites = getSavedSites(); if(sites[index]) { siteData = sites[index]; activeSiteIndex = index; sessionStorage.setItem('pf_active_index', index); syncSidebarUI(); updatePreview(); switchView('view-editor'); } };

window.saveProject = function() {
    try { 
        siteData.lastEdited = new Date().toLocaleString();
        let sites = getSavedSites();
        if (activeSiteIndex === -1) { sites.push(siteData); activeSiteIndex = sites.length - 1; sessionStorage.setItem('pf_active_index', activeSiteIndex); } 
        else { sites[activeSiteIndex] = siteData; }
        
        localStorage.setItem(getPortfolioDBKey(), JSON.stringify(sites));
        const status = document.getElementById('saveStatus');
        if(status) { status.innerText = "Saved at " + new Date().toLocaleTimeString(); setTimeout(() => status.innerText = "", 3000); }
    } catch(e) {}
};

window.deleteProject = function(index) { if(confirm("Delete this project?")) { let sites = getSavedSites(); sites.splice(index, 1); localStorage.setItem(getPortfolioDBKey(), JSON.stringify(sites)); renderDashboard(); } };

window.handlePhotoUpload = function(event) {
    const file = event.target.files[0];
    if (file) { const reader = new FileReader(); reader.onload = function(e) { siteData.photo = e.target.result; if(document.getElementById('pPhotoPreview')) document.getElementById('pPhotoPreview').src = siteData.photo; updatePreview(); }; reader.readAsDataURL(file); }
};

// --- 2. DECOUPLED UX SYSTEM ---
let renderTimer;
function triggerDebouncedRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => { updatePreview(); }, 800);
}

window.updateData = function(key, val) { siteData[key] = val; triggerDebouncedRender(); };
window.switchLayout = function(id) { siteData.layoutId = id; updatePreview(); };
window.setViewport = function(width) { const container = document.getElementById('iframeWrapper'); if(container) { container.style.width = width; container.style.border = width !== '100%' ? '12px solid #1e293b' : '1px solid #334155'; } };

window.addListItem = function(type) {
    if(!siteData[type]) siteData[type] = [];
    if(type==='skills') siteData.skills.push({ id: Date.now(), name: 'New Skill', level: 'Intermediate' });
    if(type==='experience') siteData.experience.push({ id: Date.now(), role: 'New Role', company: 'Company', date: '2024', desc: 'Description' });
    if(type==='projects') siteData.projects.push({ id: Date.now(), name: 'New Project', tags: 'Tech', desc: 'Description' });
    if(type==='certs') siteData.certs.push({ id: Date.now(), name: 'New Cert', date: '2024' });
    
    renderListInputs(type + 'List', type);
    updatePreview();
};

window.removeListItem = function(type, id) { 
    siteData[type] = siteData[type].filter(i => i.id !== id); 
    renderListInputs(type + 'List', type);
    updatePreview(); 
};

window.editListItem = function(type, id, field, value) { 
    let item = siteData[type].find(i => i.id === id);
    if(item) { 
        item[field] = value; 
        triggerDebouncedRender();
    } 
};

function syncSidebarUI() {
    if (document.getElementById('pPhotoPreview')) document.getElementById('pPhotoPreview').src = siteData.photo || '';
    if (document.getElementById('pName')) document.getElementById('pName').value = siteData.name || '';
    if (document.getElementById('pTitle')) document.getElementById('pTitle').value = siteData.title || ''; 
    if (document.getElementById('pAbout')) document.getElementById('pAbout').value = siteData.about || '';
    if (document.getElementById('pEmail')) document.getElementById('pEmail').value = siteData.email || '';
    if (document.getElementById('pLinkedin')) document.getElementById('pLinkedin').value = siteData.linkedin || '';
    if (document.getElementById('pGithub')) document.getElementById('pGithub').value = siteData.github || '';
    if (document.getElementById('pPhone')) document.getElementById('pPhone').value = siteData.phone || '';
    if (document.getElementById('pLocation')) document.getElementById('pLocation').value = siteData.location || '';
    if (document.getElementById('pContactEmail')) document.getElementById('pContactEmail').value = siteData.contactEmail || '';

    const tplSel = document.getElementById('templateSelect'); if (tplSel && tplSel.value !== siteData.layoutId) tplSel.value = siteData.layoutId;
    const themeSel = document.getElementById('themeSelect');
    if (themeSel && themeSel.value !== siteData.theme) themeSel.value = siteData.theme;
    const fontSel = document.getElementById('fontSelect');
    if (fontSel && fontSel.value !== siteData.font) fontSel.value = siteData.font;

    if(siteData.skills) renderListInputs('skillsList', 'skills'); 
    if(siteData.experience) renderListInputs('experienceList', 'experience'); 
    if(siteData.projects) renderListInputs('projectsList', 'projects');
    if(siteData.certs) renderListInputs('certsList', 'certs');
}

function renderListInputs(containerId, type) {
    const el = document.getElementById(containerId);
    if (!el || !siteData[type]) return;
    const html = siteData[type].map(item => `
        <div style="background:#0f172a; padding:15px; border-radius:8px; margin-bottom:10px; border:1px solid #334155; position:relative;">
            <button onclick="removeListItem('${type}', ${item.id})" style="position:absolute; top:10px; right:10px; background:none; border:none; color:#ef4444; cursor:pointer;"><i class="fas fa-trash"></i></button>
            <input class="prop-input" style="margin-bottom:8px; font-weight:bold;" value="${item.name || item.role || ''}" placeholder="Name / Title" oninput="editListItem('${type}', ${item.id}, '${item.hasOwnProperty('role') ? 'role' : 'name'}', this.value)">
            ${type==='experience'?`<input class="prop-input" style="margin-bottom:8px; font-size:0.8rem;" value="${item.company || ''}" placeholder="Company" oninput="editListItem('${type}', ${item.id}, 'company', this.value)">`:''}
            ${type==='projects'?`<input class="prop-input" style="margin-bottom:8px; font-size:0.8rem;" value="${item.tags || ''}" placeholder="Tags (e.g. HTML, CSS)" oninput="editListItem('${type}', ${item.id}, 'tags', this.value)">`:''}
            ${type!=='skills'?`<input class="prop-input" style="margin-bottom:8px; font-size:0.8rem;" value="${item.date || ''}" placeholder="Date" oninput="editListItem('${type}', ${item.id}, 'date', this.value)">`:''}
            ${type==='experience'||type==='projects'?`<textarea class="prop-input" rows="2" style="font-size:0.85rem;" placeholder="Description" oninput="editListItem('${type}', ${item.id}, 'desc', this.value)">${item.desc || ''}</textarea>`:''}
        </div>
    `).join('');
    el.innerHTML = html;
}

// --- 3. TEMPLATES & RENDER ENGINE ---
const tailwindConfigs = [
    { id: 'tpl_1', name: "Trendy Bento Grid", bg: "bg-zinc-950 text-white", hero: "bg-gradient-to-br from-violet-600 to-indigo-900 rounded-3xl p-8 shadow-xl", card: "bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:-translate-y-2 transition-transform", anim: "animate-fade-in-up" },
    { id: 'tpl_2', name: "Clean Minimalist", bg: "bg-white text-zinc-900", hero: "py-24 border-b border-zinc-200", card: "border-l-4 border-zinc-900 pl-6 py-4 my-8 hover:ml-4 transition-all", anim: "animate-fade-in" },
    { id: 'tpl_3', name: "Neo-Brutalism", bg: "bg-yellow-300 text-black", hero: "bg-fuchsia-400 border-4 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]", card: "bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all", anim: "animate-bounce-short" },
    { id: 'tpl_4', name: "Developer Terminal", bg: "bg-black text-green-500", hero: "border border-green-500 p-8 shadow-[0_0_15px_#22c55e]", card: "border border-green-800 p-6 hover:bg-green-900/20 hover:border-green-400 transition-colors", anim: "animate-pulse", bgAnim: 'tech' },
    { id: 'tpl_5', name: "Glassmorphism", bg: "bg-zinc-900 text-white", hero: "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-12 shadow-2xl", card: "bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 hover:bg-white/20 transition-all", anim: "animate-fade-in", bgAnim: 'orbs' },
    { id: 'tpl_6', name: "Cyberpunk Neon", bg: "bg-slate-900 text-cyan-400", hero: "bg-black border-b-2 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] p-12", card: "bg-slate-800 border border-cyan-500 p-6 hover:shadow-[0_0_25px_rgba(6,182,212,0.8)] transition-shadow", anim: "animate-pulse" },
    { id: 'tpl_7', name: "Corporate Timeline", bg: "bg-slate-50 text-slate-800", hero: "bg-slate-800 text-white py-20 px-8 text-center rounded-b-3xl shadow-lg", card: "bg-white border border-slate-200 rounded-lg p-8 shadow-sm relative before:absolute before:-left-3 before:top-8 before:w-6 before:h-6 before:bg-blue-500 before:rounded-full ml-6", anim: "animate-slide-right" },
    { id: 'tpl_8', name: "Soft Neumorphism", bg: "bg-[#e0e5ec] text-slate-600", hero: "p-12 rounded-[2rem] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)]", card: "p-8 rounded-[2rem] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] hover:shadow-[inset_6px_6px_10px_0_rgba(163,177,198,0.7),inset_-6px_-6px_10px_0_rgba(255,255,255,0.8)] transition-shadow", anim: "animate-fade-in" },
    { id: 'tpl_9', name: "Dark Split-Screen", bg: "bg-zinc-900 text-zinc-300", hero: "md:fixed md:w-1/3 h-screen bg-black text-white p-12 flex flex-col justify-center border-r border-zinc-800", card: "bg-zinc-800 p-8 rounded-xl hover:bg-zinc-700 transition-colors", anim: "animate-fade-in", isSplit: true },
    { id: 'tpl_10', name: "Editorial Magazine", bg: "bg-[#Fdfbf7] text-[#2c2c2c]", hero: "py-24 text-center border-b border-black", card: "py-8 border-b border-black/10 hover:opacity-70 transition-opacity", anim: "animate-fade-in-up" },
    { id: 'tpl_11', name: "Synthwave Glitch", bg: "bg-fuchsia-950 text-cyan-300", hero: "bg-black border-4 border-cyan-400 shadow-[8px_8px_0_#d946ef] p-10", card: "bg-black border-2 border-fuchsia-500 shadow-[4px_4px_0_#06b6d4] hover:-translate-x-1 hover:-translate-y-1 transition-transform", anim: "animate-pulse", bgAnim: 'synthwave' },
    { id: 'tpl_12', name: "Kawaii Pastel", bg: "bg-pink-50 text-pink-900", hero: "bg-gradient-to-b from-pink-200 to-white rounded-[3rem] p-12 border-4 border-pink-300 shadow-[0_10px_0_#fbcfe8]", card: "bg-white rounded-3xl border-2 border-pink-200 p-6 hover:shadow-[0_10px_20px_rgba(244,114,182,0.3)] hover:-translate-y-2 transition-all", anim: "animate-bounce-short" },
    { id: 'tpl_13', name: "High-End Vogue", bg: "bg-white text-black", hero: "border-b border-black pb-20 pt-10 text-center uppercase tracking-widest", card: "border border-gray-200 p-10 hover:bg-black hover:text-white transition-colors duration-500 rounded-none", anim: "animate-fade-in" },
    { id: 'tpl_14', name: "Deep Space Glass", bg: "bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black text-indigo-100", hero: "bg-white/5 backdrop-blur-sm border border-indigo-500/30 p-12 rounded-full text-center shadow-[0_0_40px_rgba(79,70,229,0.2)]", card: "bg-white/5 backdrop-blur-md border border-indigo-500/20 p-6 rounded-2xl hover:border-indigo-400/50 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all", anim: "animate-fade-in-up" },
    { id: 'tpl_15', name: "8-Bit Arcade", bg: "bg-blue-900 text-white", hero: "bg-blue-800 border-[6px] border-white p-8 shadow-[8px_8px_0_#000]", card: "bg-blue-700 border-[4px] border-white p-6 shadow-[6px_6px_0_#000] hover:-translate-y-1 hover:shadow-[10px_10px_0_#000] transition-all", anim: "animate-pulse" },
    { id: 'tpl_16', name: "Eco Nature", bg: "bg-emerald-50 text-emerald-950", hero: "bg-emerald-800 text-emerald-50 rounded-br-[5rem] p-16 shadow-lg", card: "bg-white border border-emerald-100 rounded-tr-[2rem] rounded-bl-[2rem] p-8 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all", anim: "animate-fade-in" },
    { id: 'tpl_17', name: "Bauhaus Primary", bg: "bg-white text-black", hero: "border-8 border-black bg-red-600 text-white p-12 shadow-[15px_15px_0_#2563eb]", card: "border-4 border-black bg-yellow-400 text-black p-8 hover:bg-blue-600 hover:text-white hover:shadow-[10px_10px_0_#000] transition-colors", anim: "animate-slide-right" },
    { id: 'tpl_18', name: "Vaporwave Sunset", bg: "bg-gradient-to-b from-purple-900 to-orange-500 text-white", hero: "bg-black/40 backdrop-blur-sm border-t-4 border-pink-500 p-10 rounded-lg shadow-[0_0_20px_#ec4899]", card: "bg-black/30 border border-cyan-400/50 p-6 rounded hover:bg-pink-900/40 hover:border-pink-400 transition-colors", anim: "animate-fade-in-up" },
    { id: 'tpl_19', name: "Corporate Gold", bg: "bg-slate-900 text-amber-50", hero: "border-b border-amber-500/30 bg-slate-950 p-16 text-center", card: "bg-slate-800 border border-amber-500/20 p-8 rounded-lg hover:border-amber-400 hover:shadow-[0_0_15px_rgba(251,191,36,0.1)] transition-all", anim: "animate-fade-in" },
    { id: 'tpl_20', name: "Cyber Security", bg: "bg-black text-red-500", hero: "border border-red-600 bg-red-950/20 p-10 shadow-[inset_0_0_20px_rgba(220,38,38,0.3)]", card: "border-l-4 border-red-600 bg-zinc-900 p-6 hover:bg-red-950/40 hover:translate-x-2 transition-all", anim: "animate-pulse" },
    { id: 'tpl_21', name: "Blueprint Architect", bg: "bg-blue-900 text-white", hero: "border-4 border-white/50 border-dashed p-12 bg-blue-800/50", card: "border-2 border-white/30 p-6 hover:bg-blue-600 transition-colors relative before:absolute before:top-2 before:left-2 before:w-2 before:h-2 before:border before:border-white", anim: "animate-fade-in", bgAnim: 'geometric' },
    { id: 'tpl_22', name: "Pop Art Comic", bg: "bg-teal-400 text-black", hero: "bg-yellow-400 border-4 border-black p-10 rounded-[2rem] shadow-[8px_8px_0_#000] rotate-1", card: "bg-white border-4 border-black p-6 rounded-2xl shadow-[6px_6px_0_#000] hover:-rotate-2 transition-transform", anim: "animate-bounce-short" },
    { id: 'tpl_23', name: "Dracula IDE", bg: "bg-[#282a36] text-[#f8f8f2]", hero: "bg-[#44475a] border-l-4 border-[#ff79c6] p-10 rounded shadow-lg", card: "bg-[#44475a] border border-[#6272a4] p-6 rounded hover:border-[#50fa7b] hover:-translate-y-1 transition-all", anim: "animate-fade-in-up" },
    { id: 'tpl_24', name: "Scrapbook Grunge", bg: "bg-[#f5f5dc] text-zinc-800", hero: "bg-white p-10 shadow-md -rotate-1 border border-zinc-200 relative before:absolute before:-top-4 before:left-1/2 before:w-16 before:h-8 before:bg-yellow-500/20 before:-rotate-6", card: "bg-white p-8 shadow-sm border border-zinc-300 hover:rotate-2 hover:shadow-xl transition-all", anim: "animate-fade-in" },
    { id: 'tpl_25', name: "Liquid Aurora", bg: "bg-gradient-to-r from-teal-200 to-lime-200 text-teal-900", hero: "bg-white/30 backdrop-blur-lg p-16 rounded-[4rem] shadow-xl border border-white/50", card: "bg-white/40 backdrop-blur-md p-8 rounded-3xl hover:bg-white/60 hover:scale-105 transition-all", anim: "animate-fade-in-up" },
    { id: 'tpl_26', name: "Typographic Monolith", bg: "bg-zinc-100 text-black", hero: "text-center py-24", card: "border-t-8 border-black pt-6 pb-12 hover:bg-black hover:text-white transition-colors duration-300 px-6", anim: "animate-slide-right" },
    { id: 'tpl_27', name: "Retro Polaroid", bg: "bg-[#ece9e0] text-[#5c4a3d]", hero: "bg-white p-6 pb-16 shadow-lg border border-gray-200 max-w-2xl mx-auto rotate-1", card: "bg-white p-4 pb-12 shadow-md border border-gray-200 hover:-rotate-2 hover:shadow-xl transition-all", anim: "animate-fade-in" },
    { id: 'tpl_28', name: "Sci-Fi HUD", bg: "bg-zinc-950 text-cyan-500", hero: "border border-cyan-500/50 bg-cyan-950/10 p-12 rounded-[3rem] shadow-[inset_0_0_30px_rgba(6,182,212,0.2)]", card: "bg-black border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all", anim: "animate-pulse", bgAnim: 'hud' },
    { id: 'tpl_29', name: "Abstract Geometry", bg: "bg-indigo-50 text-indigo-950", hero: "bg-white p-12 rounded-tr-[4rem] rounded-bl-[4rem] shadow-xl border-2 border-indigo-100", card: "bg-white border-2 border-indigo-50 p-8 rounded-tl-[2rem] rounded-br-[2rem] hover:rounded-3xl hover:border-indigo-300 transition-all duration-300", anim: "animate-fade-in-up" },
    { id: 'tpl_30', name: "MARVEL Cinematic Assemble", bg: "bg-black text-zinc-200", hero: "", card: "", anim: "" }
];

function getScriptTag(scriptContent) { return '\x3Cscript\x3E' + scriptContent + '\x3C/script\x3E'; }

function renderBackgroundAnimation(type) {
    if (type === 'tech') {
        const sc = "const techBg = document.getElementById('tech-bg'); const icons = ['&lt;/&gt;', '{}', '()', '01', '[]', '#', '==']; for(let i=0; i<25; i++) { let el = document.createElement('div'); el.innerHTML = icons[Math.floor(Math.random() * icons.length)]; el.className = 'absolute text-green-500 font-mono text-2xl md:text-4xl font-bold'; el.style.left = Math.random() * 100 + 'vw'; el.style.animation = 'floatUpTech ' + (Math.random() * 10 + 10) + 's linear infinite'; el.style.animationDelay = (Math.random() * -10) + 's'; techBg.appendChild(el); }";
        return `<div id="tech-bg" class="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-20"></div><style>@keyframes floatUpTech { 0% { transform: translateY(100vh) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-20vh) rotate(360deg); opacity: 0; } }</style>${getScriptTag(sc)}`;
    }
    if (type === 'orbs') return `<div class="fixed inset-0 z-0 pointer-events-none overflow-hidden"><div class="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] opacity-50 animate-[orbAnim_10s_infinite_alternate]"></div><div class="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-[120px] opacity-50 animate-[orbAnim_12s_infinite_alternate-reverse]"></div><div class="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-50 animate-[orbAnim_14s_infinite_alternate]"></div></div><style>@keyframes orbAnim { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(80px, 80px) scale(1.2); } }</style>`;
    if (type === 'synthwave') return `<div class="fixed inset-0 z-0 pointer-events-none overflow-hidden perspective-[1000px] bg-black"><div class="absolute bottom-0 w-[200%] left-[-50%] h-[60vh] bg-[linear-gradient(transparent_95%,_#06b6d4_100%),linear-gradient(90deg,_transparent_95%,_#06b6d4_100%)] bg-[length:40px_40px] animate-[gridMove_2s_linear_infinite]" style="transform: rotateX(75deg); transform-origin: top;"></div><div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-t from-fuchsia-600 to-yellow-400 shadow-[0_0_60px_#d946ef] animate-pulse opacity-80"></div></div><style>@keyframes gridMove { 0% { background-position: 0 0; } 100% { background-position: 0 40px; } }</style>`;
    if (type === 'geometric') {
        const sc = "const geoBg = document.getElementById('geo-bg'); for(let i=0; i<15; i++) { let el = document.createElement('div'); el.className = 'absolute border-2 border-white/50 backdrop-blur-sm'; let size = Math.random() * 120 + 50; el.style.width = size + 'px'; el.style.height = size + 'px'; if(Math.random() > 0.5) el.style.borderRadius = '50%'; el.style.left = Math.random() * 100 + 'vw'; el.style.top = Math.random() * 100 + 'vh'; el.style.animation = 'floatAnim ' + (Math.random() * 20 + 15) + 's infinite alternate linear'; el.style.animationDelay = (Math.random() * -15) + 's'; geoBg.appendChild(el); }";
        return `<div id="geo-bg" class="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-30"></div>${getScriptTag(sc)}`;
    }
    if (type === 'hud') return `<div class="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-20"><div class="absolute w-[90vw] h-[90vw] md:w-[45vw] md:h-[45vw] border-[1px] border-dashed border-cyan-500 rounded-full animate-[spin_60s_linear_infinite]"></div><div class="absolute w-[80vw] h-[80vw] md:w-[35vw] md:h-[35vw] border-[3px] border-cyan-400/50 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div><div class="absolute w-[100vw] h-[100vw] md:w-[55vw] md:h-[55vw] border-[6px] border-dotted border-cyan-600/30 rounded-full animate-[spin_80s_linear_infinite]"></div></div>`;
    return '';
}

function renderContactSection(config) {
    if (!siteData.phone && !siteData.location && !siteData.contactEmail) return '';
    const isMarvel = config.id === 'tpl_30';
    const isDark = config.bg.includes('900') || config.bg.includes('black') || config.bg.includes('950');
    
    return `
    <div class="mb-16 z-10 relative">
        <h2 class="text-3xl font-bold mb-8 uppercase tracking-wide border-b-2 ${isDark ? 'border-white/10' : 'border-black/10'} ${isMarvel ? 'border-red-600 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500' : ''} pb-2 inline-block">Contact Me</h2>
        <div class="${isMarvel ? 'marvel-card rounded-xl p-8' : config.card}">
            <p class="mb-6 text-lg opacity-90">Ready to collaborate? Let's connect.</p>
            <div class="flex flex-col gap-4 mb-8">
                ${siteData.phone ? `<div><i class="fas fa-phone mr-3 opacity-70"></i> <strong>Phone:</strong> <span class="opacity-80 ml-2">${siteData.phone}</span></div>` : ''}
                ${siteData.location ? `<div><i class="fas fa-map-marker-alt mr-3 opacity-70"></i> <strong>Location:</strong> <span class="opacity-80 ml-2">${siteData.location}</span></div>` : ''}
            </div>
            ${siteData.contactEmail ? `<a href="mailto:${siteData.contactEmail}" target="_blank" rel="noopener noreferrer" class="inline-block ${isMarvel ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg shadow-blue-500/30">Send a Message</a>` : ''}
        </div>
    </div>`;
}

function renderMarvelSection(title, items) {
    if (!items || items.length === 0) return '';
    return `
    <div class="mb-16 z-10 relative">
        <h2 class="text-3xl font-bold mb-8 uppercase tracking-wide border-b-2 border-red-600 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 pb-2 inline-block">${title}</h2>
        <div class="space-y-6">
            ${items.map(item => `
                <div class="marvel-card rounded-xl p-6 transition-all duration-300 transform hover:-translate-y-2 group">
                    <h3 class="text-xl font-bold mb-1 text-white group-hover:text-yellow-400 transition-colors">${item.name || item.role || ''}</h3>
                    ${item.tags ? `<p class="text-xs font-mono mb-3 p-1 px-3 inline-block rounded-full bg-red-900/50 border border-red-500/50 text-red-200">${item.tags}</p>` : ''}
                    ${item.date ? `<p class="text-sm font-bold opacity-70 mb-3 text-gray-400">${item.company || ''} ${item.company && item.date ? '|' : ''} ${item.date}</p>` : ''}
                    ${item.level ? `<p class="text-sm font-bold opacity-70 mb-3 text-gray-400">${item.level}</p>` : ''}
                    ${item.desc ? `<p class="opacity-80 leading-relaxed text-gray-300">${item.desc}</p>` : ''}
                </div>
            `).join('')}
        </div>
    </div>`;
}

function renderEngine(config) {
    const isMarvel = config.id === 'tpl_30';
    const socialsHtml = `<div class="flex gap-5 mt-6 items-center ${isMarvel || config.isSplit ? 'justify-start' : ''}">
        ${siteData.email ? `<a href="mailto:${siteData.email}" class="opacity-70 hover:opacity-100 hover:-translate-y-1 transition-all"><i class="fas fa-envelope text-2xl"></i></a>` : ''}
        ${siteData.linkedin ? `<a href="${formatUrl(siteData.linkedin)}" target="_blank" rel="noopener noreferrer" class="opacity-70 hover:opacity-100 hover:-translate-y-1 transition-all"><i class="fab fa-linkedin text-2xl"></i></a>` : ''}
        ${siteData.github ? `<a href="${formatUrl(siteData.github)}" target="_blank" rel="noopener noreferrer" class="opacity-70 hover:opacity-100 hover:-translate-y-1 transition-all"><i class="fab fa-github text-2xl"></i></a>` : ''}
    </div>`;

    if (isMarvel) {
        const capShieldSVG = `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"><circle cx="50" cy="50" r="48" fill="#dc2626"/><circle cx="50" cy="50" r="38" fill="#e2e8f0"/><circle cx="50" cy="50" r="28" fill="#dc2626"/><circle cx="50" cy="50" r="18" fill="#2563eb"/><polygon points="50,35 54,45 65,45 56,52 60,63 50,56 40,63 44,52 35,45 46,45" fill="#f8fafc"/></svg>`;
        const ironManSVG = `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]"><circle cx="50" cy="50" r="45" fill="#1e293b"/><circle cx="50" cy="50" r="40" fill="#020617"/><circle cx="50" cy="50" r="38" fill="none" stroke="#06b6d4" stroke-width="4" stroke-dasharray="12 6"/><circle cx="50" cy="50" r="28" fill="#a5f3fc"/><circle cx="50" cy="50" r="20" fill="#ffffff" filter="drop-shadow(0 0 10px #ffffff)"/><rect x="46" y="10" width="8" height="12" fill="#d97706"/><rect x="46" y="78" width="8" height="12" fill="#d97706"/><rect x="10" y="46" width="12" height="8" fill="#d97706"/><rect x="78" y="46" width="12" height="8" fill="#d97706"/></svg>`;
        const thorHammerSVG = `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_25px_rgba(56,189,248,0.8)]"><rect x="42" y="40" width="16" height="55" fill="#78350f" rx="2"/><line x1="42" y1="45" x2="58" y2="48" stroke="#451a03" stroke-width="2"/><line x1="42" y1="55" x2="58" y2="58" stroke="#451a03" stroke-width="2"/><line x1="42" y1="65" x2="58" y2="68" stroke="#451a03" stroke-width="2"/><line x1="42" y1="75" x2="58" y2="78" stroke="#451a03" stroke-width="2"/><line x1="42" y1="85" x2="58" y2="88" stroke="#451a03" stroke-width="2"/><rect x="38" y="90" width="24" height="6" fill="#94a3b8" rx="2"/><path d="M20,15 L80,15 L85,40 L15,40 Z" fill="#94a3b8"/><path d="M15,40 L20,15 L25,15 L20,40 Z" fill="#cbd5e1"/><path d="M85,40 L80,15 L75,15 L80,40 Z" fill="#64748b"/><rect x="25" y="15" width="50" height="25" fill="#94a3b8"/><circle cx="50" cy="27" r="8" fill="none" stroke="#64748b" stroke-width="2"/><path d="M46,27 L54,27 M50,23 L50,31" stroke="#64748b" stroke-width="2"/></svg>`;
        const blackPantherSVG = `<svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]"><path d="M20,20 Q50,90 80,20" fill="none" stroke="#94a3b8" stroke-width="4"/><polygon points="25,28 30,45 20,40" fill="#f1f5f9"/><polygon points="40,55 45,75 35,70" fill="#f1f5f9"/><polygon points="50,70 55,95 45,95" fill="#f1f5f9"/><polygon points="60,55 55,75 65,70" fill="#f1f5f9"/><polygon points="75,28 70,45 80,40" fill="#f1f5f9"/></svg>`;

        const marvelScript = "const container = document.getElementById('marvel-particles'); const colors = ['#ef4444', '#eab308', '#3b82f6', '#a855f7', '#06b6d4', '#22c55e']; for(let i=0; i<40; i++) { let div = document.createElement('div'); div.className = 'absolute rounded-full mix-blend-screen'; let size = Math.random() * 150 + 50; div.style.width = size + 'px'; div.style.height = size + 'px'; div.style.background = 'radial-gradient(circle, ' + colors[Math.floor(Math.random()*colors.length)] + ' 0%, transparent 60%)'; div.style.left = Math.random() * 100 + 'vw'; div.style.top = Math.random() * 100 + 'vh'; div.style.opacity = Math.random() * 0.5 + 0.1; div.style.animation = 'floatAnim ' + (Math.random() * 10 + 10) + 's infinite ease-in-out alternate'; div.style.animationDelay = (Math.random() * -10) + 's'; container.appendChild(div); }";

        return `<div class="min-h-screen bg-black text-white overflow-hidden relative font-['Inter']">
            <div id="marvel-particles" class="fixed inset-0 z-0 pointer-events-none"></div>
            <div class="fixed top-20 left-[10%] z-0 animate-[floatAnim_6s_infinite_ease-in-out] opacity-80 hover:opacity-100 transition-opacity w-[150px] h-[150px]">${capShieldSVG}</div>
            <div class="fixed bottom-20 right-[10%] z-0 animate-[floatAnim_5s_infinite_ease-in-out_reverse] opacity-80 hover:opacity-100 transition-opacity w-[180px] h-[180px]">${ironManSVG}</div>
            <div class="fixed top-1/3 right-[15%] z-0 animate-[pulse_4s_infinite] opacity-80 hover:opacity-100 transition-opacity mix-blend-screen w-[160px] h-[160px]">${thorHammerSVG}</div>
            <div class="fixed bottom-[40%] left-[10%] z-0 animate-[floatAnim_7s_infinite_reverse] opacity-80 hover:opacity-100 transition-opacity w-[120px] h-[120px]">${blackPantherSVG}</div>

            <div class="relative z-10 max-w-5xl mx-auto p-4 md:p-8">
                <div class="text-center mb-16 pt-12 animate-fade-in-up">
                    <div class="inline-block p-2 rounded-full bg-gradient-to-r from-red-600 via-yellow-500 to-blue-600 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                        <img src="${siteData.photo}" class="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-black">
                    </div>
                    <p class="uppercase tracking-[0.5em] text-red-500 font-bold mb-4 text-sm animate-pulse">Initiative Protocol Active</p>
                    <h1 class="text-6xl md:text-8xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-600 drop-shadow-[0_5px_5px_rgba(220,38,38,0.8)] uppercase" style="font-family: 'Anton', sans-serif;">${siteData.name}</h1>
                    <p class="text-xl md:text-3xl text-gray-300 font-medium">${siteData.title}</p>
                    <div class="flex justify-center mt-6">${socialsHtml}</div>
                </div>
                <div class="marvel-card rounded-2xl p-8 mb-16 text-lg text-gray-300 leading-relaxed border-l-4 border-red-600 animate-slide-right group"><p>${siteData.about}</p></div>
                ${renderMarvelSection('Combat Experience', siteData.experience)}
                ${renderMarvelSection('Active Missions', siteData.projects)}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-12">${renderMarvelSection('Super Powers', siteData.skills)}${renderMarvelSection('Clearance Levels', siteData.certs)}</div>
                ${renderContactSection(config)}
            </div>
            ${getScriptTag(marvelScript)}
        </div>`;
    }

    let bgClasses = config.bg;
    if (siteData.theme === 'light' && bgClasses.includes('bg-zinc-9')) bgClasses = 'bg-white text-slate-900';
    if (siteData.theme === 'dark' && bgClasses.includes('bg-white')) bgClasses = 'bg-zinc-950 text-slate-200';
    const isDark = bgClasses.includes('900') || bgClasses.includes('black') || bgClasses.includes('950');
    const bgAnimHtml = config.bgAnim ? renderBackgroundAnimation(config.bgAnim) : '';

    const headerHtml = `
        <div class="${config.hero} mb-12 flex flex-col md:flex-row items-center gap-8 ${config.anim}">
            <img src="${siteData.photo}" class="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 ${isDark?'border-white/20':'border-black/10'} shadow-xl">
            <div><p class="uppercase tracking-widest text-sm font-bold opacity-70 mb-2">Portfolio</p><h1 class="text-5xl md:text-7xl font-black mb-4 tracking-tight leading-tight">${siteData.name}</h1><p class="text-xl md:text-2xl font-medium opacity-90 max-w-2xl">${siteData.title}</p>${socialsHtml}</div>
        </div>`;

    const sectionHtml = (title, items) => (!items || items.length === 0) ?
        '' : `
        <div class="mb-16 z-10 relative">
            <h2 class="text-3xl font-bold mb-8 uppercase tracking-wide border-b-2 ${isDark?'border-white/10':'border-black/10'} pb-2 inline-block">${title}</h2>
            <div class="${config.id==='tpl_1'?'grid grid-cols-1 md:grid-cols-2 gap-6':'space-y-6'}">
                ${items.map(item => `
                    <div class="${config.card}">
                        <h3 class="text-xl font-bold mb-1">${item.name || item.role || ''}</h3>
                        ${item.tags ? `<p class="text-xs font-mono mb-3 p-1 px-3 inline-block rounded-full ${isDark?'bg-white/10':'bg-black/5'}">${item.tags}</p>` : ''}
                        ${item.date ? `<p class="text-sm font-bold opacity-70 mb-3">${item.company || ''} ${item.company && item.date ? '|' : ''} ${item.date}</p>` : ''}
                        ${item.level ? `<p class="text-sm font-bold opacity-70 mb-3">${item.level}</p>` : ''}
                        ${item.desc ? `<p class="opacity-80 leading-relaxed">${item.desc}</p>` : ''}
                    </div>`).join('')}
            </div>
        </div>`;

    if(config.isSplit) {
        return `
        <div class="min-h-screen ${bgClasses}" style="font-family: '${siteData.font}', sans-serif;">
            ${bgAnimHtml}
            <div class="${config.hero} relative z-10"><img src="${siteData.photo}" class="w-32 h-32 rounded-full mb-6 border-4 border-white/20"><h1 class="text-5xl font-black mb-4">${siteData.name}</h1><p class="text-xl">${siteData.title}</p>${socialsHtml}<p class="mt-8 opacity-70">${siteData.about}</p></div>
            <div class="md:ml-[33.333%] p-8 md:p-16 relative z-10">${sectionHtml('Experience', siteData.experience)}${sectionHtml('Projects', siteData.projects)}${sectionHtml('Skills', siteData.skills)}${sectionHtml('Certifications', siteData.certs)}${renderContactSection(config)}</div>
        </div>`;
    }

    return `
    <div class="min-h-screen ${bgClasses} p-4 md:p-8 relative" style="font-family: '${siteData.font}', sans-serif;">
        ${bgAnimHtml}
        <div class="max-w-5xl mx-auto relative z-10">
            ${headerHtml}
            <div class="mb-16 text-lg leading-relaxed max-w-3xl opacity-90"><p>${siteData.about}</p></div>
            ${sectionHtml('Experience', siteData.experience)}
            ${sectionHtml('Projects', siteData.projects)}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-12">${sectionHtml('Skills', siteData.skills)}${sectionHtml('Certifications', siteData.certs)}</div>
            ${renderContactSection(config)}
        </div>
    </div>`;
}

// --- 4. CORE ENGINE ---
window.updatePreview = function() {
    try {
        const iframe = document.getElementById('livePreview');
        if (!iframe) return;

        const layoutConfig = tailwindConfigs.find(t => t.id === siteData.layoutId) || tailwindConfigs[0];
        const safeFontUrl = (siteData.font || 'Inter').replace(/\s+/g, '+');

        const seoTags = siteData.seo ? (siteData.seo.optimized ? `<title>${siteData.seo.title}</title><meta name="description" content="${siteData.seo.description}"><meta name="keywords" content="${siteData.seo.keywords}">` : `<title>${siteData.name || 'Portfolio'} | Portfolio</title>`) : `<title>Portfolio</title>`;

        const htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${seoTags}
        <link href="https://fonts.googleapis.com/css2?family=${safeFontUrl}:wght@300;400;600;700;800;900&family=Anton&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <script src="https://cdn.tailwindcss.com"></script><script>tailwind.config = { darkMode: 'class' }</script><style>
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounceShort { 0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8,0,1,1); } 50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); } }
        @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes floatAnim { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-30px) scale(1.05); } }
        @keyframes rotateGlow { 100% { transform: rotate(360deg); } }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-bounce-short { animation: bounceShort 1s ease-in-out 1; }
        .animate-slide-right { animation: slideRight 0.5s ease-out forwards; }
        ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .marvel-card { position: relative; z-index: 10; background: rgba(24, 24, 27, 0.8); backdrop-filter: blur(12px); overflow: hidden; border: 1px solid rgba(220,38,38,0.2); }
        .marvel-card::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: conic-gradient(transparent, rgba(234,179,8,0.6), transparent 30%); animation: rotateGlow 4s linear infinite; z-index: -1; opacity: 0; transition: opacity 0.3s; }
        .marvel-card:hover::before { opacity: 1; }
        .marvel-card::after { content: ''; position: absolute; inset: 2px; background: rgba(24, 24, 27, 0.95); border-radius: inherit; z-index: -1; }
        </style></head><body>${renderEngine(layoutConfig)}</body></html>`;

        iframe.srcdoc = htmlContent;
        window.saveProject();
    } catch(e) { console.error("Update Preview Failed:", e); }
};

window.addEventListener('DOMContentLoaded', () => {
    try {
        const tplSelect = document.getElementById('templateSelect'); if (tplSelect) tplSelect.innerHTML = tailwindConfigs.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        const fontSelect = document.getElementById('fontSelect'); if (fontSelect) { fontSelect.innerHTML = popularFonts.map(font => `<option value="${font}" style="font-family: '${font}', sans-serif;">${font}</option>`).join(''); fontSelect.value = siteData.font; }
        
        const lastView = sessionStorage.getItem('pf_current_view') || 'view-dashboard'; const lastIndex = sessionStorage.getItem('pf_active_index');
        if (lastView === 'view-editor' && lastIndex !== null && parseInt(lastIndex) >= 0) {
            const sites = getSavedSites();
            if(sites[parseInt(lastIndex)]) { siteData = sites[parseInt(lastIndex)]; activeSiteIndex = parseInt(lastIndex); syncSidebarUI(); updatePreview(); document.getElementById('view-dashboard').style.display = 'none'; document.getElementById('view-editor').style.display = 'flex'; } 
            else { renderDashboard(); }
        } else { renderDashboard(); }
        
        document.addEventListener('keydown', (e) => { if((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); document.getElementById('cmdPalette').classList.toggle('active'); document.querySelector('#cmdPalette input').focus(); } });
    } catch (e) { console.error("Initialization Failed:", e); renderDashboard(); }
});

// --- 5. AI CO-PILOT ---
window.sendAI = function() {
    const input = document.getElementById('aiInput');
    const prompt = input.value.trim(); if(!prompt) return;
    const chat = document.getElementById('aiChat'); chat.innerHTML += `<div class="ai-bubble user">${prompt}</div>`; input.value = '';
    chat.scrollTop = chat.scrollHeight;

    setTimeout(() => {
        let p = prompt.toLowerCase(); let response = "I updated the site!"; let changed = false;
        
        if(p.includes('dark')) { siteData.theme = 'dark'; response = "Switched to Dark Mode! 🌙"; changed = true; }
        if(p.includes('light') || p.includes('white')) { siteData.theme = 'light'; response = "Switched to Light Mode! ☀️"; changed = true; }
        if(p.includes('bento') || p.includes('grid')) { siteData.layoutId = 'tpl_1'; response = "Applied Bento Grid layout!"; changed = true; }
        if(p.includes('minimal')) { siteData.layoutId = 'tpl_2'; response = "Applied Minimalist layout!"; changed = true; }
        if(p.includes('brutal')) { siteData.layoutId = 'tpl_3'; response = "Applied Neo-Brutalism layout!"; changed = true; }
        if(p.includes('terminal') || p.includes('hacker')) { siteData.layoutId = 'tpl_4'; response = "Booting Terminal layout..."; changed = true; }
        if(p.includes('glass')) { siteData.layoutId = 'tpl_5'; response = "Applied Glassmorphism!"; changed = true; }
        if(p.includes('cyber') || p.includes('neon')) { siteData.layoutId = 'tpl_6'; response = "Applied Cyberpunk Neon!"; changed = true; }
        if(p.includes('marvel') || p.includes('avenger') || p.includes('assemble')) { siteData.layoutId = 'tpl_30'; response = "Avengers Assemble! The Marvel theme is locked in. 🦸‍♂️"; changed = true; }

        if(!changed) response = "I didn't catch that command. Try 'switch to dark mode', 'make it brutalist', or type 'Assemble the Avengers!'.";
        chat.innerHTML += `<div class="ai-bubble bot">${response}</div>`; chat.scrollTop = chat.scrollHeight; 
        if(changed) { syncSidebarUI(); updatePreview(); }
    }, 800);
};

// --- 6. DEPLOY & EXPORT ---
window.startDeployment = function() {
    document.getElementById('cmdPalette').classList.remove('active'); window.saveProject();
    const modal = document.getElementById('deployModal');
    const loader = document.getElementById('deployLoader'); const success = document.getElementById('deploySuccess'); const logs = document.getElementById('deployLogs'); const linkTxt = document.getElementById('deployLinkTxt');
    if(!modal) return;
    modal.classList.add('active');
    loader.style.display = 'block'; success.style.display = 'none';
    let logSequence = ["> Resolving dependencies...", "> Compiling Tailwind CSS utilities...", "> Optimizing assets...", "> Generating static HTML files...", "> Assigning edge network nodes...", "> Finalizing deployment..."];
    logs.innerHTML = "> Initializing build environment...<br>";
    let i = 0;
    let interval = setInterval(() => {
        if(i < logSequence.length) { logs.innerHTML += logSequence[i] + "<br>"; logs.scrollTop = logs.scrollHeight; i++; } 
        else { clearInterval(interval); setTimeout(() => { loader.style.display = 'none'; success.style.display = 'block'; let urlSlug = (siteData.name||'site').toLowerCase().replace(/\s+/g, '-'); linkTxt.innerHTML = `https://${urlSlug}-portfolio.workfolio.app <a href="#" style="margin-left:10px; color:#a855f7;"><i class="fas fa-external-link-alt"></i></a>`; }, 500); }
    }, 600);
}

window.exportCode = function() {
    const iframe = document.getElementById('livePreview'); const htmlContent = iframe.srcdoc;
    const blob = new Blob([htmlContent], { type: 'text/html' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${(siteData.name||'Project').replace(/\s+/g, '_')}_Portfolio.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
};

window.syncFromResume = function() {
    try {
        let session = null;
        try { session = JSON.parse(sessionStorage.getItem('workfolio_session') || localStorage.getItem('workfolio_session')); } catch(e) {}
        let userKey = session ? session.username : 'guest';
        
        let resumes = JSON.parse(localStorage.getItem('workfolio_resumes_' + userKey) || '[]');
        if (resumes.length === 0) return alert("No resumes found to sync!");
        
        let r = resumes[resumes.length - 1]; 
        siteData.photo = r.personal.photo || siteData.photo; 
        siteData.name = r.personal.name || siteData.name; 
        siteData.title = r.personal.title || siteData.title; 
        siteData.about = r.personal.summary || siteData.about;
        siteData.email = r.personal.email || siteData.email; 
        siteData.linkedin = r.personal.linkedin || siteData.linkedin; 
        siteData.github = r.personal.github || siteData.github;
        siteData.phone = r.personal.phone || siteData.phone; 
        siteData.location = r.personal.location || siteData.location;
        
        if(r.experience?.length) siteData.experience = r.experience; 
        if(r.skills?.length) siteData.skills = r.skills; 
        if(r.projects?.length) siteData.projects = r.projects;
        
        syncSidebarUI(); updatePreview(); alert("Synced from Resume!");
    } catch(e) { console.error("Sync Error:", e); }
};

// --- 7. SHARE VIA EMAIL LOGIC ---
window.openShareModal = function() {
    document.getElementById('cmdPalette').classList.remove('active');
    document.getElementById('shareModal').classList.add('active');
};

window.shareViaEmail = function(e) {
    e.preventDefault(); 
    
    const recipient = document.getElementById('shareEmail').value;
    const subject = document.getElementById('shareSubject').value;
    const message = document.getElementById('shareMessage').value;

    const encodedSubject = encodeURIComponent(subject);
    const finalMessage = message + "\n\n(Note: Please find my exported Portfolio attached to this email.)";
    const encodedMessage = encodeURIComponent(finalMessage);

    window.location.href = `mailto:${recipient}?subject=${encodedSubject}&body=${encodedMessage}`;
    
    document.getElementById('shareModal').classList.remove('active');
};