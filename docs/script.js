// SkillRadar JavaScript
// Version: 1.0 - All functionality for the application

// === GLOBAL STATE VARIABLES ===
let currentSection = 'dashboard';
let kanbanState = { applied: [], interview: [], offer: [] };
let alertKeywords = [];
let userProfile = null;
let currentFilter = { search: '', skill: '', location: '', level: '' };
let isSortedByMatch = false;
let isShowingSaved = false;
let trendCharts = {};
let toastQueue = [];

// Salary data for heatmap
const salaryData = {
  'Python': 35000,
  'React': 32000,
  'JavaScript': 30000,
  'Node.js': 28000,
  'AWS': 42000,
  'Machine Learning': 50000,
  'Docker': 38000,
  'Kubernetes': 44000,
  'MongoDB': 26000,
  'PostgreSQL': 27000,
  'Django': 29000,
  'Figma': 22000,
  'TensorFlow': 48000,
  'Firebase': 25000,
  'Redux': 28000
};

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  // Set footer year
  document.getElementById('footer-year').textContent = new Date().getFullYear();

  // Load state from localStorage
  loadStateFromStorage();

  // Initialize components
  setupEventListeners();
  setupNavigation();
  setupMobileDrawer();
  updateSidebarSkillCount();

  // Initialize dashboard
  navigateToSection('dashboard');

  // Setup onboarding
  setupOnboarding();

  // Initialize data-driven components
  populateFilterDropdowns();
  initializeMarketTicker();
  renderDashboardStats();
  renderTrendingSkills();
  renderRecentJobs();
  renderSkillDemandChart();

  // Initialize other sections
  initializeGapAnalyzer();
  initializeTracker();
  initializeAlerts();
}

function loadStateFromStorage() {
  // Load user profile
  const savedProfile = localStorage.getItem('srProfile');
  if (savedProfile) {
    try {
      userProfile = JSON.parse(savedProfile);
    } catch (e) {
      console.warn('Invalid profile data in localStorage');
      userProfile = null;
    }
  }

  // Load kanban state
  const savedKanban = localStorage.getItem('srKanban');
  if (savedKanban) {
    try {
      kanbanState = JSON.parse(savedKanban);
    } catch (e) {
      console.warn('Invalid kanban data in localStorage');
      initKanbanFromApplicationTracker();
    }
  } else {
    initKanbanFromApplicationTracker();
  }

  // Load alert keywords
  const savedKeywords = localStorage.getItem('srAlertKeywords');
  if (savedKeywords) {
    try {
      alertKeywords = JSON.parse(savedKeywords);
    } catch (e) {
      console.warn('Invalid alert keywords in localStorage');
      alertKeywords = [];
    }
  }

  // Load alert preferences and set toggles
  const savedPrefs = localStorage.getItem('srAlertPrefs');
  const defaultPrefs = { emailAlerts: true, skillAlerts: true, weeklyDigest: false, newJobs: true };
  const prefs = savedPrefs ? JSON.parse(savedPrefs) : defaultPrefs;

  document.querySelectorAll('.toggle-input').forEach(toggle => {
    const key = toggle.dataset.key;
    if (key && prefs.hasOwnProperty(key)) {
      toggle.checked = prefs[key];
    }
  });
}

function initKanbanFromApplicationTracker() {
  kanbanState = { applied: [], interview: [], offer: [] };
  applicationTracker.forEach(app => {
    const key = app.status.toLowerCase();
    if (kanbanState[key]) {
      kanbanState[key].push({ ...app });
    }
  });
}

// === NAVIGATION SYSTEM ===
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.section;
      if (sectionId) {
        navigateToSection(sectionId);
      }
    });
  });

  // View all buttons
  document.querySelectorAll('.view-all-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target) {
        navigateToSection(target);
      }
    });
  });
}

function navigateToSection(sectionId) {
  // Remove active from all sections
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('section--active');
  });

  // Add active to target section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('section--active');
  }

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('nav-item--active');
  });

  document.querySelectorAll(`[data-section="${sectionId}"]`).forEach(item => {
    item.classList.add('nav-item--active');
  });

  // Scroll to top
  const contentArea = document.querySelector('.page-content');
  if (contentArea) {
    contentArea.scrollTop = 0;
  }

  // Section-specific initialization
  if (sectionId === 'trends') {
    renderTrendCharts();
  } else if (sectionId === 'gap-analyzer') {
    prefillGapAnalyzer();
  } else if (sectionId === 'tracker') {
    renderKanbanView();
    renderPipelineSummary();
  } else if (sectionId === 'alerts') {
    renderAlerts();
  }

  currentSection = sectionId;

  // Close mobile drawer if open
  closeMobileDrawer();
}

