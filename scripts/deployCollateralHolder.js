import { network } from "hardhat";

const { ethers } = await network.connect();

// PAXG token address (will be set after deploying PAXG)
const PAXG_ADDRESS = process.env.PAXG_ADDRESS || "REPLACE_WITH_PAXG_ADDRESS";

async function main() {
  console.log("🏦 Deploying RentMatesCollateralHolder to Polygon Amoy...\n");

  if (PAXG_ADDRESS === "REPLACE_WITH_PAXG_ADDRESS") {
    console.error("❌ Error: Please set PAXG_ADDRESS environment variable");
    console.log("Example: $env:PAXG_ADDRESS='0x...' (PowerShell)");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", await deployer.getAddress());
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC");
  console.log("PAXG Token Address:", PAXG_ADDRESS, "\n");

  const CollateralHolder = await ethers.getContractFactory("RentMatesCollateralHolder");
  const collateralHolder = await CollateralHolder.deploy(PAXG_ADDRESS);
  await collateralHolder.waitForDeployment();

  const address = await collateralHolder.getAddress();
  console.log("✅ RentMatesCollateralHolder deployed at:", address);
  
  // Verify the PAXG token address is set correctly
  const paxgTokenAddress = await collateralHolder.paxgToken();
  console.log("Contract PAXG Token Address:", paxgTokenAddress);
  console.log("Total Collateral:", ethers.formatEther(await collateralHolder.totalCollateral()), "PAXG\n");
  
  console.log("📝 Save this address for backend integration!");
  console.log("COLLATERAL_HOLDER_ADDRESS=" + address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
