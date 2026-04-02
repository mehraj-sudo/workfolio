// === GLOBAL VARIABLES ===
let resumeRawText = "";
let jobDescText = "";
let selectedJobTitle = ""; 

function getATSHistoryKey() {
    let session = null;
    try { session = JSON.parse(sessionStorage.getItem('workfolio_session') || localStorage.getItem('workfolio_session')); } catch(e) {}
    return 'workfolio_ats_history_' + (session ? session.username : 'guest');
}

// === MASSIVE 100+ JOB DESCRIPTION LIBRARY ===
const massiveJobDatabase = {
    "Frontend Developer (React)": "Requires 3+ years experience with JavaScript, React, HTML, CSS. Familiar with Redux, Tailwind, Git, and APIs.",
    "Backend Engineer (Node.js)": "Must know Node.js, Express, PostgreSQL. Experience with REST APIs, AWS, Docker, and microservices architecture required.",
    "Full Stack Developer (MERN)": "Proficient in MongoDB, Express, React, Node.js. Requires experience in CI/CD, Git, scalable systems, and Agile methodologies.",
    "Python Developer": "Strong Python programming skills. Experience with Django/Flask, SQL, API integration, and server-side logic.",
    "Java Software Engineer": "Seeking Java expert with Spring Boot experience. Knowledge of Oracle DB, Maven, Jenkins, and OOP principles required.",
    "C++ Systems Engineer": "Low-level system programming. Requires C++, memory management, multithreading, Linux, and performance optimization.",
    "Ruby on Rails Developer": "Looking for Ruby on Rails developer. Postgres, background jobs (Sidekiq), Redis, and RSpec testing experience required.",
    "GoLang Engineer": "Build scalable systems using Go (Golang). Requires experience with gRPC, Kubernetes, Docker, and distributed systems.",
    "iOS Developer (Swift)": "Build native iOS apps using Swift, CoreData, Xcode. Experience with Apple App Store deployment and RESTful APIs.",
    "Android Developer (Kotlin)": "Native Android development using Kotlin. Experience with Jetpack Compose, Room database, Firebase, and Material Design.",
    "Mobile Developer (Flutter)": "Cross-platform development using Flutter and Dart. State management (Provider/Riverpod), API integration, and UI/UX skills.",
    "DevOps Engineer": "Manage cloud infrastructure. Requires AWS/Azure, Terraform, Docker, Kubernetes, Jenkins, Linux administration, and Bash scripting.",
    "Site Reliability Engineer (SRE)": "Focus on system uptime. Experience with Prometheus, Grafana, Kubernetes, incident response, and Python scripting.",
    "Cloud Architect (AWS)": "Design AWS cloud solutions. Requires AWS Solutions Architect cert, EC2, S3, Lambda, IAM, and infrastructure as code.",
    "Cybersecurity Analyst": "Monitor networks for threats. Requires knowledge of firewalls, SIEM, penetration testing, Python, and ISO 27001.",
    "Information Security Engineer": "Implement security protocols. Cryptography, ethical hacking, vulnerability scanning, and CISSP certification preferred.",
    "QA Automation Engineer": "Automated testing using Selenium, Cypress, or Playwright. Requires Java/Python, CI/CD pipelines, and bug tracking in Jira.",
    "Data Analyst": "Interpret business data. Requires SQL, Excel, Tableau or Power BI. Python/R for statistical analysis is a plus.",
    "Data Scientist": "Build predictive models. Deep expertise in Machine Learning, Python, Pandas, Scikit-Learn, and statistical analysis.",
    "Data Engineer": "Build data pipelines. Expert in SQL, Python, Apache Spark, ETL processes, Snowflake, and AWS Redshift.",
    "Machine Learning Engineer": "Deploy AI models. Python, TensorFlow, PyTorch, NLP, Computer Vision, and cloud ML deployment (SageMaker).",
    "UX/UI Designer": "Design user interfaces. Expert in Figma, Adobe XD. Wireframing, prototyping, user research, and journey mapping.",
    "Graphic Designer": "Brand identity and marketing collateral. Adobe Illustrator, Photoshop, InDesign, typography, and color theory.",
    "Product Designer": "End-to-end SaaS platform design. Figma, interaction design, design systems, and close collaboration with engineers.",
    "Video Editor": "Edit promotional content. Adobe Premiere Pro, After Effects, color grading, sound synchronization, and social media formats.",
    "Marketing Manager": "Drive digital campaigns. SEO, SEM, Mailchimp, HubSpot, Google Analytics, copywriting, and project management.",
    "SEO Specialist": "Improve organic search. Keyword research, Ahrefs, SEMrush, Google Search Console, technical SEO, and link-building.",
    "Social Media Manager": "Grow online presence. Twitter, Instagram, TikTok, Hootsuite, community engagement, and analytics reporting.",
    "Content Writer": "Produce high-quality copy. B2B writing, grammar, SEO knowledge, WordPress, and storytelling.",
    "Account Executive": "B2B SaaS sales. Cold calling, pipeline management, Salesforce, client presentations, and negotiation skills.",
    "Sales Development Rep (SDR)": "Lead generation. Outbound prospecting, cold emailing, LinkedIn Sales Navigator, and booking demos.",
    "Product Manager": "Lead software roadmap. Agile, user stories, sprint planning, Jira, competitive analysis, and cross-functional leadership.",
    "Project Manager": "Manage complex projects. PMP/Scrum Master cert, Asana, risk management, budgeting, and stakeholder communication.",
    "Business Analyst": "Requirements gathering. SQL, Visio, process mapping, and bridging the gap between IT and operations.",
    "Financial Analyst": "Forecasting and budgeting. Advanced Excel, financial modeling, ERP systems (SAP), variance analysis, and corporate finance.",
    "Staff Accountant": "Month-end close. GAAP, QuickBooks, accounts payable/receivable, reconciliations, and payroll processing.",
    "Human Resources Manager": "Employee relations. SHRM certification, performance management, onboarding, Workday, and conflict resolution.",
    "Technical Recruiter": "Source engineering talent. LinkedIn Recruiter, ATS (Greenhouse), interviewing, offer negotiation, and sourcing strategies."
};