// === MOBILE DRAWER ===
function setupMobileDrawer() {
  const menuBtn = document.querySelector('.topbar__menu-btn');
  const drawerOverlay = document.querySelector('.drawer-overlay');
  const drawerBackdrop = document.querySelector('.drawer-backdrop');
  const drawerClose = document.querySelector('.drawer__close');

  if (menuBtn) {
    menuBtn.addEventListener('click', openMobileDrawer);
  }

  if (drawerBackdrop) {
    drawerBackdrop.addEventListener('click', closeMobileDrawer);
  }

  if (drawerClose) {
    drawerClose.addEventListener('click', closeMobileDrawer);
  }

  // Escape key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawerOverlay && drawerOverlay.classList.contains('drawer--open')) {
      closeMobileDrawer();
    }
  });

  // Navigation from drawer
  document.querySelectorAll('.drawer__nav .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.section;
      if (sectionId) {
        closeMobileDrawer();
        setTimeout(() => navigateToSection(sectionId), 100);
      }
    });
  });
}

function openMobileDrawer() {
  const drawerOverlay = document.querySelector('.drawer-overlay');
  const menuBtn = document.querySelector('.topbar__menu-btn');

  if (drawerOverlay) {
    drawerOverlay.classList.add('drawer--open');
    document.body.style.overflow = 'hidden';
  }

  if (menuBtn) {
    menuBtn.setAttribute('aria-expanded', 'true');
  }
}

function closeMobileDrawer() {
  const drawerOverlay = document.querySelector('.drawer-overlay');
  const menuBtn = document.querySelector('.topbar__menu-btn');

  if (drawerOverlay) {
    drawerOverlay.classList.remove('drawer--open');
    document.body.style.overflow = '';
  }

  if (menuBtn) {
    menuBtn.setAttribute('aria-expanded', 'false');
  }
}

// === ONBOARDING SYSTEM ===
function setupOnboarding() {
  const strip = document.querySelector('.onboarding-strip');
  const saveBtn = document.querySelector('.save-btn');
  const dismissBtn = document.querySelector('.strip-dismiss');

  // Check if should show onboarding
  const hasProfile = localStorage.getItem('srProfile');
  const isDismissed = localStorage.getItem('srDismissed');

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

  localStorage.setItem('srProfile', JSON.stringify(profile));
  userProfile = profile;

  // Hide onboarding strip
  const strip = document.querySelector('.onboarding-strip');
  if (strip) {
    strip.style.display = 'none';
  }

  // Update UI
  updateSidebarSkillCount();
  recomputeAllMatchScores();

  showToast('Profile saved. Match scores are now active.', 'success');
}

function handleDismissOnboarding() {
  localStorage.setItem('srDismissed', 'true');
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

function updateSidebarSkillCount() {
  const countElement = document.querySelector('.sidebar__skill-count');
  if (!countElement) return;

  const count = userProfile ? userProfile.skills.length : 0;
  countElement.textContent = count > 0 ? `Skills saved: ${count}` : 'No skills saved yet';
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
  animateCounter(document.querySelector('[data-counter="0"]:nth-of-type(1)'), totalListings);
  animateCounter(document.querySelector('[data-counter="0"]:nth-of-type(2)'), uniqueSkills);
  animateCounter(document.querySelector('[data-counter="0"]:nth-of-type(3)'), remoteRoles);

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

function renderMatchRing(container, score, size) {
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
  scoreText.textContent = userProfile ? score : '—';

  const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  labelText.setAttribute('x', center);
  labelText.setAttribute('y', center + 12);
  labelText.setAttribute('font-size', '11');
  labelText.setAttribute('fill', '#94A3B8');
  labelText.textContent = userProfile ? 'Match' : 'Add skills';

  textGroup.appendChild(scoreText);
  textGroup.appendChild(labelText);

  svg.appendChild(bgCircle);
  svg.appendChild(fgCircle);
  svg.appendChild(textGroup);

  container.appendChild(svg);

  // Animate the arc
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion && userProfile) {
    const targetOffset = circumference * (1 - score / 100);
    fgCircle.setAttribute('stroke-dashoffset', circumference);

    setTimeout(() => {
      fgCircle.style.transition = 'stroke-dashoffset 800ms ease-out';
      fgCircle.setAttribute('stroke-dashoffset', targetOffset);
    }, 100);
  } else {
    const targetOffset = circumference * (1 - (userProfile ? score : 0) / 100);
    fgCircle.setAttribute('stroke-dashoffset', targetOffset);
  }
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

function renderSkillDemandChart() {
  const canvas = document.getElementById('skill-demand-chart');
  if (!canvas || !skillDemand) return;

  const ctx = canvas.getContext('2d');

  // Get top 8 skills
  const topSkills = Object.entries(skillDemand)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const labels = topSkills.map(([skill]) => skill);
  const data = topSkills.map(([, demand]) => demand);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: '#0284C7',
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ctx.parsed.x + '% of listings'
          }
        }
      },
      scales: {
        x: {
          max: 100,
          grid: {
            color: '#E2E8F0'
          },
          ticks: {
            callback: (v) => v + '%',
            color: '#94A3B8'
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            color: '#475569'
          }
        }
      }
    }
  });
}

