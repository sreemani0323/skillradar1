// Comprehensive Tab Testing and Debugging Script
// Run this in browser console to test and debug tab functionality

function debugTabFunctionality() {
    console.clear();
    console.log('🔍 DEBUGGING TAB FUNCTIONALITY');
    console.log('===============================');

    // Test all possible tab scenarios
    const testScenarios = [
        {
            name: 'Trends Tabs',
            tabs: [
                { selector: '.tab-skill-trends', name: 'Skill Trends', targetTab: 'trends' },
                { selector: '.tab-salary-heatmap', name: 'Salary Heatmap', targetTab: 'heatmap' }
            ],
            panels: [
                { id: 'trends-panel', relatedTab: 'trends' },
                { id: 'heatmap-panel', relatedTab: 'heatmap' }
            ]
        },
        {
            name: 'Gap Analyzer Tabs',
            tabs: [
                { selector: '.tab-enter-skills', name: 'Enter Skills', targetTab: 'enter' },
                { selector: '.tab-paste-resume', name: 'Paste Resume', targetTab: 'resume' }
            ],
            panels: [
                { id: 'tab-panel-enter', relatedTab: 'enter' },
                { id: 'tab-panel-resume', relatedTab: 'resume' }
            ]
        },
        {
            name: 'Tracker Views',
            tabs: [
                { selector: '.kanban-btn', name: 'Kanban View', targetTab: 'kanban' },
                { selector: '.timeline-btn', name: 'Timeline View', targetTab: 'timeline' }
            ],
            panels: [
                { id: 'kanban-view', relatedTab: 'kanban' },
                { id: 'timeline-view', relatedTab: 'timeline' }
            ]
        }
    ];

    let overallResults = [];

    testScenarios.forEach(scenario => {
        console.log(`\n📋 Testing ${scenario.name}`);
        console.log('─'.repeat(30));

        const scenarioResults = testTabScenario(scenario);
        overallResults = overallResults.concat(scenarioResults);
    });

    // Summary
    console.log('\n📊 OVERALL RESULTS');
    console.log('==================');

    const passed = overallResults.filter(r => r.status === 'PASS').length;
    const failed = overallResults.filter(r => r.status === 'FAIL').length;
    const warnings = overallResults.filter(r => r.status === 'WARN').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);

    if (failed > 0) {
        console.log('\n🚨 FAILURES DETECTED:');
        overallResults.filter(r => r.status === 'FAIL').forEach(result => {
            console.log(`❌ ${result.test}: ${result.details}`);
        });

        console.log('\n💡 DEBUGGING TIPS:');
        console.log('1. Check browser console for JavaScript errors');
        console.log('2. Verify all script files are loaded with type="module"');
        console.log('3. Check if event listeners are attached properly');
        console.log('4. Look for conflicting CSS or JavaScript');
    } else {
        console.log('\n🎉 All tests passed! Tab functionality is working correctly.');
    }

    return { passed, failed, warnings, details: overallResults };
}

function testTabScenario(scenario) {
    const results = [];

    // Check if tabs exist on this page
    const availableTabs = scenario.tabs.filter(tab => document.querySelector(tab.selector));

    if (availableTabs.length === 0) {
        results.push({
            test: `${scenario.name} - Page Check`,
            status: 'WARN',
            details: 'Not on this page'
        });
        return results;
    }

    console.log(`Found ${availableTabs.length} tabs on this page`);

    // Test each tab
    availableTabs.forEach((tab, index) => {
        const tabElement = document.querySelector(tab.selector);

        if (!tabElement) {
            results.push({
                test: `${tab.name} - Element Check`,
                status: 'FAIL',
                details: 'Tab element not found'
            });
            return;
        }

        // Test 1: Check if tab has event listeners
        const hasListeners = tabElement.onclick || getEventListeners(tabElement)?.click?.length > 0;
        results.push({
            test: `${tab.name} - Event Listeners`,
            status: hasListeners ? 'PASS' : 'FAIL',
            details: hasListeners ? 'Has click listeners' : 'No click listeners detected'
        });

        // Test 2: Check ARIA attributes
        const ariaSelected = tabElement.getAttribute('aria-selected');
        results.push({
            test: `${tab.name} - ARIA Attributes`,
            status: ariaSelected !== null ? 'PASS' : 'WARN',
            details: `aria-selected: ${ariaSelected || 'not set'}`
        });

        // Test 3: Simulate click and check response
        try {
            const originalState = {
                ariaSelected: tabElement.getAttribute('aria-selected'),
                hasActiveClass: tabElement.classList.contains('active')
            };

            console.log(`🖱️ Simulating click on ${tab.name}...`);
            tabElement.click();

            // Wait a bit for state changes
            setTimeout(() => {
                const newState = {
                    ariaSelected: tabElement.getAttribute('aria-selected'),
                    hasActiveClass: tabElement.classList.contains('active')
                };

                const stateChanged =
                    originalState.ariaSelected !== newState.ariaSelected ||
                    originalState.hasActiveClass !== newState.hasActiveClass;

                results.push({
                    test: `${tab.name} - Click Response`,
                    status: stateChanged ? 'PASS' : 'FAIL',
                    details: stateChanged
                        ? `State changed: ${JSON.stringify(originalState)} → ${JSON.stringify(newState)}`
                        : 'No state change detected'
                });

                // Test 4: Check if related panel is visible (if applicable)
                const relatedPanel = scenario.panels.find(p => p.relatedTab === tab.targetTab);
                if (relatedPanel) {
                    const panelElement = document.getElementById(relatedPanel.id);
                    if (panelElement) {
                        const isVisible = panelElement.style.display !== 'none' &&
                                        !panelElement.classList.contains('tab-panel--active') === false;

                        results.push({
                            test: `${tab.name} - Panel Visibility`,
                            status: isVisible ? 'PASS' : 'WARN',
                            details: `Panel ${relatedPanel.id}: ${isVisible ? 'visible' : 'hidden'}`
                        });
                    }
                }
            }, 100);

        } catch (error) {
            results.push({
                test: `${tab.name} - Click Simulation`,
                status: 'FAIL',
                details: `Error: ${error.message}`
            });
        }
    });

    // Test rapid clicking scenario
    if (availableTabs.length >= 2) {
        console.log('🚀 Testing rapid tab switching...');

        try {
            const tab1 = document.querySelector(availableTabs[0].selector);
            const tab2 = document.querySelector(availableTabs[1].selector);

            // Rapid fire clicks
            for (let i = 0; i < 5; i++) {
                tab1.click();
                tab2.click();
            }

            results.push({
                test: `${scenario.name} - Rapid Switching`,
                status: 'PASS',
                details: 'Rapid clicking completed without errors'
            });

        } catch (error) {
            results.push({
                test: `${scenario.name} - Rapid Switching`,
                status: 'FAIL',
                details: `Error during rapid switching: ${error.message}`
            });
        }
    }

    return results;
}

// Helper function to get event listeners (works in Chrome DevTools)
function getEventListeners(element) {
    if (typeof window.getEventListeners === 'function') {
        return window.getEventListeners(element);
    }
    return null; // Not available in all browsers
}

// Auto-run the debug test
debugTabFunctionality();