// === 1. SESSION MEMORY ===
window.onload = function() {
    initJobSearch();
    const lastView = sessionStorage.getItem('ats_current_view');
    if(lastView === 'view-dashboard') {
        const savedData = sessionStorage.getItem('ats_last_scan');
        if(savedData) {
            try {
                const data = JSON.parse(savedData);
                resumeRawText = data.rawText || "";
                jobDescText = data.jobDesc || "";
                renderDashboardData(data.total, data.key, data.sec, data.fmt, data.matched, data.missing, false);
                window.switchView('view-dashboard');
                return; 
            } catch(e) { console.error("Could not load saved scan."); }
        }
    }
    window.switchView('view-input');
};

// === 2. CLEAN VIEW SWITCHER ===
window.switchView = function(viewId) {
    try {
        sessionStorage.setItem('ats_current_view', viewId);
        const screens = ['view-input', 'view-scanning', 'view-dashboard'];
        screens.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('active');
                el.style.removeProperty('display');
                el.style.removeProperty('opacity');
                el.style.removeProperty('visibility');
            }
        });
        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (e) { console.error("View Switcher Error:", e); }
}

// === 3. SEARCH ENGINE LOGIC ===
window.initJobSearch = function() {
    const listContainer = document.getElementById('jobDropdownList');
    if(!listContainer) return;
    let html = '';
    for (const [jobTitle, jobDesc] of Object.entries(massiveJobDatabase)) {
        html += `<div class="job-item" onclick="selectJob('${jobTitle.replace(/'/g, "\\'")}')">${jobTitle}</div>`;
    }
    listContainer.innerHTML = html;
    document.addEventListener('click', function(event) {
        const container = document.querySelector('.job-search-container');
        if (container && !container.contains(event.target)) {
            const dropdown = document.getElementById('jobDropdownList');
            if(dropdown) dropdown.classList.remove('show');
        }
    });
};

window.toggleJobDropdown = function(event) { document.getElementById('jobDropdownList').classList.add('show'); };

window.filterJobs = function() {
    const input = document.getElementById('jobSearchInput').value.toLowerCase();
    const items = document.querySelectorAll('.job-item');
    items.forEach(item => { item.style.display = item.innerText.toLowerCase().includes(input) ? "block" : "none"; });
};

window.selectJob = function(jobTitle) {
    const textarea = document.getElementById('jobDescription');
    const searchInput = document.getElementById('jobSearchInput');
    if (massiveJobDatabase[jobTitle]) {
        textarea.value = massiveJobDatabase[jobTitle];
        searchInput.value = jobTitle; 
        selectedJobTitle = jobTitle;
    }
    document.getElementById('jobDropdownList').classList.remove('show');
};

