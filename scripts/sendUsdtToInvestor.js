import { network } from "hardhat";

const { ethers } = await network.connect();

// Deployed USDT contract address
const USDT_ADDRESS = "0x93A7B3819f95Fb563ED6A042AA6268ac0fB7C083";

// Investor wallet address
const INVESTOR_WALLET = "0xA274d2E5079dbDb09344715a9103b860c51a50c3";

// Amount to send (100 USDT with 6 decimals)
const AMOUNT = ethers.parseUnits("100", 6);

async function main() {
  console.log("🪙 Sending USDT to investor wallet...\n");

  // Get the MockUSDT contract instance
  const usdt = await ethers.getContractAt("MockUSDT", USDT_ADDRESS);
  
  // Get deployer (who has all the minted USDT)
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  console.log("Deployer address:", deployerAddress);
  
  // Check deployer's USDT balance
  const deployerBalance = await usdt.balanceOf(deployerAddress);
  console.log("Deployer USDT balance:", ethers.formatUnits(deployerBalance, 6), "USDT\n");

  // Check if deployer has enough balance
  if (deployerBalance < AMOUNT) {
    console.error("❌ Insufficient USDT balance in deployer wallet!");
    console.log("Please deploy the USDT contract first or use a different wallet.");
    process.exitCode = 1;
    return;
  }

  // Check investor's balance before transfer
  const balanceBefore = await usdt.balanceOf(INVESTOR_WALLET);
  console.log(`Investor balance before: ${ethers.formatUnits(balanceBefore, 6)} USDT`);

  // Transfer USDT to investor wallet
  console.log(`\nSending ${ethers.formatUnits(AMOUNT, 6)} USDT to ${INVESTOR_WALLET}...`);
  
  const tx = await usdt.transfer(INVESTOR_WALLET, AMOUNT);
  console.log("Transaction sent! Hash:", tx.hash);
  
  console.log("Waiting for confirmation...");
  await tx.wait();
  
  // Check investor's balance after transfer
  const balanceAfter = await usdt.balanceOf(INVESTOR_WALLET);
  console.log(`\n✅ Transfer complete!`);
  console.log(`Investor balance after: ${ethers.formatUnits(balanceAfter, 6)} USDT`);
  console.log(`Received: ${ethers.formatUnits(balanceAfter - balanceBefore, 6)} USDT\n`);

  console.log("📝 To view this in MetaMask:");
  console.log("1. Open MetaMask");
  console.log("2. Switch to Polygon Amoy Testnet");
  console.log("3. Click 'Import tokens'");
  console.log("4. Paste this contract address:", USDT_ADDRESS);
  console.log("5. Token symbol: USDT");
  console.log("6. Decimals: 6");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
