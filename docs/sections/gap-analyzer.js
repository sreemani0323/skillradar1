// Gap Analyzer JavaScript using shared utilities
import {
    getStorageItem,
    setStorageItem,
    showToast,
    calculateJobMatchScore,
    renderMatchRing,
    createDebouncer,
    setupCleanEventListener,
    updateTabStates,
    updatePanelVisibility,
    getCachedElement,
    STORAGE_KEYS,
    CSS_CLASSES,
    TAB_IDS
} from '../utils/shared.js';

// Gap analyzer state
let userProfile = null;
const tabSwitchDebouncer = createDebouncer(100);

// Cache frequently accessed DOM elements
const domCache = {
    analyzeBtn: null,
    scanBtn: null,
    tagsList: null,
    resultsCard: null,
    ringContainer: null,
    tagInput: null,
    resumeTextarea: null,
    branchSelect: null,
    targetRoleSelect: null,

    // Initialize cache on DOM ready
    init() {
        this.analyzeBtn = getCachedElement('.analyze-btn');
        this.scanBtn = getCachedElement('.scan-btn');
        this.tagsList = getCachedElement('.tags-list');
        this.resultsCard = getCachedElement('#analysis-results');
        this.ringContainer = getCachedElement('#analyzer-match-ring');
        this.tagInput = getCachedElement('.tag-input__field');
        this.resumeTextarea = getCachedElement('.resume-textarea');
        this.branchSelect = getCachedElement('.analyzer-layout .branch-select');
        this.targetRoleSelect = getCachedElement('.target-role-select');
    }
};

// Initialize gap analyzer when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeGapAnalyzer();
});

function initializeGapAnalyzer() {
    // Load user profile from localStorage
    userProfile = getStorageItem(STORAGE_KEYS.PROFILE);

    // Initialize DOM cache
    domCache.init();

    // Setup event listeners
    setupGapAnalyzerEventListeners();

    // Restore active tab
    const savedTab = getStorageItem(STORAGE_KEYS.ANALYZER_TAB, TAB_IDS.ENTER_SKILLS);
    switchAnalyzerTab(savedTab);

    // Pre-fill from profile if exists
    prefillGapAnalyzer();
}

// === EVENT LISTENERS ===
function setupGapAnalyzerEventListeners() {
    // Tab switching with proper cleanup
    setupCleanEventListener('.tab-enter-skills', 'click', (e) => {
        e.stopPropagation();
        switchAnalyzerTab(TAB_IDS.ENTER_SKILLS);
    });

    setupCleanEventListener('.tab-paste-resume', 'click', (e) => {
        e.stopPropagation();
        switchAnalyzerTab(TAB_IDS.PASTE_RESUME);
    });

    // Tag input
    setupTagInput();

    // Analyze button - use cached element
    if (domCache.analyzeBtn) {
        domCache.analyzeBtn.addEventListener('click', handleAnalyzeSkills);
    }

    // Scan resume button - use cached element
    if (domCache.scanBtn) {
        domCache.scanBtn.addEventListener('click', handleScanResume);
    }
}

function switchAnalyzerTab(tabName) {
    // Debounce rapid clicks for performance
    if (!tabSwitchDebouncer()) return;

    console.log(`Switching to ${tabName} analyzer tab`); // Debug log

    // Update tab states using shared utility
    updateTabStates([
        { selector: '.tab-enter-skills', active: tabName === TAB_IDS.ENTER_SKILLS },
        { selector: '.tab-paste-resume', active: tabName === TAB_IDS.PASTE_RESUME }
    ]);

    // Update panel visibility using shared utility
    updatePanelVisibility([
        { id: 'tab-panel-enter', visible: tabName === TAB_IDS.ENTER_SKILLS },
        { id: 'tab-panel-resume', visible: tabName === TAB_IDS.PASTE_RESUME }
    ]);

    // Save tab preference
    setStorageItem(STORAGE_KEYS.ANALYZER_TAB, tabName);
}

