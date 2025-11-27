# Wallet Integration Test Guide

## Prerequisites
1. Backend server must be running on http://localhost:5000
2. You must be logged in to get an auth token in localStorage
3. MetaMask must be installed and connected to Polygon Amoy testnet

## Testing Steps

### 1. Check Backend Health
Open browser console and run:
```javascript
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Expected response:
```json
{"status":"ok","message":"Server is running"}
```

### 2. Check Auth Token
Open browser console and run:
```javascript
console.log('Token:', localStorage.getItem('token'))
```

If null, you need to log in first at http://localhost:5173

### 3. Test Wallet Connection Flow

#### Step 1: Connect MetaMask
1. Click "Connect Wallet" button
2. Approve MetaMask popup
3. Check browser console for logs:
   - "Connecting wallet to backend: 0x..."
   - "Auth token present: true/false"
   - "Backend response status: 200/401/500"

#### Step 2: Deposit USDT
1. Enter amount (e.g., 10)
2. Click "Deposit Now"
3. Approve USDT spending in MetaMask (first time only)
4. Confirm deposit transaction in MetaMask
5. Check console logs

#### Step 3: Pay Rent (Student only)
1. Click "Pay Rent Now" button
2. Confirm 2 USDT payment
3. Check balance update

#### Step 4: Withdraw USDT
1. Enter amount (less than balance)
2. Click "Withdraw Now"
3. Backend will process withdrawal
4. USDT will be sent to your MetaMask

### 4. Common Errors

#### "Failed to fetch"
**Causes:**
- Backend not running → Start backend: `cd backend && npm start`
- CORS issue → Check server.js has `app.use(cors())`
- Wrong API_URL → Check walletService.ts uses `http://localhost:5000/api`
- No auth token → Log in first

**Fix:**
```powershell
# Start backend
cd backend
npm start

# Start frontend (separate terminal)
cd frontend
npm run dev
```

#### "No auth token found"
**Fix:** Log in at http://localhost:5173 first

#### "Wallet connection failed"
**Fix:** 
- Install MetaMask browser extension
- Switch to Polygon Amoy testnet
- Import test wallet with private key (from hardhat accounts)

### 5. Debug Console Commands

Check wallet routes:
```javascript
// Test connect endpoint
fetch('http://localhost:5000/api/wallet/balance', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Check USDT balance on-chain:
```javascript
// In browser console (after MetaMask connected)
import { getUSDTBalance } from './src/shared/services/walletService'
const address = '0xYourAddressHere'
getUSDTBalance(address).then(console.log)
```

### 6. Expected Console Logs

**Successful connection:**
```
Connecting wallet to backend: 0x...
Auth token present: true
Backend response status: 200
Wallet connected successfully: { success: true, walletAddress: "0x..." }
```

**Failed connection (no auth):**
```
Connecting wallet to backend: 0x...
Auth token present: false
Backend response status: 401
Backend error: { error: "No token provided" }
```

### 7. Port Configuration

If ports conflict:

Backend (server.js):
```javascript
const PORT = process.env.PORT || 5000;
```

Frontend (vite.config.ts):
```typescript
server: {
  port: 5173
}
```

WalletService (walletService.ts):
```typescript
const API_URL = 'http://localhost:5000/api';
```

### 8. Test with cURL

Test backend directly:
```bash
# Health check
curl http://localhost:5000/api/health

# Connect wallet (replace TOKEN with actual token)
curl -X POST http://localhost:5000/api/wallet/connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"walletAddress":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'

# Get balance
curl http://localhost:5000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
