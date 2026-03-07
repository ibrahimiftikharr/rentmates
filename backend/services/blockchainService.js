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

/**
 * ============================================
 * RENTAL CONTRACT VERIFICATION FUNCTIONS
 * ============================================
 */

// Rental Contract Verification Address
const RENTAL_CONTRACT_VERIFICATION_ADDRESS = process.env.RENTAL_CONTRACT_VERIFICATION_ADDRESS;

// Diagnostic log to verify env var is loading
console.log('🔍 [Blockchain Service] RENTAL_CONTRACT_VERIFICATION_ADDRESS:', 
  RENTAL_CONTRACT_VERIFICATION_ADDRESS || '❌ NOT LOADED');

// Load Rental Contract Verification ABI
let RENTAL_CONTRACT_VERIFICATION_ABI;
try {
  RENTAL_CONTRACT_VERIFICATION_ABI = loadContractABI('RentalContractVerification');
  console.log('✅ [Blockchain Service] RentalContractVerification ABI loaded successfully');
} catch (error) {
  console.warn('⚠️  [Blockchain Service] RentalContractVerification ABI not found. Contract may not be deployed yet.');
  RENTAL_CONTRACT_VERIFICATION_ABI = null;
}

/**
 * Get Rental Contract Verification contract instance
 */
const getRentalContractVerificationContract = (signer = null) => {
  if (!RENTAL_CONTRACT_VERIFICATION_ADDRESS) {
    throw new Error('RENTAL_CONTRACT_VERIFICATION_ADDRESS not configured in environment');
  }
  
  if (!RENTAL_CONTRACT_VERIFICATION_ABI) {
    throw new Error('RentalContractVerification ABI not available. Please compile and deploy the contract first.');
  }
  
  const provider = getProvider();
  const signerOrProvider = signer || provider;
  
  return new ethers.Contract(
    RENTAL_CONTRACT_VERIFICATION_ADDRESS,
    RENTAL_CONTRACT_VERIFICATION_ABI,
    signerOrProvider
  );
};

/**
 * Store rental contract on blockchain
 * @param {string} contractHash - SHA-256 hash of the contract (0x prefixed bytes32)
 * @param {string} ipfsCID - IPFS Content Identifier
 * @param {string} landlordAddress - Landlord's wallet address
 * @param {string} studentAddress - Student's wallet address
 * @param {string} privateKey - Private key for signing the transaction
 * @returns {Promise<Object>} Transaction result with contractId and transaction hash
 */
const storeRentalContractOnBlockchain = async (contractHash, ipfsCID, landlordAddress, studentAddress, privateKey) => {
  try {
    console.log('📝 Storing rental contract on blockchain...');
    console.log('Contract Hash:', contractHash);
    console.log('IPFS CID:', ipfsCID);
    console.log('Landlord Address:', landlordAddress);
    console.log('Student Address:', studentAddress);

    // Create provider and wallet
    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('Transaction sender:', wallet.address);

    // Get contract instance with signer
    const contract = getRentalContractVerificationContract(wallet);

    // Call storeContract function
    console.log('Sending transaction to blockchain...');
    const tx = await contract.storeContract(
      contractHash,
      ipfsCID,
      landlordAddress,
      studentAddress
    );

    console.log('Transaction sent. Hash:', tx.hash);
    console.log('Waiting for confirmation...');

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

    // Parse the ContractStored event to get the contract ID
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'ContractStored';
      } catch {
        return false;
      }
    });

    let contractId;
    if (event) {
      const parsed = contract.interface.parseLog(event);
      contractId = Number(parsed.args.contractId);
      console.log('Blockchain Contract ID:', contractId);
    }

    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      contractId: contractId,
      gasUsed: receipt.gasUsed.toString(),
      network: 'Polygon Amoy Testnet'
    };
  } catch (error) {
    console.error('❌ Error storing rental contract on blockchain:', error);
    throw new Error(`Failed to store contract on blockchain: ${error.message}`);
  }
};

/**
 * Verify rental contract from blockchain
 * @param {number} contractId - Blockchain contract ID
 * @param {string} expectedHash - Expected contract hash to verify
 * @returns {Promise<Object>} Verification result
 */
const verifyRentalContractOnBlockchain = async (contractId, expectedHash) => {
  try {
    console.log('🔍 Verifying rental contract on blockchain...');
    console.log('Contract ID:', contractId);
    console.log('Expected Hash:', expectedHash);

    const contract = getRentalContractVerificationContract();

    // Get contract data
    const contractData = await contract.getContract(contractId);
    
    console.log('Retrieved contract data from blockchain');

    // Verify hash
    const isValid = await contract.verifyContract(contractId, expectedHash);

    return {
      success: true,
      isValid: isValid,
      contractHash: contractData.contractHash,
      ipfsCID: contractData.ipfsCID,
      landlord: contractData.landlord,
      student: contractData.student,
      timestamp: Number(contractData.timestamp),
      message: isValid ? 'Contract verification successful' : 'Contract hash mismatch'
    };
  } catch (error) {
    console.error('❌ Error verifying rental contract:', error);
    throw new Error(`Failed to verify contract: ${error.message}`);
  }
};

/**
 * Get rental contract details from blockchain
 * @param {number} contractId - Blockchain contract ID
 * @returns {Promise<Object>} Contract details
 */
const getRentalContractFromBlockchain = async (contractId) => {
  try {
    console.log('📄 Fetching rental contract from blockchain...');
    console.log('Contract ID:', contractId);

    const contract = getRentalContractVerificationContract();
    const contractData = await contract.getContract(contractId);

    return {
      success: true,
      contractHash: contractData.contractHash,
      ipfsCID: contractData.ipfsCID,
      landlord: contractData.landlord,
      student: contractData.student,
      timestamp: Number(contractData.timestamp),
      timestampDate: new Date(Number(contractData.timestamp) * 1000).toISOString()
    };
  } catch (error) {
    console.error('❌ Error fetching rental contract:', error);
    throw new Error(`Failed to fetch contract: ${error.message}`);
  }
};

module.exports = {
  getPAXGBalance,
  getDepositedCollateral,
  verifyDepositTransaction,
  getContractAddresses,
  PAXG_TOKEN_ADDRESS,
  COLLATERAL_HOLDER_ADDRESS,
  // Rental Contract Verification
  storeRentalContractOnBlockchain,
  verifyRentalContractOnBlockchain,
  getRentalContractFromBlockchain,
  RENTAL_CONTRACT_VERIFICATION_ADDRESS
};
