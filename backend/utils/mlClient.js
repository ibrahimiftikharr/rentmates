const axios = require('axios');

const DEFAULT_ML_BASE_URL = 'https://justforextras-rentmates-scam-detector.hf.space';
const DEFAULT_PREDICT_PATH = '/predict';

function getPredictUrl() {
  const direct = (process.env.ML_API_URL || '').trim();
  if (direct) {
    return direct;
  }

  const base = (process.env.ML_API_BASE_URL || DEFAULT_ML_BASE_URL).trim().replace(/\/+$/, '');
  return `${base}${DEFAULT_PREDICT_PATH}`;
}

function getTimeoutMs() {
  const raw = Number(process.env.ML_API_TIMEOUT_MS || process.env.ML_TIMEOUT || 30000);
  return Number.isFinite(raw) && raw > 0 ? raw : 30000;
}

function shouldRetry(error) {
  const status = error?.response?.status;
  return [429, 502, 503, 504].includes(status);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function predictScam(features) {
  const url = getPredictUrl();
  const timeout = getTimeoutMs();
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      console.log(`🔗 Calling ML API at: ${url}`);
      console.log(`📤 Sending features:`, JSON.stringify(features, null, 2));

      const res = await axios.post(url, features, { timeout });

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
      const status = err?.response?.status;
      console.error(`❌ ML API Error (attempt ${attempt}/${maxAttempts}):`, err.message);
      if (err.response) {
        console.error(`   Response Status: ${status}`);
        console.error(`   Response Data:`, JSON.stringify(err.response.data, null, 2));
      }

      if (attempt < maxAttempts && shouldRetry(err)) {
        await sleep(1200 * attempt);
        continue;
      }

      throw err;
    }
  }
}

module.exports = { predictScam };
