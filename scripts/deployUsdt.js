import { network } from "hardhat";

const { ethers } = await network.connect();

const USDT = await ethers.getContractFactory("MockUSDT");
const usdt = await USDT.deploy();
await usdt.waitForDeployment();

const address = await usdt.getAddress();
console.log("Mock USDT deployed at:", address);
