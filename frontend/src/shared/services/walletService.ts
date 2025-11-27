import { ethers } from 'ethers';

// Contract addresses
export const USDT_ADDRESS = '0x93A7B3819f95Fb563ED6A042AA6268ac0fB7C083';
export const VAULT_ADDRESS = '0x9a0070e5C9f1E1d75F105B85F93f955e2656Aa22';

// Contract ABIs
const USDT_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const VAULT_ABI = [
  "function deposit(uint256 amount) external"
];

// API base URL
const API_URL = 'http://localhost:5000/api';

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
 * Connect to MetaMask and get user's wallet address
 */
export const connectMetaMask = async (): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found in MetaMask');
    }

    const walletAddress = accounts[0];
    
    // Check if on correct network (Polygon Amoy testnet)
    await switchToAmoyNetwork();
    
    return walletAddress;
  } catch (error: any) {
    console.error('MetaMask connection error:', error);
    throw new Error(error.message || 'Failed to connect to MetaMask');
  }
};

/**
 * Switch to Polygon Amoy testnet
 */
export const switchToAmoyNetwork = async (): Promise<void> => {
  const amoyChainId = '0x13882'; // 80002 in hex

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: amoyChainId }],
    });
  } catch (switchError: any) {
    // Chain not added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: amoyChainId,
              chainName: 'Polygon Amoy Testnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
              },
              rpcUrls: ['https://rpc-amoy.polygon.technology'],
              blockExplorerUrls: ['https://amoy.polygonscan.com/']
            }
          ]
        });
      } catch (addError) {
        throw new Error('Failed to add Polygon Amoy network to MetaMask');
      }
    } else {
      throw switchError;
    }
  }
};

/**
 * Get USDT balance from user's wallet
 */
export const getUSDTBalance = async (walletAddress: string): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);
    
    const balance = await usdtContract.balanceOf(walletAddress);
    return ethers.formatUnits(balance, 6); // USDT has 6 decimals
  } catch (error) {
    console.error('Error getting USDT balance:', error);
    throw error;
  }
};

/**
 * Approve vault to spend USDT
 */
export const approveUSDT = async (amount: string): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
    
    const amountInWei = ethers.parseUnits(amount, 6);
    const tx = await usdtContract.approve(VAULT_ADDRESS, amountInWei);
    const receipt = await tx.wait();
    
    return receipt.hash;
  } catch (error: any) {
    console.error('Approval error:', error);
    throw new Error(error.message || 'Failed to approve USDT');
  }
};

/**
 * Check USDT allowance for vault
 */
export const checkAllowance = async (walletAddress: string): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);
    
    const allowance = await usdtContract.allowance(walletAddress, VAULT_ADDRESS);
    return ethers.formatUnits(allowance, 6);
  } catch (error) {
    console.error('Error checking allowance:', error);
    throw error;
  }
};

/**
 * Deposit USDT to vault
 */
export const depositToVault = async (amount: string): Promise<string> => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const vaultContract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
    
    const amountInWei = ethers.parseUnits(amount, 6);
    
    // Check if approval is needed
    const walletAddress = await signer.getAddress();
    const allowanceStr = await checkAllowance(walletAddress);
    const allowance = parseFloat(allowanceStr);
    
    if (allowance < parseFloat(amount)) {
      // Need approval first
      console.log('Insufficient allowance, requesting approval...');
      await approveUSDT(amount);
    }
    
    // Deposit to vault
    const tx = await vaultContract.deposit(amountInWei);
    const receipt = await tx.wait();
    
    return receipt.hash;
  } catch (error: any) {
    console.error('Deposit error:', error);
    throw new Error(error.message || 'Failed to deposit USDT');
  }
};

// ========================================
// Backend API Calls
// ========================================

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No auth token found in localStorage');
  }
  return token || '';
};

/**
 * Connect wallet to backend (save wallet address)
 */
export const connectWalletToBackend = async (walletAddress: string) => {
  try {
    console.log('Connecting wallet to backend:', walletAddress);
    const token = getAuthToken();
    console.log('Auth token present:', !!token);
    
    const response = await fetch(`${API_URL}/wallet/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ walletAddress })
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Backend error:', error);
      throw new Error(error.error || 'Failed to connect wallet to backend');
    }

    const result = await response.json();
    console.log('Wallet connected successfully:', result);
    return result;
  } catch (error: any) {
    console.error('Error in connectWalletToBackend:', error);
    throw error;
  }
};

/**
 * Get wallet balance from backend
 */
export const getWalletBalance = async () => {
  try {
    console.log('Fetching wallet balance from backend');
    const token = getAuthToken();
    console.log('Auth token present:', !!token);
    
    const response = await fetch(`${API_URL}/wallet/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Balance response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Balance fetch error:', error);
      throw new Error(error.error || 'Failed to fetch balance');
    }

    const result = await response.json();
    console.log('Balance fetched successfully:', result);
    return result;
  } catch (error: any) {
    console.error('Error in getWalletBalance:', error);
    throw error;
  }
};

/**
 * Record deposit in backend
 */
export const recordDeposit = async (amount: string, txHash: string) => {
  const response = await fetch(`${API_URL}/wallet/deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ amount, txHash })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to record deposit');
  }

  return await response.json();
};

/**
 * Withdraw USDT from vault
 */
export const withdrawFromVault = async (amount: string) => {
  const response = await fetch(`${API_URL}/wallet/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ amount })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to withdraw');
  }

  return await response.json();
};

/**
 * Pay rent (off-chain transfer)
 */
export const payRent = async (landlordId: string, amount?: number) => {
  const response = await fetch(`${API_URL}/wallet/pay-rent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ landlordId, amount })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to pay rent');
  }

  return await response.json();
};

/**
 * Get vault info
 */
export const getVaultInfo = async () => {
  const response = await fetch(`${API_URL}/wallet/vault-info`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch vault info');
  }

  return await response.json();
};