// === JOBS SECTION ===
function setupEventListeners() {
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

  // Gap analyzer
  setupGapAnalyzer();

  // Trends tabs
  setupTrendsTabs();

  // Tracker view toggle
  setupTrackerToggle();

  // Alert preferences
  setupAlertPreferences();

  // Keyword alerts
  setupKeywordAlerts();
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
    const savedJobs = JSON.parse(localStorage.getItem('srSaved') || '[]');
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
  const savedJobs = JSON.parse(localStorage.getItem('srSaved') || '[]');
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

function calculateJobMatchScore(job) {
  if (!userProfile || !userProfile.skills) return 0;

  const userSkills = userProfile.skills.map(s => s.toLowerCase().trim());
  const jobSkills = job.skills.map(s => s.toLowerCase().trim());

  const matchedSkills = jobSkills.filter(js =>
    userSkills.some(us => us.includes(js) || js.includes(us))
  );

  return Math.round((matchedSkills.length / jobSkills.length) * 100);
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
  const savedJobs = JSON.parse(localStorage.getItem('srSaved') || '[]');
  const index = savedJobs.indexOf(jobId);

  if (index > -1) {
    savedJobs.splice(index, 1);
    showToast('Job removed from saved.', 'success');
  } else {
    savedJobs.push(jobId);
    showToast('Job saved.', 'success');
  }

  localStorage.setItem('srSaved', JSON.stringify(savedJobs));

  // Update bookmark icons
  updateBookmarkIcons();
  updateSavedCount();

  // Re-render if showing saved jobs
  if (isShowingSaved) {
    renderJobsGrid();
  }
}

function updateBookmarkIcons() {
  const savedJobs = JSON.parse(localStorage.getItem('srSaved') || '[]');

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
  const savedJobs = JSON.parse(localStorage.getItem('srSaved') || '[]');
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

function recomputeAllMatchScores() {
  renderDashboardMatchRing();
  updateSortByMatchVisibility();
  renderJobsGrid();
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

  // Setup close handlers
  const backdrop = overlay.querySelector('.panel-backdrop');
  const closeBtn = overlay.querySelector('.panel-close');

  const closePanel = () => {
    overlay.classList.remove('company-panel-overlay--open');
    document.body.style.overflow = '';
  };

  backdrop?.addEventListener('click', closePanel);
  closeBtn?.addEventListener('click', closePanel);

  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      closePanel();
      document.removeEventListener('keydown', escapeHandler);
    }
  };

  document.addEventListener('keydown', escapeHandler);
}

// === GAP ANALYZER ===
function setupGapAnalyzer() {
  // Tab switching
  const enterTab = document.querySelector('.tab-enter-skills');
  const resumeTab = document.querySelector('.tab-paste-resume');

  if (enterTab) {
    enterTab.addEventListener('click', () => switchAnalyzerTab('enter'));
  }
  if (resumeTab) {
    resumeTab.addEventListener('click', () => switchAnalyzerTab('resume'));
  }

  // Tag input
  setupTagInput();

  // Analyze button
  const analyzeBtn = document.querySelector('.analyze-btn');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', handleAnalyzeSkills);
  }

  // Scan resume button
  const scanBtn = document.querySelector('.scan-btn');
  if (scanBtn) {
    scanBtn.addEventListener('click', handleScanResume);
  }
}

function initializeGapAnalyzer() {
  // Restore active tab
  const savedTab = localStorage.getItem('srAnalyzerTab') || 'enter';
  switchAnalyzerTab(savedTab);
}

function switchAnalyzerTab(tabName) {
  const enterTab = document.querySelector('.tab-enter-skills');
  const resumeTab = document.querySelector('.tab-paste-resume');
  const enterPanel = document.getElementById('tab-panel-enter');
  const resumePanel = document.getElementById('tab-panel-resume');

  // Update tab states
  if (enterTab && resumeTab) {
    enterTab.setAttribute('aria-selected', tabName === 'enter');
    resumeTab.setAttribute('aria-selected', tabName === 'resume');
  }

  // Update panel visibility
  if (enterPanel && resumePanel) {
    enterPanel.classList.toggle('tab-panel--active', tabName === 'enter');
    resumePanel.classList.toggle('tab-panel--active', tabName === 'resume');
  }

  // Save tab preference
  localStorage.setItem('srAnalyzerTab', tabName);
}

function prefillGapAnalyzer() {
  if (userProfile && userProfile.skills) {
    const tagsList = document.querySelector('.tags-list');
    if (tagsList) {
      tagsList.innerHTML = '';
      userProfile.skills.forEach(skill => addSkillTag(skill));
    }
  }

  if (userProfile && userProfile.branch) {
    const branchSelect = document.querySelector('.analyzer-layout .branch-select');
    if (branchSelect) {
      branchSelect.value = userProfile.branch;
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

  localStorage.setItem('srProfile', JSON.stringify(newProfile));
  userProfile = newProfile;

  // Run analysis
  const results = computeGapAnalysis(skills);
  renderAnalysisResults(results);

  // Update global UI
  updateSidebarSkillCount();
  recomputeAllMatchScores();

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
  if (!skillDemand) {
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
        openCompanyPanel(job.company);
      }
    });

    container.appendChild(card);
  });
}

