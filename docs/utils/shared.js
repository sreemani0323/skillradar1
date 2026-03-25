// Shared Utilities for SkillRadar Application
// Consolidates common functions to eliminate code duplication

// === CONSTANTS ===
export const STORAGE_KEYS = {
    PROFILE: 'srProfile',
    SAVED_JOBS: 'srSaved',
    DISMISSED: 'srDismissed',
    ANALYZER_TAB: 'srAnalyzerTab',
    TRACKER_VIEW: 'srTrackerView',
    ALERT_KEYWORDS: 'srAlertKeywords',
    ALERT_PREFS: 'srAlertPrefs',
    KANBAN: 'srKanban'
};

export const CSS_CLASSES = {
    DRAWER_OPEN: 'drawer--open',
    TOAST_VISIBLE: 'toast--visible',
    NAV_ACTIVE: 'nav-item--active',
    BTN_ACTIVE: 'btn-secondary--active',
    PANEL_OPEN: 'company-panel-overlay--open',
    RESULTS_VISIBLE: 'results-card--visible',
    TAB_ACTIVE: 'tab-panel--active'
};

export const ELEMENT_IDS = {
    DASHBOARD_MATCH_RING: 'dashboard-match-ring',
    TRENDING_SKILLS: 'trending-skills',
    RECENT_JOBS_GRID: 'recent-jobs-grid',
    JOBS_GRID: 'jobs-grid',
    ANALYSIS_RESULTS: 'analysis-results',
    COMPANY_PANEL: 'company-panel-overlay'
};

// === STATE MANAGEMENT ===
let userProfile = null;
let toastQueue = [];

// === USER PROFILE UTILITIES ===
export function loadUserProfile() {
    const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (savedProfile) {
        try {
            userProfile = JSON.parse(savedProfile);
            return userProfile;
        } catch (e) {
            console.warn('Invalid profile data in localStorage');
            userProfile = null;
        }
    }
    return null;
}

export function saveUserProfile(profile) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    userProfile = profile;
}

export function getUserProfile() {
    return userProfile || loadUserProfile();
}

// === LOCALSTORAGE UTILITIES ===
export function getStorageItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.warn(`Failed to parse localStorage item: ${key}`, e);
        return defaultValue;
    }
}

export function setStorageItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error(`Failed to save to localStorage: ${key}`, e);
        return false;
    }
}

// === JOB UTILITIES ===
export function calculateJobMatchScore(job) {
    const profile = getUserProfile();
    if (!profile || !profile.skills) return 0;

    const userSkills = profile.skills.map(s => s.toLowerCase().trim());
    const jobSkills = job.skills.map(s => s.toLowerCase().trim());

    const matchedSkills = jobSkills.filter(js =>
        userSkills.some(us => us.includes(js) || js.includes(us))
    );

    return Math.round((matchedSkills.length / jobSkills.length) * 100);
}

export function getBadgeVariant(source) {
    switch (source) {
        case 'LinkedIn': return 'brand';
        case 'Internshala': return 'amber';
        case 'Unstop': return 'violet';
        default: return 'gray';
    }
}

export function getLevelVariant(level) {
    switch (level) {
        case 'Beginner': return 'emerald';
        case 'Intermediate': return 'amber';
        case 'Advanced': return 'coral';
        default: return 'gray';
    }
}

export function getMatchColor(score) {
    if (score >= 70) return 'var(--brand)';
    if (score >= 40) return 'var(--amber)';
    return 'var(--coral)';
}

export function generateApplyUrl(job) {
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

export function calculatePostedDate(dateString) {
    const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
}

// === SAVED JOBS UTILITIES ===
export function getSavedJobs() {
    return getStorageItem(STORAGE_KEYS.SAVED_JOBS, []);
}

export function toggleJobSaved(jobId) {
    const savedJobs = getSavedJobs();
    const index = savedJobs.indexOf(jobId);

    if (index > -1) {
        savedJobs.splice(index, 1);
        showToast('Job removed from saved.', 'success');
    } else {
        savedJobs.push(jobId);
        showToast('Job saved.', 'success');
    }

    setStorageItem(STORAGE_KEYS.SAVED_JOBS, savedJobs);
    return savedJobs;
}

export function isJobSaved(jobId) {
    return getSavedJobs().includes(jobId);
}

// === TOAST NOTIFICATIONS ===
export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    const iconSvg = type === 'success' ? `
        <svg class="toast__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"/>
        </svg>
    ` : `
        <svg class="toast__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
    `;

    toast.innerHTML = `
        ${iconSvg}
        <span class="toast__message">${message}</span>
    `;

    document.body.appendChild(toast);

    // Limit concurrent toasts
    toastQueue.push(toast);
    if (toastQueue.length > 3) {
        const oldestToast = toastQueue.shift();
        if (oldestToast && oldestToast.parentNode) {
            oldestToast.remove();
        }
    }

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add(CSS_CLASSES.TOAST_VISIBLE);
    });

    // Auto remove
    setTimeout(() => {
        toast.classList.remove(CSS_CLASSES.TOAST_VISIBLE);
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
                const index = toastQueue.indexOf(toast);
                if (index > -1) {
                    toastQueue.splice(index, 1);
                }
            }
        }, 150);
    }, 3000);
}

