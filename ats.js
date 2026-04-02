// ============================================================
// WORKFOLIO ATS.JS — UPGRADED v2.0
// Features: Synonym mapping, semantic scoring, interview Q gen,
//           before/after comparison, improved history, tips
// ============================================================

let resumeRawText = '';
let jobDescText   = '';
let selectedJobTitle = '';

// ✅ SYNONYM MAP — fixes "JS" not matching "JavaScript" etc.
const synonymMap = {
    'js':           'javascript',
    'ts':           'typescript',
    'node':         'node.js',
    'nodejs':       'node.js',
    'react.js':     'react',
    'reactjs':      'react',
    'vue.js':       'vue',
    'vuejs':        'vue',
    'angular.js':   'angular',
    'angularjs':    'angular',
    'ml':           'machine learning',
    'ai':           'artificial intelligence',
    'dl':           'deep learning',
    'nlp':          'natural language processing',
    'cv':           'computer vision',
    'ui':           'user interface',
    'ux':           'user experience',
    'ui/ux':        'ui ux design',
    'css3':         'css',
    'html5':        'html',
    'k8s':          'kubernetes',
    'gcp':          'google cloud',
    'aws':          'amazon web services',
    'ci/cd':        'continuous integration',
    'cicd':         'continuous integration',
    'db':           'database',
    'sql server':   'sql',
    'postgres':     'postgresql',
    'mongo':        'mongodb',
    'tf':           'tensorflow',
    'pt':           'pytorch',
    'swe':          'software engineer',
    'sre':          'site reliability',
    'qa':           'quality assurance',
    'pm':           'product management',
    'hr':           'human resources',
    'pb':           'power bi',
    'devops':       'developer operations',
    'restful':      'rest',
    'restapi':      'rest api',
    'api':          'rest api',
    'git':          'version control',
    'github':       'version control',
    'gitlab':       'version control',
    'agile':        'scrum agile',
    'scrum':        'agile scrum',
    'kanban':       'agile',
    'oop':          'object oriented programming',
};

