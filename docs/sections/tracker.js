// Tracker JavaScript using shared utilities
import {
    getStorageItem,
    setStorageItem,
    showToast,
    createDebouncer,
    setupCleanEventListener,
    updateTabStates,
    updatePanelVisibility,
    getCachedElement,
    STORAGE_KEYS,
    CSS_CLASSES,
    TAB_IDS
} from '../utils/shared.js';

// Tracker-specific state
let kanbanState = { applied: [], interview: [], offer: [] };
let currentView = 'kanban';
const viewSwitchDebouncer = createDebouncer(100);

// Initialize tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTracker();
});

function initializeTracker() {
    loadKanbanState();
    setupEventListeners();
    currentView = getStorageItem(STORAGE_KEYS.TRACKER_VIEW, TAB_IDS.KANBAN);
    switchTrackerView(currentView);
}

function loadKanbanState() {
    const saved = getStorageItem(STORAGE_KEYS.KANBAN);
    if (saved) {
        kanbanState = saved;
    } else {
        // Initialize with sample data from applicationTracker if available
        if (typeof applicationTracker !== 'undefined') {
            applicationTracker.forEach(app => {
                const key = app.status.toLowerCase();
                if (kanbanState[key]) {
                    kanbanState[key].push({ ...app });
                }
            });
        }
    }
}

function setupEventListeners() {
    // Setup view switching with proper cleanup
    setupCleanEventListener('.kanban-btn', 'click', (e) => {
        e.stopPropagation();
        switchTrackerView(TAB_IDS.KANBAN);
    });

    setupCleanEventListener('.timeline-btn', 'click', (e) => {
        e.stopPropagation();
        switchTrackerView(TAB_IDS.TIMELINE);
    });

    // Setup add form handlers for all columns
    setupAddForms();
}

function switchTrackerView(view) {
    // Debounce rapid clicks for performance
    if (!viewSwitchDebouncer()) return;

    console.log(`Switching to ${view} view`); // Debug log

    // Update button states using shared utility with toggle mode
    updateTabStates([
        { selector: '.kanban-btn', active: view === TAB_IDS.KANBAN, toggleMode: true },
        { selector: '.timeline-btn', active: view === TAB_IDS.TIMELINE, toggleMode: true }
    ]);

    // Update panel visibility using display style
    updatePanelVisibility([
        { id: 'kanban-view', visible: view === TAB_IDS.KANBAN, useDisplay: true },
        { id: 'timeline-view', visible: view === TAB_IDS.TIMELINE, useDisplay: true }
    ]);

    // Render appropriate view
    try {
        if (view === TAB_IDS.KANBAN) {
            renderKanbanView();
        } else {
            renderTimelineView();
        }
    } catch (error) {
        console.error('Error rendering tracker view:', error);
    }

    currentView = view;
    setStorageItem(STORAGE_KEYS.TRACKER_VIEW, view);
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
    });
}

function createKanbanCard(item, status) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.tabIndex = 0;
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

    return card;
}

function setupAddForms() {
    const columns = document.querySelectorAll('.kanban-column');

    columns.forEach(column => {
        const status = column.dataset.status;
        const addBtn = column.querySelector('.add-btn');
        const addForm = column.querySelector('.add-form');
        const saveBtn = column.querySelector('.save-card-btn');
        const cancelBtn = column.querySelector('.cancel-card-btn');

        if (addBtn && addForm) {
            addBtn.addEventListener('click', () => {
                const isExpanded = addForm.classList.contains('add-form--expanded');

                if (isExpanded) {
                    addForm.classList.remove('add-form--expanded');
                    addBtn.textContent = '+ Add';
                    clearAddForm(addForm);
                } else {
                    addForm.classList.add('add-form--expanded');
                    addBtn.textContent = 'Cancel';
                    addForm.querySelector('.role-input')?.focus();
                }
            });
        }

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
    });
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
    setStorageItem(STORAGE_KEYS.KANBAN, kanbanState);

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

    // Update counts
    const stageCounts = container.querySelectorAll('.stage-count');
    if (stageCounts[0]) stageCounts[0].textContent = appliedCount;
    if (stageCounts[1]) stageCounts[1].textContent = interviewCount;
    if (stageCounts[2]) stageCounts[2].textContent = offerCount;

    // Update rates
    const conversionRates = container.querySelectorAll('.conversion-rate');
    if (conversionRates[0]) conversionRates[0].textContent = `Interview rate: ${interviewRate}%`;
    if (conversionRates[1]) conversionRates[1].textContent = `Offer rate: ${offerRate}%`;
}

