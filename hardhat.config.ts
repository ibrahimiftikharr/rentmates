import { HardhatUserConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts"
  },
  networks: {
    mumbai: {
      type: "http" as const,
      url: process.env.RPC_URL || "https://polygon-amoy.g.alchemy.com/v2/demo",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
    },
    amoy: {
      type: "http" as const,
      url: process.env.RPC_URL || "https://polygon-amoy.g.alchemy.com/v2/demo",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
    },
  },
  plugins: [hardhatEthers],
};

export default config;
