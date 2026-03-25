// Alerts Module for SkillRadar

document.addEventListener('DOMContentLoaded', function() {
    initAlerts();
});

function initAlerts() {
    populateFilters();
    loadMyAlerts();
    renderNotifications();
    setupEventListeners();
}

// Populate skill and location dropdowns from jobsData
function populateFilters() {
    const skillSelect = document.getElementById('alert-skill');
    const locationSelect = document.getElementById('alert-location');

    if (!skillSelect || !locationSelect || typeof jobsData === 'undefined') return;

    // Get unique skills
    const skills = new Set();
    jobsData.forEach(job => {
        job.skills.forEach(skill => skills.add(skill));
    });

    Array.from(skills).sort().forEach(skill => {
        const option = document.createElement('option');
        option.value = skill;
        option.textContent = skill;
        skillSelect.appendChild(option);
    });

    // Get unique locations
    const locations = new Set();
    jobsData.forEach(job => locations.add(job.location));

    Array.from(locations).sort().forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationSelect.appendChild(option);
    });
}

// Load saved alerts from localStorage
function loadMyAlerts() {
    const alerts = getSavedAlerts();
    renderMyAlerts(alerts);
}

function getSavedAlerts() {
    const saved = localStorage.getItem('skillradar_alerts');
    return saved ? JSON.parse(saved) : [];
}

function saveAlerts(alerts) {
    localStorage.setItem('skillradar_alerts', JSON.stringify(alerts));
}

// Render user's saved alerts
function renderMyAlerts(alerts) {
    const container = document.getElementById('my-alerts-list');
    const countBadge = document.getElementById('alerts-count');
    const emptyState = document.getElementById('no-alerts-state');

    if (!container) return;

    countBadge.textContent = alerts.length;

    if (alerts.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    container.innerHTML = alerts.map(alert => createAlertCard(alert)).join('');
}

function createAlertCard(alert) {
    const matchingJobs = countMatchingJobs(alert);

    return `
        <div class="alert-card" data-id="${alert.id}" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--surface-card); border: 1px solid var(--border-default); border-radius: 12px; margin-bottom: 12px;">
            <div class="alert-info" style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                        <path d="m13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    <span style="font-weight: 500; color: var(--text-primary);">${alert.name}</span>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; font-size: 13px; color: var(--text-muted);">
                    ${alert.skill ? `<span class="tag" style="background: var(--surface-elevated); padding: 2px 8px; border-radius: 4px;">${alert.skill}</span>` : ''}
                    ${alert.location ? `<span class="tag" style="background: var(--surface-elevated); padding: 2px 8px; border-radius: 4px;">${alert.location}</span>` : ''}
                    ${alert.level ? `<span class="tag" style="background: var(--surface-elevated); padding: 2px 8px; border-radius: 4px;">${alert.level}</span>` : ''}
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
                <span style="font-size: 13px; color: var(--text-muted);">${matchingJobs} matching job${matchingJobs !== 1 ? 's' : ''}</span>
                <button class="delete-alert-btn btn-icon" data-id="${alert.id}" aria-label="Delete alert" style="color: var(--text-muted); padding: 8px; border-radius: 6px; cursor: pointer; border: none; background: transparent;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

// Count jobs matching an alert's criteria
function countMatchingJobs(alert) {
    if (typeof jobsData === 'undefined') return 0;

    return jobsData.filter(job => {
        if (alert.skill && !job.skills.includes(alert.skill)) return false;
        if (alert.location && job.location !== alert.location) return false;
        if (alert.level && job.level !== alert.level) return false;
        return true;
    }).length;
}

// Render recent notifications from recentAlerts data
function renderNotifications() {
    const container = document.getElementById('notifications-list');
    if (!container || typeof recentAlerts === 'undefined') return;

    container.innerHTML = recentAlerts.map(notification => createNotificationCard(notification)).join('');
}

function createNotificationCard(notification) {
    const priorityColors = {
        high: '#EF4444',
        medium: '#F59E0B',
        normal: '#10B981'
    };

    const typeIcons = {
        trend: '<path d="m22 7-8.5 8.5-5-5L1 18"/><path d="m16 7 6 0 0 6"/>',
        reminder: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
        skill: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>'
    };

    const color = priorityColors[notification.priority] || priorityColors.normal;
    const icon = typeIcons[notification.type] || typeIcons.reminder;

    return `
        <div class="notification-card" style="display: flex; gap: 14px; padding: 16px; background: var(--surface-card); border: 1px solid var(--border-default); border-radius: 12px; margin-bottom: 12px; border-left: 3px solid ${color};">
            <div class="notification-icon" style="flex-shrink: 0; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--surface-elevated); border-radius: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5">
                    ${icon}
                </svg>
            </div>
            <div class="notification-content" style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                    <span style="font-weight: 500; color: var(--text-primary);">${notification.title}</span>
                    <span style="font-size: 12px; color: var(--text-muted);">${notification.time}</span>
                </div>
                <p style="font-size: 13px; color: var(--text-muted); margin: 0;">${notification.description}</p>
            </div>
        </div>
    `;
}

// Event listeners
function setupEventListeners() {
    const createBtn = document.getElementById('create-alert-btn');
    if (createBtn) {
        createBtn.addEventListener('click', createNewAlert);
    }

    // Delegate delete button clicks
    const alertsList = document.getElementById('my-alerts-list');
    if (alertsList) {
        alertsList.addEventListener('click', function(e) {
            const deleteBtn = e.target.closest('.delete-alert-btn');
            if (deleteBtn) {
                const alertId = deleteBtn.getAttribute('data-id');
                deleteAlert(alertId);
            }
        });
    }
}

function createNewAlert() {
    const nameInput = document.getElementById('alert-name');
    const skillSelect = document.getElementById('alert-skill');
    const locationSelect = document.getElementById('alert-location');
    const levelSelect = document.getElementById('alert-level');

    const name = nameInput.value.trim();
    const skill = skillSelect.value;
    const location = locationSelect.value;
    const level = levelSelect.value;

    if (!name) {
        nameInput.focus();
        nameInput.style.borderColor = '#EF4444';
        setTimeout(() => nameInput.style.borderColor = '', 2000);
        return;
    }

    if (!skill && !location && !level) {
        alert('Please select at least one filter (skill, location, or level)');
        return;
    }

    const alerts = getSavedAlerts();
    const newAlert = {
        id: 'alert-' + Date.now(),
        name,
        skill,
        location,
        level,
        createdAt: new Date().toISOString()
    };

    alerts.push(newAlert);
    saveAlerts(alerts);
    renderMyAlerts(alerts);

    // Reset form
    nameInput.value = '';
    skillSelect.value = '';
    locationSelect.value = '';
    levelSelect.value = '';
}

function deleteAlert(alertId) {
    const alerts = getSavedAlerts().filter(a => a.id !== alertId);
    saveAlerts(alerts);
    renderMyAlerts(alerts);
}