function renderTimelineView() {
    const container = document.querySelector('.timeline-svg');
    const emptyState = document.querySelector('#timeline-view .empty-state');

    if (!container) return;

    // Get all entries sorted by date
    const allEntries = [
        ...kanbanState.applied.map(e => ({ ...e, status: 'Applied' })),
        ...kanbanState.interview.map(e => ({ ...e, status: 'Interview' })),
        ...kanbanState.offer.map(e => ({ ...e, status: 'Offer' }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (allEntries.length === 0) {
        container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    container.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    // Basic timeline rendering - simplified version
    container.innerHTML = `
        <text x="50%" y="50%" text-anchor="middle" font-size="14" fill="#475569">
            Timeline view: ${allEntries.length} applications tracked
        </text>
    `;
}

function showContextMenu(event, item, status) {
    const menu = document.getElementById('context-menu');
    if (!menu) return;

    // Position menu
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';
    menu.classList.add('context-menu--visible');

    // Update menu options visibility
    const moveToApplied = menu.querySelector('.move-to-applied');
    const moveToInterview = menu.querySelector('.move-to-interview');
    const moveToOffer = menu.querySelector('.move-to-offer');
    const deleteItem = menu.querySelector('.delete-item');

    if (moveToApplied) moveToApplied.style.display = status === 'applied' ? 'none' : 'block';
    if (moveToInterview) moveToInterview.style.display = status === 'interview' ? 'none' : 'block';
    if (moveToOffer) moveToOffer.style.display = status === 'offer' ? 'none' : 'block';

    // Add event listeners (remove old ones first)
    const newMenu = menu.cloneNode(true);
    menu.parentNode.replaceChild(newMenu, menu);

    const newMoveToApplied = newMenu.querySelector('.move-to-applied');
    const newMoveToInterview = newMenu.querySelector('.move-to-interview');
    const newMoveToOffer = newMenu.querySelector('.move-to-offer');
    const newDeleteItem = newMenu.querySelector('.delete-item');

    if (newMoveToApplied) {
        newMoveToApplied.addEventListener('click', () => moveKanbanCard(item, 'applied'));
    }
    if (newMoveToInterview) {
        newMoveToInterview.addEventListener('click', () => moveKanbanCard(item, 'interview'));
    }
    if (newMoveToOffer) {
        newMoveToOffer.addEventListener('click', () => moveKanbanCard(item, 'offer'));
    }
    if (newDeleteItem) {
        newDeleteItem.addEventListener('click', () => deleteKanbanCard(item, status));
    }

    // Close menu handlers
    const closeHandler = (e) => {
        if (!newMenu.contains(e.target)) {
            newMenu.classList.remove('context-menu--visible');
            document.removeEventListener('click', closeHandler);
        }
    };

    setTimeout(() => {
        document.addEventListener('click', closeHandler);
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
    setStorageItem(STORAGE_KEYS.KANBAN, kanbanState);
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
    setStorageItem(STORAGE_KEYS.KANBAN, kanbanState);
    renderKanbanView();

    // Hide menu
    const menu = document.getElementById('context-menu');
    if (menu) {
        menu.classList.remove('context-menu--visible');
    }

    showToast('Application deleted.', 'success');
}