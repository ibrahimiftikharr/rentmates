const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

// Load contract ABIs
const loadContractABI = (contractName) => {
  const abiPath = path.join(__dirname, '..', '..', 'artifacts', 'contracts', `${contractName}.sol`, `${contractName}.json`);
  const contractJson = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  return contractJson.abi;
};

// Contract addresses (from deployment)
const PAXG_TOKEN_ADDRESS = process.env.PAXG_TOKEN_ADDRESS || '0x1450E1215a99c8a4287e24e5d00fdFe9390092D5';
const COLLATERAL_HOLDER_ADDRESS = process.env.COLLATERAL_HOLDER_ADDRESS || '0x4b5DEdc0fa59288e36Ec35297E8cf0A1c9800619';

// Polygon Amoy RPC
const POLYGON_AMOY_RPC = process.env.POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology/';

// Load ABIs
const PAXG_ABI = loadContractABI('MockPAXG');
const COLLATERAL_HOLDER_ABI = loadContractABI('RentMatesCollateralHolder');

/**
 * Get provider (read-only)
 */
const getProvider = () => {
  return new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
};

/**
 * Get PAXG contract instance (read-only)
 */
const getPAXGContract = () => {
  const provider = getProvider();
  return new ethers.Contract(PAXG_TOKEN_ADDRESS, PAXG_ABI, provider);
};

/**
 * Get Collateral Holder contract instance (read-only)
 */
const getCollateralHolderContract = () => {
  const provider = getProvider();
  return new ethers.Contract(COLLATERAL_HOLDER_ADDRESS, COLLATERAL_HOLDER_ABI, provider);
};

/**
 * Get student's PAXG balance in their wallet
 * @param {string} walletAddress - Student's wallet address
 * @returns {Promise<string>} PAXG balance in ether format
 */
const getPAXGBalance = async (walletAddress) => {
  try {
    const paxg = getPAXGContract();
    const balance = await paxg.balanceOf(walletAddress);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Get PAXG balance error:', error);
    throw new Error('Failed to fetch PAXG balance');
  }
};

/**
 * Get student's deposited collateral balance in the contract
 * @param {string} walletAddress - Student's wallet address
 * @returns {Promise<string>} Deposited collateral in ether format
 */
const getDepositedCollateral = async (walletAddress) => {
  try {
    const collateralHolder = getCollateralHolderContract();
    const balance = await collateralHolder.getBalance(walletAddress);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Get deposited collateral error:', error);
    throw new Error('Failed to fetch deposited collateral');
  }
};

/**
 * Verify a collateral deposit transaction
 * @param {string} txHash - Transaction hash
 * @param {string} walletAddress - Student's wallet address
 * @param {string} expectedAmount - Expected PAXG amount in ether
 * @returns {Promise<Object>} Transaction verification result
 */
const verifyDepositTransaction = async (txHash, walletAddress, expectedAmount) => {
  try {
    const provider = getProvider();
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return { success: false, message: 'Transaction not found' };
    }
    
    if (receipt.status === 0) {
      return { success: false, message: 'Transaction failed' };
    }
    
    // Parse logs to verify deposit event
    const collateralHolder = getCollateralHolderContract();
    const parsedLogs = receipt.logs
      .map(log => {
        try {
          return collateralHolder.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter(log => log !== null);
    
    // Find CollateralDeposited event
    const depositEvent = parsedLogs.find(
      log => log.name === 'CollateralDeposited' && 
             log.args.student.toLowerCase() === walletAddress.toLowerCase()
    );
    
    if (!depositEvent) {
      return { success: false, message: 'Deposit event not found in transaction' };
    }
    
    const depositedAmount = ethers.formatEther(depositEvent.args.amount);
    const expectedAmountNum = parseFloat(expectedAmount);
    const depositedAmountNum = parseFloat(depositedAmount);
    
    // Allow small rounding difference (0.000001 PAXG)
    if (Math.abs(depositedAmountNum - expectedAmountNum) > 0.000001) {
      return { 
        success: false, 
        message: `Amount mismatch: expected ${expectedAmount} PAXG, got ${depositedAmount} PAXG` 
      };
    }
    
    return {
      success: true,
      amount: depositedAmount,
      newBalance: ethers.formatEther(depositEvent.args.newBalance),
      blockNumber: receipt.blockNumber,
      timestamp: (await provider.getBlock(receipt.blockNumber)).timestamp
    };
    
  } catch (error) {
    console.error('Verify deposit transaction error:', error);
    return { success: false, message: 'Failed to verify transaction: ' + error.message };
  }
};

/**
 * Get contract addresses
 */
const getContractAddresses = () => {
  return {
    paxgToken: PAXG_TOKEN_ADDRESS,
    collateralHolder: COLLATERAL_HOLDER_ADDRESS,
    network: 'Polygon Amoy Testnet',
    chainId: 80002
  };
};

module.exports = {
  getPAXGBalance,
  getDepositedCollateral,
  verifyDepositTransaction,
  getContractAddresses,
  PAXG_TOKEN_ADDRESS,
  COLLATERAL_HOLDER_ADDRESS
};
