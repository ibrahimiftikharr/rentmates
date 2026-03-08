const axios = require('axios');

async function testMLAPI() {
  const testPayload = {
    priceRatio: 1.2,
    depositRatio: 1.0,
    depositTooHigh: false,
    landlordVerified: true,
    reputationScore: 75,
    nationalityMismatch: false,
    thumbsRatio: 0.5,
    minStayMonths: 12,
    description_length: 150,
    description_word_count: 25,
    has_scam_keywords: false,
    review_count: 0,
    isNewListing: true
  };

  try {
    console.log('🔗 Testing ML API at http://localhost:8000/predict');
    console.log('📤 Sending payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await axios.post('http://localhost:8000/predict', testPayload, {
      timeout: 5000
    });
    
    console.log('\n✅ ML API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\n📊 Checking explanations:');
    if (response.data.scam_explanations && Array.isArray(response.data.scam_explanations)) {
      console.log(`Found ${response.data.scam_explanations.length} explanations:`);
      response.data.scam_explanations.forEach((exp, idx) => {
        console.log(`\n${idx + 1}. ${exp.feature}`);
        console.log(`   - score: ${exp.score} (type: ${typeof exp.score})`);
        console.log(`   - direction: ${exp.direction}`);
        console.log(`   - impact: ${exp.impact}`);
      });
    } else {
      console.log('❌ No explanations found in response');
    }
    
  } catch (error) {
    console.error('❌ Error calling ML API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testMLAPI();
