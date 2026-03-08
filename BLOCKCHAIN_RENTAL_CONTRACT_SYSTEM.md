# Blockchain Rental Contract Verification System

## Overview

The RentMates platform implements a **blockchain-based rental contract verification system** that ensures rental agreements are **immutable, publicly verifiable, and tamper-proof**. When a landlord signs a rental contract, the system automatically:

1. ✅ Generates a PDF of the contract
2. ✅ Uploads the PDF to IPFS (decentralized storage)
3. ✅ Calculates a SHA-256 hash of the contract
4. ✅ Records everything on the Polygon Amoy blockchain
5. ✅ Stores verification data in the database

This creates a **permanent, verifiable record** that cannot be altered or deleted.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Landlord Signs Contract                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Generate PDF                                           │
│  • Contract content converted to professional PDF               │
│  • Includes all terms, signatures, dates                        │
│  • Size: ~5,800-6,000 bytes                                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: Calculate SHA-256 Hash                                 │
│  • Cryptographic hash of PDF file                               │
│  • Output: 64-character hexadecimal string                      │
│  • Example: 0x48b3ea3daaad16a93dfedb9c611fa372...               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: Upload to IPFS via Pinata                              │
│  • PDF stored on decentralized IPFS network                     │
│  • Returns Content Identifier (CID)                             │
│  • Example: bafkreiciwpvd3kvnc2ut37w3trqr7i3...                 │
│  • Accessible from any IPFS gateway                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: Record on Blockchain                                   │
│  • Smart contract: RentalContractVerification.sol               │
│  • Network: Polygon Amoy Testnet                                │
│  • Stores: contract hash, IPFS CID, addresses                   │
│  • Returns: transaction hash, block number                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 5: Save to Database                                       │
│  • All verification data stored in MongoDB                      │
│  • Linked to JoinRequest and Rental documents                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Blockchain Verification Fields

When a contract is successfully verified on the blockchain, the following data is stored:

### 📝 **contractHash** (SHA-256)
- **Type**: String (66 characters)
- **Format**: `0x` + 64 hexadecimal characters
- **Example**: `0x48b3ea3daaad16a93dfedb9c611fa372183c2121f7d6c933be10068446bbb7fd`
- **Purpose**: 
  - Cryptographic fingerprint of the contract PDF
  - Used to verify document authenticity
  - Any change to the document changes the hash
- **How to Verify**:
  1. Download the contract PDF from IPFS
  2. Calculate SHA-256 hash: `sha256sum contract.pdf`
  3. Compare with stored hash
  4. If they match → document is authentic and unmodified

---

### 🌐 **ipfsCID** (IPFS Content Identifier)
- **Type**: String (variable length)
- **Format**: Base58 encoded string starting with `bafkrei...` (CIDv1)
- **Example**: `bafkreiciwpvd3kvnc2ut37w3trqr7i3sda6ccipx23ethpqqa2ceno5x7u`
- **Purpose**: 
  - Unique identifier for the contract document on IPFS
  - Ensures document availability across decentralized network
  - Content-addressed (CID derived from file content)
- **Access**: 
  - Pinata Gateway: `https://gateway.pinata.cloud/ipfs/{CID}`
  - Public Gateways: `https://ipfs.io/ipfs/{CID}`
- **Characteristics**:
  - Immutable: Cannot be modified
  - Decentralized: Stored across multiple IPFS nodes
  - Permanent: Pinned on Pinata for guaranteed availability

---

### 🔗 **transactionHash** (Blockchain TX Hash)
- **Type**: String (66 characters)
- **Format**: `0x` + 64 hexadecimal characters
- **Example**: `0x7a3c891b4d5e2f6a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b`
- **Purpose**: 
  - Unique identifier for the blockchain transaction
  - Proof that contract was recorded on-chain
  - Links to permanent blockchain record
- **Blockchain Explorer**: 
  - Polygon Amoy: `https://amoy.polygonscan.com/tx/{txHash}`
- **What It Proves**:
  - Transaction timestamp (when contract was recorded)
  - Gas fees paid
  - Block number
  - Transaction status (success/failure)
  - Immutable on-chain record

---

### 🔢 **blockchainContractId**
- **Type**: Number (auto-incrementing)
- **Example**: `1`, `2`, `3`, etc.
- **Purpose**: 
  - Sequential ID assigned by smart contract
  - Easy reference for contract lookup
  - Used in smart contract queries
- **Usage**: `await contract.getContract(contractId)`

---

### 📅 **verifiedAt**
- **Type**: Date (ISO 8601)
- **Example**: `2026-03-07T11:49:37.122Z`
- **Purpose**: 
  - Timestamp when blockchain verification was completed
  - Server-side timestamp (may differ slightly from blockchain time)
  - Used for audit trails

---

### 🌍 **blockchainNetwork**
- **Type**: String
- **Value**: `"amoy"` (Polygon Amoy Testnet)
- **Purpose**: 
  - Identifies which blockchain network was used
  - Important for using correct block explorers
  - Future-proof (can support multiple networks)
