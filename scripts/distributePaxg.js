import { network } from "hardhat";

const { ethers } = await network.connect();

// Deployed contract address (set after deploying PAXG)
const PAXG_ADDRESS = process.env.PAXG_ADDRESS || "REPLACE_WITH_PAXG_ADDRESS";

// Test wallets to fund (from the requirements)
const TEST_WALLETS = [
  "0x496ecaD6d0B5834eF38fD12536a113DC9216E398",
  "0xA274d2E5079dbDb09344715a9103b860c51a50c3"
];

// Amount to send to each wallet (100 PAXG with 18 decimals)
const AMOUNT = ethers.parseUnits("100", 18);

async function main() {
  console.log("🪙 Distributing Mock PAXG to test wallets...\n");

  if (PAXG_ADDRESS === "REPLACE_WITH_PAXG_ADDRESS") {
    console.error("❌ Error: Please set PAXG_ADDRESS environment variable");
    console.log("Example: $env:PAXG_ADDRESS='0x...' (PowerShell)");
    process.exit(1);
  }

  // Get the MockPAXG contract instance
  const paxg = await ethers.getContractAt("MockPAXG", PAXG_ADDRESS);
  
  // Get deployer (who has all the minted PAXG)
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  console.log("Deployer address:", deployerAddress);
  console.log("PAXG Contract:", PAXG_ADDRESS);
  
  // Check deployer's PAXG balance
  const deployerBalance = await paxg.balanceOf(deployerAddress);
  console.log("Deployer PAXG balance:", ethers.formatEther(deployerBalance), "PAXG\n");

  // Transfer PAXG to each test wallet
  for (const wallet of TEST_WALLETS) {
    console.log(`Sending ${ethers.formatEther(AMOUNT)} PAXG to ${wallet}...`);
    
    const tx = await paxg.transfer(wallet, AMOUNT);
    await tx.wait();
    
    const balance = await paxg.balanceOf(wallet);
    console.log(`✅ Balance: ${ethers.formatEther(balance)} PAXG\n`);
  }

  // Check remaining deployer balance
  const finalBalance = await paxg.balanceOf(deployerAddress);
  console.log("Remaining deployer balance:", ethers.formatEther(finalBalance), "PAXG");
  console.log("\n✅ Distribution complete!");
  
  console.log("\n📝 PAXG Token Address:", PAXG_ADDRESS);
  console.log("To import in MetaMask:");
  console.log("1. Open MetaMask and switch to Polygon Amoy Testnet");
  console.log("2. Click 'Import tokens'");
  console.log("3. Paste the token address:", PAXG_ADDRESS);
  console.log("4. Token symbol: PAXG");
  console.log("5. Token decimals: 18");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
