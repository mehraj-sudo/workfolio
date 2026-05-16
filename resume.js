// =========================================================
// === RESUME BUILDER ENGINE (MASTER BUILD)              ===
// =========================================================

// ── PER-USER STORAGE KEY ──────────────────────────────────
// Each logged-in user gets their OWN resume list.
// Guests share a 'guest' slot.
function getResumeDBKey() {
    try {
        const s = JSON.parse(
            sessionStorage.getItem('workfolio_session') ||
            localStorage.getItem('workfolio_session') || 'null'
        );
        return 'workfolio_resumes_' + (s ? s.username : 'guest');
    } catch(e) { return 'workfolio_resumes_guest'; }
}
// Legacy migration: if old flat key has data, move it to the current user key once
(function migrateLegacyResumes() {
    try {
        const key = getResumeDBKey();
        const legacyData = localStorage.getItem('workfolio_resumes');
        if (legacyData && legacyData !== '[]' && !localStorage.getItem(key)) {
            localStorage.setItem(key, legacyData);
            console.log('WorkFolio: migrated legacy resumes to per-user key:', key);
        }
    } catch(e) {}
})();
const DB_RESUMES = getResumeDBKey(); // kept for backward compat references below

// HTML Escaper to prevent input breaking
window.esc = function(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

// Database safety check
(function cleanCorruptedData() {
    try {
        let currentData = localStorage.getItem(DB_RESUMES);
        if (currentData === "[object Object]" || currentData === "undefined" || currentData === "null") {
            localStorage.setItem(getResumeDBKey(), '[]');
        }
    } catch(e) { localStorage.setItem(getResumeDBKey(), '[]'); }
})();

const getEmptyResume = () => ({
    name: "Untitled Resume", date: new Date().toLocaleDateString(),
    design: { template: 'tpl-executive', color: '#0f172a', font: "'Times New Roman', sans-serif", skillStyle: 'text-bullet', pageMode: 'single' },
    layout: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages'],
    personal: { name: '', title: '', email: '', phone: '', location: '', summary: '', photo: '', linkedin: '', github: '' },
    experience: [], education: [], projects: [], skills: [], certifications: [], languages: []
});

let resumeData = getEmptyResume();
let activeResumeIndex = -1;
let backupSnapshot = null; 
let wasNewResume = false;

function getSafeResumes() {
    try {
        let data = localStorage.getItem(getResumeDBKey());
        let parsed = data ? JSON.parse(data) : [];
        return Array.isArray(parsed) ? parsed.filter(res => res && res.personal) : [];
    } catch(e) { return []; }
}

// ── CLOUD-AWARE LOAD: tries Supabase, falls back to localStorage ──
async function loadResumesCloud() {
    if (window.isSupabaseConfigured && window.isSupabaseConfigured()) {
        const cloud = await window.sb_getResumes();
        if (cloud && cloud.length > 0) {
            // Sync cloud data to localStorage as cache
            localStorage.setItem(getResumeDBKey(), JSON.stringify(cloud));
            return cloud;
        }
    }
    return getSafeResumes(); // localStorage fallback
}

// === VIEW MANAGEMENT ===
window.onload = function() {
    try {
        if(typeof window.authUIUpdate === 'function') window.authUIUpdate();
        const lastView = sessionStorage.getItem('wf_current_view') || 'view-dashboard';
        const lastIndex = sessionStorage.getItem('wf_active_index');
        
        if (lastView === 'view-editor' && lastIndex !== null && parseInt(lastIndex) >= 0) {
            window.loadEditor(parseInt(lastIndex));
        } else {
            window.switchView(lastView === 'view-editor' ? 'view-dashboard' : lastView);
        }
    } catch(e) { document.getElementById('view-dashboard').classList.add('active'); }
};

window.switchView = function(viewId) {
    document.querySelectorAll('.resume-view').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(viewId);
    if(target) target.classList.add('active');
    sessionStorage.setItem('wf_current_view', viewId);
    if (viewId === 'view-dashboard') { sessionStorage.removeItem('wf_active_index'); renderDashboard(); }
};

function renderDashboard() {
    const list = document.getElementById('resumeList');
    if(!list) return;
    // Try cloud load first (async), then render
    if (window.isSupabaseConfigured && window.isSupabaseConfigured() && !renderDashboard._cloudLoaded) {
        renderDashboard._cloudLoaded = true;
        loadResumesCloud().then(() => renderDashboard()).catch(() => {});
        // Show local cache immediately while cloud loads
    }
    let resumes = getSafeResumes(); 
    if (resumes.length === 0) { list.innerHTML = `<div class="glass-panel" style="grid-column: 1 / -1; padding: 40px; text-align: center;"><p style="color: #64748b;">No resumes found. Start creating!</p></div>`; return; }
    
    list.innerHTML = resumes.map((res, index) => {
        let color = (res.design && res.design.color) ? res.design.color : '#4F46E5';
        return `
            <div class="glass-panel" style="text-align:left; padding:20px; border-radius:16px; border: 1px solid #e2e8f0;">
                <div style="height: 100px; background: #f8fafc; border-radius: 8px; margin-bottom: 15px; position:relative; overflow:hidden; border: 1px solid #e2e8f0;">
                    <div style="position:absolute; top:0; left:0; width:100%; height:20px; background:${color};"></div>
                    <div style="padding: 35px 15px; font-weight:800; color: #1e293b;">${esc(res.personal.name) || 'Untitled'}</div>
                </div>
                <h3 style="margin-bottom: 5px;">${esc(res.name)}</h3>
                <div style="display:flex; gap:10px; margin-top:15px;">
                    <button class="btn-gradient" style="background: ${color}; width: 100%;" onclick="loadEditor(${index})">Edit</button>
                    <button class="btn-outline" style="color: #ef4444; border-color:#fca5a5;" onclick="deleteResume(${index})"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }).join('');
}

window.deleteResume = function(index) {
    if(confirm("Delete this resume?")) {
        let resumes = getSafeResumes();
        const deleted = resumes[index];
        resumes.splice(index, 1);
        localStorage.setItem(getResumeDBKey(), JSON.stringify(resumes));
        // Cloud delete (non-blocking)
        if (deleted && deleted._cloud_id && window.sb_deleteResume) {
            window.sb_deleteResume(deleted._cloud_id).catch(e => console.warn('[WF]', e));
        }
        renderDashboard();
    }
};

// === INITIALIZATION ===
window.initEditor = function(templateClass, isBlank) {
    resumeData = getEmptyResume();
    resumeData.design.template = templateClass;
    if(isBlank) resumeData.layout = []; 
    activeResumeIndex = -1; 
    backupSnapshot = JSON.stringify(resumeData);
    wasNewResume = true;
    setupEditorUI();
    window.switchView('view-editor');
};

window.loadEditor = function(index) {
    let resumes = getSafeResumes();
    resumeData = resumes[index] || getEmptyResume();
    activeResumeIndex = index;
    sessionStorage.setItem('wf_active_index', index); 
    backupSnapshot = JSON.stringify(resumeData);
    wasNewResume = false;
    setupEditorUI();
    window.switchView('view-editor');
};

window.saveAndExit = function() { window.saveData(); window.switchView('view-dashboard'); };

window.exitWithoutSaving = function() {
    if(confirm("Exit without saving? Changes will be lost.")) {
        let resumes = getSafeResumes();
        if (!wasNewResume && activeResumeIndex !== -1 && backupSnapshot) resumes[activeResumeIndex] = JSON.parse(backupSnapshot);
        localStorage.setItem(getResumeDBKey(), JSON.stringify(resumes));
        window.switchView('view-dashboard');
    }
};

function setupEditorUI() {
    const p = resumeData.personal || {};
    const d = resumeData.design || {};
    
    document.getElementById('inpName').value = p.name || '';
    document.getElementById('inpTitle').value = p.title || '';
    document.getElementById('inpEmail').value = p.email || '';
    document.getElementById('inpPhone').value = p.phone || '';
    document.getElementById('inpLocation').value = p.location || '';
    document.getElementById('inpLinkedin').value = p.linkedin || '';
    document.getElementById('inpGithub').value = p.github || '';
    document.getElementById('inpSummary').value = p.summary || '';
    
    if(document.getElementById('selPageMode')) document.getElementById('selPageMode').value = d.pageMode || 'single';
    if(document.getElementById('selColor')) document.getElementById('selColor').value = d.color || '#4F46E5';
    if(document.getElementById('selSkillStyle')) document.getElementById('selSkillStyle').value = d.skillStyle || 'bar-percent';

    const photoEl = document.getElementById('previewPhoto');
    if (photoEl) photoEl.src = (p.photo && p.photo.length > 50) ? p.photo : 'https://ui-avatars.com/api/?name=User&background=4F46E5&color=fff&size=100';

    setupDynamicSections();
    setupDragAndDrop();
    window.updatePreview();
}

// === SYNC & SAVE ===
window.syncText = function(inputId, text) { 
    document.getElementById(inputId).value = text; 
    window.saveData();
    window.updatePreview(); 
};
window.syncArray = function(type, id, field, text) {
    const item = resumeData[type].find(i => String(i.id) === String(id)); 
    if(item) item[field] = text;
    window.saveData(); 
    renderArrayLists(); 
    window.updatePreview(); 
};

window.saveData = function() {
    try {
        resumeData.personal = {
            name: document.getElementById('inpName').value, title: document.getElementById('inpTitle').value,
            email: document.getElementById('inpEmail').value, phone: document.getElementById('inpPhone').value,
            location: document.getElementById('inpLocation').value, linkedin: document.getElementById('inpLinkedin').value,
            github: document.getElementById('inpGithub').value, summary: document.getElementById('inpSummary').value,
            photo: document.getElementById('previewPhoto') ? document.getElementById('previewPhoto').src : ''
        };
        
        if (resumeData.personal.summary && !resumeData.layout.includes('summary')) { resumeData.layout.unshift('summary'); renderDragPills(); }
        
        if (document.getElementById('selPageMode')) resumeData.design.pageMode = document.getElementById('selPageMode').value;
        if (document.getElementById('selColor')) resumeData.design.color = document.getElementById('selColor').value;
        if (document.getElementById('selSkillStyle')) resumeData.design.skillStyle = document.getElementById('selSkillStyle').value;
        
        resumeData.name = resumeData.personal.name ? resumeData.personal.name + "'s Resume" : "Untitled Resume";
        resumeData.date = new Date().toLocaleDateString();

        let resumes = getSafeResumes();
        if(activeResumeIndex === -1) { resumes.push(resumeData); activeResumeIndex = resumes.length - 1; } 
        else { resumes[activeResumeIndex] = resumeData; }
        
        localStorage.setItem(getResumeDBKey(), JSON.stringify(resumes));
        sessionStorage.setItem('wf_active_index', activeResumeIndex);

        // ── CLOUD SAVE (non-blocking) ──────────────────────────
        if (window.sb_saveResume) {
            const cloudId = resumeData._cloud_id || null;
            window.sb_saveResume(resumeData, cloudId).then(newId => {
                if (newId && !resumeData._cloud_id) {
                    resumeData._cloud_id = newId;
                    // Update cached version with cloud ID
                    let r2 = getSafeResumes();
                    if (activeResumeIndex >= 0 && r2[activeResumeIndex]) {
                        r2[activeResumeIndex]._cloud_id = newId;
                        localStorage.setItem(getResumeDBKey(), JSON.stringify(r2));
                    }
                }
            }).catch(e => console.warn('[WF] Cloud save failed (offline?):', e));
        }
    } catch(e) { console.error(e); }
};

window.handlePhotoUpload = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) { document.getElementById('previewPhoto').src = e.target.result; window.updatePreview(); };
        reader.readAsDataURL(file);
    }
};
window.removePhoto = function() { document.getElementById('previewPhoto').src = 'https://ui-avatars.com/api/?name=User&background=4F46E5&color=fff&size=100'; window.updatePreview(); };

// === DYNAMIC SECTIONS ===
function setupDynamicSections() {
    const container = document.getElementById('dynamicEditorSections');
    // Build custom section HTML
    let customHTML = '';
    if (resumeData.customSections) {
        Object.keys(resumeData.customSections).forEach(key => {
            const sec = resumeData.customSections[key];
            customHTML += `<div class="editor-section"><h3><i class="fas fa-star"></i> ${esc(sec.title)} <button class="btn-outline" style="margin-left:auto;padding:5px 10px;font-size:0.8rem;" onclick="addCustomSectionItem('${key}')">+ Add</button><button style="background:none;border:none;color:#ef4444;cursor:pointer;padding:0 6px;font-size:.8rem;" onclick="deleteCustomSection('${key}')"><i class="fas fa-trash"></i></button></h3><div id="list-${key}"></div></div>`;
        });
    }
    container.innerHTML = `
        <div class="editor-section"><h3><i class="fas fa-briefcase"></i> Experience <button class="btn-outline" style="margin-left:auto;padding:5px 10px;font-size:0.8rem;" onclick="addArrayItem('experience')">+ Add</button></h3><div id="list-experience"></div></div>
        <div class="editor-section"><h3><i class="fas fa-graduation-cap"></i> Education <button class="btn-outline" style="margin-left:auto;padding:5px 10px;font-size:0.8rem;" onclick="addArrayItem('education')">+ Add</button></h3><div id="list-education"></div></div>
        <div class="editor-section"><h3><i class="fas fa-code"></i> Skills <button class="btn-outline" style="margin-left:auto;padding:5px 10px;font-size:0.8rem;" onclick="addArrayItem('skills')">+ Add</button></h3><div id="list-skills"></div></div>
        <div class="editor-section"><h3><i class="fas fa-folder-open"></i> Projects <button class="btn-outline" style="margin-left:auto;padding:5px 10px;font-size:0.8rem;" onclick="addArrayItem('projects')">+ Add</button></h3><div id="list-projects"></div></div>
        <div class="editor-section"><h3><i class="fas fa-certificate"></i> Certifications <button class="btn-outline" style="margin-left:auto;padding:5px 10px;font-size:0.8rem;" onclick="addArrayItem('certifications')">+ Add</button></h3><div id="list-certifications"></div></div>
        <div class="editor-section"><h3><i class="fas fa-language"></i> Languages <button class="btn-outline" style="margin-left:auto;padding:5px 10px;font-size:0.8rem;" onclick="addArrayItem('languages')">+ Add</button></h3><div id="list-languages"></div></div>
        <div class="editor-section"><h3><i class="fas fa-hands-helping"></i> Volunteer Work <button class="btn-outline" style="margin-left:auto;padding:5px 10px;font-size:0.8rem;" onclick="addArrayItem('volunteer')">+ Add</button></h3><div id="list-volunteer"></div></div>
        <div class="editor-section"><h3><i class="fas fa-trophy"></i> Awards <button class="btn-outline" style="margin-left:auto;padding:5px 10px;font-size:0.8rem;" onclick="addArrayItem('awards')">+ Add</button></h3><div id="list-awards"></div></div>
        <div class="editor-section"><h3><i class="fas fa-book-open"></i> Publications <button class="btn-outline" style="margin-left:auto;padding:5px 10px;font-size:0.8rem;" onclick="addArrayItem('publications')">+ Add</button></h3><div id="list-publications"></div></div>
        ${customHTML}
        <div style="padding:10px 0;">
            <button class="btn-outline" style="width:100%;padding:10px;border-style:dashed;color:#a855f7;border-color:#a855f7;" onclick="addCustomSection()">
                <i class="fas fa-plus"></i> Add Custom Section
            </button>
        </div>
    `;
    renderArrayLists();
}

window.addArrayItem = function(type) {
    const id = Date.now().toString(); 
    if(!resumeData[type]) resumeData[type] = [];
    if(type === 'experience') resumeData.experience.push({ id, title: '', company: '', date: '', desc: '' });
    if(type === 'education') resumeData.education.push({ id, degree: '', school: '', date: '', desc: '' });
    if(type === 'projects') resumeData.projects.push({ id, name: '', tech: '', desc: '' });
    if(type === 'skills') resumeData.skills.push({ id, name: '', level: 80 }); 
    if(!resumeData.layout.includes(type)) { resumeData.layout.push(type); renderDragPills(); }
    renderArrayLists(); window.updatePreview();
};

window.removeArrayItem = function(type, id) { resumeData[type] = resumeData[type].filter(item => String(item.id) !== String(id)); renderArrayLists(); window.updatePreview(); };
window.updateArrayItem = function(type, id, field, value) { const item = resumeData[type].find(i => String(i.id) === String(id)); if(item) item[field] = value; window.updatePreview(); };

function renderArrayLists() {
    const listExp = document.getElementById('list-experience');
    if(listExp) listExp.innerHTML = (resumeData.experience || []).map(exp => `
        <div class="dynamic-item" style="position: relative; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px;">
            <button style="position:absolute; right:0; top:0; background:none; border:none; color:#ef4444; cursor:pointer;" onclick="removeArrayItem('experience', '${exp.id}')"><i class="fas fa-times"></i></button>
            <input type="text" placeholder="Job Title" value="${esc(exp.title)}" oninput="updateArrayItem('experience', '${exp.id}', 'title', this.value)" style="width: 100%; margin-bottom: 8px; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
            <div style="display:flex; gap:10px; margin-bottom: 8px;">
                <input type="text" placeholder="Company" value="${esc(exp.company)}" oninput="updateArrayItem('experience', '${exp.id}', 'company', this.value)" style="flex:1; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
                <input type="text" placeholder="Date" value="${esc(exp.date)}" oninput="updateArrayItem('experience', '${exp.id}', 'date', this.value)" style="flex:1; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
            </div>
            <textarea id="exp-desc-${exp.id}" placeholder="Job description..." rows="3" oninput="updateArrayItem('experience', '${exp.id}', 'desc', this.value)" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; resize:vertical; margin-bottom: 8px;">${esc(exp.desc)}</textarea>
            <div style="display:flex; justify-content:flex-end; gap:15px;">
                <button onclick="improveGrammar('experience', '${exp.id}')" style="font-size:0.75rem; color:#10b981; border:none; background:none; cursor:pointer; font-weight:600;"><i class="fas fa-wrench"></i> Fix Grammar</button>
                <button onclick="openAIModal('experience', '${exp.id}')" style="font-size:0.75rem; color:#a855f7; border:none; background:none; cursor:pointer; font-weight:600;"><i class="fas fa-sparkles"></i> AI Writer</button>
            </div>
        </div>`).join('');
    
    const listEdu = document.getElementById('list-education');
    if(listEdu) listEdu.innerHTML = (resumeData.education || []).map(edu => `
        <div class="dynamic-item" style="position: relative; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px;">
            <button style="position:absolute; right:0; top:0; background:none; border:none; color:#ef4444; cursor:pointer;" onclick="removeArrayItem('education', '${edu.id}')"><i class="fas fa-times"></i></button>
            <input type="text" placeholder="Degree" value="${esc(edu.degree)}" oninput="updateArrayItem('education', '${edu.id}', 'degree', this.value)" style="width: 100%; margin-bottom: 8px; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
            <div style="display:flex; gap:10px;">
                <input type="text" placeholder="School" value="${esc(edu.school)}" oninput="updateArrayItem('education', '${edu.id}', 'school', this.value)" style="flex:1; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
                <input type="text" placeholder="Date" value="${esc(edu.date)}" oninput="updateArrayItem('education', '${edu.id}', 'date', this.value)" style="flex:1; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
            </div>
        </div>`).join('');

    const listSki = document.getElementById('list-skills');
    if(listSki) listSki.innerHTML = (resumeData.skills || []).map(s => `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; position:relative;">
            <button style="background:none; border:none; color:#ef4444; cursor:pointer; padding:0 5px;" onclick="removeArrayItem('skills', '${s.id}')"><i class="fas fa-times"></i></button>
            <input type="text" placeholder="Skill Name" value="${esc(s.name)}" oninput="updateArrayItem('skills', '${s.id}', 'name', this.value)" style="flex:1; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1;">
            <input type="range" min="10" max="100" value="${s.level}" oninput="updateArrayItem('skills', '${s.id}', 'level', this.value)" style="width:80px;">
        </div>`).join('');

    const listProj = document.getElementById('list-projects');
    if(listProj) listProj.innerHTML = (resumeData.projects || []).map(proj => `
        <div class="dynamic-item" style="position: relative; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px;">
            <button style="position:absolute; right:0; top:0; background:none; border:none; color:#ef4444; cursor:pointer;" onclick="removeArrayItem('projects', '${proj.id}')"><i class="fas fa-times"></i></button>
            <input type="text" placeholder="Project Name" value="${esc(proj.name)}" oninput="updateArrayItem('projects', '${proj.id}', 'name', this.value)" style="width: 100%; margin-bottom: 8px; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
            <textarea id="proj-desc-${proj.id}" placeholder="Project description..." rows="3" oninput="updateArrayItem('projects', '${proj.id}', 'desc', this.value)" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; resize:vertical; margin-bottom: 8px;">${esc(proj.desc)}</textarea>
            <div style="display:flex; justify-content:flex-end; gap:15px;">
                <button onclick="improveGrammar('projects', '${proj.id}')" style="font-size:0.75rem; color:#10b981; border:none; background:none; cursor:pointer; font-weight:600;"><i class="fas fa-wrench"></i> Fix Grammar</button>
                <button onclick="openAIModal('projects', '${proj.id}')" style="font-size:0.75rem; color:#a855f7; border:none; background:none; cursor:pointer; font-weight:600;"><i class="fas fa-sparkles"></i> AI Writer</button>
            </div>
        </div>`).join('');
}

// === DRAG & DROP ===
function setupDragAndDrop() {
    const container = document.getElementById('dragContainer');
    if(!container) return;
    const labels = { summary:'Profile', experience:'Experience', education:'Education', skills:'Skills', projects:'Projects', certifications:'Certs', languages:'Languages', volunteer:'Volunteer', awards:'Awards', publications:'Publications' };
    container.innerHTML = (resumeData.layout || []).map(key => `<div class="drag-pill" draggable="true" data-id="${key}" style="cursor: grab; padding: 8px; border: 1px solid #ddd; margin-bottom: 5px; border-radius: 6px; background: white;">${labels[key] || key}</div>`).join('');
    
    let draggedItem = null;
    container.addEventListener('dragstart', (e) => { draggedItem = e.target; e.target.style.opacity = '0.5'; });
    container.addEventListener('dragend', (e) => { 
        e.target.style.opacity = '1'; 
        resumeData.layout = Array.from(container.children).map(pill => pill.dataset.id); 
        window.updatePreview(); 
    });
    container.addEventListener('dragover', (e) => { 
        e.preventDefault(); 
        const afterElement = getDragAfterElement(container, e.clientY);
        if (draggedItem) { 
            if (afterElement == null) container.appendChild(draggedItem); 
            else container.insertBefore(draggedItem, afterElement); 
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.drag-pill:not(.dragging)')];
    return draggableElements.reduce((closest, child) => { 
        const box = child.getBoundingClientRect(); 
        const offset = y - box.top - box.height / 2; 
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child }; 
        else return closest; 
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// === LIVE PREVIEW & SMART AUTO-FIT ===
window.updatePreview = function() {
    const paper = document.getElementById('resumePreview');
    if(!paper) return;
    
    const p = resumeData.personal; const d = resumeData.design;
    paper.className = `a4-paper ${d.template || 'tpl-executive'}`;
    paper.style.setProperty('--res-theme', d.color || '#0f172a'); 
    paper.style.setProperty('--font-family', d.font || "'Times New Roman', sans-serif");
    paper.style.fontFamily = d.font || "'Times New Roman', sans-serif";

    const photoHTML = (p.photo && p.photo !== 'https://ui-avatars.com/api/?name=User&background=4F46E5&color=fff&size=100') ? `<img src="${p.photo}" class="profile-pic" style="width:90px; height:90px; border-radius:50%; object-fit:cover; margin-bottom:15px; border: 3px solid var(--res-theme);">` : '';
    let mainHTML = ''; let sidebarHTML = '';

    (resumeData.layout || []).filter(s=>s).forEach(section => {
        if(section === 'summary' && p.summary) {
            mainHTML += `<div class="res-section"><h3 class="res-heading">Profile</h3><p class="item-desc" contenteditable="true" oninput="syncText('inpSummary', this.innerText)">${p.summary}</p></div>`;
        }
        else if(section === 'experience' && (resumeData.experience || []).length > 0) {
            let expHTML = resumeData.experience.map(e => `<div style="margin-bottom: 8px;"><div class="item-header"><span><span contenteditable="true" oninput="syncArray('experience', '${e.id}', 'title', this.innerText)">${e.title || 'Job Title'}</span> <span style="font-weight:normal; opacity:0.8;">| <span contenteditable="true" oninput="syncArray('experience', '${e.id}', 'company', this.innerText)">${e.company || 'Company'}</span></span></span><span class="item-date" contenteditable="true" oninput="syncArray('experience', '${e.id}', 'date', this.innerText)">${e.date || ''}</span></div><div class="item-desc" contenteditable="true" oninput="syncArray('experience', '${e.id}', 'desc', this.innerHTML)">${e.desc ? e.desc.replace(/\n/g, '<br>') : ''}</div></div>`).join('');
            mainHTML += `<div class="res-section"><h3 class="res-heading">Experience</h3>${expHTML}</div>`;
        }
        else if(section === 'education' && (resumeData.education || []).length > 0) {
            let eduHTML = resumeData.education.map(e => `<div style="margin-bottom: 8px;"><div class="item-header"><span contenteditable="true" oninput="syncArray('education', '${e.id}', 'degree', this.innerText)">${e.degree || 'Degree'}</span><span class="item-date" contenteditable="true" oninput="syncArray('education', '${e.id}', 'date', this.innerText)">${e.date || ''}</span></div><div style="color:#555; font-size:0.85rem;" contenteditable="true" oninput="syncArray('education', '${e.id}', 'school', this.innerText)">${e.school || 'School'}</div></div>`).join('');
            mainHTML += `<div class="res-section"><h3 class="res-heading">Education</h3>${eduHTML}</div>`;
        }
        else if(section === 'projects' && (resumeData.projects || []).length > 0) {
            let projHTML = resumeData.projects.map(proj => `<div style="margin-bottom: 8px;"><div class="item-header"><span contenteditable="true" oninput="syncArray('projects', '${proj.id}', 'name', this.innerText)">${proj.name || 'Project Name'}</span></div><div class="item-desc" contenteditable="true" oninput="syncArray('projects', '${proj.id}', 'desc', this.innerHTML)">${proj.desc ? proj.desc.replace(/\n/g, '<br>') : ''}</div></div>`).join('');
            mainHTML += `<div class="res-section"><h3 class="res-heading">Projects</h3>${projHTML}</div>`;
        }
        else if(section === 'skills' && (resumeData.skills || []).length > 0) {
            let skillStyle = d.skillStyle || 'text-bullet';
            let validSkills = resumeData.skills.filter(e=>e);
            let skillHTML = '';

            if (skillStyle === 'pill-solid') skillHTML = validSkills.map(s => `<div style="background: var(--res-theme); color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; display: inline-block;"><span contenteditable="true" oninput="syncArray('skills', '${s.id}', 'name', this.innerText)">${s.name || 'Skill'}</span></div>`).join('');
            else if (skillStyle === 'pill-outline') skillHTML = validSkills.map(s => `<div style="border: 1px solid var(--res-theme); color: var(--res-theme); padding: 3px 10px; border-radius: 20px; font-size: 0.8rem; display: inline-block; font-weight: 600;"><span contenteditable="true" oninput="syncArray('skills', '${s.id}', 'name', this.innerText)">${s.name || 'Skill'}</span></div>`).join('');
            else if (skillStyle === 'tags-square') skillHTML = validSkills.map(s => `<div style="background: #f1f5f9; border-left: 3px solid var(--res-theme); color: #334155; padding: 4px 8px; font-size: 0.8rem; display: inline-block;"><span contenteditable="true" oninput="syncArray('skills', '${s.id}', 'name', this.innerText)">${s.name || 'Skill'}</span></div>`).join('');
            else if (skillStyle === 'text-comma') skillHTML = validSkills.map((s, idx) => `<span contenteditable="true" oninput="syncArray('skills', '${s.id}', 'name', this.innerText)">${s.name || 'Skill'}</span>${idx < validSkills.length - 1 ? '<span style="color:var(--res-theme); font-weight:bold;">, </span>' : ''}`).join('');
            else if (skillStyle === 'text-bullet') skillHTML = validSkills.map((s, idx) => `<span contenteditable="true" oninput="syncArray('skills', '${s.id}', 'name', this.innerText)">${s.name || 'Skill'}</span>${idx < validSkills.length - 1 ? '<span style="color:var(--res-theme); margin: 0 4px;">&bull;</span>' : ''}`).join('');
            else if (skillStyle === 'text-simple') skillHTML = validSkills.map(s => `<div style="margin-bottom: 4px;"><span contenteditable="true" oninput="syncArray('skills', '${s.id}', 'name', this.innerText)" style="font-weight: 600; font-size: 0.85rem;">${s.name || 'Skill'}</span></div>`).join('');
            else if (skillStyle === 'minimal-line') skillHTML = validSkills.map(s => `<div style="display:inline-block; margin-right:10px; margin-bottom:10px; padding-bottom:2px; border-bottom: 2px solid var(--res-theme); font-size:0.85rem; font-weight:600;"><span contenteditable="true" oninput="syncArray('skills', '${s.id}', 'name', this.innerText)">${s.name || 'Skill'}</span></div>`).join('');
            else if (skillStyle === 'grid-2col') skillHTML = validSkills.map(s => `<div style="font-weight:600; font-size:0.85rem; display:flex; align-items:center; gap:4px;"><i class="fas fa-check-circle" style="color:var(--res-theme); font-size:0.75rem;"></i><span contenteditable="true" oninput="syncArray('skills', '${s.id}', 'name', this.innerText)">${s.name || 'Skill'}</span></div>`).join('');
            else if (skillStyle === 'dots') skillHTML = validSkills.map(s => { let filled = Math.round((s.level||80)/20); let dots = ''; for(let i=0; i<5; i++) dots += `<i class="fas fa-circle" style="color: ${i<filled?'var(--res-theme)':'#e2e8f0'}; font-size: 0.5rem; margin-left: 2px;"></i>`; return `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;"><span contenteditable="true" style="font-weight:600; font-size:0.85rem;" oninput="syncArray('skills', '${s.id}', 'name', this.innerText)">${s.name || 'Skill'}</span><div>${dots}</div></div>`; }).join('');
            else if (skillStyle === 'stars') skillHTML = validSkills.map(s => { let filled = Math.round((s.level||80)/20); let stars = ''; for(let i=0; i<5; i++) stars += `<i class="${i<filled?'fas':'far'} fa-star" style="color: ${i<filled?'#f59e0b':'#cbd5e1'}; font-size: 0.6rem; margin-left: 2px;"></i>`; return `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;"><span contenteditable="true" style="font-weight:600; font-size:0.85rem;" oninput="syncArray('skills', '${s.id}', 'name', this.innerText)">${s.name || 'Skill'}</span><div>${stars}</div></div>`; }).join('');
            else if (skillStyle === 'bar-simple') skillHTML = validSkills.map(s => `<div class="skill-item" style="margin-bottom: 8px;"><div style="margin-bottom: 2px; font-weight: 600; font-size: 0.85rem;"><span contenteditable="true" oninput="syncArray('skills', '${s.id}', 'name', this.innerText)">${s.name || 'Skill'}</span></div><div class="skill-bar-bg" style="height: 4px; background: #e2e8f0; border-radius: 4px; overflow: hidden;"><div class="skill-bar-fill" style="width: ${s.level || 80}%; height: 100%; background: var(--res-theme);"></div></div></div>`).join('');
            else { skillHTML = validSkills.map(s => `<div class="skill-item" style="margin-bottom: 8px;"><div style="display:flex; justify-content:space-between; margin-bottom: 2px; font-weight: 600; font-size: 0.85rem;"><span contenteditable="true" oninput="syncArray('skills', '${s.id}', 'name', this.innerText)">${s.name || 'Skill'}</span><span style="opacity:0.8; font-size: 0.8rem;">${s.level || 80}%</span></div><div class="skill-bar-bg" style="height: 4px; background: #e2e8f0; border-radius: 4px; overflow: hidden;"><div class="skill-bar-fill" style="width: ${s.level || 80}%; height: 100%; background: var(--res-theme);"></div></div></div>`).join(''); }
            
            sidebarHTML += `<div class="res-section"><h3 class="res-heading">Skills</h3><div style="${skillStyle.includes('inline') || skillStyle.includes('pill') || skillStyle.includes('tags') ? 'display:flex; flex-wrap:wrap; gap:6px;' : skillStyle === 'grid-2col' ? 'display:grid; grid-template-columns:1fr 1fr; gap:6px;' : 'display:flex; flex-direction:column;'}">${skillHTML}</div></div>`;
        }
    });

    let cleanLi = (typeof p.linkedin === 'string') ? p.linkedin.replace(/^https?:\/\//,'').replace(/^www\./,'') : '';
    let cleanGh = (typeof p.github === 'string') ? p.github.replace(/^https?:\/\//,'').replace(/^www\./,'') : '';

    paper.innerHTML = `
        <div id="resumeContentWrapper" style="width: 100%; transform-origin: top left; transition: transform 0.2s ease;">
            <div class="res-header">
                ${photoHTML}
                <h1 contenteditable="true" oninput="syncText('inpName', this.innerText)">${p.name || 'Your Name'}</h1>
                <h2 contenteditable="true" oninput="syncText('inpTitle', this.innerText)">${p.title || 'Professional Title'}</h2>
                <div class="res-contact" style="margin-top:10px; font-size: 0.85rem; display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;">
                    ${p.email ? `<span><i class="fas fa-envelope" style="color:var(--res-theme);"></i> <span contenteditable="true" oninput="syncText('inpEmail', this.innerText)">${p.email}</span></span>` : ''}
                    ${p.phone ? `<span><i class="fas fa-phone" style="color:var(--res-theme);"></i> <span contenteditable="true" oninput="syncText('inpPhone', this.innerText)">${p.phone}</span></span>` : ''}
                    ${p.location ? `<span><i class="fas fa-map-marker-alt" style="color:var(--res-theme);"></i> <span contenteditable="true" oninput="syncText('inpLocation', this.innerText)">${p.location}</span></span>` : ''}
                    ${p.linkedin ? `<span><i class="fab fa-linkedin" style="color:var(--res-theme);"></i> <a href="${p.linkedin}" target="_blank" style="color:inherit; text-decoration:none;">${cleanLi}</a></span>` : ''}
                    ${p.github ? `<span><i class="fab fa-github" style="color:var(--res-theme);"></i> <a href="${p.github}" target="_blank" style="color:inherit; text-decoration:none;">${cleanGh}</a></span>` : ''}
                </div>
            </div>
            <div class="res-layout-grid"><div class="res-main">${mainHTML}</div><div class="res-sidebar">${sidebarHTML}</div></div>
        </div>
    `;

    // Smart Auto-Fit Math
    setTimeout(() => {
        const content = document.getElementById('resumeContentWrapper');
        if(!content) return;
        const pageMode = d.pageMode || 'single';
        
        if (pageMode === 'multi') {
            paper.style.height = 'auto'; paper.style.minHeight = '297mm'; paper.style.overflow = 'visible';
            content.style.transform = 'none'; content.style.width = '100%';
        } else {
            paper.style.height = '297mm'; paper.style.overflow = 'hidden';
            const style = window.getComputedStyle(paper);
            const targetHeight = paper.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - 5; 
            const contentHeight = content.scrollHeight;
            if (contentHeight > targetHeight && targetHeight > 0) {
                const scale = targetHeight / contentHeight;
                content.style.transform = `scale(${scale})`;
                content.style.width = `${100 / scale}%`;
            } else { content.style.transform = 'none'; content.style.width = '100%'; }
        }
    }, 50);
};


// === FLAWLESS PDF EXPORT ENGINE (ABSOLUTE ZERO METHOD) ===
window.downloadPDF = async function() {
    try {
        if (typeof hideToolbar === 'function') hideToolbar();
        const selection = window.getSelection();
        if (selection) selection.removeAllRanges();

        const btn = document.querySelector('button[onclick="downloadPDF()"]');
        const originalText = btn ? btn.innerHTML : 'Download PDF';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            btn.style.opacity = '0.7';
            btn.style.cursor = 'wait';
            btn.disabled = true;
        }

        // Scroll to top
        window.scrollTo(0, 0);
        await document.fonts.ready;

        const paper = document.getElementById('resumePreview');
        const wrapper = document.getElementById('resumeContentWrapper');

        // Backup
        const originalParent = paper.parentNode;
        const originalSibling = paper.nextSibling;
        const origTransform = wrapper.style.transform;
        const origWidth = wrapper.style.width;

        // Remove editable
        const editables = paper.querySelectorAll('[contenteditable]');
        editables.forEach(el => {
            el.dataset.wasEditable = "true";
            el.removeAttribute('contenteditable');
        });

        // 🔥 FIXED PRINT CONTAINER
        const printContainer = document.createElement('div');
        printContainer.style.position = 'fixed'; // FIX
        printContainer.style.top = '0';
        printContainer.style.left = '0';
        printContainer.style.width = '794px';
        printContainer.style.height = 'auto';
        printContainer.style.margin = '0';
        printContainer.style.padding = '0';
        printContainer.style.zIndex = '999999';
        printContainer.style.background = 'white';
        printContainer.style.overflow = 'hidden'; // FIX
        document.body.appendChild(printContainer);

        // Move paper
        printContainer.appendChild(paper);

        // Force exact width (CRITICAL)
        paper.style.margin = '0';
        paper.style.width = '794px';
        paper.style.maxWidth = '794px';

        // Disable scaling
        wrapper.style.transform = 'none';
        wrapper.style.width = '100%';

        // Extra safety (prevents hidden shifts)
        const originalBodyTransform = document.body.style.transform;
        document.body.style.transform = 'none';

        // Style fix
        const styleFix = document.createElement('style');
        styleFix.innerHTML = `
            .a4-paper { margin: 0 !important; box-shadow: none !important; transform: none !important; }
            .a4-paper * { letter-spacing: normal !important; word-spacing: normal !important; }
        `;
        document.head.appendChild(styleFix);

        // Wait for layout stabilization
        await new Promise(r => setTimeout(r, 300));

        let fileNameName = (resumeData.personal && resumeData.personal.name)
            ? resumeData.personal.name.trim().replace(/\s+/g, '_')
            : 'My';

        const isMulti = resumeData.design && resumeData.design.pageMode === 'multi';

        const elementHeight = wrapper.scrollHeight;
        const pageHeightA4 = 1123;

        const opt = {
            margin: 0,
            filename: `${fileNameName}_Professional_Resume.pdf`,
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                scrollY: 0,
                scrollX: 0,
                windowWidth: 794,
                windowHeight: paper.scrollHeight,
                x: 0,
                y: 0
            },
            jsPDF: {
                unit: 'px',
                format: [794, isMulti ? Math.max(elementHeight, pageHeightA4) : pageHeightA4],
                orientation: 'portrait'
            }
        };

        // Generate PDF
        await html2pdf().set(opt).from(paper).save();

        // Restore DOM
        if (originalSibling) {
            originalParent.insertBefore(paper, originalSibling);
        } else {
            originalParent.appendChild(paper);
        }

        document.body.removeChild(printContainer);
        document.head.removeChild(styleFix);

        wrapper.style.transform = origTransform;
        wrapper.style.width = origWidth;

        document.body.style.transform = originalBodyTransform;

        editables.forEach(el => {
            if (el.dataset.wasEditable) el.setAttribute('contenteditable', 'true');
        });

        if (btn) {
            btn.innerHTML = originalText;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.disabled = false;
        }

    } catch (error) {
        console.error("PDF Failure: ", error);
        alert("Error generating PDF.");
    }
};
// === 31 UNIQUE TEMPLATES & WYSIWYG TOOLBAR INJECTION ===
const popularFonts = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia", "Palatino", "Garamond", "Bookman", "Tahoma", "Trebuchet MS", "Arial Black", "Impact", "Comic Sans MS", "Century Gothic", "Lucida Console", "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald", "Source Sans Pro", "Raleway", "PT Sans", "Merriweather", "Noto Sans", "Nunito", "Poppins", "Playfair Display", "Rubik", "Ubuntu", "Work Sans", "Fira Sans", "Quicksand", "Inter", "Josefin Sans", "Karla", "Arimo", "Libre Baskerville", "Anton", "Bebas Neue", "Dancing Script", "Pacifico", "Lobster", "Righteous", "Cinzel", "Inconsolata", "Fjalla One", "Mukta", "Cabin"];