// === TRENDS SECTION ===
function setupTrendsTabs() {
  const skillTrendsTab = document.querySelector('.tab-skill-trends');
  const salaryHeatmapTab = document.querySelector('.tab-salary-heatmap');

  if (skillTrendsTab) {
    skillTrendsTab.addEventListener('click', () => switchTrendsTab('trends'));
  }
  if (salaryHeatmapTab) {
    salaryHeatmapTab.addEventListener('click', () => switchTrendsTab('heatmap'));
  }
}

function switchTrendsTab(tabName) {
  const skillTrendsTab = document.querySelector('.tab-skill-trends');
  const salaryHeatmapTab = document.querySelector('.tab-salary-heatmap');
  const trendsPanel = document.getElementById('trends-panel');
  const heatmapPanel = document.getElementById('heatmap-panel');

  // Update tab states
  if (skillTrendsTab && salaryHeatmapTab) {
    skillTrendsTab.setAttribute('aria-selected', tabName === 'trends');
    salaryHeatmapTab.setAttribute('aria-selected', tabName === 'heatmap');
  }

  // Update panel visibility
  if (trendsPanel && heatmapPanel) {
    trendsPanel.style.display = tabName === 'trends' ? 'block' : 'none';
    heatmapPanel.style.display = tabName === 'heatmap' ? 'block' : 'none';
  }

  // Render heatmap if switching to it
  if (tabName === 'heatmap') {
    renderSalaryHeatmap();
  }
}

function renderTrendCharts() {
  if (!trendData) return;

  const container = document.getElementById('trends-grid');
  if (!container) return;

  container.innerHTML = '';

  // Get main skills from trendData
  const skills = Object.keys(trendData);

  skills.forEach(skill => {
    const data = trendData[skill];
    const first = data[0];
    const last = data[data.length - 1];
    const pctChange = Math.round(((last - first) / first) * 100);
    const maxValue = Math.max(...data);

    let badgeVariant = 'amber'; // neutral
    let badgeText = `${pctChange >= 0 ? '+' : ''}${pctChange}%`;

    if (pctChange > 5) badgeVariant = 'emerald';
    else if (pctChange < -5) badgeVariant = 'coral';

    const card = document.createElement('div');
    card.className = 'trend-card card';

    const canvasId = `trend-${skill.toLowerCase().replace(/\s+/g, '-')}`;

    card.innerHTML = `
      <div class="card-header">
        <h3 class="skill-name">${skill}</h3>
        <span class="badge badge--${badgeVariant}">${badgeText}</span>
      </div>
      <div class="chart-container">
        <canvas id="${canvasId}" width="280" height="80"></canvas>
      </div>
      <div class="chart-footer">
        <span class="period-label">Last 7 weeks</span>
        <span class="peak-label">Peak: ${maxValue}%</span>
      </div>
    `;

    container.appendChild(card);

    // Don't re-render if chart already exists
    if (trendCharts[canvasId]) return;

    // Render chart
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      const ctx = canvas.getContext('2d');

      let lineColor = '#0284C7'; // brand
      let fillColor = '#0284C720';

      if (pctChange > 5) {
        lineColor = '#059669'; // emerald
        fillColor = '#05966920';
      } else if (pctChange < -5) {
        lineColor = '#DC2626'; // coral
        fillColor = '#DC262620';
      } else {
        lineColor = '#B45309'; // amber
        fillColor = '#B4530920';
      }

      const labels = getLast7Months();

      trendCharts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            borderColor: lineColor,
            backgroundColor: fillColor,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          },
          scales: {
            x: { display: false },
            y: { display: false }
          }
        }
      });
    }
  });
}

function getLast7Months() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 6 + i, 1);
    return months[d.getMonth()];
  });
}

function renderSalaryHeatmap() {
  const container = document.getElementById('heatmap-grid');
  if (!container) return;

  container.innerHTML = '';

  const salaries = Object.values(salaryData);
  const maxSalary = Math.max(...salaries);
  const minSalary = Math.min(...salaries);

  Object.entries(salaryData).forEach(([skill, salary]) => {
    const ratio = (salary - minSalary) / (maxSalary - minSalary);
    const bgAlpha = 0.1 + ratio * 0.85;
    const textColor = ratio > 0.5 ? '#FFFFFF' : '#0369A1';

    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    cell.style.background = `rgba(2, 132, 199, ${bgAlpha})`;
    cell.style.color = textColor;

    cell.innerHTML = `
      <p class="cell-skill">${skill}</p>
      <p class="cell-salary">₹${salary.toLocaleString('en-IN')}/mo avg</p>
    `;

    container.appendChild(cell);
  });
}

// === TRACKER SECTION ===
function setupTrackerToggle() {
  const kanbanBtn = document.querySelector('.kanban-btn');
  const timelineBtn = document.querySelector('.timeline-btn');

  if (kanbanBtn) {
    kanbanBtn.addEventListener('click', () => switchTrackerView('kanban'));
  }
  if (timelineBtn) {
    timelineBtn.addEventListener('click', () => switchTrackerView('timeline'));
  }
}

function initializeTracker() {
  const savedView = localStorage.getItem('srTrackerView') || 'kanban';
  switchTrackerView(savedView);
}