window.clearJobDescription = function() {
    document.getElementById('jobDescription').value = ''; 
    document.getElementById('jobSearchInput').value = '';
    selectedJobTitle = "";
}

// === 4. FILE UPLOADER ===
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');

    if (fileInput) {
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) { processFile(file); event.target.value = ''; }
        });
    }

    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#a855f7';
            dropZone.style.background = 'rgba(139, 92, 246, 0.08)';
        });
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'rgba(139, 92, 246, 0.4)';
            dropZone.style.background = 'rgba(255,255,255,0.5)';
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'rgba(139, 92, 246, 0.4)';
            dropZone.style.background = 'rgba(255,255,255,0.5)';
            if (e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
        });
    }
});

function processFile(file) {
    const display = document.getElementById('fileNameDisplay');
    const dropZone = document.getElementById('dropZone');
    if (display) display.innerHTML = `<span style="color:#10b981; font-weight:bold;">${file.name}</span><br>File loaded successfully!`;
    if (dropZone) {
        dropZone.style.borderColor = "#10b981";
        dropZone.style.background = "rgba(16, 185, 129, 0.08)";
    }

    const reader = new FileReader();
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (file.type === "application/pdf" || fileExtension === "pdf") {
        reader.onload = function() {
            const typedarray = new Uint8Array(this.result);
            extractTextFromPDF(typedarray, display, dropZone);
        };
        reader.readAsArrayBuffer(file);
    } 
    else if (file.type === "text/plain" || fileExtension === "txt") {
        reader.onload = function() { resumeRawText = this.result; };
        reader.readAsText(file);
    } 
    else if (fileExtension === "docx" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        reader.onload = function(loadEvent) {
            const arrayBuffer = loadEvent.target.result;
            if(typeof mammoth !== 'undefined') {
                mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                    .then(function(result) { resumeRawText = result.value; })
                    .catch(function(err) { console.error(err); alert("Could not read DOCX file."); });
            } else { alert("DOCX parser not loaded yet. Check your internet connection."); }
        };
        reader.readAsArrayBuffer(file);
    } 
    else {
        alert("Unsupported file format! Please use PDF, DOCX, or TXT.");
        resumeRawText = ""; 
    }
}

// === THE NEW AI VISION ENGINE (TESSERACT OCR) ===
async function extractTextFromPDF(pdfData, display, dropZone) {
    if(typeof pdfjsLib === 'undefined') {
        alert("PDF parser not loaded. Please refresh the page.");
        return;
    }
    
    try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        const loadingTask = pdfjsLib.getDocument({data: pdfData});
        const pdf = await loadingTask.promise;
        let fullTextArray = [];
        let imageScanTriggered = false;
        for (let j = 1; j <= pdf.numPages; j++) {
            const page = await pdf.getPage(j);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(s => s.str).join(' ');
            
            // 1. If it finds standard text, use it.
            if (pageText.trim().length > 20) {
                fullTextArray.push(pageText);
            } 
            // 2. If it is BLANK (an Image-based PDF), trigger the AI OCR Vision!
            else {
                imageScanTriggered = true;
                if(display) display.innerHTML = `<span style="color:#f59e0b; font-weight:bold;"><i class="fas fa-eye"></i> Reading Scanned Image...</span><br>Running Optical Character Recognition (Takes a few seconds)`;
                if(dropZone) dropZone.style.borderColor = "#f59e0b";

                // Take a background screenshot of the PDF page
                const viewport = page.getViewport({scale: 1.5});
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({canvasContext: ctx, viewport: viewport}).promise;
                
                // Pass the image to Tesseract.js
                if(typeof Tesseract !== 'undefined') {
                    const result = await Tesseract.recognize(canvas, 'eng');
                    fullTextArray.push(result.data.text);
                }
            }
        }
        
        resumeRawText = fullTextArray.join(' ');
        // Reset the UI if OCR was successful
        if (imageScanTriggered && display) {
            display.innerHTML = `<span style="color:#10b981; font-weight:bold;">Scan Complete!</span><br>Text extracted from image successfully.`;
            if(dropZone) dropZone.style.borderColor = "#10b981";
        }
        
    } catch (err) {
        console.error("PDF Parsing Error: ", err);
        alert("There was a critical error reading this PDF.");
    }
}