window.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Template Gallery
    const grid = document.getElementById('templateGrid30');
    if(grid) {
        const themes = [
            { name: "Start from Scratch", class: "tpl-blank", font: "Arial", desc: "A completely empty canvas", color: "#cbd5e1", skillStyle: "text-simple" },
            { name: "The Executive", class: "tpl-executive", font: "Times New Roman", desc: "Classic ATS-Friendly", color: "#0f172a", skillStyle: "text-bullet" },
            { name: "Tech Innovator", class: "tpl-modern", font: "Roboto", desc: "Light Left Sidebar", color: "#3b82f6", skillStyle: "bar-percent" },
            { name: "Creative Director", class: "tpl-creative", font: "Montserrat", desc: "Bold Top Header", color: "#8b5cf6", skillStyle: "pill-solid" },
            { name: "The Strategist", class: "tpl-elegant", font: "Playfair Display", desc: "Centered & Sophisticated", color: "#1e293b", skillStyle: "minimal-line" },
            { name: "Data Architect", class: "tpl-split", font: "Lato", desc: "Perfect 50/50 Split", color: "#0ea5e9", skillStyle: "grid-2col" },
            { name: "Pure Minimalist", class: "tpl-minimal", font: "Inter", desc: "High Whitespace", color: "#000000", skillStyle: "tags-square" },
            { name: "Agency Pro", class: "tpl-dark-sidebar", font: "Poppins", desc: "Inverted Dark Sidebar", color: "#111827", skillStyle: "bar-simple" },
            { name: "The Scholar", class: "tpl-academic", font: "Garamond", desc: "Dense & Boxed", color: "#7f1d1d", skillStyle: "text-comma" },
            { name: "Operations Lead", class: "tpl-executive", font: "Merriweather", desc: "Traditional Serif", color: "#4338ca", skillStyle: "grid-2col" },
            { name: "UX Researcher", class: "tpl-modern", font: "Open Sans", desc: "Clean & Soft", color: "#ec4899", skillStyle: "dots" },
            { name: "Startup Founder", class: "tpl-split", font: "Raleway", desc: "Modern Two-Column", color: "#10b981", skillStyle: "pill-outline" },
            { name: "Frontend Dev", class: "tpl-dark-sidebar", font: "Source Code Pro", desc: "Code-Inspired Dark", color: "#059669", skillStyle: "bar-percent" },
            { name: "Graphic Artist", class: "tpl-creative", font: "Oswald", desc: "Heavy Typography", color: "#ef4444", skillStyle: "tags-square" },
            { name: "Legal Counsel", class: "tpl-elegant", font: "Georgia", desc: "Strict Standard", color: "#334155", skillStyle: "minimal-line" },
            { name: "Product Manager", class: "tpl-minimal", font: "Nunito", desc: "Friendly & Open", color: "#0284c7", skillStyle: "pill-solid" },
            { name: "Sales Director", class: "tpl-executive", font: "PT Sans", desc: "Direct & Balanced", color: "#ea580c", skillStyle: "text-bullet" },
            { name: "Content Writer", class: "tpl-elegant", font: "Lora", desc: "Editorial Style", color: "#4c1d95", skillStyle: "text-simple" },
            { name: "HR Specialist", class: "tpl-modern", font: "Quicksand", desc: "Approachable Sidebar", color: "#14b8a6", skillStyle: "bar-simple" },
            { name: "Systems Analyst", class: "tpl-split", font: "Verdana", desc: "High Readability", color: "#1d4ed8", skillStyle: "grid-2col" },
            { name: "Art Director", class: "tpl-creative", font: "Cinzel", desc: "Dramatic Header", color: "#be123c", skillStyle: "stars" },
            { name: "Public Relations", class: "tpl-elegant", font: "Cormorant Garamond", desc: "High-End Luxury", color: "#b45309", skillStyle: "minimal-line" },
            { name: "Cloud Engineer", class: "tpl-dark-sidebar", font: "Fira Sans", desc: "Deep Tech", color: "#0369a1", skillStyle: "bar-percent" },
            { name: "Consultant", class: "tpl-executive", font: "Tahoma", desc: "Corporate Reliable", color: "#475569", skillStyle: "text-comma" },
            { name: "Brand Strategist", class: "tpl-minimal", font: "Josefin Sans", desc: "Avant-garde Spacing", color: "#c026d3", skillStyle: "tags-square" },
            { name: "Healthcare Pro", class: "tpl-modern", font: "Mukta", desc: "Clinical & Clean", color: "#0ea5e9", skillStyle: "pill-outline" },
            { name: "Educator", class: "tpl-academic", font: "Zilla Slab", desc: "Academic Structured", color: "#15803d", skillStyle: "text-bullet" },
            { name: "Event Planner", class: "tpl-creative", font: "Dancing Script", desc: "Stylized & Fun", color: "#db2777", skillStyle: "pill-solid" },
            { name: "Civil Engineer", class: "tpl-split", font: "Barlow", desc: "Structural Grid", color: "#b91c1c", skillStyle: "grid-2col" },
            { name: "Scientist", class: "tpl-elegant", font: "Spectral", desc: "Journal Format", color: "#4f46e5", skillStyle: "text-simple" },
            { name: "The Visionary", class: "tpl-minimal", font: "Space Mono", desc: "Future-Forward", color: "#64748b", skillStyle: "dots" }
        ];

        grid.innerHTML = themes.map((t) => {
            let previewHTML = '';
            if (t.class === 'tpl-blank') previewHTML = `<div style="width:100%; height:100%; border: 2px dashed #cbd5e1; border-radius: 8px; display:flex; align-items:center; justify-content:center; color:#94a3b8;"><i class="fas fa-plus fa-2x"></i></div>`;
            else if (t.class === 'tpl-modern') previewHTML = `<div style="width: 30%; background: ${t.color}; height: 100%; border-right: 2px solid rgba(0,0,0,0.1);"></div><div style="width: 70%; background: #ffffff;"></div>`;
            else if (t.class === 'tpl-creative') previewHTML = `<div style="width: 100%; display: flex; flex-direction: column;"><div style="height: 45px; background: ${t.color};"></div><div style="flex-grow: 1; background: #ffffff;"></div></div>`;
            else if (t.class === 'tpl-elegant') previewHTML = `<div style="width: 100%; display: flex; flex-direction: column; align-items:center; padding-top:15px;"><div style="width: 50%; height: 10px; background: ${t.color}; border-radius:10px; margin-bottom:10px;"></div><div style="flex-grow: 1; width:100%; background: #f1f5f9;"></div></div>`;
            else if (t.class === 'tpl-split') previewHTML = `<div style="width: 100%; display: flex; gap:4px;"><div style="width: 50%; background: #f8fafc; border-top: 6px solid ${t.color}; height: 100%;"></div><div style="width: 50%; background: #f1f5f9; height: 100%;"></div></div>`;
            else if (t.class === 'tpl-minimal') previewHTML = `<div style="width: 100%; display: flex; flex-direction: column; padding:15px;"><div style="width: 70%; height: 20px; background: ${t.color}; margin-bottom:10px;"></div><div style="width: 90%; height: 6px; background: #cbd5e1; margin-bottom:5px;"></div><div style="width: 60%; height: 6px; background: #cbd5e1;"></div></div>`;
            else if (t.class === 'tpl-dark-sidebar') previewHTML = `<div style="width: 40%; background: ${t.color}; height: 100%;"></div><div style="width: 60%; background: #f8fafc;"></div>`;
            else if (t.class === 'tpl-academic') previewHTML = `<div style="width: 100%; display: flex; flex-direction: column; padding: 10px;"><div style="width: 100%; height: 15px; border-bottom: 3px double ${t.color}; margin-bottom: 10px;"></div><div style="flex-grow: 1; border: 1px solid #e2e8f0; background: #fafafa;"></div></div>`;
            else previewHTML = `<div style="width: 100%; display: flex; flex-direction: column;"><div style="height: 8px; background: ${t.color};"></div><div style="flex-grow: 1; background: #f8fafc;"></div></div>`;

            return `
            <div class="template-card-modern">
                <div class="template-preview-abstract">${previewHTML}</div>
                <h3 class="template-title">${t.name}</h3>
                <p style="font-size: 0.75rem; color: #94a3b8; margin: -10px 0 15px 0;">${t.desc}</p>
                <button class="template-choose-btn" style="background: ${t.class === 'tpl-blank' ? '#94a3b8' : t.color};" onclick="loadSpecificTemplate('${t.class}', '${t.font}', ${t.class === 'tpl-blank'}, '${t.color}', '${t.skillStyle}')">
                    ${t.class === 'tpl-blank' ? 'Start Blank' : 'Choose Pattern'}
                </button>
            </div>`;
        }).join('');
    }

    // 2. Inject Fully-Featured WYSIWYG Toolbar
    const fontOptions = popularFonts.map(font => `<option value="${font}" style="font-family: '${font}', sans-serif;">${font}</option>`).join('');
    const toolbarHTML = `
    <div class="wysiwyg-toolbar" id="wysiwygToolbar" style="position: fixed; z-index: 99999; display: flex; flex-direction: column; gap: 8px; opacity: 0; pointer-events: none; transition: opacity 0.2s ease, box-shadow 0.2s ease; box-shadow: 0 15px 35px rgba(0,0,0,0.15); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 16px; background: rgba(255,255,255,0.95); backdrop-filter: blur(16px); padding: 12px; margin: 0; min-width: 340px;">
        <div style="display: flex; align-items: center; gap: 6px;">
            <div id="toolbarDragHandle" style="cursor: grab; padding: 4px; color: #a855f7; font-size: 1.2rem;" title="Drag Toolbar"><i class="fas fa-grip-vertical"></i></div>
            <button class="tool-btn" onmousedown="event.preventDefault()" onclick="formatText('undo')" title="Undo"><i class="fas fa-undo"></i></button>
            <button class="tool-btn" onmousedown="event.preventDefault()" onclick="formatText('redo')" title="Redo"><i class="fas fa-redo"></i></button>
            <div style="width: 1px; height: 20px; background: #cbd5e1; margin: 0 2px;"></div>
            <select id="wysiwygFont" onchange="loadAndSetFont(this.value)" style="border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; background: rgba(255,255,255,0.9); outline: none; max-width: 130px; padding: 4px; cursor: pointer;"><option value="inherit">Default Font</option>${fontOptions}</select>
            <div class="size-controls" style="display: flex; align-items: center; gap: 4px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
                <button class="tool-btn" onmousedown="event.preventDefault()" onclick="changeFontSize(-1)"><i class="fas fa-minus"></i></button>
                <span id="wysiwygFontSize" style="font-weight: 700; width: 20px; text-align: center;">16</span>
                <button class="tool-btn" onmousedown="event.preventDefault()" onclick="changeFontSize(1)"><i class="fas fa-plus"></i></button>
            </div>
            <button class="tool-btn" onmousedown="event.preventDefault()" onclick="formatText('removeFormat')" style="color: #ef4444;" title="Clear Formatting"><i class="fas fa-remove-format"></i></button>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
            <button class="tool-btn" id="btnBold" onmousedown="event.preventDefault()" onclick="formatText('bold')"><i class="fas fa-bold"></i></button>
            <button class="tool-btn" id="btnItalic" onmousedown="event.preventDefault()" onclick="formatText('italic')"><i class="fas fa-italic"></i></button>
            <button class="tool-btn" id="btnUnderline" onmousedown="event.preventDefault()" onclick="formatText('underline')"><i class="fas fa-underline"></i></button>
            <button class="tool-btn" id="btnStrike" onmousedown="event.preventDefault()" onclick="formatText('strikeThrough')"><i class="fas fa-strikethrough"></i></button>
            <div style="width: 1px; height: 20px; background: #cbd5e1; margin: 0 2px;"></div>
            <button class="tool-btn" id="btnSub" onmousedown="event.preventDefault()" onclick="formatText('subscript')"><i class="fas fa-subscript"></i></button>
            <button class="tool-btn" id="btnSup" onmousedown="event.preventDefault()" onclick="formatText('superscript')"><i class="fas fa-superscript"></i></button>
            <div style="width: 1px; height: 20px; background: #cbd5e1; margin: 0 2px;"></div>
            <div style="display:flex; flex-direction: column; align-items: center;" title="Text Color"><input type="color" id="wysiwygColor" onchange="formatText('foreColor', this.value)" style="border: none; width: 22px; height: 22px; cursor: pointer; padding: 0; background: transparent;"></div>
            <div style="display:flex; flex-direction: column; align-items: center;" title="Highlight Color"><input type="color" id="wysiwygHighlight" value="#ffffff" onchange="formatText('backColor', this.value)" style="border: none; width: 22px; height: 22px; cursor: pointer; padding: 0; background: transparent;"></div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
            <button class="tool-btn" id="btnLeft" onmousedown="event.preventDefault()" onclick="formatText('justifyLeft')"><i class="fas fa-align-left"></i></button>
            <button class="tool-btn" id="btnCenter" onmousedown="event.preventDefault()" onclick="formatText('justifyCenter')"><i class="fas fa-align-center"></i></button>
            <button class="tool-btn" id="btnRight" onmousedown="event.preventDefault()" onclick="formatText('justifyRight')"><i class="fas fa-align-right"></i></button>
            <button class="tool-btn" id="btnJustify" onmousedown="event.preventDefault()" onclick="formatText('justifyFull')"><i class="fas fa-align-justify"></i></button>
            <div style="width: 1px; height: 20px; background: #cbd5e1; margin: 0 2px;"></div>
            <button class="tool-btn" onmousedown="event.preventDefault()" onclick="formatText('insertUnorderedList')"><i class="fas fa-list-ul"></i></button>
            <button class="tool-btn" onmousedown="event.preventDefault()" onclick="formatText('insertOrderedList')"><i class="fas fa-list-ol"></i></button>
            <button class="tool-btn" onmousedown="event.preventDefault()" onclick="formatText('outdent')"><i class="fas fa-outdent"></i></button>
            <button class="tool-btn" onmousedown="event.preventDefault()" onclick="formatText('indent')"><i class="fas fa-indent"></i></button>
            <div style="width: 1px; height: 20px; background: #cbd5e1; margin: 0 2px;"></div>
            <button class="tool-btn" onmousedown="event.preventDefault()" onclick="addLink()"><i class="fas fa-link"></i></button>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; padding-top: 6px; border-top: 1px solid rgba(139,92,246,0.2);">
            <select onchange="applyBlockStyle('lineHeight', this.value)" style="border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; font-size: 0.8rem; padding: 4px; flex-grow: 1; cursor: pointer; outline:none;"><option value="">↕ Line Height</option><option value="1">Single (1.0)</option><option value="1.5">Relaxed (1.5)</option><option value="2">Double (2.0)</option></select>
            <select onchange="applyBlockStyle('letterSpacing', this.value)" style="border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; font-size: 0.8rem; padding: 4px; flex-grow: 1; cursor: pointer; outline:none;"><option value="">↔ Spacing</option><option value="-0.5px">Tight</option><option value="normal">Normal</option><option value="1px">Wide</option></select>
            <select onchange="applyBlockStyle('textTransform', this.value)" style="border: 1px solid rgba(139,92,246,0.3); border-radius: 6px; font-size: 0.8rem; padding: 4px; flex-grow: 1; cursor: pointer; outline:none;"><option value="">Aa Case</option><option value="uppercase">UPPERCASE</option><option value="lowercase">lowercase</option><option value="capitalize">Capitalize</option><option value="none">Normal</option></select>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', toolbarHTML);
    setupToolbarDrag();

    const paperEl = document.getElementById('resumePreview');
    if(paperEl) {
        const handleSelection = (e) => {
            if (e && e.target && e.target.closest('#wysiwygToolbar')) return; 
            const selection = window.getSelection();
            if (selection.toString().trim().length > 0) {
                let node = selection.anchorNode;
                if (node && node.nodeType === 3) node = node.parentNode; 
                const editableTarget = node ? node.closest('[contenteditable="true"]') : null;
                if (editableTarget && paperEl.contains(editableTarget)) window.showToolbar(editableTarget);
                else window.hideToolbar();
            } else window.hideToolbar();
        };
        paperEl.addEventListener('mouseup', handleSelection);
        paperEl.addEventListener('keyup', handleSelection);
        document.addEventListener('mousedown', (e) => { 
            if (!e.target.closest('#resumePreview') && !e.target.closest('#wysiwygToolbar')) window.hideToolbar(); 
        });
    }
});

// === TOOLBAR LOGIC ===
let currentActiveElement = null; 
let isToolbarMoved = false;

window.loadSpecificTemplate = function(templateClass, fontName, isBlank, hexColor, skillStyle) {
    window.initEditor(templateClass, isBlank);
    if(!resumeData.design) resumeData.design = {};
    resumeData.design.font = `'${fontName}', sans-serif`;
    resumeData.design.color = hexColor;
    resumeData.design.skillStyle = skillStyle;
    
    if(document.getElementById('selColor')) document.getElementById('selColor').value = hexColor;
    if(document.getElementById('selSkillStyle')) document.getElementById('selSkillStyle').value = skillStyle;
    
    const fontId = 'font-' + fontName.replace(/\s+/g, '-').toLowerCase();
    if (!document.getElementById(fontId)) { 
        const link = document.createElement('link'); link.id = fontId; link.rel = 'stylesheet'; 
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;600;700;800&display=swap`; 
        document.head.appendChild(link); 
    }
    
    if (isBlank) {
        resumeData.personal = { name: '', title: '', email: '', phone: '', location: '', summary: '', photo: '', linkedin: '', github: '' };
        resumeData.experience = []; resumeData.education = []; resumeData.projects = []; resumeData.skills = []; resumeData.certifications = [];
        resumeData.layout = []; document.getElementById('dragContainer').innerHTML = ''; setupEditorUI(); 
    }
    window.saveData(); window.updatePreview();
};