function switchTrackerView(view) {
  const kanbanBtn = document.querySelector('.kanban-btn');
  const timelineBtn = document.querySelector('.timeline-btn');
  const kanbanView = document.getElementById('kanban-view');
  const timelineView = document.getElementById('timeline-view');

  // Update buttons
  if (kanbanBtn && timelineBtn) {
    kanbanBtn.setAttribute('aria-checked', view === 'kanban');
    timelineBtn.setAttribute('aria-checked', view === 'timeline');
  }

  // Update views
  if (kanbanView && timelineView) {
    kanbanView.style.display = view === 'kanban' ? 'block' : 'none';
    timelineView.classList.toggle('timeline-view--active', view === 'timeline');
  }

  // Render appropriate view
  if (view === 'kanban') {
    renderKanbanView();
  } else {
    renderTimelineView();
  }

  localStorage.setItem('srTrackerView', view);
}

function renderKanbanView() {
  renderPipelineSummary();

  const columns = document.querySelectorAll('.kanban-column');
  columns.forEach(column => {
    const status = column.dataset.status;
    const cardsContainer = column.querySelector('.kanban-cards');
    const countBadge = column.querySelector('.column-count');

    if (!cardsContainer || !kanbanState[status]) return;

    // Update count
    if (countBadge) {
      countBadge.textContent = kanbanState[status].length;
    }

    // Render cards
    cardsContainer.innerHTML = '';
    kanbanState[status].forEach(item => {
      const card = createKanbanCard(item, status);
      cardsContainer.appendChild(card);
    });

    // Setup add form
    setupAddForm(column, status);
  });
}

function createKanbanCard(item, status) {
  const card = document.createElement('div');
  card.className = 'kanban-card';
  card.tabIndex = 0;
  card.setAttribute('role', 'article');
  card.setAttribute('aria-label', `${item.role} at ${item.company}`);
  card.dataset.itemId = item.id;
  card.dataset.status = status;

  const formattedDate = new Date(item.date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  card.innerHTML = `
    <p class="card-role">${item.role}</p>
    <p class="card-company">${item.company}</p>
    <p class="card-date">Applied: ${formattedDate}</p>
    ${item.salary ? `<p class="card-salary">${item.salary}</p>` : ''}
  `;

  // Context menu handler
  card.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e, item, status);
  });

  // Long press for mobile
  let longPressTimer;
  card.addEventListener('touchstart', (e) => {
    longPressTimer = setTimeout(() => {
      showContextMenu(e.touches[0], item, status);
    }, 500);
  });

  card.addEventListener('touchend', () => {
    clearTimeout(longPressTimer);
  });

  return card;
}

function setupAddForm(column, status) {
  const addBtn = column.querySelector('.add-btn');
  const addForm = column.querySelector('.add-form');
  const saveBtn = column.querySelector('.save-card-btn');
  const cancelBtn = column.querySelector('.cancel-card-btn');

  if (!addBtn || !addForm) return;

  addBtn.addEventListener('click', () => {
    const isExpanded = addForm.classList.contains('add-form--expanded');

    if (isExpanded) {
      // Cancel
      addForm.classList.remove('add-form--expanded');
      addBtn.textContent = '+ Add';
      clearAddForm(addForm);
    } else {
      // Expand
      addForm.classList.add('add-form--expanded');
      addBtn.textContent = 'Cancel';
      addForm.querySelector('.role-input')?.focus();
    }
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      handleSaveKanbanCard(addForm, status);
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      addForm.classList.remove('add-form--expanded');
      addBtn.textContent = '+ Add';
      clearAddForm(addForm);
    });
  }
}

function handleSaveKanbanCard(form, status) {
  const roleInput = form.querySelector('.role-input');
  const companyInput = form.querySelector('.company-input');
  const dateInput = form.querySelector('.date-input');
  const salaryInput = form.querySelector('.salary-input');

  // Clear previous errors
  [roleInput, companyInput, dateInput].forEach(input => {
    if (input) input.style.borderColor = '';
  });

  // Validate
  if (!roleInput?.value.trim()) {
    showInputError(roleInput, 'Role title is required');
    return;
  }

  if (!companyInput?.value.trim()) {
    showInputError(companyInput, 'Company name is required');
    return;
  }

  if (!dateInput?.value) {
    showInputError(dateInput, 'Date is required');
    return;
  }

  // Create new entry
  const entry = {
    id: Date.now(),
    role: roleInput.value.trim(),
    company: companyInput.value.trim(),
    status: status,
    date: dateInput.value,
    salary: salaryInput?.value.trim() || ''
  };

  // Add to state
  kanbanState[status].push(entry);
  localStorage.setItem('srKanban', JSON.stringify(kanbanState));

  // Update UI
  renderKanbanView();

  // Close form
  const addForm = form.closest('.add-form');
  const addBtn = form.closest('.kanban-column').querySelector('.add-btn');
  if (addForm && addBtn) {
    addForm.classList.remove('add-form--expanded');
    addBtn.textContent = '+ Add';
  }

  clearAddForm(form);
  showToast('Application saved.', 'success');
}

