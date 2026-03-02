import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("🪙 Deploying Mock PAXG token to Polygon Amoy...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", await deployer.getAddress());
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC\n");

  const PAXG = await ethers.getContractFactory("MockPAXG");
  const paxg = await PAXG.deploy();
  await paxg.waitForDeployment();

  const address = await paxg.getAddress();
  console.log("✅ Mock PAXG deployed at:", address);
  
  // Check initial balance
  const balance = await paxg.balanceOf(await deployer.getAddress());
  console.log("Initial PAXG minted:", ethers.formatEther(balance), "PAXG\n");
  
  console.log("📝 Save this address for the next steps!");
  console.log("PAXG_ADDRESS=" + address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