function setupToolbarDrag() {
    const toolbar = document.getElementById('wysiwygToolbar');
    const handle = document.getElementById('toolbarDragHandle');
    let isDragging = false; let offsetX, offsetY;
    if(!handle || !toolbar) return;
    handle.addEventListener('mousedown', (e) => { 
        isDragging = true; isToolbarMoved = true;
        const rect = toolbar.getBoundingClientRect(); 
        offsetX = e.clientX - rect.left; offsetY = e.clientY - rect.top; 
        handle.style.cursor = 'grabbing'; toolbar.style.transition = 'none'; e.preventDefault(); 
    });
    document.addEventListener('mousemove', (e) => { 
        if (!isDragging) return; 
        toolbar.style.left = `${e.clientX - offsetX}px`; toolbar.style.top = `${e.clientY - offsetY}px`; 
    });
    document.addEventListener('mouseup', () => { 
        if(isDragging) { isDragging = false; handle.style.cursor = 'grab'; toolbar.style.transition = 'opacity 0.2s ease'; } 
    });
}

window.showToolbar = function(element) {
    const toolbar = document.getElementById('wysiwygToolbar');
    if(!toolbar) return; currentActiveElement = element;
    if (!isToolbarMoved) { 
        const rect = element.getBoundingClientRect(); 
        let topPosition = rect.top - 180; 
        if (topPosition < 10) topPosition = rect.bottom + 10; 
        toolbar.style.top = `${topPosition}px`; toolbar.style.left = `${Math.max(20, rect.left)}px`; 
    }
    updateToolbarInputValues(element);
    toolbar.style.opacity = '1'; toolbar.style.pointerEvents = 'auto';
};

