// Jobs JavaScript using shared utilities
import {
    getStorageItem,
    setStorageItem,
    showToast,
    calculateJobMatchScore,
    getCachedElement,
    STORAGE_KEYS,
    CSS_CLASSES
} from '../utils/shared.js';

// Jobs-specific state
let userProfile = null;
let currentFilter = { search: '', skill: '', location: '', level: '' };
let isSortedByMatch = false;
let isShowingSaved = false;
let currentEscapeHandler = null; // Store escape handler reference for cleanup

// Cache frequently accessed DOM elements
const jobsCache = {
    jobSearch: null,
    skillFilter: null,
    locationFilter: null,
    levelFilter: null,
    sortMatchBtn: null,
    clearFiltersBtn: null,
    savedToggleBtn: null,
    jobsGrid: null,
    emptyState: null,
    savedCount: null,
    companyOverlay: null,

    // Initialize cache on DOM ready
    init() {
        this.jobSearch = getCachedElement('.job-search');
        this.skillFilter = getCachedElement('.skill-filter');
        this.locationFilter = getCachedElement('.location-filter');
        this.levelFilter = getCachedElement('.level-filter');
        this.sortMatchBtn = getCachedElement('.sort-match-btn');
        this.clearFiltersBtn = getCachedElement('.clear-filters-btn');
        this.savedToggleBtn = getCachedElement('.saved-toggle-btn');
        this.jobsGrid = getCachedElement('#jobs-grid');
        this.emptyState = getCachedElement('#jobs-empty-state');
        this.savedCount = getCachedElement('.saved-count');
        this.companyOverlay = getCachedElement('#company-panel-overlay');
    }
};

// Initialize jobs when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeJobs();
});

function initializeJobs() {
    // Load user profile from localStorage
    userProfile = getStorageItem(STORAGE_KEYS.PROFILE);

    // Setup event listeners
    setupJobsEventListeners();

    // Populate filter dropdowns
    populateFilterDropdowns();

    // Initial render of jobs grid
    renderJobsGrid();

    // Update UI state
    updateSavedCount();
    updateSortByMatchVisibility();
    updateClearFiltersVisibility();
}

function setupJobsEventListeners() {
    // Job search and filters
    const jobSearch = document.querySelector('.job-search');
    const skillFilter = document.querySelector('.skill-filter');
    const locationFilter = document.querySelector('.location-filter');
    const levelFilter = document.querySelector('.level-filter');
    const sortMatchBtn = document.querySelector('.sort-match-btn');
    const clearFiltersBtn = document.querySelector('.clear-filters-btn');
    const savedToggleBtn = document.querySelector('.saved-toggle-btn');

    if (jobSearch) jobSearch.addEventListener('input', filterJobs);
    if (skillFilter) skillFilter.addEventListener('change', filterJobs);
    if (locationFilter) locationFilter.addEventListener('change', filterJobs);
    if (levelFilter) levelFilter.addEventListener('change', filterJobs);
    if (sortMatchBtn) sortMatchBtn.addEventListener('click', toggleSortByMatch);
    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearAllFilters);
    if (savedToggleBtn) savedToggleBtn.addEventListener('click', toggleSavedJobs);
}

function populateFilterDropdowns() {
    if (!jobsData) return;

    // Populate skills dropdown
    const skillFilter = document.querySelector('.skill-filter');
    if (skillFilter) {
        const skills = [...new Set(jobsData.flatMap(j => j.skills))].sort();
        skillFilter.innerHTML = '<option value="">All Skills</option>';
        skills.forEach(skill => {
            const option = document.createElement('option');
            option.value = skill;
            option.textContent = skill;
            skillFilter.appendChild(option);
        });
    }

    // Populate locations dropdown
    const locationFilter = document.querySelector('.location-filter');
    if (locationFilter) {
        const locations = [...new Set(jobsData.map(j => j.location))].sort();
        locationFilter.innerHTML = '<option value="">All Locations</option>';
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
        });
    }
}

function filterJobs() {
    const searchInput = document.querySelector('.job-search');
    const skillFilter = document.querySelector('.skill-filter');
    const locationFilter = document.querySelector('.location-filter');
    const levelFilter = document.querySelector('.level-filter');

    currentFilter = {
        search: searchInput ? searchInput.value.toLowerCase().trim() : '',
        skill: skillFilter ? skillFilter.value : '',
        location: locationFilter ? locationFilter.value : '',
        level: levelFilter ? levelFilter.value : ''
    };

    renderJobsGrid();
    updateClearFiltersVisibility();
}

