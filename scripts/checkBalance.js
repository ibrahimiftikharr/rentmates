import { network } from "hardhat";

const { ethers } = await network.connect();

// Deployed USDT contract address
const USDT_ADDRESS = "0x93A7B3819f95Fb563ED6A042AA6268ac0fB7C083";

// Wallet address to check
const WALLET_ADDRESS = process.argv[2] || "0xA274d2E5079dbDb09344715a9103b860c51a50c3";

async function main() {
  console.log("🔍 Checking USDT balance...\n");

  // Get the MockUSDT contract instance
  const usdt = await ethers.getContractAt("MockUSDT", USDT_ADDRESS);
  
  console.log("USDT Contract:", USDT_ADDRESS);
  console.log("Wallet:", WALLET_ADDRESS);
  
  // Get balance
  const balance = await usdt.balanceOf(WALLET_ADDRESS);
  console.log(`\n💰 Balance: ${ethers.formatUnits(balance, 6)} USDT\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