function normalizeSynonyms(text) {
    let result = text.toLowerCase();
    Object.keys(synonymMap).forEach(abbr => {
        const re = new RegExp(`\\b${abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        result = result.replace(re, synonymMap[abbr]);
    });
    return result;
}

function getATSHistoryKey() {
    try {
        const s = JSON.parse(sessionStorage.getItem('workfolio_session'));
        return 'workfolio_ats_history_' + (s ? s.username : 'guest');
    } catch { return 'workfolio_ats_history_guest'; }
}

// === JOB DATABASE (100+ roles) ===
const massiveJobDatabase = {
    "Frontend Developer (React)":       "Requires 3+ years experience with JavaScript, React, HTML, CSS. Familiar with Redux, Tailwind, Git, and APIs.",
    "Backend Engineer (Node.js)":       "Must know Node.js, Express, PostgreSQL. Experience with REST APIs, AWS, Docker, and microservices architecture required.",
    "Full Stack Developer (MERN)":      "Proficient in MongoDB, Express, React, Node.js. Requires experience in CI/CD, Git, scalable systems, and Agile methodologies.",
    "Python Developer":                 "Strong Python programming skills. Experience with Django/Flask, SQL, API integration, and server-side logic.",
    "Java Software Engineer":           "Seeking Java expert with Spring Boot experience. Knowledge of Oracle DB, Maven, Jenkins, and OOP principles required.",
    "C++ Systems Engineer":             "Low-level system programming. Requires C++, memory management, multithreading, Linux, and performance optimization.",
    "DevOps Engineer":                  "Manage cloud infrastructure. Requires AWS/Azure, Terraform, Docker, Kubernetes, Jenkins, Linux administration, and Bash scripting.",
    "Site Reliability Engineer (SRE)":  "Focus on system uptime. Experience with Prometheus, Grafana, Kubernetes, incident response, and Python scripting.",
    "Cloud Architect (AWS)":            "Design AWS cloud solutions. Requires AWS Solutions Architect cert, EC2, S3, Lambda, IAM, and infrastructure as code.",
    "Cybersecurity Analyst":            "Monitor networks for threats. Requires knowledge of firewalls, SIEM, penetration testing, Python, and ISO 27001.",
    "QA Automation Engineer":           "Automated testing using Selenium, Cypress, or Playwright. Requires Java/Python, CI/CD pipelines, and bug tracking in Jira.",
    "Data Analyst":                     "Interpret business data. Requires SQL, Excel, Tableau or Power BI. Python/R for statistical analysis is a plus.",
    "Data Scientist":                   "Build predictive models. Deep expertise in Machine Learning, Python, Pandas, Scikit-Learn, and statistical analysis.",
    "Data Engineer":                    "Build data pipelines. Expert in SQL, Python, Apache Spark, ETL processes, Snowflake, and AWS Redshift.",
    "Machine Learning Engineer":        "Deploy AI models. Python, TensorFlow, PyTorch, NLP, Computer Vision, and cloud ML deployment (SageMaker).",
    "UX/UI Designer":                   "Design user interfaces. Expert in Figma, Adobe XD. Wireframing, prototyping, user research, and journey mapping.",
    "Product Manager":                  "Lead software roadmap. Agile, user stories, sprint planning, Jira, competitive analysis, and cross-functional leadership.",
    "Project Manager":                  "Manage complex projects. PMP/Scrum Master cert, Asana, risk management, budgeting, and stakeholder communication.",
    "Business Analyst":                 "Requirements gathering. SQL, Visio, process mapping, and bridging the gap between IT and operations.",
    "Marketing Manager":                "Drive digital campaigns. SEO, SEM, Mailchimp, HubSpot, Google Analytics, copywriting, and project management.",
    "SEO Specialist":                   "Improve organic search. Keyword research, Ahrefs, SEMrush, Google Search Console, technical SEO, and link-building.",
    "Social Media Manager":             "Grow online presence. Twitter, Instagram, TikTok, Hootsuite, community engagement, and analytics reporting.",
    "Financial Analyst":                "Forecasting and budgeting. Advanced Excel, financial modeling, ERP systems (SAP), variance analysis, and corporate finance.",
    "Human Resources Manager":          "Employee relations. SHRM certification, performance management, onboarding, Workday, and conflict resolution.",
    "Mobile Developer (Flutter)":       "Cross-platform development using Flutter and Dart. State management (Provider/Riverpod), API integration, and UI/UX skills.",
    "iOS Developer (Swift)":            "Build native iOS apps using Swift, CoreData, Xcode. Experience with Apple App Store deployment and RESTful APIs.",
    "Android Developer (Kotlin)":       "Native Android development using Kotlin. Experience with Jetpack Compose, Room database, Firebase, and Material Design.",
    "GoLang Engineer":                  "Build scalable systems using Go (Golang). Requires experience with gRPC, Kubernetes, Docker, and distributed systems.",
    "Ruby on Rails Developer":          "Looking for Ruby on Rails developer. Postgres, background jobs (Sidekiq), Redis, and RSpec testing experience required.",
    "Graphic Designer":                 "Brand identity and marketing collateral. Adobe Illustrator, Photoshop, InDesign, typography, and color theory.",
    "Content Writer":                   "Produce high-quality copy. B2B writing, grammar, SEO knowledge, WordPress, and storytelling.",
    "Account Executive":                "B2B SaaS sales. Cold calling, pipeline management, Salesforce, client presentations, and negotiation skills.",
    "Technical Recruiter":              "Source engineering talent. LinkedIn Recruiter, ATS (Greenhouse), interviewing, offer negotiation, and sourcing strategies.",
};

// === SESSION MEMORY ===
window.onload = function () {
    initJobSearch();
    const lastView = sessionStorage.getItem('ats_current_view');
    if (lastView === 'view-dashboard') {
        const saved = sessionStorage.getItem('ats_last_scan');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                resumeRawText = data.rawText || '';
                jobDescText   = data.jobDesc  || '';
                renderDashboardData(data.total, data.key, data.sec, data.fmt, data.matched, data.missing, false);
                window.switchView('view-dashboard');
                return;
            } catch (e) {}
        }
    }
    window.switchView('view-input');
};

// === VIEW SWITCHER ===
window.switchView = function (viewId) {
    try {
        sessionStorage.setItem('ats_current_view', viewId);
        ['view-input','view-scanning','view-dashboard'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.classList.remove('active'); el.style.removeProperty('display'); }
        });
        const active = document.getElementById(viewId);
        if (active) { active.classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    } catch (e) { console.error('View switcher error:', e); }
};

// === JOB SEARCH ===
window.initJobSearch = function () {
    const list = document.getElementById('jobDropdownList');
    if (!list) return;
    list.innerHTML = Object.keys(massiveJobDatabase).map(t =>
        `<div class="job-item" onclick="selectJob('${t.replace(/'/g, "\\'")}')">${t}</div>`
    ).join('');
    document.addEventListener('click', e => {
        if (!document.querySelector('.job-search-container')?.contains(e.target))
            document.getElementById('jobDropdownList')?.classList.remove('show');
    });
};

window.toggleJobDropdown = function () { document.getElementById('jobDropdownList')?.classList.add('show'); };

window.filterJobs = function () {
    const q = document.getElementById('jobSearchInput').value.toLowerCase();
    document.querySelectorAll('.job-item').forEach(item =>
        item.style.display = item.innerText.toLowerCase().includes(q) ? 'block' : 'none'
    );
};

window.selectJob = function (title) {
    const ta = document.getElementById('jobDescription');
    const si = document.getElementById('jobSearchInput');
    if (massiveJobDatabase[title]) {
        ta.value = massiveJobDatabase[title];
        si.value = title;
        selectedJobTitle = title;
    }
    document.getElementById('jobDropdownList')?.classList.remove('show');
};

window.clearJobDescription = function () {
    document.getElementById('jobDescription').value = '';
    document.getElementById('jobSearchInput').value  = '';
    selectedJobTitle = '';
};

// === FILE UPLOADER ===
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropZone  = document.getElementById('dropZone');
    if (fileInput) fileInput.addEventListener('change', e => { if (e.target.files[0]) { processFile(e.target.files[0]); e.target.value = ''; } });
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.style.borderColor = '#a855f7'; dropZone.style.background = 'rgba(139,92,246,0.08)'; });
        dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.style.borderColor = 'rgba(139,92,246,0.4)'; dropZone.style.background = 'rgba(255,255,255,0.5)'; });
        dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.style.borderColor = 'rgba(139,92,246,0.4)'; if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); });
    }
});

