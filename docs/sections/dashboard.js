// Dashboard JavaScript using shared utilities
import {
    getStorageItem,
    setStorageItem,
    showToast,
    calculateJobMatchScore,
    renderMatchRing,
    STORAGE_KEYS,
    CSS_CLASSES
} from '../utils/shared.js';

// Dashboard-specific state
let userProfile = null;

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    // Set footer year
    const footerYear = document.getElementById('footer-year');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

    // Cleanup any existing charts before initializing
    cleanupExistingCharts();

    // Load user profile from localStorage
    userProfile = getStorageItem(STORAGE_KEYS.PROFILE);

    // Setup event listeners
    setupOnboarding();
    setupViewAllButtons();

    // Render dashboard components
    populateFilterDropdowns();
    initializeMarketTicker();
    renderDashboardStats();
    renderTrendingSkills();
    renderRecentJobs();
    renderSkillDemandChart();
}

// Cleanup function to prevent memory leaks
function cleanupExistingCharts() {
    if (window.skillDemandChartInstance) {
        window.skillDemandChartInstance.destroy();
        window.skillDemandChartInstance = null;
    }
}

// === ONBOARDING SYSTEM ===
function setupOnboarding() {
    const strip = document.querySelector('.onboarding-strip');
    const saveBtn = document.querySelector('.save-btn');
    const dismissBtn = document.querySelector('.strip-dismiss');

    // Check if should show onboarding
    const hasProfile = getStorageItem(STORAGE_KEYS.PROFILE);
    const isDismissed = getStorageItem(STORAGE_KEYS.DISMISSED);

    if (!hasProfile && !isDismissed && strip) {
        strip.style.display = 'flex';
    } else if (strip) {
        strip.style.display = 'none';
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveProfile);
    }

    if (dismissBtn) {
        dismissBtn.addEventListener('click', handleDismissOnboarding);
    }
}

function handleSaveProfile() {
    const branchSelect = document.querySelector('.branch-select');
    const gradYearInput = document.querySelector('.gradyear-input');
    const skillsInput = document.querySelector('.skills-input');

    // Clear previous errors
    clearFormErrors();

    // Validate branch
    if (!branchSelect.value) {
        showFieldError(branchSelect, 'Please select a branch.');
        return;
    }

    // Validate graduation year
    const gradYear = parseInt(gradYearInput.value);
    if (!gradYear || gradYear < 2024 || gradYear > 2030) {
        showFieldError(gradYearInput, 'Please enter a valid graduation year.');
        return;
    }

    // Validate skills
    const skillsText = skillsInput.value.trim();
    if (!skillsText) {
        showFieldError(skillsInput, 'Please enter at least one skill.');
        return;
    }

    const skills = skillsText.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (skills.length === 0) {
        showFieldError(skillsInput, 'Please enter at least one skill.');
        return;
    }

    // Save profile
    const profile = {
        branch: branchSelect.value,
        gradYear: gradYear,
        skills: skills
    };

    setStorageItem(STORAGE_KEYS.PROFILE, profile);
    userProfile = profile;

    // Hide onboarding strip
    const strip = document.querySelector('.onboarding-strip');
    if (strip) {
        strip.style.display = 'none';
    }

    // Update UI
    renderDashboardMatchRing();

    showToast('Profile saved. Match scores are now active.', 'success');
}

function handleDismissOnboarding() {
    setStorageItem(STORAGE_KEYS.DISMISSED, 'true');
    const strip = document.querySelector('.onboarding-strip');
    if (strip) {
        strip.style.display = 'none';
    }
}