// === 5. ATS SCANNER ALGORITHM ===
window.startScan = function() {
    try {
        const jdElement = document.getElementById('jobDescription');
        jobDescText = jdElement ? jdElement.value : "";
        
        if (!jobDescText.trim()) return alert("Please select or paste a job description.");
        // Fallback for completely empty/failed files
        if (!resumeRawText || resumeRawText.trim().length < 10) {
            resumeRawText = "[ATS ERROR: NO READABLE TEXT DETECTED]\n\nThe file you uploaded could not be read, and the OCR engine failed to extract letters. Please try a standard .DOCX or .TXT file.";
        }

        window.switchView('view-scanning');
        
        let currentScans = parseInt(localStorage.getItem('workfolio_real_scans') || "0");
        localStorage.setItem('workfolio_real_scans', currentScans + 1);
        const scanText = document.getElementById('scanText');
        if(scanText) {
            scanText.innerText = "Parsing Resume Data...";
            setTimeout(() => scanText.innerText = "Extracting Keywords...", 1000);
            setTimeout(() => scanText.innerText = "Analyzing Formatting...", 2000);
        }
        
        setTimeout(() => {
            runATSAlgorithm();
            window.switchView('view-dashboard');
        }, 3000);
    } catch (err) {
        console.error("Scan Button Error:", err);
        alert("Something went wrong starting the scan.");
    }
}

function runATSAlgorithm() {
    const resumeTextStr = resumeRawText.toLowerCase();
    const jdTextStr = jobDescText.toLowerCase();
    const skillDictionary = [
        "javascript", "react", "node.js", "node", "html", "css", "git", "api", "agile", "scrum",
        "seo", "sem", "mailchimp", "hubspot", "excel", "tableau", "power bi", "google analytics",
        "machine learning", "statistics", "sql", "python", "data visualization", "data analysis",
        "aws", "azure", "docker", "kubernetes", "java", "c++", "c#", "php", "ruby", "swift", 
        "typescript", "figma", "adobe", "ui/ux", "marketing", "sales", "leadership", "management",
        "content marketing", "copywriting", "project management", "jira", "mongodb", "postgresql",
        "linux", "bash", "rest", "graphql", "spring boot", "django", "flask", "numpy", "pandas",
        "express", "angular", "vue", "tailwind", "bootstrap"
    ];
    // Smarter Regex: Fixes the bug where C++, Node.js, and UI/UX couldn't be detected
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let requiredSkills = [];
    skillDictionary.forEach(skill => {
        let escaped = escapeRegExp(skill);
        // Looks for the word surrounded by spaces, punctuation, or start/end of file
        let regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:[^a-zA-Z0-9]|$)`, 'i');
        if (regex.test(jdTextStr)) requiredSkills.push(skill);
    });
    let matched = [];
    let missing = [];
    
    requiredSkills.forEach(skill => {
        let escaped = escapeRegExp(skill);
        let regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:[^a-zA-Z0-9]|$)`, 'i');
        if(regex.test(resumeTextStr)) matched.push(skill);
        else missing.push(skill);
    });
    
    let keywordScore = requiredSkills.length > 0 ? Math.round((matched.length / requiredSkills.length) * 100) : 75;
    
    let hasSummary = /summary|profile|objective|about/i.test(resumeTextStr);
    let hasExp = /experience|history|employment|work/i.test(resumeTextStr);
    let hasEdu = /education|university|degree|college/i.test(resumeTextStr);
    let hasSkills = /skills|technologies|expertise|tools/i.test(resumeTextStr);
    let sectionsFound = [hasSummary, hasExp, hasEdu, hasSkills].filter(Boolean).length;
    let sectionScore = (sectionsFound / 4) * 100;

    let formatScore = 100;
    if (resumeTextStr.includes('\t\t\t')) formatScore -= 10;
    if (resumeTextStr.length < 500) formatScore -= 20; 
    
    let totalScore = Math.round((keywordScore * 0.5) + (sectionScore * 0.3) + (formatScore * 0.2));
    saveToHistory(totalScore, selectedJobTitle);
    
    sessionStorage.setItem('ats_last_scan', JSON.stringify({
        total: totalScore, key: keywordScore, sec: sectionScore, fmt: formatScore,
        matched: matched, missing: missing, rawText: resumeRawText, jobDesc: jobDescText
    }));
    renderDashboardData(totalScore, keywordScore, sectionScore, formatScore, matched, missing, true);
}

