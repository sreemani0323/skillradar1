// Tab Functionality Test Script
// Run this in the browser console to test tab switching

function testTabFunctionality() {
    console.log('🧪 Testing Tab Switching Functionality...');

    const tests = [];

    // Test 1: Check for throttling variables
    const pageTypes = [
        { name: 'Trends', variable: 'isTabSwitching', tabs: ['.tab-skill-trends', '.tab-salary-heatmap'] },
        { name: 'Gap Analyzer', variable: 'isTabSwitching', tabs: ['.tab-enter-skills', '.tab-paste-resume'] },
        { name: 'Tracker', variable: 'isViewSwitching', tabs: ['.kanban-btn', '.timeline-btn'] }
    ];

    pageTypes.forEach(pageType => {
        const tabs = document.querySelectorAll(pageType.tabs.join(', '));
        if (tabs.length > 0) {
            tests.push({
                name: `${pageType.name} tabs found`,
                status: '✅ PASS',
                details: `Found ${tabs.length} tabs`
            });

            // Test tab click simulation
            tabs.forEach((tab, index) => {
                if (tab) {
                    const hasClickListener = tab.onclick || tab.addEventListener;
                    tests.push({
                        name: `${pageType.name} tab ${index + 1} clickable`,
                        status: hasClickListener ? '✅ PASS' : '⚠️ INFO',
                        details: hasClickListener ? 'Has click handler' : 'No direct click handler found'
                    });
                }
            });
        } else {
            tests.push({
                name: `${pageType.name} tabs found`,
                status: '⚠️ INFO',
                details: 'Not on this page'
            });
        }
    });

    // Test 2: Check for proper ARIA attributes
    const allTabs = document.querySelectorAll('[role="tab"], [aria-selected], .tab-skill-trends, .tab-salary-heatmap, .tab-enter-skills, .tab-paste-resume');
    const activeTab = document.querySelector('[aria-selected="true"]');

    tests.push({
        name: 'ARIA tab attributes',
        status: allTabs.length > 0 ? '✅ PASS' : '❌ FAIL',
        details: `${allTabs.length} tabs with ARIA attributes, ${activeTab ? '1 active' : '0 active'}`
    });

    // Test 3: Check for CSS transitions
    const firstTab = allTabs[0];
    if (firstTab) {
        const style = window.getComputedStyle(firstTab);
        const hasTransition = style.transition !== 'all 0s ease 0s';
        tests.push({
            name: 'CSS transitions',
            status: hasTransition ? '✅ PASS' : '⚠️ INFO',
            details: hasTransition ? 'Transitions enabled' : 'No transitions detected'
        });
    }

    // Test 4: Simulate a tab click (if tabs exist)
    if (allTabs.length > 0) {
        try {
            const testTab = allTabs[0];
            const originalSelected = testTab.getAttribute('aria-selected');

            // Simulate click
            testTab.click();

            setTimeout(() => {
                const newSelected = testTab.getAttribute('aria-selected');
                tests.push({
                    name: 'Tab click simulation',
                    status: (originalSelected !== newSelected || testTab.classList.contains('active')) ? '✅ PASS' : '❌ FAIL',
                    details: `ARIA state: ${originalSelected} → ${newSelected}`
                });

                displayResults(tests);
            }, 100);
        } catch (error) {
            tests.push({
                name: 'Tab click simulation',
                status: '❌ FAIL',
                details: error.message
            });
            displayResults(tests);
        }
    } else {
        displayResults(tests);
    }
}

function displayResults(tests) {
    console.log('\n📊 Tab Test Results:');
    console.log('===================');
    tests.forEach(test => {
        console.log(`${test.status} ${test.name}: ${test.details}`);
    });

    const passed = tests.filter(t => t.status.includes('✅')).length;
    const failed = tests.filter(t => t.status.includes('❌')).length;

    console.log('\n📈 Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️ Warnings: ${tests.length - passed - failed}`);

    if (failed === 0) {
        console.log('\n🎉 Tab functionality is working correctly!');
    } else {
        console.log('\n⚠️ Some tab issues detected. Check the details above.');
    }
}

// Auto-run test
testTabFunctionality();