- **Network Details**:
  - **Name**: Polygon Amoy Testnet
  - **Chain ID**: 80002
  - **RPC**: `https://rpc-amoy.polygon.technology/`
  - **Explorer**: `https://amoy.polygonscan.com/`
  - **Currency**: MATIC (testnet)

---

### 🌐 **gatewayUrl**
- **Type**: String (URL)
- **Example**: `https://gateway.pinata.cloud/ipfs/bafkreiciwpvd3kvnc2ut37w3trqr7i3...`
- **Purpose**: 
  - Direct link to download contract PDF
  - Pre-constructed for convenience
  - Uses Pinata's reliable gateway

---

### 🔥 **gasUsed** *(stored in actionHistory)*
- **Type**: String
- **Example**: `"0.004 ETH"` or actual gas value
- **Purpose**: 
  - Records blockchain transaction cost
  - Transparency for system costs
  - Audit trail

---

### 📦 **blockNumber** *(optional)*
- **Type**: Number
- **Example**: `12345678`
- **Purpose**: 
  - Specific block where transaction was included
  - Additional verification point
  - Can be used to query blockchain at specific point in time

---

## Smart Contract Details

### Contract Information
- **Name**: `RentalContractVerification`
- **File**: `contracts/RentalContractVerification.sol`
- **Deployed Address**: `0x9b042c9ef0a4e88b5c35c5ce2df2a98dfc0d89dc`
- **Network**: Polygon Amoy Testnet
- **Deployer**: `0xA274d2E5079dbDb09344715a9103b860c51a50c3`

### Key Functions

#### `storeContract()`
```solidity
function storeContract(
    bytes32 contractHash,
    string memory ipfsCID,
    address landlordAddress,
    address studentAddress
) external returns (uint256)
```
- Stores new contract verification on blockchain
- Returns auto-incremented contract ID
- Emits `ContractStored` event

#### `getContract()`
```solidity
function getContract(uint256 contractId) external view returns (
    bytes32 contractHash,
    string memory ipfsCID,
    address landlordAddress,
    address studentAddress,
    uint256 timestamp,
    bool exists
)
```
- Retrieves contract details by ID
- View function (no gas cost)

#### `verifyContract()`
```solidity
function verifyContract(
    bytes32 contractHash,
    string memory ipfsCID
) external view returns (bool, uint256)
```
- Verifies if contract hash + IPFS CID combination exists
- Returns existence status and contract ID

---

## Database Schema

### JoinRequest Model
```javascript
contract: {
  blockchainVerification: {
    contractHash: String,        // SHA-256 hash
    ipfsCID: String,             // IPFS Content ID
    transactionHash: String,     // Blockchain TX hash
    blockchainContractId: Number, // Smart contract ID
    verifiedAt: Date,            // Verification timestamp
    blockchainNetwork: String,   // "amoy"
    gatewayUrl: String,          // IPFS gateway URL
    blockNumber: Number,         // Block number (optional)
    gasUsed: String             // Gas cost (optional)
  }
}
```

### Rental Model
```javascript
blockchainVerification: {
  contractHash: String,
  ipfsCID: String,
  transactionHash: String,
  blockchainContractId: Number,
  verifiedAt: Date,
  blockchainNetwork: String,
  gatewayUrl: String,
  blockNumber: Number,
  gasUsed: String
}
```

**Note**: Blockchain verification data is stored in both JoinRequest (during signing) and copied to Rental document (when rental is created).

---

## Contract Signing Flow

### Step-by-Step Process

1. **Student Approval**
   - Landlord approves join request
   - Contract is auto-generated with terms
   - Status: `approved`

2. **Student Signs**
   - Student reviews and signs contract
   - Signature hash stored
   - Status: `waiting_completion`
   - ⚠️ No blockchain action yet

3. **Landlord Signs** (Triggers Blockchain)
   - Landlord reviews and signs contract
   - **Blockchain verification flow starts**:
     ```
     📄 Generate PDF → Calculate Hash → Upload IPFS → Store on Blockchain
     ```
   - Status: `completed`
   - ✅ Blockchain verification complete

4. **Rental Record Created**
   - New `Rental` document created
   - Blockchain verification data copied
   - Security deposit payment scheduled
   - Email notifications sent to both parties

---

## Verification Process

### For Users

#### Via Platform UI:
1. Navigate to completed join request
2. Click "View Contract" button
3. See blockchain verification section with:
   - ✅ Transaction hash with PolygonScan link
   - ✅ IPFS document link with download button
   - ✅ Contract SHA-256 hash
   - ✅ Copy buttons for easy sharing

#### Manual Verification:
1. **Download Contract**:
   ```bash
   curl https://gateway.pinata.cloud/ipfs/{CID} -o contract.pdf
   ```

2. **Calculate Hash**:
   ```bash
   # Linux/Mac
   sha256sum contract.pdf
   
   # Windows (PowerShell)
   Get-FileHash contract.pdf -Algorithm SHA256
   ```

3. **Compare Hashes**:
   - Downloaded file hash should match `contractHash` field
   - If match → authentic and unmodified ✅
   - If different → tampering detected ❌

4. **Verify on Blockchain**:
   - Visit: `https://amoy.polygonscan.com/tx/{transactionHash}`
   - Check transaction status
   - View contract creation event
   - Confirm timestamp and gas fees

