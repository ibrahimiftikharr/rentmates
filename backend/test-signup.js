/**
 * Test script to verify signup flow works end-to-end
 * Run with: node test-signup.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';
const testEmail = `test-${Date.now()}@example.com`;

async function testSignupFlow() {
  try {
    console.log('🧪 Testing Signup Flow\n');
    console.log(`📧 Test Email: ${testEmail}\n`);

    // Step 1: Send OTP
    console.log('1️⃣  Sending OTP...');
    const sendResponse = await axios.post(`${BASE_URL}/send-otp`, { email: testEmail });
    console.log('✓ OTP sent:', sendResponse.data.message);

    // Step 2: Get OTP from debug endpoint (dev-only)
    console.log('\n2️⃣  Fetching OTP from debug endpoint...');
    const otpResponse = await axios.get(`${BASE_URL}/debug-otp?email=${testEmail}`);
    const otp = otpResponse.data.otp;
    console.log('✓ OTP retrieved:', otp);

    // Step 3: Verify OTP
    console.log('\n3️⃣  Verifying OTP...');
    const verifyResponse = await axios.post(`${BASE_URL}/verify-otp`, {
      email: testEmail,
      otp: otp
    });
    console.log('✓ OTP verified:', verifyResponse.data.message);

    // Step 4: Complete Signup
    console.log('\n4️⃣  Completing signup...');
    const signupResponse = await axios.post(`${BASE_URL}/signup`, {
      name: 'Test User',
      email: testEmail,
      password: 'TestPass123!',
      role: 'student',
      otp: otp
    });
    console.log('✓ Signup successful!');
    console.log('  User ID:', signupResponse.data.user.id);
    console.log('  User Name:', signupResponse.data.user.name);
    console.log('  User Role:', signupResponse.data.user.role);
    console.log('  Token received:', signupResponse.data.token.substring(0, 20) + '...');

    // Step 5: Test Login
    console.log('\n5️⃣  Testing login with created account...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: testEmail,
      password: 'TestPass123!'
    });
    console.log('✓ Login successful!');
    console.log('  User:', loginResponse.data.user.name);

    console.log('\n✅ ALL TESTS PASSED! User was successfully created and can login.');
    console.log('\n📊 Summary:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: TestPass123!`);
    console.log('   Status: User exists in MongoDB and can authenticate');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

// Run the test
testSignupFlow();
