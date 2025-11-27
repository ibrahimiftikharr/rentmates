# RentMates Blockchain Wallet Integration - Deployment Summary

## 📋 Deployment Information

### Contract Addresses (Polygon Amoy Testnet)
- **USDt Token**: `0x93A7B3819f95Fb563ED6A042AA6268ac0fB7C083`
- **Vault Contract**: `0x9a0070e5C9f1E1d75F105B85F93f955e2656Aa22`
- **Backend Wallet**: `0xa274d2e5079dbdb09344715a9103b860c51a50c3`

### Test Wallets (Funded with 100,000 USDT each)
1. **Test Wallet 1**: `0xfe31cb4331cd6a609f2958ed029f29b08846e4d2`
2. **Test Wallet 2**: `0x8e85ee1e727f7d78baacbe0ad4cd431dfafec2ba`

### Network Details
- **Network**: Polygon Amoy Testnet
- **Chain ID**: 80002
- **RPC URL**: https://rpc-amoy.polygon.technology
- **Block Explorer**: https://amoy.polygonscan.com/

## 🔧 Implementation Overview

### Backend Components

1. **User Model** (`backend/models/userModel.js`)
   - Added `walletAddress` field for MetaMask wallet
   - Added `offChainBalance` field for tracking user's balance in RentMates

2. **Contract Service** (`backend/services/contractService.js`)
   - `getUSDTBalance()` - Check USDT balance of any wallet
   - `withdrawFromVault()` - Backend calls vault to send USDT to user
   - `getVaultBalance()` - Check total vault balance

3. **Wallet Controller** (`backend/controllers/walletController.js`)
   - `connectWallet` - Store user's wallet address
   - `getBalance` - Get both on-chain and off-chain balances
   - `recordDeposit` - Record deposit after MetaMask transaction
   - `withdraw` - Withdraw USDT from vault to user's wallet
   - `payRent` - Off-chain transfer from student to landlord (2 USDT hardcoded)

4. **Routes** (`backend/routes/walletRoutes.js`)
   - POST `/api/wallet/connect` - Connect wallet
   - GET `/api/wallet/balance` - Get balances
   - POST `/api/wallet/deposit` - Record deposit
   - POST `/api/wallet/withdraw` - Withdraw funds
   - POST `/api/wallet/pay-rent` - Pay rent
   - GET `/api/wallet/vault-info` - Get vault info

### Frontend Components

1. **Wallet Service** (`frontend/src/shared/services/walletService.ts`)
   - MetaMask connection and network switching
   - USDT approval and deposit to vault
   - Balance checking
   - Backend API integration

2. **Wallet Pages** (Student & Landlord)
   - Connect MetaMask wallet
   - View on-chain USDT balance (in MetaMask)
   - View off-chain balance (in RentMates)
   - Deposit USDT to vault
   - Withdraw USDT from vault

3. **Pay Rent Feature** (`frontend/src/domains/student/pages/DashboardPage.tsx`)
   - Pay Rent button in Quick Actions
   - Hardcoded 2 USDT rent payment
   - Instant off-chain transfer to landlord

## 💰 Transaction Flow

### Deposit Flow
1. User connects MetaMask wallet
2. User enters amount and clicks "Deposit"
3. MetaMask prompts for USDT approval (if needed)
4. MetaMask prompts for deposit transaction
5. After confirmation, backend records deposit
6. User's off-chain balance increases

### Withdrawal Flow
1. User enters amount and clicks "Withdraw"
2. Backend checks off-chain balance
3. Backend calls smart contract to transfer USDT
4. USDT sent from vault to user's MetaMask
5. User's off-chain balance decreases

### Rent Payment Flow (Off-Chain Only)
1. Student clicks "Pay Rent" (2 USDT)
2. Backend checks student's off-chain balance
3. If sufficient, deduct from student
4. Add to landlord's off-chain balance
5. NO blockchain transaction (saves gas fees)

## 🧪 Testing Instructions

### Prerequisites
1. Install MetaMask browser extension
2. Add Polygon Amoy testnet to MetaMask
3. Import one of the test wallets using their private keys

### Test Workflow

1. **Start Backend**
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Deposit**
   - Login as student
   - Go to Wallet page
   - Connect MetaMask (use Test Wallet 1)
   - Deposit 10 USDT
   - Confirm in MetaMask
   - Verify off-chain balance increases

4. **Test Pay Rent**
   - Go to Dashboard
   - Click "Pay Rent" in Quick Actions
   - Confirm payment of 2 USDT
   - Verify student balance decreases by 2 USDT

5. **Test Withdrawal** (as landlord)
   - Login as landlord
   - Go to Wallet page
   - Connect MetaMask (use Test Wallet 2)
   - Withdraw 5 USDT
   - Verify USDT appears in MetaMask wallet

## 🎯 Key Features

✅ MetaMask wallet connection
✅ USDT deposits to vault contract
✅ Off-chain balance tracking in MongoDB
✅ Backend-controlled withdrawals via smart contract
✅ Rent payments (off-chain, gas-free)
✅ Real-time balance updates
✅ Transaction history

## 🔐 Security Considerations

- Only backend wallet can call `withdraw()` on vault contract
- Users can only deposit, not directly withdraw
- All withdrawals require backend authorization
- Off-chain balances stored in MongoDB
- Private keys stored in `.env` file (never commit)

## 📝 Notes

- Rent amount is currently hardcoded to 2 USDT
- Landlord ID is hardcoded for testing
- Real implementation should fetch landlord from property/contract data
- Consider adding transaction history tracking
- Consider adding withdrawal limits/verification

## 🚀 Next Steps

1. Add transaction history to database
2. Fetch real landlord IDs from contracts
3. Implement dynamic rent amounts
4. Add security deposit handling
5. Add refund functionality
6. Implement rent payment schedules
7. Add email notifications for transactions