function showFieldError(field, message) {
    field.style.borderColor = 'var(--coral)';

    // Remove existing error
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }

    // Add new error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.cssText = 'font-size: var(--text-xs); color: var(--coral-text); margin-top: 4px;';
    errorDiv.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; margin-right: 4px;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        ${message}
    `;
    field.parentNode.appendChild(errorDiv);
}

function clearFormErrors() {
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('input, select').forEach(field => {
        field.style.borderColor = '';
    });
}

// === VIEW ALL BUTTONS ===
function setupViewAllButtons() {
    document.querySelectorAll('.view-all-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            if (target === 'jobs') {
                // Navigate to jobs page
                window.location.href = 'jobs.html';
            }
        });
    });
}

// === DASHBOARD COMPONENTS ===
function initializeMarketTicker() {
    const messages = generateTickerMessages();
    const messageElements = document.querySelectorAll('.ticker__message');

    if (messageElements.length === 0 || messages.length === 0) return;

    // Set messages
    messageElements.forEach((el, index) => {
        if (messages[index]) {
            el.textContent = messages[index];
        }
    });

    // Start rotation
    let currentIndex = 0;
    messageElements[0].classList.add('ticker__message--active');

    const ticker = document.querySelector('.ticker');
    let interval;

    function rotateMessage() {
        messageElements[currentIndex].classList.remove('ticker__message--active');
        currentIndex = (currentIndex + 1) % messages.length;
        messageElements[currentIndex].classList.add('ticker__message--active');
    }

    function startRotation() {
        interval = setInterval(rotateMessage, 4000);
    }

    function stopRotation() {
        clearInterval(interval);
    }

    if (ticker) {
        ticker.addEventListener('mouseenter', stopRotation);
        ticker.addEventListener('mouseleave', startRotation);
    }

    startRotation();
}

function generateTickerMessages() {
    if (!skillDemand || !jobsData || !trendData) return [];

    const pythonDemand = skillDemand['Python'] || 0;
    const remoteJobs = jobsData.filter(j => j.location === 'Remote').length;
    const topSkillName = Object.keys(skillDemand).reduce((a, b) => skillDemand[a] > skillDemand[b] ? a : b);
    const mlTrendData = trendData['Machine Learning'];
    const mlTrend = mlTrendData ? Math.round(((mlTrendData[mlTrendData.length - 1] - mlTrendData[0]) / mlTrendData[0]) * 100) : 0;
    const uniqueCompanies = new Set(jobsData.map(j => j.company)).size;

    return [
        `Python appears in ${pythonDemand}% of all listings`,
        `${remoteJobs} remote internships available`,
        `Top skill this week: ${topSkillName}`,
        `Machine Learning demand up ${mlTrend}% over 7 weeks`,
        `${uniqueCompanies} companies actively hiring`
    ];
}

function renderDashboardStats() {
    if (!jobsData) return;

    const totalListings = jobsData.length;
    const uniqueSkills = new Set(jobsData.flatMap(j => j.skills)).size;
    const remoteRoles = jobsData.filter(j => j.location === 'Remote').length;
    const topSkill = skillDemand ? Object.keys(skillDemand).reduce((a, b) => skillDemand[a] > skillDemand[b] ? a : b) : 'Python';

    // Animate counters
    const counterElements = document.querySelectorAll('[data-counter="0"]');
    if (counterElements[0]) animateCounter(counterElements[0], totalListings);
    if (counterElements[1]) animateCounter(counterElements[1], uniqueSkills);
    if (counterElements[2]) animateCounter(counterElements[2], remoteRoles);

    const topSkillElement = document.getElementById('top-skill');
    if (topSkillElement) {
        topSkillElement.textContent = topSkill;
    }

    // Render match score ring
    renderDashboardMatchRing();
}

function animateCounter(element, target, duration = 600) {
    if (!element || isNaN(target)) return;

    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Check for reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            element.textContent = target;
            return;
        }

        const current = Math.round(start + (target - start) * progress);
        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function renderDashboardMatchRing() {
    const container = document.getElementById('dashboard-match-ring');
    if (!container) return;

    const score = calculateMatchScore();
    renderMatchRing(container, score, 80);
}

function calculateMatchScore() {
    if (!userProfile || !userProfile.skills || !skillDemand) return 0;

    const userSkills = userProfile.skills.map(s => s.toLowerCase().trim());
    const demandSkills = Object.keys(skillDemand);
    const matchedSkills = demandSkills.filter(s =>
        userSkills.some(us => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us))
    );

    return Math.round((matchedSkills.length / demandSkills.length) * 100);
}

function renderTrendingSkills() {
    const container = document.getElementById('trending-skills');
    if (!container || !skillDemand) return;

    // Get top 5 skills by demand
    const topSkills = Object.entries(skillDemand)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    container.innerHTML = '';

    topSkills.forEach(([skill, demand]) => {
        const pill = document.createElement('div');
        pill.className = 'skill-pill';

        let hasSkill = false;
        if (userProfile && userProfile.skills) {
            hasSkill = userProfile.skills.some(s =>
                s.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(s.toLowerCase())
            );
        }

        pill.innerHTML = `
            ${hasSkill ? `
                <svg class="skill-check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"/>
                </svg>
            ` : ''}
            <span>${skill}</span>
            <span class="demand-chip">${demand}%</span>
        `;

        container.appendChild(pill);
    });
}

function renderRecentJobs() {
    const container = document.getElementById('recent-jobs-grid');
    if (!container || !jobsData) return;

    const recentJobs = jobsData.slice(-5).reverse();
    container.innerHTML = '';

    recentJobs.forEach(job => {
        const card = createJobCard(job, true); // compact = true
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

    return card;
}

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

    // Update bookmark icons in current view
    updateBookmarkIcons();
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

function renderSkillDemandChart() {
    const canvas = document.getElementById('skill-demand-chart');
    if (!canvas || typeof skillDemand === 'undefined') return;

    const ctx = canvas.getContext('2d');

    // Clear any existing chart
    if (window.skillDemandChartInstance) {
        window.skillDemandChartInstance.destroy();
    }

    // Ensure proper canvas sizing
    const container = canvas.parentElement;
    canvas.style.width = '100%';
    canvas.style.height = '400px';

    // Get top 10 skills for better visibility
    const topSkills = Object.entries(skillDemand)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const labels = topSkills.map(([skill]) => skill);
    const data = topSkills.map(([, demand]) => demand);

    // Create gradient colors based on demand level
    const backgroundColors = data.map(demand => {
        if (demand >= 70) return '#10B981'; // High demand - emerald
        if (demand >= 50) return '#F59E0B'; // Medium demand - amber
        if (demand >= 30) return '#EF4444'; // Lower demand - red
        return '#6B7280'; // Very low demand - gray
    });

    const hoverColors = data.map(demand => {
        if (demand >= 70) return '#059669'; // Darker emerald
        if (demand >= 50) return '#D97706'; // Darker amber
        if (demand >= 30) return '#DC2626'; // Darker red
        return '#4B5563'; // Darker gray
    });

    // Calculate job counts for each skill (approximate)
    const jobCounts = labels.map(skill => {
        if (typeof jobsData !== 'undefined') {
            return jobsData.filter(job => job.skills.includes(skill)).length;
        }
        return Math.round((data[labels.indexOf(skill)] / 100) * 150); // Fallback calculation
    });

    window.skillDemandChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                hoverBackgroundColor: hoverColors,
                borderRadius: {
                    topLeft: 8,
                    topRight: 8,
                    bottomLeft: 0,
                    bottomRight: 0
                },
                borderSkipped: false,
                borderWidth: 0,
                barThickness: 30,
                maxBarThickness: 35
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 15,
                    right: 30,
                    bottom: 15,
                    left: 15
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeOutCubic'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1E293B',
                    titleColor: '#F1F5F9',
                    bodyColor: '#E2E8F0',
                    borderColor: '#334155',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    titleFont: {
                        size: 14,
                        weight: '600'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const skill = context.label;
                            const demand = context.parsed.x;
                            const jobCount = jobCounts[context.dataIndex];

                            return [
                                `Demand: ${demand}% of listings`,
                                `Jobs available: ~${jobCount}`,
                                getDemandCategory(demand)
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: Math.max(...data) + 10,
                    grid: {
                        color: '#E2E8F0',
                        lineWidth: 1
                    },
                    border: {
                        color: '#CBD5E1',
                        width: 1
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        },
                        color: '#64748B',
                        font: {
                            size: 13,
                            family: "'IBM Plex Sans', sans-serif"
                        },
                        stepSize: 10
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    },
                    ticks: {
                        color: '#1E293B',
                        font: {
                            size: 14,
                            weight: '500',
                            family: "'IBM Plex Sans', sans-serif"
                        },
                        padding: 15
                    }
                }
            },
            onHover: (event, elements) => {
                event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const skill = labels[elements[0].index];
                    // Could navigate to jobs filtered by this skill
                    console.log(`Clicked on ${skill} - could filter jobs by this skill`);
                }
            }
        }
    });
}

// Helper function to categorize demand levels
function getDemandCategory(demand) {
    if (demand >= 70) return '🔥 High Demand';
    if (demand >= 50) return '📈 Medium Demand';
    if (demand >= 30) return '📊 Lower Demand';
    return '📉 Emerging Skill';
}

// Placeholder filter dropdowns function (needed for initialization)
function populateFilterDropdowns() {
    // This would be implemented if filter dropdowns existed on dashboard
    // Currently used by other sections
}