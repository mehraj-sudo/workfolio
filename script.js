// === HAMBURGER MENU TOGGLE ===
function toggleMenu() {
    const menu = document.getElementById('navMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}
// === SCROLL REVEAL ANIMATIONS ===
document.addEventListener("DOMContentLoaded", function() {
    // Reveal elements on scroll
    function reveal() {
        var reveals = document.querySelectorAll(".reveal");
        for (var i = 0; i < reveals.length; i++) {
            var windowHeight = window.innerHeight;
            var elementTop = reveals[i].getBoundingClientRect().top;
            var elementVisible = 100; // Trigger point
            if (elementTop < windowHeight - elementVisible) {
                reveals[i].classList.add("active");
            }
        }
    }
    
    // Trigger instantly for Navbar and Hero on page load
    setTimeout(() => {
        const nav = document.querySelector('.reveal-down');
        const hero = document.querySelector('#home.reveal');
        if(nav) nav.classList.add('active');
        if(hero) hero.classList.add('active');
    }, 100);

    // Listen for scrolling
    window.addEventListener("scroll", reveal);
    reveal(); // Check on load
});
// ==========================================
// WORKFOLIO - MAIN APPLICATION LOGIC
// ==========================================

// === 1. SMART BACK BUTTON LOGIC ===
function handleBackButton(event) {
    event.preventDefault(); // Stop the link from jumping out of the page
    
    const step1 = document.getElementById('step-1-onboarding');
    const step2 = document.getElementById('step-2-templates');
    const step3 = document.getElementById('step-3-editor');

    // Check which step is currently visible and go back accordingly
    if (step3 && step3.classList.contains('active-step')) {
        goToStep(2); // From Editor -> Templates
    } else if (step2 && step2.classList.contains('active-step')) {
        goToStep(1); // From Templates -> Onboarding
    } else {
        window.location.href = 'index.html'; // From Onboarding -> Dashboard
    }
}

// === 2. MULTI-STEP WIZARD (Resume Builder) ===
function goToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.builder-step').forEach(step => {
        step.classList.remove('active-step');
    });
    
    // Show target step
    const target = document.getElementById(`step-${stepNumber}-` + (stepNumber === 1 ? 'onboarding' : stepNumber === 2 ? 'templates' : 'editor'));
    if(target) target.classList.add('active-step');
    
    // Manage scrolling: Hide body scrollbar when in the editor to make it feel like an app
    if(stepNumber === 3) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}

// === 3. RESUME BUILDER (CANVA-STYLE INLINE EDITING) ===
function setThemeColor(hexColor) {
    const paper = document.getElementById('resumePreview');
    if (paper) {
        paper.style.setProperty('--res-theme', hexColor);
    }
}

function selectTemplate(templateClass) {
    const paper = document.getElementById('resumePreview');
    if (paper) {
        // Remove all previous template layout classes
        paper.classList.remove('tpl-executive', 'tpl-innovator', 'tpl-creative', 'tpl-minimalist', 'tpl-classic', 'tpl-modern');
        // Apply the newly selected one
        paper.classList.add(templateClass);
    }
    // Move to the editor step
    goToStep(3);
}

// Inject new editable Job block directly into the paper
function addInlineExperience() {
    const container = document.getElementById('canvasExperience');
    if(!container) return;
    
    const newJob = document.createElement('div');
    newJob.className = 'res-job-block editable-block';
    newJob.innerHTML = `
        <div class="res-job-header">
            <h4 contenteditable="true" class="editable-text">New Job Title</h4>
            <span contenteditable="true" class="editable-text" style="font-weight:600; color:var(--res-theme);">Company Name</span>
            <span contenteditable="true" class="editable-text" style="color:#666; font-size:0.9em; float:right;">Start - End</span>
        </div>
        <ul contenteditable="true" class="editable-text" style="margin-top:8px; padding-left:20px; color:#444;">
            <li>Click here to edit this bullet point.</li>
            <li>Describe your achievements here.</li>
        </ul>
        <button onclick="this.parentElement.remove()" style="font-size:0.7rem; color:red; border:none; background:none; cursor:pointer; margin-top:5px;"><i class="fas fa-trash"></i> Delete Block</button>
    `;
    container.appendChild(newJob);
}