window.hideToolbar = function() {
    const toolbar = document.getElementById('wysiwygToolbar');
    if(toolbar) { toolbar.style.opacity = '0'; toolbar.style.pointerEvents = 'none'; }
    currentActiveElement = null;
};

window.formatText = function(cmd, value) { 
    if(!currentActiveElement) return; currentActiveElement.focus(); 
    document.execCommand(cmd, false, value); updateToolbarInputValues(currentActiveElement); window.saveData(); 
};

window.loadAndSetFont = function(fontName) {
    if(!currentActiveElement || fontName === 'inherit') { if(currentActiveElement) currentActiveElement.style.fontFamily = 'inherit'; return; }
    const fontId = 'font-' + fontName.replace(/\s+/g, '-').toLowerCase();
    if (!document.getElementById(fontId)) { 
        const link = document.createElement('link'); link.id = fontId; link.rel = 'stylesheet'; 
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;600;700;800&display=swap`; 
        document.head.appendChild(link); 
    }
    currentActiveElement.style.fontFamily = `'${fontName}', sans-serif`; window.saveData();
};

window.changeFontSize = function(step) { 
    if(!currentActiveElement) return; 
    let currentSize = parseInt(window.getComputedStyle(currentActiveElement).fontSize) || 16; 
    currentActiveElement.style.fontSize = (currentSize + step) + 'px'; 
    document.getElementById('wysiwygFontSize').innerText = currentSize + step; window.saveData(); 
};

window.addLink = function() { 
    if(!currentActiveElement) return; 
    const url = prompt("Enter URL:", "https://"); 
    if (url && url !== "https://" && url.trim() !== "") { 
        currentActiveElement.focus(); document.execCommand("createLink", false, url); 
        let links = currentActiveElement.getElementsByTagName('a'); 
        for(let a of links) { a.target = "_blank"; a.style.color = "var(--res-theme)"; } window.saveData(); 
    } 
};

window.applyBlockStyle = function(property, value) { 
    if(!currentActiveElement) return; 
    if(value === "") currentActiveElement.style.removeProperty(property); else currentActiveElement.style[property] = value; 
    window.saveData(); 
};

function updateToolbarInputValues(element) {
    const commands = ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'];
    commands.forEach(cmd => { 
        let btn = document.getElementById('btn' + cmd.charAt(0).toUpperCase() + cmd.slice(1)); 
        if(btn) {
            if(document.queryCommandState(cmd)) {
                btn.style.color = 'var(--primary)'; btn.style.background = 'rgba(79, 70, 229, 0.1)'; btn.style.borderRadius = '4px';
            } else { btn.style.color = '#64748b'; btn.style.background = 'transparent'; }
        }
    });
    if(document.getElementById('wysiwygFontSize')) document.getElementById('wysiwygFontSize').innerText = parseInt(window.getComputedStyle(element).fontSize) || 16;
    let currentFont = element.style.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
    const fontSelect = document.getElementById('wysiwygFont'); 
    if (fontSelect) fontSelect.value = Array.from(fontSelect.options).some(opt => opt.value === currentFont) ? currentFont : 'inherit';
    if(document.getElementById('wysiwygColor')) document.getElementById('wysiwygColor').value = rgbToHex(document.queryCommandValue('foreColor') || window.getComputedStyle(element).color);
    if(document.getElementById('wysiwygHighlight')) document.getElementById('wysiwygHighlight').value = rgbToHex(document.queryCommandValue('backColor') || window.getComputedStyle(element).backgroundColor);
}

function rgbToHex(rgb) {
    if(!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return '#ffffff'; if(rgb.startsWith('#')) return rgb;
    let r, g, b; 
    if(rgb.startsWith('rgb')) { const match = rgb.match(/\d+/g); if(match && match.length >= 3) { r = parseInt(match[0]); g = parseInt(match[1]); b = parseInt(match[2]); } else return '#ffffff'; } 
    else if(!isNaN(rgb)) { b = (rgb >> 16) & 255; g = (rgb >> 8) & 255; r = rgb & 255; } else return '#ffffff';
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

// === AI CO-PILOT ===
let aiCurrentTargetType = '';
let aiCurrentTargetId = '';

window.openAIModal = function(type, id) {
    aiCurrentTargetType = type; aiCurrentTargetId = id;
    document.getElementById('aiOverlay').style.display = 'block'; document.getElementById('aiModal').style.display = 'block'; document.getElementById('aiResultsArea').style.display = 'none';
    const inputField = document.getElementById('aiRoleInput'); inputField.value = '';
    if (type === 'summary') { document.getElementById('aiPromptText').innerText = "What is your profession?"; inputField.placeholder = "e.g. Full Stack Developer"; } 
    else { document.getElementById('aiPromptText').innerText = "What was your job title?"; inputField.placeholder = "e.g. Marketing Manager"; if(resumeData[type]) { let item = resumeData[type].find(i => String(i.id) === String(id)); if(item && item.title) inputField.value = item.title; if(item && item.name) inputField.value = item.name; } }
    inputField.focus();
}

window.closeAIModal = function() { document.getElementById('aiOverlay').style.display = 'none'; document.getElementById('aiModal').style.display = 'none'; }

window.generateAIContent = function() {
    const role = document.getElementById('aiRoleInput').value.trim() || 'Professional';
    document.getElementById('aiLoader').style.display = 'block'; document.getElementById('aiResultsArea').style.display = 'none';
    setTimeout(() => {
        document.getElementById('aiLoader').style.display = 'none';
        const list = document.getElementById('aiOptionsList'); list.innerHTML = '';
        let results = [];
        if (aiCurrentTargetType === 'summary') {
            results = [
                `Results-driven ${role} with a proven track record of delivering high-impact solutions and driving operational efficiency. Adept at cross-functional collaboration and leading projects from conception to successful deployment.`,
                `Innovative ${role} specializing in optimizing processes and leveraging data-driven insights to exceed strategic goals. Passionate about continuous improvement and driving scalable growth.`,
                `Highly analytical ${role} with exceptional problem-solving skills and a strong focus on aligning technical capabilities with business objectives.`
            ];
        } else {
            results = [
                `Spearheaded cross-functional initiatives, resulting in a 25% increase in operational efficiency and accelerating project delivery timelines.`,
                `Designed and implemented scalable, data-driven solutions that optimized workflows and reduced bottlenecks by over 30%.`,
                `Led end-to-end execution of complex projects, ensuring 100% compliance with industry standards while coming in under budget.`
            ];
        }
        results.forEach(text => { list.innerHTML += `<div onclick="applyAIContent(\`${text}\`)" style="padding: 15px; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; background: #f8fafc; transition: 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);" onmouseover="this.style.borderColor='#a855f7'; this.style.background='#ffffff'" onmouseout="this.style.borderColor='#e2e8f0'; this.style.background='#f8fafc'"><p style="margin: 0; font-size: 0.9rem; color: #334155; line-height: 1.5;">${text}</p></div>`; });
        document.getElementById('aiResultsArea').style.display = 'block';
    }, 1200);
}

window.applyAIContent = function(text) {
    if (aiCurrentTargetType === 'summary') { const sumBox = document.getElementById('inpSummary'); if (sumBox) { sumBox.value = sumBox.value ? sumBox.value + '\n\n' + text : text; window.syncText('inpSummary', sumBox.value); } } 
    else { const item = resumeData[aiCurrentTargetType].find(i => String(i.id) === String(aiCurrentTargetId)); if (item) { let bullet = `• ${text}`; item.desc = item.desc ? item.desc + '\n' + bullet : bullet; window.saveData(); renderArrayLists(); window.updatePreview(); } }
    closeAIModal();
}


// ── EXTENDED renderArrayLists with new sections ─────────────────
const _origRenderArrayLists = renderArrayLists;
renderArrayLists = function() {
    _origRenderArrayLists();

    // Certifications
    const listCert = document.getElementById('list-certifications');
    if(listCert) listCert.innerHTML = (resumeData.certifications||[]).map(c=>`
        <div class="dynamic-item" style="position:relative;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e2e8f0;">
            <button style="position:absolute;right:0;top:0;background:none;border:none;color:#ef4444;cursor:pointer;" onclick="removeArrayItem('certifications','${c.id}')"><i class="fas fa-times"></i></button>
            <input type="text" placeholder="Certification Name" value="${esc(c.name)}" oninput="updateArrayItem('certifications','${c.id}','name',this.value)" style="width:100%;margin-bottom:6px;padding:7px;border-radius:6px;border:1px solid #cbd5e1;">
            <div style="display:flex;gap:8px;">
                <input type="text" placeholder="Issuer" value="${esc(c.issuer)}" oninput="updateArrayItem('certifications','${c.id}','issuer',this.value)" style="flex:1;padding:7px;border-radius:6px;border:1px solid #cbd5e1;">
                <input type="text" placeholder="Date" value="${esc(c.date)}" oninput="updateArrayItem('certifications','${c.id}','date',this.value)" style="flex:0 0 90px;padding:7px;border-radius:6px;border:1px solid #cbd5e1;">
            </div>
        </div>`).join('');

    // Languages
    const listLang = document.getElementById('list-languages');
    if(listLang) listLang.innerHTML = (resumeData.languages||[]).map(l=>`
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <button style="background:none;border:none;color:#ef4444;cursor:pointer;" onclick="removeArrayItem('languages','${l.id}')"><i class="fas fa-times"></i></button>
            <input type="text" placeholder="Language" value="${esc(l.name)}" oninput="updateArrayItem('languages','${l.id}','name',this.value)" style="flex:1;padding:6px 10px;border-radius:6px;border:1px solid #cbd5e1;">
            <select onchange="updateArrayItem('languages','${l.id}','level',this.value)" style="padding:6px;border-radius:6px;border:1px solid #cbd5e1;font-size:.8rem;">
                ${['Native','Fluent','Advanced','Conversational','Basic'].map(o=>`<option value="${o}" ${l.level===o?'selected':''}>${o}</option>`).join('')}
            </select>
        </div>`).join('');

    // Volunteer
    const listVol = document.getElementById('list-volunteer');
    if(listVol) listVol.innerHTML = (resumeData.volunteer||[]).map(v=>`
        <div class="dynamic-item" style="position:relative;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e2e8f0;">
            <button style="position:absolute;right:0;top:0;background:none;border:none;color:#ef4444;cursor:pointer;" onclick="removeArrayItem('volunteer','${v.id}')"><i class="fas fa-times"></i></button>
            <input type="text" placeholder="Role" value="${esc(v.role)}" oninput="updateArrayItem('volunteer','${v.id}','role',this.value)" style="width:100%;margin-bottom:6px;padding:7px;border-radius:6px;border:1px solid #cbd5e1;">
            <div style="display:flex;gap:8px;margin-bottom:6px;">
                <input type="text" placeholder="Organization" value="${esc(v.org)}" oninput="updateArrayItem('volunteer','${v.id}','org',this.value)" style="flex:1;padding:7px;border-radius:6px;border:1px solid #cbd5e1;">
                <input type="text" placeholder="Date" value="${esc(v.date)}" oninput="updateArrayItem('volunteer','${v.id}','date',this.value)" style="flex:0 0 90px;padding:7px;border-radius:6px;border:1px solid #cbd5e1;">
            </div>
            <textarea placeholder="Description" rows="2" oninput="updateArrayItem('volunteer','${v.id}','desc',this.value)" style="width:100%;padding:7px;border-radius:6px;border:1px solid #cbd5e1;resize:vertical;">${esc(v.desc)}</textarea>
        </div>`).join('');

    // Awards
    const listAwd = document.getElementById('list-awards');
    if(listAwd) listAwd.innerHTML = (resumeData.awards||[]).map(a=>`
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <button style="background:none;border:none;color:#ef4444;cursor:pointer;" onclick="removeArrayItem('awards','${a.id}')"><i class="fas fa-times"></i></button>
            <input type="text" placeholder="Award Name" value="${esc(a.name)}" oninput="updateArrayItem('awards','${a.id}','name',this.value)" style="flex:1;padding:7px;border-radius:6px;border:1px solid #cbd5e1;">
            <input type="text" placeholder="Date" value="${esc(a.date)}" oninput="updateArrayItem('awards','${a.id}','date',this.value)" style="width:80px;padding:7px;border-radius:6px;border:1px solid #cbd5e1;">
        </div>`).join('');

    // Publications
    const listPub = document.getElementById('list-publications');
    if(listPub) listPub.innerHTML = (resumeData.publications||[]).map(p=>`
        <div class="dynamic-item" style="position:relative;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e2e8f0;">
            <button style="position:absolute;right:0;top:0;background:none;border:none;color:#ef4444;cursor:pointer;" onclick="removeArrayItem('publications','${p.id}')"><i class="fas fa-times"></i></button>
            <input type="text" placeholder="Title" value="${esc(p.title)}" oninput="updateArrayItem('publications','${p.id}','title',this.value)" style="width:100%;margin-bottom:6px;padding:7px;border-radius:6px;border:1px solid #cbd5e1;">
            <div style="display:flex;gap:8px;">
                <input type="text" placeholder="Publisher / Journal" value="${esc(p.publisher)}" oninput="updateArrayItem('publications','${p.id}','publisher',this.value)" style="flex:1;padding:7px;border-radius:6px;border:1px solid #cbd5e1;">
                <input type="text" placeholder="Date" value="${esc(p.date)}" oninput="updateArrayItem('publications','${p.id}','date',this.value)" style="flex:0 0 80px;padding:7px;border-radius:6px;border:1px solid #cbd5e1;">
            </div>
        </div>`).join('');

    // Custom sections
    if (resumeData.customSections) {
        Object.keys(resumeData.customSections).forEach(key => {
            const sec = resumeData.customSections[key];
            const el = document.getElementById('list-' + key);
            if (!el) return;
            el.innerHTML = (sec.items||[]).map(item=>`
                <div class="dynamic-item" style="position:relative;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #e2e8f0;">
                    <button style="position:absolute;right:0;top:0;background:none;border:none;color:#ef4444;cursor:pointer;" onclick="removeCustomSectionItem('${key}','${item.id}')"><i class="fas fa-times"></i></button>
                    <input type="text" placeholder="Title" value="${esc(item.title)}" oninput="updateCustomItem('${key}','${item.id}','title',this.value)" style="width:100%;margin-bottom:6px;padding:7px;border-radius:6px;border:1px solid #cbd5e1;">
                    <input type="text" placeholder="Date" value="${esc(item.date)}" oninput="updateCustomItem('${key}','${item.id}','date',this.value)" style="width:100%;margin-bottom:6px;padding:7px;border-radius:6px;border:1px solid #cbd5e1;">
                    <textarea placeholder="Description" rows="2" oninput="updateCustomItem('${key}','${item.id}','desc',this.value)" style="width:100%;padding:7px;border-radius:6px;border:1px solid #cbd5e1;resize:vertical;">${esc(item.desc)}</textarea>
                </div>`).join('');
        });
    }
};


window.improveGrammar = function(type, id) {
    const item = resumeData[type].find(i => String(i.id) === String(id));
    if (!item || !item.desc) return alert("Please write a description first.");
    const replacements = { "worked on": "spearheaded", "made": "architected", "helped": "facilitated", "good": "exceptional", "did": "executed", "led to": "yielded", "in charge of": "directed", "was responsible for": "managed", "changed": "transformed", "fixed": "resolved" };
    let improvedText = item.desc;
    Object.keys(replacements).forEach(weak => { const regex = new RegExp(`\\b${weak}\\b`, 'gi'); improvedText = improvedText.replace(regex, replacements[weak]); });
    if(improvedText.length > 20 && !improvedText.toLowerCase().includes("optimized")) improvedText = improvedText.replace(/^(•|-)?\s*/m, "$1 Optimized core workflows and ");
    item.desc = improvedText;
    let textArea = document.getElementById(`${type === 'experience' ? 'exp' : 'proj'}-desc-${id}`);
    if(textArea) { textArea.style.transition = '0.3s'; textArea.style.backgroundColor = '#dcfce7'; setTimeout(() => textArea.style.backgroundColor = '#f8fafc', 500); }
    window.saveData(); renderArrayLists(); window.updatePreview();
}

// ═══════════════════════════════════════════════════════════════
// ██ MISSING FEATURES BLOCK — Added by WorkFolio upgrade ██
// ═══════════════════════════════════════════════════════════════

// ── 1. UNDO / REDO HISTORY ─────────────────────────────────────
const undoStack = [];
const redoStack = [];
let undoPaused = false;
function pushUndo() {
    if (undoPaused) return;
    undoStack.push(JSON.stringify(resumeData));
    if (undoStack.length > 40) undoStack.shift();
    redoStack.length = 0;
}
window.undoResume = function() {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify(resumeData));
    const prev = undoStack.pop();
    undoPaused = true;
    resumeData = JSON.parse(prev);
    setupEditorUI();
    window.updatePreview();
    undoPaused = false;
    showToast('↩ Undo');
};
window.redoResume = function() {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(resumeData));
    const next = redoStack.pop();
    undoPaused = true;
    resumeData = JSON.parse(next);
    setupEditorUI();
    window.updatePreview();
    undoPaused = false;
    showToast('↪ Redo');
};
// Hook into saveData to push undo snapshots
const _origSaveForUndo = window.saveData;
window.saveData = function() {
    pushUndo();
    _origSaveForUndo && _origSaveForUndo();
};
// Keyboard shortcuts for undo/redo
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); window.undoResume(); }
    if ((e.ctrlKey || e.metaKey) && (e.shiftKey && e.key === 'z' || e.key === 'y')) { e.preventDefault(); window.redoResume(); }
});

// ── 2. WORD/CHAR COUNTER ────────────────────────────────────────
window.updateWordCount = function(textareaId, counterId) {
    const el = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    if (!el || !counter) return;
    const text = el.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    counter.textContent = words + 'w / ' + chars + 'c';
    counter.style.color = chars > 500 ? '#ef4444' : '#94a3b8';
};

// ── 3. DUPLICATE RESUME ─────────────────────────────────────────
window.duplicateResume = function(index) {
    let resumes = getSafeResumes();
    if (!resumes[index]) return;
    const copy = JSON.parse(JSON.stringify(resumes[index]));
    copy.id = Date.now();
    copy.name = (copy.name || 'Resume') + ' (Copy)';
    copy.date = new Date().toLocaleDateString();
    resumes.splice(index + 1, 0, copy);
    localStorage.setItem(getResumeDBKey(), JSON.stringify(resumes));
    renderDashboard();
    showToast('Resume duplicated!');
};

// ── 4. JSON EXPORT / IMPORT ─────────────────────────────────────
window.exportResumeJSON = function() {
    const data = JSON.stringify(resumeData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (resumeData.personal.name || 'resume').replace(/\s+/g,'_') + '_backup.json';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('JSON exported!');
};
window.importResumeJSON = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (!parsed.personal) throw new Error('Invalid file');
            pushUndo();
            resumeData = parsed;
            setupEditorUI();
            window.updatePreview();
            showToast('Resume imported!');
        } catch(err) { alert('Invalid JSON file. Please export a WorkFolio resume JSON.'); }
    };
    reader.readAsText(file);
};

// ── 5. SECTION VISIBILITY TOGGLE ───────────────────────────────
window.toggleSectionVisibility = function(section) {
    if (!resumeData.hiddenSections) resumeData.hiddenSections = [];
    const idx = resumeData.hiddenSections.indexOf(section);
    if (idx === -1) {
        resumeData.hiddenSections.push(section);
        showToast(section + ' hidden from PDF');
    } else {
        resumeData.hiddenSections.splice(idx, 1);
        showToast(section + ' visible');
    }
    window.saveData();
    window.updatePreview();
    renderDragPills && renderDragPills();
};

// ── 6. CUSTOM SECTION BUILDER ──────────────────────────────────
window.addCustomSection = function() {
    const name = prompt('Section name (e.g. Volunteer Work, Awards, Publications):');
    if (!name || !name.trim()) return;
    const key = 'custom_' + name.trim().toLowerCase().replace(/\s+/g,'_');
    if (!resumeData.customSections) resumeData.customSections = {};
    resumeData.customSections[key] = { title: name.trim(), items: [] };
    if (!resumeData.layout.includes(key)) resumeData.layout.push(key);
    window.saveData();
    setupDynamicSections();
    renderDragPills && renderDragPills();
    showToast('Section "' + name.trim() + '" added!');
};
window.addCustomSectionItem = function(key) {
    if (!resumeData.customSections || !resumeData.customSections[key]) return;
    resumeData.customSections[key].items.push({ id: Date.now().toString(), title: '', desc: '', date: '' });
    window.saveData();
    setupDynamicSections();
    window.updatePreview();
};
window.removeCustomSectionItem = function(key, id) {
    if (!resumeData.customSections || !resumeData.customSections[key]) return;
    resumeData.customSections[key].items = resumeData.customSections[key].items.filter(i => String(i.id) !== String(id));
    window.saveData(); setupDynamicSections(); window.updatePreview();
};
window.updateCustomItem = function(key, id, field, value) {
    if (!resumeData.customSections || !resumeData.customSections[key]) return;
    const item = resumeData.customSections[key].items.find(i => String(i.id) === String(id));
    if (item) item[field] = value;
    window.saveData(); window.updatePreview();
};
window.deleteCustomSection = function(key) {
    if (!confirm('Delete this section?')) return;
    if (resumeData.customSections) delete resumeData.customSections[key];
    resumeData.layout = resumeData.layout.filter(l => l !== key);
    window.saveData(); setupDynamicSections(); renderDragPills && renderDragPills(); window.updatePreview();
};

// ── 7. ATS LIVE SCORE INSIDE EDITOR ────────────────────────────
window.runLiveATS = function() {
    const jdInput = document.getElementById('liveATSInput');
    const scoreEl = document.getElementById('liveATSScore');
    const barEl = document.getElementById('liveATSBar');
    const detailEl = document.getElementById('liveATSDetail');
    if (!jdInput || !scoreEl) return;
    const jd = jdInput.value.toLowerCase();
    if (!jd.trim()) { scoreEl.textContent = '--'; return; }
    const resumeText = [
        resumeData.personal.summary || '',
        ...(resumeData.experience || []).map(e => (e.title||'') + ' ' + (e.desc||'')),
        ...(resumeData.skills || []).map(s => s.name||''),
        ...(resumeData.projects || []).map(p => p.name + ' ' + (p.desc||''))
    ].join(' ').toLowerCase();
    const jdWords = [...new Set(jd.match(/\b[a-z][a-z+#.]{2,}\b/g) || [])].filter(w => w.length > 3 && !['with','that','this','have','from','will','your','their','about','into','more'].includes(w));
    const synonyms = { js: 'javascript', ts: 'typescript', ml: 'machine learning', ai: 'artificial intelligence', ui: 'user interface', ux: 'user experience', db: 'database', css: 'cascading style sheets', html: 'hypertext markup' };
    let hits = 0, missing = [];
    jdWords.slice(0, 25).forEach(w => {
        const check = synonyms[w] || w;
        if (resumeText.includes(check) || resumeText.includes(w)) hits++;
        else missing.push(w);
    });
    const total = Math.min(jdWords.length, 25);
    const pct = total ? Math.round((hits / total) * 100) : 0;
    scoreEl.textContent = pct + '%';
    scoreEl.style.color = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
    if (barEl) { barEl.style.width = pct + '%'; barEl.style.background = pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'; }
    if (detailEl) detailEl.textContent = missing.length ? 'Missing: ' + missing.slice(0,6).join(', ') : '✓ Great keyword match!';
};

// ── 8. LINE SPACING + MARGIN CONTROLS ─────────────────────────
window.applyLineSpacing = function(value) {
    const paper = document.getElementById('resumePreview');
    if (paper) { paper.style.lineHeight = value; if (!resumeData.design) resumeData.design = {}; resumeData.design.lineSpacing = value; window.saveData(); }
};
window.applyPageMargin = function(value) {
    const paper = document.getElementById('resumePreview');
    if (paper) { paper.style.padding = value; if (!resumeData.design) resumeData.design = {}; resumeData.design.pageMargin = value; window.saveData(); }
};

// ── 9. PAGE SIZE TOGGLE (A4 vs US LETTER) ─────────────────────
window.applyPageSize = function(size) {
    const paper = document.getElementById('resumePreview');
    if (!paper) return;
    if (!resumeData.design) resumeData.design = {};
    resumeData.design.pageSize = size;
    if (size === 'letter') { paper.style.width = '816px'; paper.style.height = '1056px'; }
    else { paper.style.width = '794px'; paper.style.height = '1123px'; } // A4 default
    window.saveData(); window.updatePreview();
};

// ── 10. VERSION HISTORY ────────────────────────────────────────
window.saveVersion = function() {
    if (!resumeData.versions) resumeData.versions = [];
    const snap = { ts: new Date().toLocaleString(), data: JSON.stringify(resumeData) };
    resumeData.versions.unshift(snap);
    if (resumeData.versions.length > 10) resumeData.versions.pop(); // keep last 10
    window.saveData();
    renderVersionHistory();
    showToast('Version saved!');
};
window.restoreVersion = function(index) {
    if (!resumeData.versions || !resumeData.versions[index]) return;
    if (!confirm('Restore this version? Current state will be saved as undo.')) return;
    pushUndo();
    const saved = resumeData.versions; // preserve history
    resumeData = JSON.parse(resumeData.versions[index].data);
    resumeData.versions = saved;
    setupEditorUI(); window.updatePreview();
    showToast('Version restored!');
};
function renderVersionHistory() {
    const el = document.getElementById('versionList');
    if (!el || !resumeData.versions) return;
    el.innerHTML = resumeData.versions.map((v, i) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:6px;">
            <span style="font-size:.78rem;color:#475569;">${v.ts}</span>
            <button onclick="restoreVersion(${i})" style="font-size:.72rem;background:#4f46e5;color:white;border:none;padding:3px 10px;border-radius:6px;cursor:pointer;">Restore</button>
        </div>`).join('') || '<p style="color:#94a3b8;font-size:.8rem;">No saved versions yet.</p>';
}

