const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');

/**
 * IPFS Service using Pinata
 * Handles uploading contract documents to IPFS for decentralized storage
 */

const PINATA_API_KEY = process.env.PINATA_API_KEY || '5f4585fa9a2ddda8ec7a';
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || '7525986cf08d65ebbbfd39e02a815419b5c407052bcb7c671ffaf9ba4d68f715';
const PINATA_JWT = process.env.PINATA_JWT || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI4NGQ3MzI0OC01MzZkLTRiYzgtYjIzNS0xMGNmNTkwZDA4OWMiLCJlbWFpbCI6ImlicmFoaW1pZnRpa2hhcnJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjVmNDU4NWZhOWEyZGRkYThlYzdhIiwic2NvcGVkS2V5U2VjcmV0IjoiNzUyNTk4NmNmMDhkNjVlYmJiZmQzOWUwMmE4MTU0MTliNWM0MDcwNTJiY2I3YzY3MWZmYWY5YmE0ZDY4ZjcxNSIsImV4cCI6MTgwNDQxNTU3Nn0.zUN7Qnkc4JSnnwwMi-uABGyKHXItei0YTy6S-QBUkbs';

/**
 * Upload a file buffer to IPFS using Pinata
 * @param {Buffer} fileBuffer - The file content as a buffer
 * @param {string} fileName - Name of the file
 * @param {Object} metadata - Optional metadata to attach to the file
 * @returns {Promise<Object>} - Returns IPFS CID and other upload details
 */
async function uploadToIPFS(fileBuffer, fileName, metadata = {}) {
  try {
    console.log('Uploading file to IPFS via Pinata...');
    console.log('File name:', fileName);
    console.log('File size:', fileBuffer.length, 'bytes');

    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: 'application/pdf'
    });

    // Add metadata
    const pinataMetadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        type: 'rental-contract',
        uploadedAt: new Date().toISOString(),
        ...metadata
      }
    });
    formData.append('pinataMetadata', pinataMetadata);

    // Add options
    const pinataOptions = JSON.stringify({
      cidVersion: 1
    });
    formData.append('pinataOptions', pinataOptions);

    // Upload to Pinata
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
          'Authorization': `Bearer ${PINATA_JWT}`
        }
      }
    );

    console.log('✅ File uploaded to IPFS successfully');
    console.log('IPFS CID:', response.data.IpfsHash);

    return {
      success: true,
      ipfsCID: response.data.IpfsHash,
      size: response.data.PinSize,
      timestamp: response.data.Timestamp,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
    };
  } catch (error) {
    console.error('❌ Error uploading to IPFS:', error.response?.data || error.message);
    throw new Error(`Failed to upload to IPFS: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Generate SHA-256 hash of a file buffer
 * @param {Buffer} fileBuffer - The file content as a buffer
 * @returns {string} - Hex string of the hash
 */
function generateFileHash(fileBuffer) {
  console.log('Generating SHA-256 hash...');
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  console.log('Hash generated:', hash);
  return hash;
}

/**
 * Convert hex hash to bytes32 format for blockchain
 * @param {string} hexHash - Hex string of the hash
 * @returns {string} - bytes32 formatted hash (0x prefixed)
 */
function hexToBytes32(hexHash) {
  // Remove 0x prefix if present
  const cleanHex = hexHash.startsWith('0x') ? hexHash.slice(2) : hexHash;
  
  // Ensure it's 64 characters (32 bytes)
  if (cleanHex.length !== 64) {
    throw new Error('Invalid hash length. Expected 64 hex characters (32 bytes)');
  }
  
  return '0x' + cleanHex;
}

/**
 * Retrieve file from IPFS using Pinata gateway
 * @param {string} ipfsCID - IPFS Content Identifier
 * @returns {Promise<Buffer>} - File content as buffer
 */
async function retrieveFromIPFS(ipfsCID) {
  try {
    console.log('Retrieving file from IPFS...');
    console.log('CID:', ipfsCID);

    const response = await axios.get(
      `https://gateway.pinata.cloud/ipfs/${ipfsCID}`,
      {
        responseType: 'arraybuffer'
      }
    );

    console.log('✅ File retrieved from IPFS successfully');
    return Buffer.from(response.data);
  } catch (error) {
    console.error('❌ Error retrieving from IPFS:', error.message);
    throw new Error(`Failed to retrieve from IPFS: ${error.message}`);
  }
}

/**
 * Verify that a file matches its stored hash
 * @param {Buffer} fileBuffer - The file content as a buffer
 * @param {string} expectedHash - The expected hash to compare against
 * @returns {boolean} - True if hashes match
 */
function verifyFileHash(fileBuffer, expectedHash) {
  const actualHash = generateFileHash(fileBuffer);
  const cleanExpectedHash = expectedHash.startsWith('0x') ? expectedHash.slice(2) : expectedHash;
  
  const matches = actualHash === cleanExpectedHash;
  console.log('Hash verification:', matches ? '✅ MATCH' : '❌ MISMATCH');
  
  return matches;
}

/**
 * Test Pinata connection
 * @returns {Promise<boolean>} - True if connection is successful
 */
async function testConnection() {
  try {
    console.log('Testing Pinata connection...');
    
    const response = await axios.get(
      'https://api.pinata.cloud/data/testAuthentication',
      {
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`
        }
      }
    );

    console.log('✅ Pinata connection successful:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Pinata connection failed:', error.response?.data || error.message);
    return false;
  }
}

module.exports = {
  uploadToIPFS,
  generateFileHash,
  hexToBytes32,
  retrieveFromIPFS,
  verifyFileHash,
  testConnection
};