// Inject new editable Education block directly into the paper
function addInlineEducation() {
    const container = document.getElementById('canvasEducation');
    if(!container) return;
    
    const newEd = document.createElement('div');
    newEd.className = 'editable-block';
    newEd.style.marginBottom = "15px";
    newEd.innerHTML = `
        <strong contenteditable="true" class="editable-text" style="display:block;">Degree Name</strong>
        <span contenteditable="true" class="editable-text" style="display:block; color:var(--res-theme);">University Name</span>
        <span contenteditable="true" class="editable-text" style="font-size:0.85em; color:#666;">Graduated: Year</span>
        <button onclick="this.parentElement.remove()" style="font-size:0.7rem; color:red; border:none; background:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(newEd);
}

// === 4. PORTFOLIO MAKER ===
if (document.getElementById('portfolioForm')) {
    function addProject() {
        const div = document.createElement('div');
        div.innerHTML = `
            <input type="text" class="proj-title" placeholder="Project Title" oninput="updatePortfolio()" style="width:100%; margin-bottom:10px; padding:8px; border-radius:5px; border:1px solid #ddd;">
            <textarea class="proj-desc" placeholder="Description" oninput="updatePortfolio()" style="width:100%; margin-bottom:10px; padding:8px; border-radius:5px; border:1px solid #ddd;"></textarea>
        `;
        document.getElementById('projectList').appendChild(div);
    }
    
    function updatePortfolio() {
        document.getElementById('dispName').innerText = document.getElementById('portName').value || "My Portfolio";
        document.getElementById('dispBio').innerText = document.getElementById('portBio').value || "Creative Developer & Designer";
        
        const container = document.getElementById('dispProjects');
        container.innerHTML = '';
        
        document.querySelectorAll('#projectList div').forEach(item => {
            const title = item.querySelector('.proj-title')?.value;
            const desc = item.querySelector('.proj-desc')?.value;
            if(title) {
                container.innerHTML += `
                <div style="border:1px solid #eee; padding:20px; border-radius:10px; background:#f8fafc;">
                    <h3>${title}</h3>
                    <p style="color:#666; margin-top:10px;">${desc}</p>
                </div>`;
            }
        });
    }
}

// === 5. ATS SCANNER LOGIC ===
function calculateScore() {
    const resume = document.getElementById('atsResume').value.toLowerCase();
    const job = document.getElementById('atsJob').value.toLowerCase();
    
    if (!resume || !job) { 
        alert("Please paste text in both boxes to scan."); 
        return; 
    }

    // Extract words with 4 or more letters from the job description
    const keywords = job.match(/\b[a-z]{4,}\b/g) || [];
    const unique = [...new Set(keywords)]; // Remove duplicates
    let matchCount = 0;
    
    // Check if resume contains those keywords
    unique.forEach(word => { 
        if (resume.includes(word)) matchCount++; 
    });

    const score = Math.round((matchCount / unique.length) * 100) || 0;
    const circle = document.getElementById('scoreDisplay');
    circle.innerText = score + "%";
    
    // Change color based on score
    if (score >= 80) circle.style.borderColor = "#10B981";      // Green
    else if (score >= 50) circle.style.borderColor = "#F59E0B"; // Yellow/Orange
    else circle.style.borderColor = "#EF4444";                  // Red
    
    circle.style.color = circle.style.borderColor;
}

// === 6. PDF DOWNLOADER (Cleans up UI before saving) ===
function downloadPDF(elementId, filename) {
    const element = document.getElementById(elementId);
    if(!element) return;
    
    // 1. Temporarily hide delete buttons so they aren't on the PDF
    const deleteBtns = element.querySelectorAll('button');
    deleteBtns.forEach(btn => btn.style.display = 'none');
    
    // 2. Temporarily clean up outline/shadows from editable areas
    const editables = element.querySelectorAll('[contenteditable="true"]');
    editables.forEach(el => {
        el.style.outline = 'none';
        el.style.boxShadow = 'none';
        el.style.background = 'transparent';
    });
    
    // 3. Prevent scaling issues
    element.style.transform = "none"; 
    
    const opt = { 
        margin: 0, 
        filename: filename + '.pdf', 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' } 
    };
    
    if (window.html2pdf) {
        html2pdf().set(opt).from(element).save().then(() => {
            // Restore delete buttons after saving is complete
            deleteBtns.forEach(btn => btn.style.display = 'inline-block');
        });
    } else {
        alert("PDF generator is still loading. Please try again in a few seconds.");
        // Restore buttons just in case of failure
        deleteBtns.forEach(btn => btn.style.display = 'inline-block');
    }
}