// ── 11. MORE SECTIONS: Volunteer, Awards, Languages, Publications ─
window.addArrayItem_orig = window.addArrayItem;
window.addArrayItem = function(type) {
    const id = Date.now().toString();
    if (!resumeData[type]) resumeData[type] = [];
    if (type === 'experience')    resumeData.experience.push({ id, title:'', company:'', date:'', desc:'' });
    else if (type === 'education')resumeData.education.push({ id, degree:'', school:'', date:'', desc:'' });
    else if (type === 'projects') resumeData.projects.push({ id, name:'', tech:'', desc:'' });
    else if (type === 'skills')   resumeData.skills.push({ id, name:'', level:80 });
    else if (type === 'certifications') resumeData.certifications.push({ id, name:'', issuer:'', date:'' });
    else if (type === 'languages')      resumeData.languages.push({ id, name:'', level:'Conversational' });
    else if (type === 'volunteer')      { if(!resumeData.volunteer) resumeData.volunteer=[]; resumeData.volunteer.push({ id, role:'', org:'', date:'', desc:'' }); }
    else if (type === 'awards')         { if(!resumeData.awards) resumeData.awards=[]; resumeData.awards.push({ id, name:'', issuer:'', date:'' }); }
    else if (type === 'publications')   { if(!resumeData.publications) resumeData.publications=[]; resumeData.publications.push({ id, title:'', publisher:'', date:'', url:'' }); }
    if (!resumeData.layout.includes(type)) { resumeData.layout.push(type); renderDragPills && renderDragPills(); }
    renderArrayLists(); window.updatePreview();
};

// ── TOAST HELPER ──────────────────────────────────────────────
function showToast(msg) {
    let t = document.getElementById('rsToast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'rsToast';
        t.style.cssText = 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(80px);background:#1e293b;color:white;padding:10px 22px;border-radius:50px;font-weight:700;font-size:.85rem;z-index:99999;transition:transform .35s cubic-bezier(.34,1.56,.64,1),opacity .3s;opacity:0;border:1px solid #334155;pointer-events:none;';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(80px)'; }, 2500);
}
window.showToast = showToast;