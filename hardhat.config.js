import "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";

dotenv.config();

const config = {
  solidity: "0.8.28",
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts"
  },
  networks: {
    mumbai: {
      url: process.env.RPC_URL || "https://polygon-amoy.g.alchemy.com/v2/demo",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
    },
    amoy: {
      url: process.env.RPC_URL || "https://polygon-amoy.g.alchemy.com/v2/demo",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
    },
  },
};

export default config;