---

## Security Features

### 🔒 Immutability
- Once recorded on blockchain, **cannot be modified or deleted**
- Transaction history is permanent
- Hash ensures document integrity

### 🌐 Decentralization
- IPFS storage across multiple nodes
- No single point of failure
- Document accessible worldwide

### 🔍 Transparency
- All transactions publicly visible on PolygonScan
- Anyone can verify contract authenticity
- Audit trail for disputes

### 🛡️ Cryptographic Security
- SHA-256 hashing (industry standard)
- Ethereum cryptographic signatures
- Wallet-based authentication

### ⚡ Gas Efficiency
- Polygon network: Low transaction fees (~$0.001)
- Fast confirmation times (2-3 seconds)
- Environmentally friendly (Proof of Stake)

---

## Technical Implementation

### Backend Services

#### `pdfService.js`
```javascript
generateContractPDF(contractData)
```
- Uses PDFKit library
- Generates professional contract PDF
- Returns buffer (~5,800 bytes)

#### `ipfsService.js`
```javascript
uploadToIPFS(pdfBuffer, fileName)
generateFileHash(buffer) // SHA-256
hexToBytes32(hexString)  // Convert for smart contract
```
- Pinata API integration
- Uploads to IPFS
- Returns CID and gateway URL

#### `blockchainService.js`
```javascript
storeRentalContractOnBlockchain(
  contractHash,
  ipfsCID,
  landlordAddress,
  studentAddress,
  privateKey
)
```
- Ethers.js integration
- Interacts with smart contract
- Returns transaction hash and contract ID

### Frontend Components

#### Landlord View
- `ViewContractPage.tsx` (Landlord)
- Shows signing interface
- Displays blockchain verification after signing

#### Student View
- `ViewContractPage.tsx` (Student)
- View-only contract display
- Full blockchain verification details

---

## Environment Configuration

### Required Variables (backend/.env)
```bash
# Blockchain
POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology/
PRIVATE_KEY=0x...your-private-key...
RENTAL_CONTRACT_VERIFICATION_ADDRESS=0x9b042c9ef0a4e88b5c35c5ce2df2a98dfc0d89dc

# IPFS (Pinata)
PINATA_API_KEY=your_api_key
PINATA_SECRET_KEY=your_secret_key
PINATA_JWT=your_jwt_token
```

**⚠️ Important**: Address must be **all lowercase** to avoid checksum errors.

---

## Common Issues & Solutions

### Issue: "RENTAL_CONTRACT_VERIFICATION_ADDRESS not configured"
**Solution**: 
- Ensure address is in `backend/.env` (not root `.env`)
- Address must be lowercase
- Restart backend server after changes

### Issue: "Bad address checksum"
**Solution**: 
- Convert address to lowercase: `0x9b042c9ef0a4e88b5c35c5ce2df2a98dfc0d89dc`
- Avoid mixed case addresses

### Issue: IPFS upload fails
**Solution**: 
- Verify Pinata API credentials
- Check API rate limits
- Ensure PDF buffer is valid

### Issue: Transaction fails
**Solution**: 
- Check wallet has sufficient MATIC
- Verify RPC endpoint is working
- Ensure contract address is correct

---

## Future Enhancements

### Potential Improvements
1. **Multi-Network Support**
   - Mainnet deployment options
   - Cross-chain verification

2. **Enhanced Verification**
   - Automatic hash verification in UI
   - PDF viewer with hash calculator

3. **Additional Metadata**
   - Property images on IPFS
   - Tenant/landlord ID documents
   - Inspection reports

4. **Legal Integration**
   - Digital signatures (e-signature standards)
   - Notarization on blockchain
   - Court-admissible records

5. **Analytics**
   - Contract performance metrics
   - Dispute resolution tracking
   - Fraud detection patterns

---

## Resources

### Documentation
- **Polygon Docs**: https://docs.polygon.technology/
- **IPFS Docs**: https://docs.ipfs.tech/
- **Pinata Docs**: https://docs.pinata.cloud/
- **Ethers.js**: https://docs.ethers.org/

### Explorers
- **Amoy Explorer**: https://amoy.polygonscan.com/
- **IPFS Gateway**: https://gateway.pinata.cloud/

### Smart Contract
- **GitHub**: View `contracts/RentalContractVerification.sol`
- **Verified Contract**: Check on PolygonScan with deployed address

---

## Conclusion

The blockchain rental contract verification system provides:

✅ **Immutable Records** - Contracts cannot be altered after signing  
✅ **Public Verification** - Anyone can verify authenticity  
✅ **Decentralized Storage** - Documents available permanently on IPFS  
✅ **Cryptographic Security** - SHA-256 hashing ensures integrity  
✅ **Low Cost** - Polygon network keeps gas fees minimal  
✅ **Transparency** - Full audit trail on blockchain  
✅ **Trust** - No single party controls the records  

This system ensures rental agreements are **secure, transparent, and legally robust** for all parties involved.

---

**Last Updated**: March 7, 2026  
**System Version**: 1.0  
**Network**: Polygon Amoy Testnet