function renderJobsGrid() {
    const container = document.getElementById('jobs-grid');
    const emptyState = document.getElementById('jobs-empty-state');
    if (!container || !jobsData) return;

    let filteredJobs = [...jobsData];

    // Apply filters
    if (currentFilter.search) {
        filteredJobs = filteredJobs.filter(job =>
            job.role.toLowerCase().includes(currentFilter.search) ||
            job.company.toLowerCase().includes(currentFilter.search)
        );
    }

    if (currentFilter.skill) {
        filteredJobs = filteredJobs.filter(job =>
            job.skills.includes(currentFilter.skill)
        );
    }

    if (currentFilter.location) {
        filteredJobs = filteredJobs.filter(job =>
            job.location === currentFilter.location
        );
    }

    if (currentFilter.level) {
        filteredJobs = filteredJobs.filter(job =>
            job.level === currentFilter.level
        );
    }

    // Apply saved filter
    if (isShowingSaved) {
        const savedJobs = getStorageItem(STORAGE_KEYS.SAVED_JOBS, []);
        filteredJobs = filteredJobs.filter(job => savedJobs.includes(job.id));
    }

    // Apply sorting
    if (isSortedByMatch && userProfile) {
        filteredJobs.sort((a, b) => {
            const scoreA = calculateJobMatchScore(a);
            const scoreB = calculateJobMatchScore(b);
            return scoreB - scoreA;
        });
    }

    // Render results
    container.innerHTML = '';

    if (filteredJobs.length === 0) {
        if (emptyState) {
            emptyState.classList.add('empty-state--visible');
        }
        return;
    }

    if (emptyState) {
        emptyState.classList.remove('empty-state--visible');
    }

    filteredJobs.forEach(job => {
        const card = createJobCard(job, false);
        container.appendChild(card);
    });
}

function createJobCard(job, compact = false) {
    const card = document.createElement('div');
    card.className = 'job-card card';

    // Calculate colors for company avatar
    const colors = [
        { bg: 'var(--brand-light)', text: 'var(--brand-text)' },
        { bg: 'var(--violet-light)', text: 'var(--violet-text)' },
        { bg: 'var(--emerald-light)', text: 'var(--emerald-text)' },
        { bg: 'var(--amber-light)', text: 'var(--amber-text)' }
    ];
    const colorIndex = job.company.charCodeAt(0) % colors.length;
    const avatarColor = colors[colorIndex];

    // Check if job is saved
    const savedJobs = getStorageItem(STORAGE_KEYS.SAVED_JOBS, []);
    const isSaved = savedJobs.includes(job.id);

    // Calculate match score
    const matchScore = userProfile ? calculateJobMatchScore(job) : 0;
    const showMatch = userProfile && !compact;

    // Generate apply URL
    const applyUrl = generateApplyUrl(job);

    // Calculate posted date
    const postedDate = calculatePostedDate(job.postedDate);

    card.innerHTML = `
        <div class="job-card__row-1">
            <div class="company-info">
                <div class="company-avatar" style="background: ${avatarColor.bg}; color: ${avatarColor.text};">
                    <span class="company-initial">${job.company.charAt(0)}</span>
                </div>
                <div class="company-meta">
                    <span class="company-name">${job.company}</span>
                    <span class="badge badge--${getBadgeVariant(job.source)}">${job.source}</span>
                </div>
            </div>
            <button class="bookmark-btn btn-icon" aria-label="Save job: ${job.role}" data-job-id="${job.id}">
                ${isSaved ? `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                    </svg>
                ` : `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                    </svg>
                `}
            </button>
        </div>

        <h3 class="job-role">${job.role}</h3>

        ${showMatch ? `
            <div class="match-bar-container">
                <div class="match-bar-header">
                    <span class="match-label">Match</span>
                    <span class="match-pct">${matchScore}%</span>
                </div>
                <div class="match-bar-track">
                    <div class="match-bar-fill" style="background: ${getMatchColor(matchScore)}; width: 0%;"></div>
                </div>
            </div>
        ` : ''}

        <div class="job-card__row-4">
            <span class="badge badge--${job.location === 'Remote' ? 'violet' : 'gray'}">${job.location}</span>
            <span class="badge badge--${getLevelVariant(job.level)}">${job.level}</span>
        </div>

        <div class="job-card__row-5">
            ${job.skills.slice(0, 4).map(skill =>
                `<span class="badge badge--brand">${skill}</span>`
            ).join('')}
            ${job.skills.length > 4 ?
                `<span class="badge badge--gray">+${job.skills.length - 4} more</span>` : ''
            }
        </div>

        <div class="job-card__footer">
            <span class="posted-date">${postedDate}</span>
            <a href="${applyUrl}" target="_blank" rel="noopener noreferrer" class="apply-btn">Apply</a>
        </div>
    `;

    // Add click handler for card (except bookmark and apply)
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.bookmark-btn') && !e.target.closest('.apply-btn')) {
            openCompanyPanel(job.company);
        }
    });

    // Add bookmark handler
    const bookmarkBtn = card.querySelector('.bookmark-btn');
    bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleJobSaved(job.id);
    });

    // Add apply link handler
    const applyLink = card.querySelector('.apply-btn');
    applyLink.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Animate match bar if visible
    if (showMatch) {
        setTimeout(() => {
            const matchFill = card.querySelector('.match-bar-fill');
            if (matchFill && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                matchFill.style.transition = 'width 600ms ease';
                matchFill.style.width = matchScore + '%';
            } else if (matchFill) {
                matchFill.style.width = matchScore + '%';
            }
        }, 100);
    }

    return card;
}