function prefillGapAnalyzer() {
    if (userProfile && userProfile.skills) {
        if (domCache.tagsList) {
            domCache.tagsList.innerHTML = '';
            userProfile.skills.forEach(skill => addSkillTag(skill));
        }
    }

    if (userProfile && userProfile.branch) {
        if (domCache.branchSelect) {
            domCache.branchSelect.value = userProfile.branch;
        }
    }
}

function setupTagInput() {
    const input = document.querySelector('.tag-input__field');
    if (!input) return;

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const value = input.value.trim();
            if (value) {
                addSkillTag(value);
                input.value = '';
            }
        }
    });
}

function addSkillTag(skillName) {
    const tagsList = document.querySelector('.tags-list');
    if (!tagsList) return;

    // Check if tag already exists
    const existingTags = Array.from(tagsList.children);
    if (existingTags.some(tag => tag.dataset.skill === skillName)) {
        return;
    }

    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.dataset.skill = skillName;
    tag.innerHTML = `
        <span>${skillName}</span>
        <button class="tag-remove btn-icon" aria-label="Remove ${skillName}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m18 6-12 12"/>
                <path d="m6 6 12 12"/>
            </svg>
        </button>
    `;

    const removeBtn = tag.querySelector('.tag-remove');
    removeBtn.addEventListener('click', () => {
        tag.remove();
    });

    tagsList.appendChild(tag);
}

function getTaggedSkills() {
    const tags = document.querySelectorAll('.tags-list .tag');
    return Array.from(tags).map(tag => tag.dataset.skill);
}

