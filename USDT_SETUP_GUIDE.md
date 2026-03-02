# Send Fake USDT to Investor Wallet

This guide shows you how to send 100 USDT from your deployed MockUSDT contract to the investor wallet.

## 📋 Prerequisites

- Your MockUSDT contract is already deployed at: `0x93A7B3819f95Fb563ED6A042AA6268ac0fB7C083`
- You have the private key of the deployer wallet in your `.env` file
- Node.js and Hardhat are installed

## 🚀 Step 1: Send USDT to Investor Wallet

Run this command from the project root directory:

```bash
npx hardhat run scripts/sendUsdtToInvestor.js --network amoy
```

This will:
- Transfer **100 USDT** from the deployer wallet to: `0xA274d2E5079dbDb09344715a9103b860c51a50c3`
- Show you the transaction hash
- Display the updated balance

## ✅ Step 2: Verify the Balance

To check the balance of any wallet:

```bash
npx hardhat run scripts/checkBalance.js --network amoy
```

Or check a specific wallet:

```bash
npx hardhat run scripts/checkBalance.js --network amoy 0xYourWalletAddress
```

## 🦊 Step 3: Add USDT Token to MetaMask

To view your USDT balance in MetaMask browser extension:

### Method 1: Manual Import

1. **Open MetaMask** browser extension
2. **Switch Network** to "Polygon Amoy Testnet"
   - If you don't see it, add it manually:
     - Network Name: `Polygon Amoy Testnet`
     - RPC URL: `https://rpc-amoy.polygon.technology`
     - Chain ID: `80002`
     - Currency Symbol: `MATIC`
     - Block Explorer: `https://amoy.polygonscan.com`

3. **Import Token**
   - Click on "Tokens" tab at the bottom
   - Scroll down and click "Import tokens"
   - Select "Custom token" tab
   - Paste these details:
     - **Token Contract Address**: `0x93A7B3819f95Fb563ED6A042AA6268ac0fB7C083`
     - **Token Symbol**: `USDT` (should auto-fill)
     - **Token Decimal**: `6` (should auto-fill)
   - Click "Add Custom Token"
   - Click "Import Tokens"

4. **View Balance**
   - You should now see your USDT balance in the tokens list
   - It should show **100 USDT**

### Method 2: Using Polygonscan

1. Go to: https://amoy.polygonscan.com/token/0x93A7B3819f95Fb563ED6A042AA6268ac0fB7C083
2. Click the MetaMask fox icon next to "Add token to wallet"
3. Confirm the prompt in MetaMask

## 📊 Smart Contract Details

- **Contract Name**: MockUSDT (Tether USD)
- **Symbol**: USDT
- **Decimals**: 6
- **Total Supply**: 1,000,000 USDT
- **Network**: Polygon Amoy Testnet
- **Contract Address**: `0x93A7B3819f95Fb563ED6A042AA6268ac0fB7C083`

## 🔧 Troubleshooting

### "Insufficient USDT balance in deployer wallet"
- The deployer wallet doesn't have enough USDT
- You may need to redeploy the MockUSDT contract or use a different deployer wallet

### "Network Error" or "Cannot connect"
- Make sure you're connected to Polygon Amoy Testnet
- Check your RPC URL in `hardhat.config.ts`
- Verify your `PRIVATE_KEY` is set in `.env` file

### Token not showing in MetaMask
- Make sure you're on the correct network (Polygon Amoy)
- Double-check the contract address when importing
- Try refreshing MetaMask or restarting the browser

### Transaction fails
- Check that you have enough MATIC for gas fees
- Get free MATIC from: https://faucet.polygon.technology/

## 📝 Additional Operations

### Send to Multiple Wallets

Edit `scripts/sendUsdtToInvestor.js` and add more addresses:

```javascript
const WALLETS = [
  "0xA274d2E5079dbDb09344715a9103b860c51a50c3",
  "0xAnotherWalletAddress",
];

// Loop through and send to each
for (const wallet of WALLETS) {
  await usdt.transfer(wallet, AMOUNT);
}
```

### Change Amount

Edit the amount in `scripts/sendUsdtToInvestor.js`:

```javascript
// For 500 USDT
const AMOUNT = ethers.parseUnits("500", 6);

// For 0.5 USDT
const AMOUNT = ethers.parseUnits("0.5", 6);
```

## 🎯 Next Steps

After adding USDT to MetaMask, you can:
1. Use it with the deposit functionality in your investor dashboard
2. Transfer it to other wallets
3. Approve the RentmatesVault contract to spend it
4. Make deposits through the platform UI

---

**Note**: This is test USDT on Amoy testnet and has **no real value**. It's only for development and testing purposes.
