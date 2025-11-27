import { network } from "hardhat";

const { ethers } = await network.connect();

// Deployed contract addresses
const USDT_ADDRESS = "0x93A7B3819f95Fb563ED6A042AA6268ac0fB7C083";

// Test wallets to fund
const TEST_WALLETS = [
  "0xfe31cb4331cd6a609f2958ed029f29b08846e4d2",
  "0x8e85ee1e727f7d78baacbe0ad4cd431dfafec2ba"
];

// Amount to send to each wallet (100,000 USDT with 6 decimals)
const AMOUNT = ethers.parseUnits("100000", 6);

async function main() {
  console.log("🪙 Minting and distributing USDT to test wallets...\n");

  // Get the MockUSDT contract instance
  const usdt = await ethers.getContractAt("MockUSDT", USDT_ADDRESS);
  
  // Get deployer (who has all the minted USDT)
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  console.log("Deployer address:", deployerAddress);
  
  // Check deployer's USDT balance
  const deployerBalance = await usdt.balanceOf(deployerAddress);
  console.log("Deployer USDT balance:", ethers.formatUnits(deployerBalance, 6), "USDT\n");

  // Transfer USDT to each test wallet
  for (const wallet of TEST_WALLETS) {
    console.log(`Sending ${ethers.formatUnits(AMOUNT, 6)} USDT to ${wallet}...`);
    
    const tx = await usdt.transfer(wallet, AMOUNT);
    await tx.wait();
    
    const balance = await usdt.balanceOf(wallet);
    console.log(`✅ Balance: ${ethers.formatUnits(balance, 6)} USDT\n`);
  }

  console.log("✅ Distribution complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
