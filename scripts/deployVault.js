import { network } from "hardhat";

const { ethers } = await network.connect();

const usdtAddress = "0x93A7B3819f95Fb563ED6A042AA6268ac0fB7C083";  
const backendWallet = "0xa274d2e5079dbdb09344715a9103b860c51a50c3";

console.log("Deploying Vault with USDt:", usdtAddress);
console.log("Backend wallet:", backendWallet);

const Vault = await ethers.getContractFactory("RentmatesVault");
const vault = await Vault.deploy(usdtAddress, backendWallet);

await vault.waitForDeployment();

const vaultAddress = await vault.getAddress();
console.log("\n✅ Vault deployed at:", vaultAddress);
console.log("\n=== Deployment Summary ===");
console.log("USDt Token:", usdtAddress);
console.log("Vault Contract:", vaultAddress);
console.log("Backend Wallet:", backendWallet);
