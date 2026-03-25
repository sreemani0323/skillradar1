// Trends JavaScript
// Handles all trends-specific functionality

import {
    createDebouncer,
    setupCleanEventListener,
    updateTabStates,
    updatePanelVisibility,
    getCachedElement,
    TAB_IDS
} from '../utils/shared.js';

// Trends state
let trendCharts = {};
const tabSwitchDebouncer = createDebouncer(100);

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

// Initialize trends when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTrends();
});

function initializeTrends() {
    setupTrendsTabs();
    switchTrendsTab(TAB_IDS.TRENDS); // Default to trends view
}

function setupTrendsTabs() {
    // Setup event listeners with proper cleanup
    setupCleanEventListener('.tab-skill-trends', 'click', (e) => {
        e.stopPropagation();
        switchTrendsTab(TAB_IDS.TRENDS);
    });

    setupCleanEventListener('.tab-salary-heatmap', 'click', (e) => {
        e.stopPropagation();
        switchTrendsTab(TAB_IDS.HEATMAP);
    });
}

function switchTrendsTab(tabName) {
    // Debounce rapid clicks for performance
    if (!tabSwitchDebouncer()) return;

    console.log(`Switching to ${tabName} tab`); // Debug log

    // Update tab states using shared utility
    updateTabStates([
        { selector: '.tab-skill-trends', active: tabName === TAB_IDS.TRENDS },
        { selector: '.tab-salary-heatmap', active: tabName === TAB_IDS.HEATMAP }
    ]);

    // Update panel visibility using shared utility
    updatePanelVisibility([
        { id: 'trends-panel', visible: tabName === TAB_IDS.TRENDS },
        { id: 'heatmap-panel', visible: tabName === TAB_IDS.HEATMAP }
    ]);

    // Render appropriate content
    try {
        if (tabName === TAB_IDS.TRENDS) {
            renderTrendCharts();
        } else {
            renderSalaryHeatmap();
        }
    } catch (error) {
        console.error('Error rendering tab content:', error);
    }
}

function renderTrendCharts() {
    // Check if required dependencies are available
    if (typeof trendData === 'undefined') {
        console.error('trendData is not available. Make sure data.js is loaded.');
        return;
    }

    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not available. Make sure the Chart.js library is loaded.');
        return;
    }

    const container = getCachedElement('#trends-grid');
    if (!container) return;

    container.innerHTML = '';

    // Get main skills from trendData
    const skills = Object.keys(trendData);

    skills.forEach(skill => {
        try {
            const data = trendData[skill];
            if (!Array.isArray(data) || data.length === 0) return;

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

            // Optimize chart rendering - update data instead of destroying
            if (trendCharts[canvasId]) {
                // Chart exists, update data instead of recreating
                const chart = trendCharts[canvasId];
                chart.data.datasets[0].data = data;
                chart.data.labels = getLast7Months();
                chart.update('none'); // No animation for better performance
                return; // Skip canvas creation
            }

            // Create new chart only if it doesn't exist
            const canvas = getCachedElement(`#${canvasId}`);
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
        } catch (error) {
            console.error(`Error rendering chart for ${skill}:`, error);
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
    const container = getCachedElement('#heatmap-grid');
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