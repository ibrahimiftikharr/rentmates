const { ethers } = require('ethers');
require('dotenv').config();

// Contract addresses
const USDT_ADDRESS = '0x93A7B3819f95Fb563ED6A042AA6268ac0fB7C083';
const VAULT_ADDRESS = '0x9a0070e5C9f1E1d75F105B85F93f955e2656Aa22';

// Vault ABI - only the functions we need
const VAULT_ABI = [
  "function deposit(uint256 amount) external",
  "function withdraw(address user, uint256 amount) external"
];

// MockUSDT ABI - only the functions we need
const USDT_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

// Setup provider and wallet
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const backendWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract instances
const vaultContract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, backendWallet);
const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);

/**
 * Get USDT balance of a wallet address
 * @param {string} walletAddress - User's wallet address
 * @returns {Promise<string>} Balance in USDT (formatted)
 */
async function getUSDTBalance(walletAddress) {
  try {
    const balance = await usdtContract.balanceOf(walletAddress);
    return ethers.formatUnits(balance, 6); // USDT has 6 decimals
  } catch (error) {
    console.error('Error getting USDT balance:', error);
    throw error;
  }
}

/**
 * Backend initiates withdrawal from vault to user's wallet
 * @param {string} userAddress - User's wallet address
 * @param {number} amount - Amount in USDT
 * @returns {Promise<string>} Transaction hash
 */
async function withdrawFromVault(userAddress, amount) {
  try {
    // Convert amount to proper format (6 decimals for USDT)
    const amountInWei = ethers.parseUnits(amount.toString(), 6);
    
    console.log(`Withdrawing ${amount} USDT to ${userAddress}...`);
    
    const tx = await vaultContract.withdraw(userAddress, amountInWei);
    const receipt = await tx.wait();
    
    console.log(`Withdrawal successful! Tx hash: ${receipt.hash}`);
    return receipt.hash;
  } catch (error) {
    console.error('Error withdrawing from vault:', error);
    throw error;
  }
}

/**
 * Get vault's USDT balance (total deposited)
 * @returns {Promise<string>} Balance in USDT
 */
async function getVaultBalance() {
  try {
    const balance = await usdtContract.balanceOf(VAULT_ADDRESS);
    return ethers.formatUnits(balance, 6);
  } catch (error) {
    console.error('Error getting vault balance:', error);
    throw error;
  }
}

module.exports = {
  getUSDTBalance,
  withdrawFromVault,
  getVaultBalance,
  VAULT_ADDRESS,
  USDT_ADDRESS
};
