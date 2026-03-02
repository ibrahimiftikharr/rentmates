# RentMates Collateral System - Deployment Guide

## 📋 Prerequisites

1. **Polygon Amoy Testnet Setup**
   - RPC URL configured in `.env` file
   - Private key with MATIC tokens for gas fees
   - Get free MATIC from: https://faucet.polygon.technology/

2. **Environment Variables**
   Create or update your `.env` file:
   ```
   RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
   PRIVATE_KEY=your_private_key_without_0x_prefix
   ```

## 🚀 Deployment Steps

### Step 1: Deploy Mock PAXG Token

```powershell
npx hardhat run scripts/deployPaxg.js --network amoy
```

**Expected Output:**
```
🪙 Deploying Mock PAXG token to Polygon Amoy...
Deploying with account: 0x...
Account balance: 1.5 MATIC
✅ Mock PAXG deployed at: 0x...
Initial PAXG minted: 10000.0 PAXG
📝 Save this address for the next steps!
PAXG_ADDRESS=0x...
```

**⚠️ IMPORTANT:** Copy the `PAXG_ADDRESS` for the next steps!

---

### Step 2: Deploy Collateral Holder Contract

Set the PAXG address from Step 1:

```powershell
$env:PAXG_ADDRESS='0xYourPaxgAddressFromStep1'
npx hardhat run scripts/deployCollateralHolder.js --network amoy
```

**Expected Output:**
```
🏦 Deploying RentMatesCollateralHolder to Polygon Amoy...
Deploying with account: 0x...
Account balance: 1.4 MATIC
PAXG Token Address: 0x...
✅ RentMatesCollateralHolder deployed at: 0x...
Contract PAXG Token Address: 0x...
Total Collateral: 0.0 PAXG
📝 Save this address for backend integration!
COLLATERAL_HOLDER_ADDRESS=0x...
```

**⚠️ IMPORTANT:** Copy the `COLLATERAL_HOLDER_ADDRESS` for backend integration!

---

### Step 3: Distribute PAXG to Test Wallets

Using the same PAXG address:

```powershell
$env:PAXG_ADDRESS='0xYourPaxgAddressFromStep1'
npx hardhat run scripts/distributePaxg.js --network amoy
```

**Expected Output:**
```
🪙 Distributing Mock PAXG to test wallets...
Deployer address: 0x...
PAXG Contract: 0x...
Deployer PAXG balance: 10000.0 PAXG

Sending 100.0 PAXG to 0x496ecaD6d0B5834eF38fD12536a113DC9216E398...
✅ Balance: 100.0 PAXG

Sending 100.0 PAXG to 0xA274d2E5079dbDb09344715a9103b860c51a50c3...
✅ Balance: 100.0 PAXG

Remaining deployer balance: 9800.0 PAXG
✅ Distribution complete!
```

---

## 🦊 Import PAXG Token into MetaMask

### For Test Wallet Users:

1. **Open MetaMask**
   - Switch to **Polygon Amoy Testnet**
   - If you don't see Amoy, add it manually:
     - Network Name: `Polygon Amoy Testnet`
     - RPC URL: `https://rpc-amoy.polygon.technology/`
     - Chain ID: `80002`
     - Currency Symbol: `MATIC`
     - Block Explorer: `https://amoy.polygonscan.com/`

2. **Import Token**
   - Click on **"Import tokens"** at the bottom
   - Select **"Custom token"** tab
   
3. **Enter Token Details:**
   - **Token Contract Address:** `[PAXG_ADDRESS from Step 1]`
   - **Token Symbol:** `PAXG` (auto-fills)
   - **Token Decimals:** `18` (auto-fills)
   
4. **Click "Add Custom Token"**
   - You should see your PAXG balance: **100.0 PAXG**

5. **Verify Balance**
   - The token should appear in your token list
   - Balance: 100 PAXG

---

## 📝 Contract Addresses Summary

After deployment, save these addresses:

```
PAXG Token: 0x...
Collateral Holder: 0x...
Network: Polygon Amoy (Chain ID: 80002)
```

---

## 🔍 Verify Deployment on PolygonScan

1. Go to: https://amoy.polygonscan.com/
2. Search for your contract addresses
3. View transactions and balances

---

## 🧪 Testing the Contracts

### Check PAXG Balance
```powershell
npx hardhat console --network amoy
```

In the console:
```javascript
const paxg = await ethers.getContractAt("MockPAXG", "YOUR_PAXG_ADDRESS");
const balance = await paxg.balanceOf("0x496ecaD6d0B5834eF38fD12536a113DC9216E398");
console.log("Balance:", ethers.formatEther(balance), "PAXG");
```

### Check Collateral Contract
```javascript
const holder = await ethers.getContractAt("RentMatesCollateralHolder", "YOUR_HOLDER_ADDRESS");
const total = await holder.totalCollateral();
console.log("Total Collateral:", ethers.formatEther(total), "PAXG");
```

---

## 🎯 Next Steps (STEP 2 - Later)

1. **Backend Integration**
   - Store contract addresses in environment variables
   - Integrate Web3.js/Ethers.js for blockchain interactions
   - Create API endpoints for collateral operations

2. **Frontend Integration**
   - Connect MetaMask wallet
   - Implement deposit/withdraw functions
   - Display real-time balances

3. **Database Schema**
   - Add collateral fields to Loan model
   - Track deposit transactions
   - Link wallet addresses to student accounts

---

## ⚠️ Troubleshooting

### Issue: "Insufficient funds for gas"
**Solution:** Get more MATIC from the faucet: https://faucet.polygon.technology/

### Issue: "Nonce too high"
**Solution:** Reset your MetaMask account (Settings → Advanced → Reset Account)

### Issue: "Cannot find module"
**Solution:** Run `npm install` to install dependencies

### Issue: "Network not configured"
**Solution:** Check your `.env` file has correct RPC_URL and PRIVATE_KEY

---

## 📞 Support

If you encounter issues, check:
1. Polygon Amoy is operational: https://amoy.polygonscan.com/
2. Your wallet has sufficient MATIC for gas
3. Environment variables are correctly set
4. Node.js and npm are up to date