function handleAnalyzeSkills() {
    const skills = getTaggedSkills();

    if (skills.length === 0) {
        showToast('Please add at least one skill.', 'error');
        return;
    }

    // Save to profile
    const existingProfile = userProfile || {};
    const newProfile = {
        ...existingProfile,
        skills: skills
    };

    setStorageItem(STORAGE_KEYS.PROFILE, newProfile);
    userProfile = newProfile;

    // Run analysis
    const results = computeGapAnalysis(skills);
    renderAnalysisResults(results);

    showToast('Analysis complete. Skills saved to your profile.', 'success');

    // Scroll to results on mobile
    if (window.innerWidth < 768) {
        const resultsCard = document.getElementById('analysis-results');
        if (resultsCard) {
            resultsCard.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

function handleScanResume() {
    const textarea = document.querySelector('.resume-textarea');
    if (!textarea) return;

    const resumeText = textarea.value.trim().toLowerCase();

    if (!resumeText) {
        showToast('Please paste resume text before scanning.', 'error');
        return;
    }

    // Find skills in resume text
    const foundSkills = [];
    if (skillDemand) {
        Object.keys(skillDemand).forEach(skill => {
            if (resumeText.includes(skill.toLowerCase())) {
                foundSkills.push(skill);
            }
        });
    }

    if (foundSkills.length === 0) {
        showToast('No recognizable skills found. Try including specific technology names.', 'error');
        return;
    }

    // Switch to enter skills tab
    switchAnalyzerTab('enter');

    // Clear existing tags and add found skills
    const tagsList = document.querySelector('.tags-list');
    if (tagsList) {
        tagsList.innerHTML = '';
        foundSkills.forEach(skill => addSkillTag(skill));
    }

    // Auto-run analysis
    setTimeout(() => handleAnalyzeSkills(), 100);

    showToast(`Found ${foundSkills.length} skills in your resume.`, 'success');
}

function computeGapAnalysis(userSkills) {
    // Check if required data is available
    if (typeof skillDemand === 'undefined') {
        console.error('skillDemand is not available. Make sure data.js is loaded.');
        return { matched: [], missing: [], score: 0, matchedJobs: [] };
    }

    if (typeof jobsData === 'undefined') {
        console.error('jobsData is not available. Make sure data.js is loaded.');
        return { matched: [], missing: [], score: 0, matchedJobs: [] };
    }

    const allDemandSkills = Object.keys(skillDemand);
    const userNorm = userSkills.map(s => s.toLowerCase().trim());

    const matched = allDemandSkills.filter(s =>
        userNorm.some(us => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us))
    );

    const missing = allDemandSkills.filter(s =>
        !userNorm.some(us => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us))
    );

    const score = Math.round((matched.length / allDemandSkills.length) * 100);

    const matchedJobs = jobsData.filter(job => {
        const jobNorm = job.skills.map(s => s.toLowerCase());
        const matchCount = jobNorm.filter(js =>
            userNorm.some(us => us.includes(js) || js.includes(us))
        ).length;
        return (matchCount / jobNorm.length) >= 0.5;
    });

    return { matched, missing, score, matchedJobs };
}

function renderAnalysisResults(results) {
    const resultsCard = document.getElementById('analysis-results');
    if (!resultsCard) return;

    // Show results card
    resultsCard.classList.add('results-card--visible');

    // Render match score ring
    const ringContainer = document.getElementById('analyzer-match-ring');
    if (ringContainer) {
        renderMatchRing(ringContainer, results.score, 120);
    }

    // Render your skills
    renderYourSkills(results.matched);

    // Render missing skills
    renderMissingSkills(results.missing);

    // Render roadmap
    renderSkillRoadmap(results.missing);

    // Render matched jobs
    renderMatchedJobs(results.matchedJobs);
}

function renderYourSkills(matchedSkills) {
    const container = document.querySelector('#your-skills-section .skills-chips');
    if (!container) return;

    const userSkills = getTaggedSkills();
    container.innerHTML = '';

    if (matchedSkills.length === 0) {
        container.innerHTML = '<p>None of your skills matched known in-demand skills.</p>';
        return;
    }

    // Show matched skills with checkmarks
    matchedSkills.forEach(skill => {
        const chip = document.createElement('span');
        chip.className = 'badge badge--brand';
        chip.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"/>
            </svg>
            ${skill}
        `;
        container.appendChild(chip);
    });

    // Show remaining user skills as gray
    const remainingSkills = userSkills.filter(us =>
        !matchedSkills.some(ms => ms.toLowerCase().includes(us.toLowerCase()) || us.toLowerCase().includes(ms.toLowerCase()))
    );

    remainingSkills.forEach(skill => {
        const chip = document.createElement('span');
        chip.className = 'badge badge--gray';
        chip.textContent = skill;
        container.appendChild(chip);
    });
}

function renderMissingSkills(missingSkills) {
    const container = document.querySelector('#missing-skills-section .missing-chips');
    if (!container) return;

    // Check if required data is available
    if (typeof skillDemand === 'undefined' || typeof jobsData === 'undefined') {
        console.error('Required data (skillDemand or jobsData) is not available.');
        container.innerHTML = '<p style="color: var(--text-muted);">Unable to load missing skills data.</p>';
        return;
    }

    container.innerHTML = '';

    // Sort by demand and show top 8
    const topMissing = missingSkills
        .sort((a, b) => (skillDemand[b] || 0) - (skillDemand[a] || 0))
        .slice(0, 8);

    topMissing.forEach(skill => {
        const demand = skillDemand[skill] || 0;
        const jobCount = jobsData.filter(job => job.skills.includes(skill)).length;

        const chip = document.createElement('span');
        chip.className = 'badge badge--coral';
        chip.textContent = `${skill} (${demand}%)`;
        chip.title = `Required by ${jobCount} jobs`;
        container.appendChild(chip);
    });
}

function renderSkillRoadmap(missingSkills) {
    const container = document.querySelector('.skill-roadmap');
    if (!container) return;

    // Check if required data is available
    if (typeof skillDemand === 'undefined') {
        console.error('skillDemand is not available for roadmap.');
        container.innerHTML = '<p style="color: var(--text-muted);">Unable to generate skill roadmap.</p>';
        return;
    }

    const targetRole = document.querySelector('.target-role-select')?.value || 'Target Role';
    const userSkills = getTaggedSkills();
    const topSkill = userSkills.length > 0 ? userSkills[0] : 'Current skills';

    // Get top 2 missing skills
    const topMissing = missingSkills
        .sort((a, b) => (skillDemand[b] || 0) - (skillDemand[a] || 0))
        .slice(0, 2);

    const nodes = [
        { label: 'You', sublabel: topSkill, color: 'brand' },
        ...(topMissing.length > 0 ? [{
            label: topMissing[0],
            sublabel: `${skillDemand[topMissing[0]] || 0}%`,
            color: 'amber',
            skill: topMissing[0]
        }] : []),
        ...(topMissing.length > 1 ? [{
            label: topMissing[1],
            sublabel: `${skillDemand[topMissing[1]] || 0}%`,
            color: 'amber',
            skill: topMissing[1]
        }] : []),
        { label: targetRole, sublabel: '', color: 'violet' }
    ];

    container.innerHTML = '';

    nodes.forEach((node, index) => {
        const nodeEl = document.createElement('div');
        nodeEl.className = `roadmap-node roadmap-node--${node.color}`;
        nodeEl.innerHTML = `
            <div style="font-size: 13px; font-weight: 500; margin-bottom: 2px;">${node.label}</div>
            ${node.sublabel ? `<div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">${node.sublabel}</div>` : ''}
            ${node.skill ? `<a href="https://www.google.com/search?q=${encodeURIComponent(node.skill + ' tutorial for beginners')}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; color: var(--brand);">Learn</a>` : ''}
        `;

        container.appendChild(nodeEl);

        if (index < nodes.length - 1) {
            const chevron = document.createElement('svg');
            chevron.className = 'roadmap-chevron';
            chevron.setAttribute('width', '16');
            chevron.setAttribute('height', '16');
            chevron.setAttribute('viewBox', '0 0 24 24');
            chevron.setAttribute('fill', 'none');
            chevron.setAttribute('stroke', 'currentColor');
            chevron.setAttribute('stroke-width', '2');
            chevron.innerHTML = '<polyline points="9,18 15,12 9,6"/>';
            container.appendChild(chevron);
        }

        // Staggered animation
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setTimeout(() => {
                nodeEl.classList.add('roadmap-node--visible');
            }, index * 80);
        } else {
            nodeEl.classList.add('roadmap-node--visible');
        }
    });
}

function renderMatchedJobs(matchedJobs) {
    const container = document.querySelector('.matched-jobs-grid');
    if (!container) return;

    container.innerHTML = '';

    if (matchedJobs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Add more skills to unlock matched jobs.</p>';
        return;
    }

    matchedJobs.slice(0, 6).forEach(job => {
        const matchScore = calculateJobMatchScore(job);
        const applyUrl = generateApplyUrl(job);

        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = 'padding: 12px; cursor: pointer;';

        card.innerHTML = `
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">${job.role}</div>
            <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 6px;">${job.company}</div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="badge badge--${getMatchColor(matchScore) === 'var(--brand)' ? 'brand' : getMatchColor(matchScore) === 'var(--amber)' ? 'amber' : 'coral'}">${matchScore}% match</span>
                <a href="${applyUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 12px; color: var(--brand);">Apply</a>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (!e.target.closest('a')) {
                // Would open company panel if implemented
                console.log('Open company panel for:', job.company);
            }
        });

        container.appendChild(card);
    });
}

function getMatchColor(score) {
    if (score >= 70) return 'var(--brand)';
    if (score >= 40) return 'var(--amber)';
    return 'var(--coral)';
}

function generateApplyUrl(job) {
    switch (job.source) {
        case 'LinkedIn':
            return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.role)}`;
        case 'Internshala':
            return `https://internshala.com/jobs/${encodeURIComponent(job.role.toLowerCase().replace(/\s+/g, '-'))}`;
        case 'Unstop':
            return `https://unstop.com/jobs?search=${encodeURIComponent(job.role)}`;
        default:
            return `https://www.google.com/search?q=${encodeURIComponent(job.role + ' internship India')}`;
    }
}