function showInputError(input, message) {
  input.style.borderColor = 'var(--coral)';
  input.focus();
  showToast(message, 'error');
}

function clearAddForm(form) {
  const inputs = form.querySelectorAll('input');
  inputs.forEach(input => {
    input.value = '';
    input.style.borderColor = '';
  });
}

function renderPipelineSummary() {
  const container = document.getElementById('pipeline-bar');
  if (!container) return;

  const appliedCount = kanbanState.applied?.length || 0;
  const interviewCount = kanbanState.interview?.length || 0;
  const offerCount = kanbanState.offer?.length || 0;

  const interviewRate = appliedCount > 0 ? Math.round((interviewCount / appliedCount) * 100) : 0;
  const offerRate = interviewCount > 0 ? Math.round((offerCount / interviewCount) * 100) : 0;

  container.innerHTML = `
    <div class="pipeline-stage">
      <span class="stage-label">Applied</span>
      <span class="stage-count">${appliedCount}</span>
    </div>
    <div class="pipeline-arrow">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9,18 15,12 9,6"/>
      </svg>
    </div>
    <div class="conversion-rate" style="font-size: 11px; color: var(--text-secondary);">
      Interview rate: ${interviewRate}%
    </div>
    <div class="pipeline-stage">
      <span class="stage-label">Interview</span>
      <span class="stage-count">${interviewCount}</span>
    </div>
    <div class="pipeline-arrow">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9,18 15,12 9,6"/>
      </svg>
    </div>
    <div class="conversion-rate" style="font-size: 11px; color: var(--text-secondary);">
      Offer rate: ${offerRate}%
    </div>
    <div class="pipeline-stage">
      <span class="stage-label">Offer</span>
      <span class="stage-count">${offerCount}</span>
    </div>
  `;
}

function renderTimelineView() {
  const container = document.querySelector('.timeline-svg');
  if (!container) return;

  // Get all entries sorted by date
  const allEntries = [
    ...kanbanState.applied.map(e => ({ ...e, status: 'Applied' })),
    ...kanbanState.interview.map(e => ({ ...e, status: 'Interview' })),
    ...kanbanState.offer.map(e => ({ ...e, status: 'Offer' }))
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  if (allEntries.length === 0) {
    container.innerHTML = `
      <text x="50%" y="50%" text-anchor="middle" font-size="14" fill="#94A3B8">
        No applications tracked yet. Add applications using the Kanban view.
      </text>
    `;
    return;
  }

  const svgWidth = Math.max(600, allEntries.length * 120 + 80);
  const svgHeight = 220;
  const axisY = 140;

  container.setAttribute('width', svgWidth);
  container.setAttribute('height', svgHeight);
  container.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

  // Clear existing content
  container.innerHTML = '';

  // Draw axis line
  const axisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  axisLine.setAttribute('x1', '60');
  axisLine.setAttribute('y1', axisY);
  axisLine.setAttribute('x2', svgWidth - 60);
  axisLine.setAttribute('y2', axisY);
  axisLine.setAttribute('stroke', '#CBD5E1');
  axisLine.setAttribute('stroke-width', '2');
  container.appendChild(axisLine);

  // Plot entries
  allEntries.forEach((entry, index) => {
    const x = 60 + (index / Math.max(allEntries.length - 1, 1)) * (svgWidth - 120);

    // Status colors
    let color = '#0284C7'; // Applied = brand
    if (entry.status === 'Interview') color = '#B45309'; // amber
    if (entry.status === 'Offer') color = '#059669'; // emerald

    // Draw dot
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', x);
    dot.setAttribute('cy', axisY);
    dot.setAttribute('r', '6');
    dot.setAttribute('fill', color);
    container.appendChild(dot);

    // Draw label card (alternating above/below)
    const labelY = index % 2 === 0 ? axisY - 60 : axisY + 40;

    const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const labelRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    labelRect.setAttribute('x', x - 50);
    labelRect.setAttribute('y', labelY);
    labelRect.setAttribute('width', '100');
    labelRect.setAttribute('height', '32');
    labelRect.setAttribute('fill', '#FFFFFF');
    labelRect.setAttribute('stroke', '#E2E8F0');
    labelRect.setAttribute('rx', '4');
    labelGroup.appendChild(labelRect);

    const roleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    roleText.setAttribute('x', x);
    roleText.setAttribute('y', labelY + 14);
    roleText.setAttribute('text-anchor', 'middle');
    roleText.setAttribute('font-size', '11');
    roleText.setAttribute('font-weight', '600');
    roleText.setAttribute('fill', '#0F172A');
    roleText.textContent = entry.role.length > 12 ? entry.role.substring(0, 12) + '...' : entry.role;
    labelGroup.appendChild(roleText);

    const companyText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    companyText.setAttribute('x', x);
    companyText.setAttribute('y', labelY + 26);
    companyText.setAttribute('text-anchor', 'middle');
    companyText.setAttribute('font-size', '9');
    companyText.setAttribute('fill', '#94A3B8');
    companyText.textContent = entry.company.length > 15 ? entry.company.substring(0, 15) + '...' : entry.company;
    labelGroup.appendChild(companyText);

    container.appendChild(labelGroup);

    // Date label below axis
    const dateText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    dateText.setAttribute('x', x);
    dateText.setAttribute('y', axisY + 20);
    dateText.setAttribute('text-anchor', 'middle');
    dateText.setAttribute('font-size', '9');
    dateText.setAttribute('fill', '#94A3B8');
    const dateFormatted = new Date(entry.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short'
    });
    dateText.textContent = dateFormatted;
    container.appendChild(dateText);
  });
}