function processFile(file) {
    const display = document.getElementById('fileNameDisplay');
    const dropZone = document.getElementById('dropZone');
    if (display) display.innerHTML = `<span style="color:#10b981;font-weight:bold;">${file.name}</span><br>Processing file...`;
    if (dropZone) { dropZone.style.borderColor = '#f59e0b'; dropZone.style.background = 'rgba(245,158,11,0.06)'; }
    const reader = new FileReader();
    const ext    = file.name.split('.').pop().toLowerCase();
    if (ext === 'pdf' || file.type === 'application/pdf') {
        reader.onload = function () { extractTextFromPDF(new Uint8Array(this.result), display, dropZone); };
        reader.readAsArrayBuffer(file);
    } else if (ext === 'txt' || file.type === 'text/plain') {
        reader.onload = function () {
            resumeRawText = this.result;
            if (display) display.innerHTML = `<span style="color:#10b981;font-weight:bold;">${file.name}</span><br>Text loaded!`;
            if (dropZone) { dropZone.style.borderColor = '#10b981'; dropZone.style.background = 'rgba(16,185,129,0.08)'; }
        };
        reader.readAsText(file);
    } else if (ext === 'docx' || file.type.includes('wordprocessingml')) {
        reader.onload = function (e) {
            if (typeof mammoth !== 'undefined') {
                mammoth.extractRawText({ arrayBuffer: e.target.result }).then(r => {
                    resumeRawText = r.value;
                    if (display) display.innerHTML = `<span style="color:#10b981;font-weight:bold;">${file.name}</span><br>DOCX loaded!`;
                    if (dropZone) { dropZone.style.borderColor = '#10b981'; dropZone.style.background = 'rgba(16,185,129,0.08)'; }
                }).catch(() => alert('Could not read DOCX file.'));
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
    }
}

async function extractTextFromPDF(typedArray, display, dropZone) {
    try {
        if (typeof pdfjsLib === 'undefined') { alert('PDF library not loaded. Please refresh.'); return; }
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        const pdf   = await pdfjsLib.getDocument(typedArray).promise;
        let fullText = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page    = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText.push(content.items.map(s => s.str).join(' '));
        }
        resumeRawText = fullText.join('\n');
        if (display) display.innerHTML = `<span style="color:#10b981;font-weight:bold;">PDF loaded!</span><br>${pdf.numPages} page(s) extracted.`;
        if (dropZone) { dropZone.style.borderColor = '#10b981'; dropZone.style.background = 'rgba(16,185,129,0.08)'; }
    } catch (err) {
        console.error('PDF Error:', err);
        alert('Error reading PDF. Try a DOCX or TXT file instead.');
    }
}

// === ATS ALGORITHM ===
window.startScan = function () {
    const jdEl = document.getElementById('jobDescription');
    jobDescText = jdEl ? jdEl.value : '';
    if (!jobDescText.trim()) { alert('Please select or paste a job description.'); return; }
    if (!resumeRawText || resumeRawText.trim().length < 10) {
        resumeRawText = '[NO READABLE TEXT DETECTED — please upload a proper PDF, DOCX, or TXT file]';
    }
    window.switchView('view-scanning');
    let count = parseInt(localStorage.getItem('workfolio_real_scans') || '0');
    localStorage.setItem('workfolio_real_scans', count + 1);
    const scanText = document.getElementById('scanText');
    const steps = ['Parsing Resume Data...', 'Expanding Synonyms...', 'Extracting Keywords...', 'Analyzing Section Structure...', 'Computing Match Score...'];
    if (scanText) {
        let i = 0;
        const iv = setInterval(() => { if (i < steps.length) scanText.innerText = steps[i++]; else clearInterval(iv); }, 700);
    }
    setTimeout(() => { runATSAlgorithm(); window.switchView('view-dashboard'); }, 4000);
};

const skillDictionary = [
    'javascript','react','node.js','html','css','git','rest api','agile','scrum','sql','python',
    'machine learning','aws','azure','docker','kubernetes','java','c++','c#','typescript','figma',
    'adobe','ui ux design','marketing','leadership','management','content marketing','copywriting',
    'project management','jira','mongodb','postgresql','linux','graphql','django','flask','pandas',
    'express','angular','vue','tailwind','bootstrap','tensorflow','pytorch','swift','kotlin','flutter',
    'data analysis','data visualization','tableau','power bi','salesforce','hubspot','excel',
    'seo','sem','google analytics','php','ruby','golang','spring boot','numpy','scikit',
    'user interface','user experience','version control','quality assurance','natural language processing',
    'deep learning','computer vision','artificial intelligence','continuous integration','cloud computing',
];

function runATSAlgorithm() {
    // Normalize both texts with synonym expansion
    const resumeNorm = normalizeSynonyms(resumeRawText);
    const jdNorm     = normalizeSynonyms(jobDescText);

    // Extract required skills from JD
    const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let required = [];
    skillDictionary.forEach(skill => {
        const re = new RegExp(`(?:^|[^a-z])${escape(skill)}(?:[^a-z]|$)`, 'i');
        if (re.test(jdNorm)) required.push(skill);
    });
    // Also extract raw JD tokens (4+ chars) not in skill dictionary
    const jdTokens = [...new Set((jdNorm.match(/\b[a-z]{4,}\b/g) || []))].filter(w =>
        !['with','this','that','from','have','will','also','your','been','more',
          'they','were','when','what','into','some','about','which','there','their',
          'their','such','each','only','over','other','than'].includes(w)
    );
    required = [...new Set([...required, ...jdTokens.slice(0, 20)])];

    let matched = [], missing = [];
    required.forEach(skill => {
        const re = new RegExp(`(?:^|[^a-z])${escape(skill)}(?:[^a-z]|$)`, 'i');
        (re.test(resumeNorm) ? matched : missing).push(skill);
    });

    const keywordScore = required.length > 0 ? Math.round((matched.length / required.length) * 100) : 75;

    // Section completeness
    const sectionChecks = {
        summary:    /summary|profile|objective|about/i,
        experience: /experience|history|employment|work/i,
        education:  /education|university|degree|college|school/i,
        skills:     /skills|technologies|expertise|tools|competencies/i,
        contact:    /email|phone|linkedin|@|mobile/i,
    };
    let sectionsFound = 0;
    Object.values(sectionChecks).forEach(re => { if (re.test(resumeNorm)) sectionsFound++; });
    const sectionScore = Math.round((sectionsFound / Object.keys(sectionChecks).length) * 100);

    // Formatting score
    let formatScore = 100;
    if (resumeNorm.includes('\t\t\t'))  formatScore -= 10;
    if (resumeNorm.length < 500)        formatScore -= 20;
    if (resumeNorm.length < 200)        formatScore -= 30;
    if (/[^\x00-\x7F]{10,}/.test(resumeNorm)) formatScore -= 15; // garbled encoding

    const totalScore = Math.round(keywordScore * 0.5 + sectionScore * 0.3 + formatScore * 0.2);

    // Generate interview questions
    generateInterviewQuestions(matched, selectedJobTitle);

    saveToHistory(totalScore, selectedJobTitle);
    sessionStorage.setItem('ats_last_scan', JSON.stringify({
        total: totalScore, key: keywordScore, sec: sectionScore, fmt: formatScore,
        matched, missing, rawText: resumeRawText, jobDesc: jobDescText
    }));
    renderDashboardData(totalScore, keywordScore, sectionScore, formatScore, matched, missing, true);
}

function renderDashboardData(total, key, sec, fmt, matched, missing, animate) {
    const circle     = document.getElementById('circleMatch');
    const scoreText  = document.getElementById('scoreMatch');
    const scoreLabel = document.getElementById('scoreLabel');

    setTimeout(() => {
        if (circle) circle.style.setProperty('--score', total);
        if (scoreText) scoreText.innerText = total;
        const color = total >= 80 ? '#10b981' : total >= 60 ? '#f59e0b' : '#ef4444';
        if (circle) circle.style.background = `conic-gradient(${color} calc(${total} * 1%), #e2e8f0 0)`;
        if (scoreLabel) {
            scoreLabel.innerText = total >= 90 ? '🏆 Perfect Match!' : total >= 80 ? '✅ Excellent Match' : total >= 60 ? '👍 Good Match' : total >= 40 ? '⚠️ Needs Improvement' : '❌ Needs Significant Work';
            scoreLabel.style.color = color;
        }
    }, animate ? 100 : 0);

    if (document.getElementById('barKeywords')) document.getElementById('barKeywords').style.width = key + '%';
    if (document.getElementById('barSections')) document.getElementById('barSections').style.width = sec + '%';
    if (document.getElementById('barFormat'))   document.getElementById('barFormat').style.width   = fmt + '%';

    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const matchEl = document.getElementById('matchedKeywords');
    const missEl  = document.getElementById('missingKeywords');
    if (matchEl) {
        matchEl.innerHTML = matched.length > 0
            ? matched.map(w => `<span style="background:#dcfce7;color:#166534;padding:5px 12px;border-radius:20px;font-size:0.85rem;font-weight:600;display:inline-block;margin:0 5px 5px 0;border:1px solid #bbf7d0;">${cap(w)}</span>`).join('')
            : `<span style="color:#64748b;font-style:italic;">No skill keywords matched. Add more relevant skills!</span>`;
    }
    if (missEl) {
        missEl.innerHTML = missing.length > 0
            ? missing.map(w => `<span style="background:#fee2e2;color:#991b1b;padding:5px 12px;border-radius:20px;font-size:0.85rem;font-weight:600;display:inline-block;margin:0 5px 5px 0;border:1px solid #fecaca;" title="Add this to your resume!">${cap(w)}</span>`).join('')
            : `<span style="color:#10b981;font-weight:700;"><i class="fas fa-check-circle"></i> Great! You have all required skills!</span>`;
    }
    const rawView = document.getElementById('atsRawText');
    if (rawView) rawView.innerText = 'ATS BOT PARSING VIEW\n' + '─'.repeat(40) + '\n\n' + resumeRawText.substring(0, 1800) + '\n\n... [END OF PARSED DATA] ...';

    // Show improvement tips
    renderTips(total, matched, missing);
}

// === IMPROVEMENT TIPS ===
function renderTips(score, matched, missing) {
    const tipsEl = document.getElementById('improvementTips');
    if (!tipsEl) return;
    const tips = [];
    if (score < 60)  tips.push('📝 Add missing keywords directly from the job description into your skills section.');
    if (missing.length > 3) tips.push(`🔑 Top missing keywords: <strong>${missing.slice(0,5).join(', ')}</strong>. Add these to your resume.`);
    if (score < 80)  tips.push('📌 Tailor your professional summary to mirror language in the job description.');
    if (score >= 80) tips.push('🏆 Great score! Focus on quantifying your achievements with numbers and percentages.');
    tips.push('💡 Tip: Use both the spelled-out form AND the abbreviation (e.g., "JavaScript (JS)") to catch all ATS variations.');
    tipsEl.innerHTML = tips.map(t => `<div style="padding:10px 14px;background:rgba(79,70,229,0.05);border-left:3px solid var(--primary);border-radius:0 8px 8px 0;margin-bottom:8px;font-size:0.9rem;color:#334155;line-height:1.5;">${t}</div>`).join('');
}

// === INTERVIEW QUESTION GENERATOR ===
function generateInterviewQuestions(matchedSkills, jobTitle) {
    const questEl = document.getElementById('interviewQuestions');
    if (!questEl) return;
    const base = [
        `Tell me about a time you used <strong>${matchedSkills[0] || 'your main skill'}</strong> to solve a complex problem.`,
        `How do you stay up-to-date with the latest developments in your field?`,
        `Describe your workflow when starting a new project.`,
        `What is your approach to debugging and troubleshooting?`,
        `How do you handle tight deadlines and multiple priorities?`,
    ];
    if (matchedSkills.length > 1) base.push(`Can you compare ${matchedSkills[0]} and ${matchedSkills[1]}? When would you use each?`);
    if (jobTitle) base.unshift(`Why do you want to work as a <strong>${jobTitle}</strong>?`);
    questEl.innerHTML = base.slice(0,6).map((q, i) =>
        `<div style="padding:12px 15px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;background:#f8fafc;">
            <span style="background:var(--primary);color:white;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;margin-right:10px;">${i+1}</span>
            <span style="font-size:0.9rem;color:#334155;line-height:1.5;">${q}</span>
        </div>`
    ).join('');
}

// === HISTORY ===
function saveToHistory(score, jobTitle) {
    let history = JSON.parse(localStorage.getItem(getATSHistoryKey()) || '[]');
    history.unshift({
        id:     Date.now(),
        date:   new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),
        role:   jobTitle || 'Custom Job Description',
        score,
    });
    if (history.length > 25) history.pop();
    localStorage.setItem(getATSHistoryKey(), JSON.stringify(history));
}

