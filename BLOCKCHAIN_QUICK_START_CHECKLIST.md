# Blockchain Contract Verification - Quick Start Checklist

Follow this checklist to deploy and test the blockchain contract verification system.

---

## Pre-Deployment Checklist

- [ ] **Backend packages installed**
  ```bash
  cd backend
  npm install pdfkit form-data
  ```

- [ ] **Environment variables set in `.env`:**
  - [ ] `PINATA_API_KEY` (already configured: 5f4585fa9a2ddda8ec7a)
  - [ ] `PINATA_SECRET_KEY` (already configured)
  - [ ] `PINATA_JWT` (already configured)
  - [ ] `RPC_URL` (Polygon Amoy RPC)
  - [ ] `PRIVATE_KEY` (your wallet private key)

- [ ] **Wallet has testnet MATIC:**
  - Get from: https://faucet.polygon.technology/
  - Minimum: 0.1 MATIC recommended

---

## Deployment Checklist

### Step 1: Compile Smart Contract
- [ ] Run: `npx hardhat compile`
- [ ] Verify artifacts generated in `artifacts/contracts/`
- [ ] No compilation errors

### Step 2: Deploy Smart Contract
- [ ] Run: `npx hardhat run scripts/deployRentalContractVerification.js --network amoy`
- [ ] Note deployed contract address from output
- [ ] Transaction confirmed on blockchain

### Step 3: Configure Environment
- [ ] Add to `.env`: `RENTAL_CONTRACT_VERIFICATION_ADDRESS=0x...`
- [ ] Save `.env` file
- [ ] Verify address is correct

### Step 4: Restart Backend
- [ ] Stop backend server (Ctrl+C)
- [ ] Start backend: `npm start` or `npm run dev`
- [ ] Verify no startup errors
- [ ] Check logs for successful initialization

---

## Testing Checklist

### Test 1: Student Signs Contract
- [ ] Login as student
- [ ] Find an approved join request
- [ ] Click "Sign Contract"
- [ ] Verify signature recorded
- [ ] Contract status: "Waiting for landlord signature"

### Test 2: Landlord Signs Contract (Blockchain Verification)
- [ ] Login as landlord
- [ ] Open the same join request
- [ ] Review contract details
- [ ] Check "I agree to terms and conditions"
- [ ] Click "Sign Contract with Wallet"
- [ ] Confirm signing in dialog
- [ ] **Watch backend logs for blockchain process:**
  - [ ] "Starting blockchain verification flow..."
  - [ ] "PDF generated successfully"
  - [ ] "Contract uploaded to IPFS"
  - [ ] "Contract hash generated"
  - [ ] "Contract stored on blockchain"
  - [ ] "Blockchain verification flow completed"

### Test 3: Verify Frontend Display
- [ ] **Blockchain Verification Section visible**
- [ ] Green "✓ Verified on Blockchain" badge shown
- [ ] **Transaction Hash displayed:**
  - [ ] Hash is displayed in monospace font
  - [ ] Copy button works
  - [ ] "View" button opens PolygonScan
- [ ] **IPFS Document Link displayed:**
  - [ ] CID is shown
  - [ ] Copy button works
  - [ ] "View" button opens/downloads PDF
- [ ] **Contract Hash displayed:**
  - [ ] SHA-256 hash shown
  - [ ] Copy button works
- [ ] **Blockchain Contract ID shown**
- [ ] Verification instructions visible

### Test 4: Verify on Blockchain Explorer
- [ ] Click "View" next to Transaction Hash
- [ ] PolygonScan opens in new tab
- [ ] Transaction status: "Success ✓"
- [ ] Verify "From" address (backend wallet)
- [ ] Verify "To" address (contract address)
- [ ] Check logs for "ContractStored" event
- [ ] Event shows: contractId, contractHash, ipfsCID, landlord, student

### Test 5: Verify IPFS Document
- [ ] Click "View" next to IPFS Link
- [ ] PDF opens in browser or downloads
- [ ] PDF contains correct contract details
- [ ] PDF shows both signatures
- [ ] PDF formatted correctly

### Test 6: Verify Document Hash
- [ ] Download PDF from IPFS
- [ ] Calculate hash:
  - **Linux/Mac:** `shasum -a 256 filename.pdf`
  - **Windows:** `certutil -hashfile filename.pdf SHA256`
  - **Online:** Use https://emn178.github.io/online-tools/sha256_checksum.html
- [ ] Copy hash from result
- [ ] Compare with Contract Hash on page
- [ ] Hashes match exactly ✓

---

## Database Verification Checklist

### Check MongoDB
- [ ] Open MongoDB Compass or shell
- [ ] Find the join request document
- [ ] Verify `contract.blockchainVerification` exists:
  - [ ] `contractHash` field populated
  - [ ] `ipfsCID` field populated
  - [ ] `transactionHash` field populated
  - [ ] `blockchainContractId` field populated
  - [ ] `verifiedAt` timestamp present
  - [ ] `blockchainNetwork` set to "amoy"

- [ ] Find the rental document
- [ ] Verify `blockchainVerification` exists with same data

---

## Troubleshooting Checklist