function showContextMenu(event, item, status) {
  const menu = document.getElementById('context-menu');
  if (!menu) return;

  // Get coordinates
  let x = event.clientX || event.pageX || 0;
  let y = event.clientY || event.pageY || 0;

  // Clear existing handlers
  menu.replaceWith(menu.cloneNode(true));
  const newMenu = document.getElementById('context-menu');

  // Update menu options visibility
  const moveToApplied = newMenu.querySelector('.move-to-applied');
  const moveToInterview = newMenu.querySelector('.move-to-interview');
  const moveToOffer = newMenu.querySelector('.move-to-offer');
  const deleteItem = newMenu.querySelector('.delete-item');

  if (moveToApplied) moveToApplied.style.display = status === 'applied' ? 'none' : 'block';
  if (moveToInterview) moveToInterview.style.display = status === 'interview' ? 'none' : 'block';
  if (moveToOffer) moveToOffer.style.display = status === 'offer' ? 'none' : 'block';

  // Add event listeners
  if (moveToApplied) {
    moveToApplied.addEventListener('click', () => moveKanbanCard(item, 'applied'));
  }
  if (moveToInterview) {
    moveToInterview.addEventListener('click', () => moveKanbanCard(item, 'interview'));
  }
  if (moveToOffer) {
    moveToOffer.addEventListener('click', () => moveKanbanCard(item, 'offer'));
  }
  if (deleteItem) {
    deleteItem.addEventListener('click', () => deleteKanbanCard(item, status));
  }

  // Position and show menu
  newMenu.style.left = x + 'px';
  newMenu.style.top = y + 'px';
  newMenu.classList.add('context-menu--visible');

  // Handle clicks outside menu
  const closeHandler = (e) => {
    if (!newMenu.contains(e.target)) {
      newMenu.classList.remove('context-menu--visible');
      document.removeEventListener('click', closeHandler);
    }
  };

  // Handle escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      newMenu.classList.remove('context-menu--visible');
      document.removeEventListener('keydown', escapeHandler);
    }
  };

  setTimeout(() => {
    document.addEventListener('click', closeHandler);
    document.addEventListener('keydown', escapeHandler);
  }, 0);
}

function moveKanbanCard(item, targetStatus) {
  // Remove from current status
  Object.keys(kanbanState).forEach(status => {
    kanbanState[status] = kanbanState[status].filter(entry => entry.id !== item.id);
  });

  // Add to target status with updated status
  const updatedItem = { ...item, status: targetStatus };
  kanbanState[targetStatus].push(updatedItem);

  // Save and render
  localStorage.setItem('srKanban', JSON.stringify(kanbanState));
  renderKanbanView();

  // Hide menu
  const menu = document.getElementById('context-menu');
  if (menu) {
    menu.classList.remove('context-menu--visible');
  }

  const statusNames = { applied: 'Applied', interview: 'Interview', offer: 'Offer' };
  showToast(`Application moved to ${statusNames[targetStatus]}.`, 'success');
}

function deleteKanbanCard(item, status) {
  // Remove from state
  kanbanState[status] = kanbanState[status].filter(entry => entry.id !== item.id);

  // Save and render
  localStorage.setItem('srKanban', JSON.stringify(kanbanState));
  renderKanbanView();

  // Hide menu
  const menu = document.getElementById('context-menu');
  if (menu) {
    menu.classList.remove('context-menu--visible');
  }

  showToast('Application deleted.', 'success');
}

// === ALERTS SECTION ===
function setupAlertPreferences() {
  document.querySelectorAll('.toggle-input').forEach(toggle => {
    toggle.addEventListener('change', () => {
      const key = toggle.dataset.key;
      if (!key) return;

      // Get current preferences
      const currentPrefs = JSON.parse(localStorage.getItem('srAlertPrefs') || '{}');
      currentPrefs[key] = toggle.checked;
      localStorage.setItem('srAlertPrefs', JSON.stringify(currentPrefs));
    });
  });
}

function setupKeywordAlerts() {
  const input = document.querySelector('.keyword-input');
  const addBtn = document.querySelector('.add-keyword-btn');

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addKeywordAlert();
      }
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', addKeywordAlert);
  }

  // Mark all read button
  const markReadBtn = document.querySelector('.mark-read-btn');
  if (markReadBtn) {
    markReadBtn.addEventListener('click', markAllAlertsRead);
  }
}

function initializeAlerts() {
  renderKeywordChips();
  renderAlerts();
}