// === MATCH RING RENDERING ===
export function renderMatchRing(container, score, size) {
    if (!container) return;

    container.innerHTML = '';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

    const center = size / 2;
    const radius = size * 0.38;
    const circumference = 2 * Math.PI * radius;

    // Background circle
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', center);
    bgCircle.setAttribute('cy', center);
    bgCircle.setAttribute('r', radius);
    bgCircle.setAttribute('fill', 'none');
    bgCircle.setAttribute('stroke', '#E2E8F0');
    bgCircle.setAttribute('stroke-width', '7');

    // Foreground arc
    const fgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    fgCircle.setAttribute('cx', center);
    fgCircle.setAttribute('cy', center);
    fgCircle.setAttribute('r', radius);
    fgCircle.setAttribute('fill', 'none');
    fgCircle.setAttribute('stroke-width', '7');
    fgCircle.setAttribute('stroke-linecap', 'round');
    fgCircle.setAttribute('stroke-dasharray', circumference);

    // Color based on score
    let strokeColor = '#0284C7'; // brand
    if (score >= 70) strokeColor = '#0284C7';
    else if (score >= 40) strokeColor = '#B45309';
    else strokeColor = '#DC2626';

    fgCircle.setAttribute('stroke', strokeColor);

    // Text elements
    const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    textGroup.setAttribute('text-anchor', 'middle');

    const scoreText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    scoreText.setAttribute('x', center);
    scoreText.setAttribute('y', center - 2);
    scoreText.setAttribute('font-size', size === 80 ? '20' : '28');
    scoreText.setAttribute('font-weight', '600');
    scoreText.setAttribute('fill', '#0F172A');

    const profile = getUserProfile();
    scoreText.textContent = profile ? score : '—';

    const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    labelText.setAttribute('x', center);
    labelText.setAttribute('y', center + 12);
    labelText.setAttribute('font-size', '11');
    labelText.setAttribute('fill', '#94A3B8');
    labelText.textContent = profile ? 'Match' : 'Add skills';

    textGroup.appendChild(scoreText);
    textGroup.appendChild(labelText);

    svg.appendChild(bgCircle);
    svg.appendChild(fgCircle);
    svg.appendChild(textGroup);

    container.appendChild(svg);

    // Animate the arc
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion && profile) {
        const targetOffset = circumference * (1 - score / 100);
        fgCircle.setAttribute('stroke-dashoffset', circumference);

        setTimeout(() => {
            fgCircle.style.transition = 'stroke-dashoffset 800ms ease-out';
            fgCircle.setAttribute('stroke-dashoffset', targetOffset);
        }, 100);
    } else {
        const targetOffset = circumference * (1 - (profile ? score : 0) / 100);
        fgCircle.setAttribute('stroke-dashoffset', targetOffset);
    }
}

// === DOM UTILITIES ===
const elementCache = new Map();

export function getCachedElement(selector) {
    if (!elementCache.has(selector)) {
        elementCache.set(selector, document.querySelector(selector));
    }
    return elementCache.get(selector);
}

export function clearElementCache() {
    elementCache.clear();
}

// === TAB MANAGEMENT UTILITIES ===

// Debouncing utility to prevent rapid tab switching
export function createDebouncer(delay = 100) {
    let lastCall = 0;
    return function() {
        const now = Date.now();
        if (now - lastCall < delay) return false;
        lastCall = now;
        return true;
    };
}

// Event listener utility with proper cleanup to prevent memory leaks
export function setupCleanEventListener(selector, eventType, handler, options = { passive: true }) {
    const element = document.querySelector(selector);
    if (!element) return null;

    // Remove existing listeners by cloning node
    const newElement = element.cloneNode(true);
    element.parentNode.replaceChild(newElement, element);

    // Add new listener
    newElement.addEventListener(eventType, handler, options);
    return newElement;
}

// Tab state management utility for ARIA attributes and CSS classes
export function updateTabStates(tabConfigs) {
    tabConfigs.forEach(config => {
        const element = document.querySelector(config.selector);
        if (!element) return;

        // Update ARIA attributes
        element.setAttribute('aria-selected', config.active ? 'true' : 'false');

        // Update CSS classes
        if (config.active) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }

        // Update aria-checked for toggle buttons (like kanban/timeline buttons)
        if (config.toggleMode) {
            element.setAttribute('aria-checked', config.active ? 'true' : 'false');
        }
    });
}

// Panel visibility utility for showing/hiding tab panels
export function updatePanelVisibility(panelConfigs) {
    panelConfigs.forEach(config => {
        const element = document.getElementById(config.id);
        if (!element) return;

        if (config.useDisplay) {
            // Use display style for simple show/hide
            element.style.display = config.visible ? 'block' : 'none';
        } else {
            // Use CSS classes for more complex states
            element.classList.toggle('tab-panel--active', config.visible);
        }
    });
}

// Batch DOM operations utility to reduce layout thrashing
export function batchDOMUpdates(updateFunctions) {
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
        updateFunctions.forEach(fn => {
            try {
                fn();
            } catch (error) {
                console.warn('Error in batched DOM update:', error);
            }
        });
    });
}

// Tab constants to avoid string literals
export const TAB_IDS = {
    // Trends tabs
    TRENDS: 'trends',
    HEATMAP: 'heatmap',

    // Gap analyzer tabs
    ENTER_SKILLS: 'enter',
    PASTE_RESUME: 'resume',

    // Tracker views
    KANBAN: 'kanban',
    TIMELINE: 'timeline'
};

// === ERROR HANDLING ===
export function withErrorHandling(fn, errorMessage = 'An error occurred') {
    return (...args) => {
        try {
            return fn(...args);
        } catch (error) {
            console.error(errorMessage, error);
            showToast(errorMessage, 'error');
            return null;
        }
    };
}