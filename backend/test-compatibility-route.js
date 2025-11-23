const axios = require('axios');

// Test the compatibility endpoint
async function testCompatibilityRoute() {
  try {
    // First, login to get a token
    console.log('🔑 Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com', // Replace with a valid test email
      password: 'test123' // Replace with a valid test password
    });
    
    const token = loginResponse.data.token;
    console.log('✓ Login successful, token received');
    
    // Test the compatibility endpoint
    console.log('\n📊 Testing /api/public/students-compatibility endpoint...');
    const response = await axios.get('http://localhost:5000/api/public/students-compatibility', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✓ Success! Response status:', response.status);
    console.log('✓ Number of students returned:', response.data.students ? response.data.students.length : 0);
    console.log('\nFirst student sample:', JSON.stringify(response.data.students?.[0], null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.data || error.message);
    console.error('Full error:', error.message);
  }
}

testCompatibilityRoute();
