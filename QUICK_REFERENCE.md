# 🎯 Quick Reference - Smart Contract Addresses

## Polygon Amoy Testnet Deployment

```
Network: Polygon Amoy Testnet
Chain ID: 80002
RPC URL: https://rpc-amoy.polygon.technology/
Explorer: https://amoy.polygonscan.com/
```

## 📝 Contract Addresses

```javascript
// Copy these addresses for your backend .env file
PAXG_TOKEN_ADDRESS=0x1450E1215a99c8a4287e24e5d00fdFe9390092D5
COLLATERAL_HOLDER_ADDRESS=0x4b5DEdc0fa59288e36Ec35297E8cf0A1c9800619
```

## 🦊 Import PAXG into MetaMask

**Quick Steps:**
1. Switch to **Polygon Amoy Testnet**
2. Click **Import tokens**
3. Paste: `0x1450E1215a99c8a4287e24e5d00fdFe9390092D5`
4. Symbol: `PAXG`, Decimals: `18`
5. Import!

## 💰 Wallet Balances

| Wallet | PAXG Balance |
|--------|--------------|
| 0x496ecaD6d0B5834eF38fD12536a113DC9216E398 | 100 PAXG |
| 0xA274d2E5079dbDb09344715a9103b860c51a50c3 | 9,900 PAXG |

## 🔗 Quick Links

**Contracts on PolygonScan:**
- PAXG Token: https://amoy.polygonscan.com/address/0x1450E1215a99c8a4287e24e5d00fdFe9390092D5
- Collateral Holder: https://amoy.polygonscan.com/address/0x4b5DEdc0fa59288e36Ec35297E8cf0A1c9800619

**Wallets on PolygonScan:**
- Wallet 1: https://amoy.polygonscan.com/address/0x496ecaD6d0B5834eF38fD12536a113DC9216E398
- Wallet 2: https://amoy.polygonscan.com/address/0xA274d2E5079dbDb09344715a9103b860c51a50c3

## 📦 Contract ABIs

Located in:
```
./artifacts/contracts/MockPAXG.sol/MockPAXG.json
./artifacts/contracts/RentMatesCollateralHolder.sol/RentMatesCollateralHolder.json
```

## ⚡ Quick Test (Hardhat Console)

```powershell
cmd /c "npx hardhat console --network amoy"
```

```javascript
// Check PAXG balance
const paxg = await ethers.getContractAt("MockPAXG", "0x1450E1215a99c8a4287e24e5d00fdFe9390092D5");
const balance = await paxg.balanceOf("0x496ecaD6d0B5834eF38fD12536a113DC9216E398");
console.log(ethers.formatEther(balance) + " PAXG");
```

---

**Status:** ✅ STEP 1 COMPLETED  
**Date:** March 2, 2026