### If compilation fails:
- [ ] Check Solidity version in `hardhat.config.ts`
- [ ] Verify contract syntax
- [ ] Run `npm install` in root directory
- [ ] Try: `npx hardhat clean` then compile again

### If deployment fails:
- [ ] Check RPC_URL is correct
- [ ] Verify PRIVATE_KEY format (no 0x prefix)
- [ ] Ensure wallet has MATIC
- [ ] Check network connectivity
- [ ] Try again (sometimes network issues)

### If backend crashes during signing:
- [ ] Check backend logs for specific error
- [ ] Verify RENTAL_CONTRACT_VERIFICATION_ADDRESS is set
- [ ] Verify contract ABI exists in artifacts/
- [ ] Check Pinata credentials
- [ ] Ensure backend wallet has MATIC

### If no blockchain section shows:
- [ ] Check if both parties signed
- [ ] Verify contract data in database
- [ ] Check browser console for errors
- [ ] Refresh page
- [ ] Clear browser cache

### If IPFS link doesn't work:
- [ ] Verify CID is correct
- [ ] Try alternative gateway: `https://ipfs.io/ipfs/[CID]`
- [ ] Check Pinata dashboard
- [ ] Wait a few minutes (IPFS propagation)

### If transaction link doesn't work:
- [ ] Verify transaction hash
- [ ] Check correct network (Amoy testnet)
- [ ] Try direct link: `https://amoy.polygonscan.com/tx/[hash]`
- [ ] Wait for block confirmation

---

## Performance Checklist

- [ ] **PDF Generation:** Takes 1-3 seconds
- [ ] **IPFS Upload:** Takes 2-5 seconds
- [ ] **Blockchain Transaction:** Takes 5-30 seconds
- [ ] **Total Time:** Should complete within 1 minute
- [ ] No timeout errors
- [ ] User sees loading indicators

---

## Security Checklist

- [ ] `.env` file not committed to git
- [ ] `.env` in `.gitignore`
- [ ] Private key secure and not exposed
- [ ] Backend wallet has limited funds (testnet only)
- [ ] Pinata credentials valid and active
- [ ] Smart contract deployed successfully
- [ ] No errors in contract code
- [ ] Hash verification working correctly

---

## Production Readiness Checklist

### Before going to production:

- [ ] **Smart Contract:**
  - [ ] Audited by security firm
  - [ ] Deployed to mainnet
  - [ ] Address updated in `.env`

- [ ] **Backend:**
  - [ ] Using production RPC URL
  - [ ] Secure key management (AWS KMS, HashiCorp Vault)
  - [ ] Error logging (Sentry, LogRocket)
  - [ ] Monitoring alerts set up
  - [ ] Rate limiting enabled

- [ ] **IPFS:**
  - [ ] Pinata paid plan (if needed)
  - [ ] Backup IPFS nodes configured
  - [ ] CDN for faster access

- [ ] **Testing:**
  - [ ] Load testing completed
  - [ ] Stress testing passed
  - [ ] All edge cases covered
  - [ ] Security audit passed

- [ ] **Documentation:**
  - [ ] User guide created
  - [ ] Support team trained
  - [ ] FAQ prepared
  - [ ] Monitoring dashboards set up

---

## Maintenance Checklist

### Weekly:
- [ ] Check backend wallet MATIC balance
- [ ] Review transaction success rate
- [ ] Check IPFS upload success rate
- [ ] Monitor error logs

### Monthly:
- [ ] Review Pinata storage usage
- [ ] Check smart contract gas costs
- [ ] Analyze performance metrics
- [ ] Update dependencies if needed

---

## Success Criteria

✅ **System is working correctly if:**
1. Contract signing completes without errors
2. PDF is visible on IPFS within 30 seconds
3. Transaction appears on PolygonScan within 2 minutes
4. Frontend shows all verification data
5. Downloaded PDF hash matches stored hash
6. Database contains blockchain verification data
7. No errors in backend logs
8. Users can access all verification links

---

## Quick Commands Reference

```bash
# Compile contract
npx hardhat compile

# Deploy contract
npx hardhat run scripts/deployRentalContractVerification.js --network amoy

# Start backend
cd backend && npm start

# Check backend logs
tail -f backend/logs/app.log  # if logging to file

# Test Pinata connection (create test script)
node backend/test-pinata.js

# Calculate file hash (Linux/Mac)
shasum -a 256 file.pdf

# Calculate file hash (Windows)
certutil -hashfile file.pdf SHA256

# Check wallet balance
npx hardhat run scripts/checkBalance.js --network amoy
```

---

## Contact Information

- **Blockchain Explorer:** https://amoy.polygonscan.com/
- **IPFS Gateway:** https://gateway.pinata.cloud/
- **Pinata Dashboard:** https://app.pinata.cloud/
- **Polygon Faucet:** https://faucet.polygon.technology/

---

## Final Verification

Before considering deployment complete:

- [✓] All items in "Pre-Deployment Checklist" completed
- [✓] All items in "Deployment Checklist" completed
- [✓] All items in "Testing Checklist" passed
- [✓] Database verification successful
- [✓] No errors in any step
- [✓] Documentation reviewed and understood

**Status: Ready for Production!** 🎉
