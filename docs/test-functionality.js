// Test Script for SkillRadar Application
// Run this in the browser console to test basic functionality

function testSkillRadarFunctionality() {
    console.log('🧪 Starting SkillRadar functionality test...');

    const tests = [];

    // Test 1: Check if data.js is loaded
    try {
        if (typeof jobsData !== 'undefined' && Array.isArray(jobsData)) {
            tests.push({ name: 'jobsData loaded', status: '✅ PASS', details: `${jobsData.length} jobs found` });
        } else {
            tests.push({ name: 'jobsData loaded', status: '❌ FAIL', details: 'jobsData not available' });
        }
    } catch (error) {
        tests.push({ name: 'jobsData loaded', status: '❌ FAIL', details: error.message });
    }

    // Test 2: Check if skillDemand is loaded
    try {
        if (typeof skillDemand !== 'undefined' && typeof skillDemand === 'object') {
            tests.push({ name: 'skillDemand loaded', status: '✅ PASS', details: `${Object.keys(skillDemand).length} skills found` });
        } else {
            tests.push({ name: 'skillDemand loaded', status: '❌ FAIL', details: 'skillDemand not available' });
        }
    } catch (error) {
        tests.push({ name: 'skillDemand loaded', status: '❌ FAIL', details: error.message });
    }

    // Test 3: Check if trendData is loaded (for trends page)
    try {
        if (typeof trendData !== 'undefined' && typeof trendData === 'object') {
            tests.push({ name: 'trendData loaded', status: '✅ PASS', details: `${Object.keys(trendData).length} trend datasets found` });
        } else {
            tests.push({ name: 'trendData loaded', status: '❌ FAIL', details: 'trendData not available' });
        }
    } catch (error) {
        tests.push({ name: 'trendData loaded', status: '❌ FAIL', details: error.message });
    }

    // Test 4: Check if Chart.js is loaded (for trends charts)
    try {
        if (typeof Chart !== 'undefined') {
            tests.push({ name: 'Chart.js loaded', status: '✅ PASS', details: `Chart.js version available` });
        } else {
            tests.push({ name: 'Chart.js loaded', status: '❌ FAIL', details: 'Chart.js not loaded' });
        }
    } catch (error) {
        tests.push({ name: 'Chart.js loaded', status: '❌ FAIL', details: error.message });
    }

    // Test 5: Check navigation elements
    const navLinks = document.querySelectorAll('.nav-item a, .nav-item[onclick]');
    if (navLinks.length > 0) {
        tests.push({ name: 'Navigation links', status: '✅ PASS', details: `${navLinks.length} navigation links found` });
    } else {
        tests.push({ name: 'Navigation links', status: '❌ FAIL', details: 'No navigation links found' });
    }

    // Test 6: Check for tab elements (if on section pages)
    const tabElements = document.querySelectorAll('[role="tab"], .tab-enter-skills, .tab-paste-resume, .tab-skill-trends, .tab-salary-heatmap, .kanban-btn, .timeline-btn');
    if (tabElements.length > 0) {
        tests.push({ name: 'Tab elements', status: '✅ PASS', details: `${tabElements.length} tab elements found` });
    } else {
        tests.push({ name: 'Tab elements', status: '⚠️ INFO', details: 'No tab elements found (may be on main page)' });
    }

    // Test 7: Check localStorage functionality
    try {
        const testKey = 'srTest';
        const testValue = 'test123';
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);

        if (retrieved === testValue) {
            tests.push({ name: 'localStorage', status: '✅ PASS', details: 'localStorage read/write works' });
        } else {
            tests.push({ name: 'localStorage', status: '❌ FAIL', details: 'localStorage read/write failed' });
        }
    } catch (error) {
        tests.push({ name: 'localStorage', status: '❌ FAIL', details: error.message });
    }

    // Display results
    console.log('\n📊 Test Results:');
    console.log('================');
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
        console.log('\n🎉 All critical tests passed! SkillRadar should be working correctly.');
    } else {
        console.log('\n⚠️ Some tests failed. Please check the details above.');
    }

    return { passed, failed, total: tests.length, details: tests };
}

// Run the test
testSkillRadarFunctionality();