function renderDashboardData(total, key, sec, fmt, matched, missing, animate) {
    const circle = document.getElementById('circleMatch');
    const scoreText = document.getElementById('scoreMatch');
    const scoreLabel = document.getElementById('scoreLabel');
    
    setTimeout(() => {
        if(circle) circle.style.setProperty('--score', total);
        if(scoreText) scoreText.innerText = total;
        
        let scoreColor = total >= 80 ? "#10b981" : total >= 60 ? "#f59e0b" : "#ef4444";
        if(circle) circle.style.background = `conic-gradient(${scoreColor} calc(${total} * 1%), #e2e8f0 0)`; 
        
        if(scoreLabel) {
            if(total >= 80) { scoreLabel.innerText = "Excellent Match"; scoreLabel.style.color = "#10b981"; }
            else if(total >= 60) { scoreLabel.innerText = "Good Match"; scoreLabel.style.color = "#f59e0b"; }
            else { scoreLabel.innerText = "Needs Work"; scoreLabel.style.color = "#ef4444"; }
        }
    }, animate ? 100 : 0);
    
    if(document.getElementById('barKeywords')) document.getElementById('barKeywords').style.width = key + '%';
    if(document.getElementById('barSections')) document.getElementById('barSections').style.width = sec + '%';
    if(document.getElementById('barFormat')) document.getElementById('barFormat').style.width = fmt + '%';
    const formatTag = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    
    const matchContainer = document.getElementById('matchedKeywords');
    const missContainer = document.getElementById('missingKeywords');
    if(matchContainer && missContainer) {
        if (matched.length === 0 && missing.length === 0) {
            matchContainer.innerHTML = `<span style="color:#64748b; font-size:0.9rem; font-style: italic;">No specific tech skills detected in job description.</span>`;
            missContainer.innerHTML = `<span style="color:#64748b; font-size:0.9rem;">-</span>`;
        } else {
            matchContainer.innerHTML = matched.length > 0 
                ? matched.map(w => `<span style="background: #dcfce7; color: #166534; padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-block; margin: 0 5px 5px 0; border: 1px solid #bbf7d0;">${formatTag(w)}</span>`).join('')
                : `<span style="color:#64748b; font-size:0.9rem; font-style: italic;">No matched skills found. You need to add keywords!</span>`;
                
            missContainer.innerHTML = missing.length > 0
                ? missing.map(w => `<span style="background: #fee2e2; color: #991b1b; padding: 5px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-block; margin: 0 5px 5px 0; border: 1px solid #fecaca;">${formatTag(w)}</span>`).join('')
                : `<span style="color:#10b981; font-size:0.9rem; font-weight: 600;"><i class="fas fa-check"></i> You have all required skills!</span>`;
        }
    }

    const rawView = document.getElementById('atsRawText');
    if(rawView) {
        rawView.innerText = "ATS RAW PARSING VIEW [EXTRACTED DATA]\n-----------------------------------\n\n" + resumeRawText.substring(0, 1500) + "\n\n... [END OF DATA] ...";
    }
}

// === 6. HISTORY MODAL LOGIC ===
function saveToHistory(totalScore, jobTitle) {
    let history = JSON.parse(localStorage.getItem(getATSHistoryKey()) || "[]");
    history.unshift({
        id: Date.now(),
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        role: jobTitle || "Custom Job Description",
        score: totalScore
    });
    if(history.length > 20) history.pop();
    localStorage.setItem(getATSHistoryKey(), JSON.stringify(history));
}

window.showHistory = function() {
    const modal = document.getElementById('historyModal');
    const overlay = document.getElementById('historyOverlay');
    const list = document.getElementById('historyList');

    let history = JSON.parse(localStorage.getItem(getATSHistoryKey()) || "[]");
    if (history.length === 0) {
        list.innerHTML = "<p style='color:#64748b; text-align:center; margin-top: 20px;'>No scans yet. Run a scan to see your history!</p>";
    } else {
        list.innerHTML = history.map(item => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                <div>
                    <strong style="color: #1e293b; display:block; font-size: 1.05rem; margin-bottom: 4px;">${item.role}</strong>
                    <span style="font-size: 0.8rem; color: #64748b;"><i class="far fa-clock"></i> ${item.date}</span>
                </div>
                <div style="background: ${item.score >= 80 ? '#10b981' : item.score >= 60 ? '#f59e0b' : '#ef4444'}; color: white; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 1.1rem; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    ${item.score}%
                </div>
            </div>
        `).join('');
    }

    modal.style.display = 'block';
    overlay.style.display = 'block';
}

window.closeHistory = function() {
    document.getElementById('historyModal').style.display = 'none';
    document.getElementById('historyOverlay').style.display = 'none';
}