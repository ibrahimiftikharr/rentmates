import { ethers, BrowserProvider, Contract } from 'ethers';

// Contract ABIs (simplified for frontend use)
const PAXG_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

const COLLATERAL_HOLDER_ABI = [
  "function depositCollateral(uint256 amount) external",
  "function withdrawCollateral(uint256 amount) external",
  "function getBalance(address student) view returns (uint256)",
  "function getMyBalance() view returns (uint256)",
  "function collateralBalances(address) view returns (uint256)",
  "function totalCollateral() view returns (uint256)"
];

declare global {
  interface Window {
    ethereum?: any;
  }
}

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

/**
 * Connect to MetaMask wallet
 * @returns {Promise<string>} Connected wallet address
 */
export const connectWallet = async (): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    
    // Request account access
    const accounts = await provider.send('eth_requestAccounts', []);
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please connect your MetaMask wallet.');
    }
    
    // Check if connected to Polygon Amoy
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    
    if (chainId !== 80002) {
      // Try to switch to Polygon Amoy
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13882' }], // 80002 in hex
        });
      } catch (switchError: any) {
        // Chain not added, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x13882',
              chainName: 'Polygon Amoy Testnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
              },
              rpcUrls: ['https://rpc-amoy.polygon.technology/'],
              blockExplorerUrls: ['https://amoy.polygonscan.com/']
            }]
          });
        } else {
          throw switchError;
        }
      }
    }
    
    return accounts[0];
  } catch (error: any) {
    console.error('Connect wallet error:', error);
    throw new Error(error.message || 'Failed to connect wallet');
  }
};

/**
 * Get PAXG balance of wallet
 */
export const getPAXGBalance = async (
  walletAddress: string,
  paxgTokenAddress: string
): Promise<string> => {
  try {
    const provider = new BrowserProvider(window.ethereum);
    const paxgContract = new Contract(paxgTokenAddress, PAXG_ABI, provider);
    
    const balance = await paxgContract.balanceOf(walletAddress);
    return ethers.formatEther(balance);
  } catch (error: any) {
    console.error('Get PAXG balance error:', error);
    throw new Error('Failed to fetch PAXG balance');
  }
};

/**
 * Approve PAXG spending by collateral holder contract
 * Only approves if current allowance is insufficient
 */
export const approvePAXG = async (
  paxgTokenAddress: string,
  collateralHolderAddress: string,
  amount: string
): Promise<string | null> => {
  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const paxgContract = new Contract(paxgTokenAddress, PAXG_ABI, signer);
    const userAddress = await signer.getAddress();
    
    const amountWei = ethers.parseEther(amount);
    
    // Check current allowance
    const currentAllowance = await paxgContract.allowance(userAddress, collateralHolderAddress);
    
    // Only approve if current allowance is less than required amount
    if (currentAllowance >= amountWei) {
      console.log('✓ Sufficient allowance already exists, skipping approval');
      return null; // No approval needed
    }
    
    console.log(`Approving ${amount} PAXG for spending...`);
    
    // Send approval transaction
    const tx = await paxgContract.approve(collateralHolderAddress, amountWei);
    
    // Wait for confirmation
    await tx.wait();
    
    console.log('✓ Approval confirmed');
    
    return tx.hash;
  } catch (error: any) {
    console.error('Approve PAXG error:', error);
    throw new Error(error.message || 'Failed to approve PAXG spending');
  }
};

/**
 * Deposit PAXG collateral into the contract
 */
export const depositCollateral = async (
  paxgTokenAddress: string,
  collateralHolderAddress: string,
  amount: string
): Promise<string> => {
  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Approve PAXG spending first (only if needed)
    const approvalTxHash = await approvePAXG(paxgTokenAddress, collateralHolderAddress, amount);
    if (approvalTxHash) {
      console.log('Approval transaction completed:', approvalTxHash);
    }
    
    // Deposit collateral
    const collateralContract = new Contract(
      collateralHolderAddress,
      COLLATERAL_HOLDER_ABI,
      signer
    );
    
    const amountWei = ethers.parseEther(amount);
    
    // Send deposit transaction
    const tx = await collateralContract.depositCollateral(amountWei);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    return receipt.hash;
  } catch (error: any) {
    console.error('Deposit collateral error:', error);
    
    // Parse error message
    let errorMsg = 'Failed to deposit collateral';
    if (error.message.includes('insufficient funds')) {
      errorMsg = 'Insufficient MATIC for gas fees';
    } else if (error.message.includes('user rejected')) {
      errorMsg = 'Transaction rejected by user';
    } else if (error.message.includes('PAXG transfer failed')) {
      errorMsg = 'Insufficient PAXG balance';
    }
    
    throw new Error(errorMsg);
  }
};

/**
 * Get deposited collateral balance
 */
export const getDepositedBalance = async (
  walletAddress: string,
  collateralHolderAddress: string
): Promise<string> => {
  try {
    const provider = new BrowserProvider(window.ethereum);
    const collateralContract = new Contract(
      collateralHolderAddress,
      COLLATERAL_HOLDER_ABI,
      provider
    );
    
    const balance = await collateralContract.getBalance(walletAddress);
    return ethers.formatEther(balance);
  } catch (error: any) {
    console.error('Get deposited balance error:', error);
    throw new Error('Failed to fetch deposited balance');
  }
};

/**
 * Withdraw collateral from the contract
 */
export const withdrawCollateral = async (
  collateralHolderAddress: string,
  amount: string
): Promise<string> => {
  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const collateralContract = new Contract(
      collateralHolderAddress,
      COLLATERAL_HOLDER_ABI,
      signer
    );
    
    const amountWei = ethers.parseEther(amount);
    
    // Send withdraw transaction
    const tx = await collateralContract.withdrawCollateral(amountWei);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    return receipt.hash;
  } catch (error: any) {
    console.error('Withdraw collateral error:', error);
    throw new Error(error.message || 'Failed to withdraw collateral');
  }
};
