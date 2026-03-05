/**
 * Test Modal API Endpoints
 * 
 * This script tests all Modal endpoints to verify deployment is working
 */

const axios = require('axios');

const ENDPOINTS = {
    health: 'https://ibrahimiftikharr--rentmates-compatibility-health-endpoint.modal.run',
    predict: 'https://ibrahimiftikharr--rentmates-compatibility-predict-endpoint.modal.run',
    batchPredict: 'https://ibrahimiftikharr--rentmates-compatibility-predict-batch--ced605.modal.run'
};

// Sample student data for testing
const sampleStudent1 = {
    university: 'NTU',
    course: 'Computer Science',
    yearOfStudy: 'Year 2',
    age: 21,
    nationality: 'Singapore',
    bio: 'I am a CS student who loves coding and gaming. I prefer quiet study environments.',
    budget: { min: 600, max: 900 },
    propertyType: 'HDB',
    smoking: false,
    petFriendly: false,
    cleanliness: 8,
    noiseTolerance: 4
};

const sampleStudent2 = {
    university: 'NTU',
    course: 'Computer Engineering',
    yearOfStudy: 'Year 2',
    age: 22,
    nationality: 'Malaysia',
    bio: 'Engineering student interested in robotics. I enjoy quiet environments and clean spaces.',
    budget: { min: 700, max: 1000 },
    propertyType: 'HDB',
    smoking: false,
    petFriendly: false,
    cleanliness: 7,
    noiseTolerance: 5
};

const sampleStudent3 = {
    university: 'NUS',
    course: 'Business Administration',
    yearOfStudy: 'Year 3',
    age: 23,
    nationality: 'China',
    bio: 'Business student who loves parties and socializing. Very outgoing and friendly.',
    budget: { min: 800, max: 1200 },
    propertyType: 'Condo',
    smoking: true,
    petFriendly: true,
    cleanliness: 5,
    noiseTolerance: 9
};

async function testHealthEndpoint() {
    console.log('\n=== Testing Health Endpoint ===');
    try {
        const response = await axios.get(ENDPOINTS.health, {
            timeout: 15000
        });
        console.log('[OK] Health endpoint response:', response.data);
        return true;
    } catch (error) {
        console.log('[ERROR] Health endpoint failed:', error.message);
        if (error.response) {
            console.log('Response data:', error.response.data);
        }
        return false;
    }
}

async function testPredictEndpoint() {
    console.log('\n=== Testing Predict Endpoint ===');
    console.log('Testing compatibility between:');
    console.log('Student 1:', sampleStudent1.university, sampleStudent1.course);
    console.log('Student 2:', sampleStudent2.university, sampleStudent2.course);
    
    try {
        const response = await axios.post(
            ENDPOINTS.predict,
            {
                student1: sampleStudent1,
                student2: sampleStudent2
            },
            {
                timeout: 15000,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        console.log('[OK] Predict endpoint response:', response.data);
        console.log('Compatibility Score:', response.data.compatibilityScore);
        return true;
    } catch (error) {
        console.log('[ERROR] Predict endpoint failed:', error.message);
        if (error.response) {
            console.log('Response data:', error.response.data);
        }
        return false;
    }
}

async function testBatchPredictEndpoint() {
    console.log('\n=== Testing Batch Predict Endpoint ===');
    console.log('Finding compatible roommates for:', sampleStudent1.university, sampleStudent1.course);
    console.log('Among', 2, 'candidates');
    
    try {
        const response = await axios.post(
            ENDPOINTS.batchPredict,
            {
                currentStudent: sampleStudent1,
                otherStudents: [sampleStudent2, sampleStudent3]
            },
            {
                timeout: 20000,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        console.log('[OK] Batch predict endpoint response:', response.data);
        console.log('Number of scores:', response.data.totalStudents);
        if (response.data.scores) {
            response.data.scores.forEach((score, index) => {
                console.log(`  Candidate ${index + 1}: Score = ${score.compatibilityScore}`);
            });
        }
        return true;
    } catch (error) {
        console.log('[ERROR] Batch predict endpoint failed:', error.message);
        if (error.response) {
            console.log('Response data:', error.response.data);
        }
        return false;
    }
}

async function runAllTests() {
    console.log('Starting Modal API endpoint tests...');
    console.log('Note: Cold start may take 5-10 seconds on first request');
    
    const results = {
        health: await testHealthEndpoint(),
        predict: await testPredictEndpoint(),
        batchPredict: await testBatchPredictEndpoint()
    };
    
    console.log('\n=== Test Results Summary ===');
    console.log('Health Endpoint:', results.health ? '[PASS]' : '[FAIL]');
    console.log('Predict Endpoint:', results.predict ? '[PASS]' : '[FAIL]');
    console.log('Batch Predict Endpoint:', results.batchPredict ? '[PASS]' : '[FAIL]');
    
    const allPassed = Object.values(results).every(result => result === true);
    console.log('\nOverall:', allPassed ? '[ALL TESTS PASSED]' : '[SOME TESTS FAILED]');
    
    return allPassed;
}

// Run tests if executed directly
if (require.main === module) {
    runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test suite error:', error);
            process.exit(1);
        });
}

module.exports = { runAllTests, testHealthEndpoint, testPredictEndpoint, testBatchPredictEndpoint };
