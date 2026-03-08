const axios = require('axios');

// simple wrapper to call external ML API
// URL taken from environment variable ML_API_URL
// returns response data or throws

async function predictScam(features) {
  const url = process.env.ML_API_URL || 'http://localhost:8000/predict';
  try {
    console.log(`🔗 Calling ML API at: ${url}`);
    console.log(`📤 Sending features:`, JSON.stringify(features, null, 2));
    
    const res = await axios.post(url, features, { timeout: 10000 });
    
    console.log(`✅ ML API Response (status ${res.status}):`, JSON.stringify(res.data, null, 2));
    
    // Extract and log explanation details
    if (res.data?.scam_explanations && Array.isArray(res.data.scam_explanations)) {
      console.log(`📊 Explanations contain ${res.data.scam_explanations.length} factors:`);
      res.data.scam_explanations.slice(0, 3).forEach((exp, idx) => {
        console.log(`   ${idx + 1}. ${exp.feature || 'N/A'}: score=${exp.score}, direction=${exp.direction}`);
      });
    }
    
    return res.data;
  } catch (err) {
    console.error(`❌ ML API Error:`, err.message);
    if (err.response) {
      console.error(`   Response Status: ${err.response.status}`);
      console.error(`   Response Data:`, JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
}

module.exports = { predictScam };