// === UTILITY FUNCTIONS ===
function getBadgeVariant(source) {
    switch (source) {
        case 'LinkedIn': return 'brand';
        case 'Internshala': return 'amber';
        case 'Unstop': return 'violet';
        default: return 'gray';
    }
}

function getLevelVariant(level) {
    switch (level) {
        case 'Beginner': return 'emerald';
        case 'Intermediate': return 'amber';
        case 'Advanced': return 'coral';
        default: return 'gray';
    }
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

function calculatePostedDate(dateString) {
    const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
}

function toggleJobSaved(jobId) {
    const savedJobs = getStorageItem(STORAGE_KEYS.SAVED_JOBS, []);
    const index = savedJobs.indexOf(jobId);

    if (index > -1) {
        savedJobs.splice(index, 1);
        showToast('Job removed from saved.', 'success');
    } else {
        savedJobs.push(jobId);
        showToast('Job saved.', 'success');
    }

    setStorageItem(STORAGE_KEYS.SAVED_JOBS, savedJobs);

    // Update bookmark icons
    updateBookmarkIcons();
    updateSavedCount();

    // Re-render if showing saved jobs
    if (isShowingSaved) {
        renderJobsGrid();
    }
}

function updateBookmarkIcons() {
    const savedJobs = getStorageItem(STORAGE_KEYS.SAVED_JOBS, []);

    document.querySelectorAll('.bookmark-btn').forEach(btn => {
        const jobId = parseInt(btn.dataset.jobId);
        const isSaved = savedJobs.includes(jobId);

        btn.innerHTML = isSaved ? `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
        ` : `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
        `;
    });
}

function updateSavedCount() {
    const savedJobs = getStorageItem(STORAGE_KEYS.SAVED_JOBS, []);
    const countElement = document.querySelector('.saved-count');
    if (countElement) {
        countElement.textContent = savedJobs.length;
    }
}

function toggleSortByMatch() {
    const btn = document.querySelector('.sort-match-btn');
    if (!btn || !userProfile) return;

    isSortedByMatch = !isSortedByMatch;

    if (isSortedByMatch) {
        btn.classList.add('btn-secondary--active');
    } else {
        btn.classList.remove('btn-secondary--active');
    }

    renderJobsGrid();
}

function clearAllFilters() {
    // Reset filters
    currentFilter = { search: '', skill: '', location: '', level: '' };
    isSortedByMatch = false;

    // Reset form elements
    const jobSearch = document.querySelector('.job-search');
    const skillFilter = document.querySelector('.skill-filter');
    const locationFilter = document.querySelector('.location-filter');
    const levelFilter = document.querySelector('.level-filter');
    const sortMatchBtn = document.querySelector('.sort-match-btn');

    if (jobSearch) jobSearch.value = '';
    if (skillFilter) skillFilter.value = '';
    if (locationFilter) locationFilter.value = '';
    if (levelFilter) levelFilter.value = '';
    if (sortMatchBtn) sortMatchBtn.classList.remove('btn-secondary--active');

    renderJobsGrid();
    updateClearFiltersVisibility();
}

function toggleSavedJobs() {
    const btn = document.querySelector('.saved-toggle-btn');
    if (!btn) return;

    isShowingSaved = !isShowingSaved;

    if (isShowingSaved) {
        btn.classList.add('btn-secondary--active');
    } else {
        btn.classList.remove('btn-secondary--active');
    }

    renderJobsGrid();
}

function updateClearFiltersVisibility() {
    const btn = document.querySelector('.clear-filters-btn');
    if (!btn) return;

    const hasFilters =
        currentFilter.search !== '' ||
        currentFilter.skill !== '' ||
        currentFilter.location !== '' ||
        currentFilter.level !== '';

    btn.style.display = hasFilters ? 'inline-block' : 'none';
}

function updateSortByMatchVisibility() {
    const btn = document.querySelector('.sort-match-btn');
    if (!btn) return;

    btn.style.display = userProfile ? 'inline-block' : 'none';
}

// === COMPANY PANEL ===
function openCompanyPanel(companyName) {
    const overlay = document.getElementById('company-panel-overlay');
    if (!overlay || !jobsData) return;

    const companyJobs = jobsData.filter(j => j.company === companyName);
    if (companyJobs.length === 0) return;

    // Calculate company avatar
    const colors = [
        { bg: 'var(--brand-light)', text: 'var(--brand-text)' },
        { bg: 'var(--violet-light)', text: 'var(--violet-text)' },
        { bg: 'var(--emerald-light)', text: 'var(--emerald-text)' },
        { bg: 'var(--amber-light)', text: 'var(--amber-text)' }
    ];
    const colorIndex = companyName.charCodeAt(0) % colors.length;
    const avatarColor = colors[colorIndex];

    // Aggregate skills
    const allSkills = companyJobs.flatMap(j => j.skills);
    const skillFrequency = {};
    allSkills.forEach(skill => {
        skillFrequency[skill] = (skillFrequency[skill] || 0) + 1;
    });
    const sortedSkills = Object.entries(skillFrequency)
        .sort((a, b) => b[1] - a[1])
        .map(([skill]) => skill);

    // Update panel content
    const avatar = overlay.querySelector('.panel-company-avatar');
    const name = overlay.querySelector('.panel-company-name');
    const subtitle = overlay.querySelector('.panel-subtitle');
    const skillsContainer = overlay.querySelector('.panel-skills');
    const jobsContainer = overlay.querySelector('.panel-jobs');

    if (avatar) {
        avatar.style.background = avatarColor.bg;
        avatar.style.color = avatarColor.text;
        avatar.innerHTML = `<span>${companyName.charAt(0)}</span>`;
    }

    if (name) name.textContent = companyName;
    if (subtitle) subtitle.textContent = `${companyJobs.length} open roles`;

    if (skillsContainer) {
        skillsContainer.innerHTML = sortedSkills.map(skill =>
            `<span class="badge badge--brand">${skill}</span>`
        ).join('');
    }

    if (jobsContainer) {
        jobsContainer.innerHTML = companyJobs.map(job => `
            <div class="panel-job-item">
                <div style="font-weight: 500; margin-bottom: 4px;">${job.role}</div>
                <div style="display: flex; gap: 6px;">
                    <span class="badge badge--${getLevelVariant(job.level)}">${job.level}</span>
                    <span class="badge badge--${job.location === 'Remote' ? 'violet' : 'gray'}">${job.location}</span>
                </div>
            </div>
        `).join('');
    }

    // Show panel
    overlay.classList.add('company-panel-overlay--open');
    document.body.style.overflow = 'hidden';

    // Setup close handlers - use onclick to automatically replace previous handlers
    const backdrop = overlay.querySelector('.panel-backdrop');
    const closeBtn = overlay.querySelector('.panel-close');

    // Remove previous escape handler if exists
    if (currentEscapeHandler) {
        document.removeEventListener('keydown', currentEscapeHandler);
    }

    const closePanel = () => {
        overlay.classList.remove('company-panel-overlay--open');
        document.body.style.overflow = '';
        // Clean up escape handler
        if (currentEscapeHandler) {
            document.removeEventListener('keydown', currentEscapeHandler);
            currentEscapeHandler = null;
        }
    };

    // Use onclick to prevent duplicate listeners (overwrites previous handler)
    if (backdrop) backdrop.onclick = closePanel;
    if (closeBtn) closeBtn.onclick = closePanel;

    // Create and store escape handler
    currentEscapeHandler = (e) => {
        if (e.key === 'Escape') {
            closePanel();
        }
    };

    document.addEventListener('keydown', currentEscapeHandler);
}