function addKeywordAlert() {
  const input = document.querySelector('.keyword-input');
  if (!input) return;

  const keyword = input.value.trim();
  if (!keyword) return;

  // Normalize to title case
  const normalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase();

  // Check if already exists
  if (alertKeywords.includes(normalizedKeyword)) {
    showToast('This keyword already exists.', 'error');
    return;
  }

  // Add to keywords
  alertKeywords.push(normalizedKeyword);
  localStorage.setItem('srAlertKeywords', JSON.stringify(alertKeywords));

  // Clear input
  input.value = '';

  // Re-render
  renderKeywordChips();
  renderAlerts();

  showToast('Keyword alert added.', 'success');
}

function removeKeywordAlert(keyword) {
  const index = alertKeywords.indexOf(keyword);
  if (index > -1) {
    alertKeywords.splice(index, 1);
    localStorage.setItem('srAlertKeywords', JSON.stringify(alertKeywords));

    renderKeywordChips();
    renderAlerts();

    showToast('Keyword removed.', 'success');
  }
}

function renderKeywordChips() {
  const container = document.getElementById('keywords-list');
  const emptyState = document.getElementById('keyword-empty-state');

  if (!container) return;

  container.innerHTML = '';

  if (alertKeywords.length === 0) {
    if (emptyState) {
      emptyState.style.display = 'block';
    }
    return;
  }

  if (emptyState) {
    emptyState.style.display = 'none';
  }

  alertKeywords.forEach(keyword => {
    const chip = document.createElement('div');
    chip.className = 'keyword-chip';

    chip.innerHTML = `
      <span class="chip-label">${keyword}</span>
      <button class="chip-remove btn-icon" aria-label="Remove keyword ${keyword}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m18 6-12 12"/>
          <path d="m6 6 12 12"/>
        </svg>
      </button>
    `;

    const removeBtn = chip.querySelector('.chip-remove');
    removeBtn.addEventListener('click', () => removeKeywordAlert(keyword));

    container.appendChild(chip);
  });
}

function renderAlerts() {
  const container = document.getElementById('alerts-container');
  const emptyState = document.getElementById('alerts-empty');

  if (!container) return;

  const alerts = generateAlerts();

  container.innerHTML = '';

  if (alerts.length === 0) {
    if (emptyState) {
      emptyState.style.display = 'block';
    }
    return;
  }

  if (emptyState) {
    emptyState.style.display = 'none';
  }

  alerts.forEach(alert => {
    const alertEl = document.createElement('div');
    alertEl.className = `alert-item alert-item--${alert.priority}`;

    const iconSvg = getAlertIcon(alert.type);

    alertEl.innerHTML = `
      ${iconSvg}
      <div class="alert-content">
        <p class="alert-title">${alert.title}</p>
        <p class="alert-description">${alert.description}</p>
        <p class="alert-time">${alert.time}</p>
      </div>
      <span class="alert-read-dot"></span>
    `;

    container.appendChild(alertEl);
  });
}

function generateAlerts() {
  const generated = [];

  // Generate keyword-based alerts
  alertKeywords.forEach(keyword => {
    const matchingJobs = jobsData.filter(job =>
      job.role.toLowerCase().includes(keyword.toLowerCase()) ||
      job.skills.some(s => s.toLowerCase().includes(keyword.toLowerCase()))
    );

    matchingJobs.forEach(job => {
      generated.push({
        id: `kw-${keyword}-${job.id}`,
        title: `New job matching "${keyword}"`,
        description: `${job.role} at ${job.company} — ${job.location}`,
        time: computeRelativeTime(job.postedDate),
        type: 'job',
        priority: 'high'
      });
    });
  });

  // Include static alerts from data.js
  const staticAlerts = recentAlerts.map(alert => ({
    ...alert,
    time: computeRelativeTime(alert.time || new Date().toISOString())
  }));

  return [...generated, ...staticAlerts];
}

function computeRelativeTime(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffDays === 0) {
    if (diffHours === 0) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  }
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

function getAlertIcon(type) {
  switch (type) {
    case 'job':
      return `<svg class="alert-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>`;
    case 'trend':
      return `<svg class="alert-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="m22 7-8.5 8.5-5-5L1 18"/>
        <path d="m16 7 6 0 0 6"/>
      </svg>`;
    case 'reminder':
      return `<svg class="alert-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
        <path d="m13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>`;
    case 'skill':
      return `<svg class="alert-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
      </svg>`;
    default:
      return `<svg class="alert-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
        <path d="m13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>`;
  }
}

function markAllAlertsRead() {
  const readDots = document.querySelectorAll('.alert-read-dot');
  readDots.forEach(dot => {
    dot.style.display = 'none';
  });

  const markReadBtn = document.querySelector('.mark-read-btn');
  if (markReadBtn) {
    markReadBtn.style.color = 'var(--text-muted)';
    markReadBtn.style.pointerEvents = 'none';
  }
}

// === TOAST NOTIFICATIONS ===
function showToast(message, type = 'success') {
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
    toast.classList.add('toast--visible');
  });

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('toast--visible');
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

// === UTILITY FUNCTIONS ===
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize saved count on load
document.addEventListener('DOMContentLoaded', () => {
  updateSavedCount();
  updateSortByMatchVisibility();
});