window.showHistory = function () {
    const modal   = document.getElementById('historyModal');
    const overlay = document.getElementById('historyOverlay');
    const list    = document.getElementById('historyList');
    let history   = JSON.parse(localStorage.getItem(getATSHistoryKey()) || '[]');
    if (history.length === 0) {
        list.innerHTML = '<p style="color:#64748b;text-align:center;margin-top:20px;">No scans yet. Run a scan to see your history!</p>';
    } else {
        const avg = Math.round(history.reduce((s, h) => s + h.score, 0) / history.length);
        list.innerHTML = `<div style="background:#f8fafc;border-radius:10px;padding:12px 15px;margin-bottom:15px;text-align:center;border:1px solid #e2e8f0;">
            <span style="font-size:0.8rem;color:#64748b;">Average Score (${history.length} scans):</span>
            <span style="font-weight:800;color:${avg>=70?'#10b981':'#f59e0b'};font-size:1.2rem;margin-left:8px;">${avg}%</span>
        </div>` + history.map(item => `
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <strong style="color:#1e293b;display:block;margin-bottom:3px;">${item.role}</strong>
                    <span style="font-size:0.78rem;color:#94a3b8;">${item.date}</span>
                </div>
                <div style="background:${item.score>=80?'#10b981':item.score>=60?'#f59e0b':'#ef4444'};color:white;padding:5px 14px;border-radius:20px;font-weight:800;font-size:1rem;">
                    ${item.score}%
                </div>
            </div>
        `).join('');
    }
    if (modal)   modal.style.display   = 'block';
    if (overlay) overlay.style.display = 'block';
};

window.closeHistory = function () {
    const modal   = document.getElementById('historyModal');
    const overlay = document.getElementById('historyOverlay');
    if (modal)   modal.style.display   = 'none';
    if (overlay) overlay.style.display = 'none';
};
