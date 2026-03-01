import { useState, useEffect } from 'react';
import { 
  Wallet,
  Info,
  TrendingUp,
  Download,
  Upload,
  Filter,
  Calendar as CalendarIcon,
  Check,
  Clock,
  X as XIcon
} from 'lucide-react';
import { Card } from '../../../shared/ui/card';
import { Button } from '../../../shared/ui/button';
import { Badge } from '../../../shared/ui/badge';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../shared/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../../../shared/ui/popover';
import { Calendar } from '../../../shared/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../shared/ui/dialog';
import {
  connectMetaMask,
  getUSDTBalance,
  depositToVault,
  recordDeposit,
  getWalletBalance,
  connectWalletToBackend,
  withdrawFromVault,
  getTransactionHistory
} from '../../../shared/services/walletService';

interface Transaction {
  _id: string;
  type: 'deposit' | 'withdraw' | 'rent_payment' | 'rent_received';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  description?: string;
  txHash?: string;
  relatedUser?: {
    name: string;
    email: string;
  };
  rental?: {
    propertyInfo: {
      title: string;
      address: string;
    };
  };
}

export function WalletPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [fromDateOpen, setFromDateOpen] = useState(false);
  const [toDateOpen, setToDateOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState('0');
  const [onChainBalance, setOnChainBalance] = useState('0');
  const [totalRentalEarnings, setTotalRentalEarnings] = useState('0');

  const network = 'Polygon Amoy Testnet';

  // Load transactions
  const loadTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const filters: any = {};
      
      if (typeFilter && typeFilter !== 'all') {
        filters.type = typeFilter;
      }
      
      if (fromDate) {
        filters.fromDate = fromDate.toISOString();
      }
      
      if (toDate) {
        filters.toDate = toDate.toISOString();
      }

      const response = await getTransactionHistory(filters);
      setTransactions(response.transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setShowToast({ message: 'Failed to load transaction history', type: 'error' });
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Reload transactions when filters change
  useEffect(() => {
    if (isConnected) {
      loadTransactions();
    }
  }, [typeFilter, fromDate, toDate, isConnected]);

  // Load wallet state on mount
  useEffect(() => {
    const loadWalletState = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const balanceData = await getWalletBalance();
        if (balanceData.walletAddress) {
          setIsConnected(true);
          setWalletAddress(balanceData.walletAddress);
          setBalance(balanceData.offChainBalance.toString());
          setOnChainBalance(balanceData.onChainBalance);
          setTotalRentalEarnings(balanceData.totalRentalEarnings?.toString() || '0');
          
          // Load transactions after wallet is connected
          loadTransactions();
        }
      } catch (error) {
        console.error('Error loading wallet state:', error);
      }
    };

    loadWalletState();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200 whitespace-nowrap">✅ Completed</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500/10 text-orange-700 border-orange-200 whitespace-nowrap">⏳ Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-700 border-red-200 whitespace-nowrap">❌ Failed</Badge>;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdraw':
        return 'Withdrawal';
      case 'rent_payment':
        return 'Rent Payment';
      case 'rent_received':
        return 'Rent Received';
      default:
        return type;
    }
  };

  // Filter transactions - now done by backend
  const filteredTransactions = transactions;

  const clearDateRange = () => {
    setFromDate(undefined);
    setToDate(undefined);
  };

  const handleConnect = async () => {
    setIsProcessing(true);
    try {
      // Connect MetaMask
      const address = await connectMetaMask();
      
      // Connect to backend
      await connectWalletToBackend(address);
      
      // Update localStorage user object with wallet address
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.walletAddress = address;
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      // Get balances
      const balanceData = await getWalletBalance();
      const usdtBalance = await getUSDTBalance(address);
      
      setIsConnected(true);
      setWalletAddress(address);
      setBalance(balanceData.offChainBalance.toString());
      setOnChainBalance(usdtBalance);
      setTotalRentalEarnings(balanceData.totalRentalEarnings?.toString() || '0');
      
      showSuccessToast('✅ Wallet connected successfully!');
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      showErrorToast(error.message || 'Failed to connect wallet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress('');
    setBalance('0');
    showSuccessToast('Wallet disconnected');
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      showErrorToast('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    try {
      // Deposit to vault
      const txHash = await depositToVault(depositAmount);
      
      // Record deposit in backend
      await recordDeposit(depositAmount, txHash);
      
      // Refresh balance
      const balanceData = await getWalletBalance();
      setBalance(balanceData.offChainBalance.toString());
      setTotalRentalEarnings(balanceData.totalRentalEarnings?.toString() || '0');
      
      setShowDepositModal(false);
      setDepositAmount('');
      showSuccessToast('✅ Deposit initiated successfully!');
      
      // Reload transactions
      loadTransactions();
    } catch (error: any) {
      console.error('Deposit error:', error);
      showErrorToast(error.message || 'Deposit failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      showErrorToast('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawAmount) > parseFloat(balance)) {
      showErrorToast('Insufficient balance');
      return;
    }

    setIsProcessing(true);
    try {
      // Withdraw from vault
      await withdrawFromVault(withdrawAmount);
      
      // Refresh balance
      const balanceData = await getWalletBalance();
      setBalance(balanceData.offChainBalance.toString());
      setTotalRentalEarnings(balanceData.totalRentalEarnings?.toString() || '0');
      
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      showSuccessToast('✅ Withdrawal request submitted!');
      
      // Reload transactions
      loadTransactions();
    } catch (error: any) {
      console.error('Withdraw error:', error);
      showErrorToast(error.message || 'Withdrawal failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const showSuccessToast = (message: string) => {
    setShowToast({ message, type: 'success' });
    setTimeout(() => setShowToast(null), 3000);
  };

  const showErrorToast = (message: string) => {
    setShowToast({ message, type: 'error' });
    setTimeout(() => setShowToast(null), 3000);
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-[#4A4A68]">💼 Wallet Management</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="focus:outline-none">
                  <Info className="h-5 w-5 text-[#8C57FF] cursor-help" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">All transactions occur securely through blockchain smart contracts.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-muted-foreground text-sm md:text-base">Connect your wallet, manage funds, and track on-chain earnings.</p>
      </div>

      {/* Wallet Connection Panel */}
      <Card className="p-4 md:p-6 mb-4 md:mb-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 md:h-6 md:w-6 text-[#8C57FF]" />
                <h3 className="text-[#4A4A68]">Wallet Connection</h3>
              </div>
              {isConnected ? (
                <Badge className="bg-green-500/10 text-green-700 border-green-200 w-fit">✅ Wallet Connected</Badge>
              ) : (
                <Badge className="bg-gray-500/10 text-gray-700 border-gray-200 w-fit">⚠️ Wallet Not Connected</Badge>
              )}
            </div>
            
            {isConnected && (
              <div className="space-y-2 sm:ml-7 md:ml-9">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <p className="text-sm text-muted-foreground">Address:</p>
                  <code className="text-xs sm:text-sm text-[#4A4A68] bg-[#F4F5FA] px-2 py-1 rounded">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}
                  </code>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <p className="text-sm text-muted-foreground">Network:</p>
                  <p className="text-sm text-[#4A4A68]">{network}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {!isConnected ? (
              <Button
                onClick={handleConnect}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                disabled={isProcessing}
              >
                {isProcessing ? '⏳ Connecting...' : '🟩 Connect Wallet'}
              </Button>
            ) : (
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:border-red-300 w-full sm:w-auto"
              >
                🔴 Disconnect Wallet
              </Button>
            )}
          </div>
        </div>
        {!isConnected && (
          <p className="text-xs text-muted-foreground mt-4 sm:ml-7 md:ml-9">
            Connect MetaMask to enable all wallet features.
          </p>
        )}
      </Card>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        <Card className="p-4 md:p-6 shadow-lg border-l-4 border-l-[#8C57FF]">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 md:h-5 md:w-5 text-[#8C57FF]" />
                <p className="text-xs md:text-sm text-muted-foreground">Total Wallet Balance</p>
              </div>
              <h2 className="text-[#4A4A68] mb-1">{balance} USDT</h2>
              <p className="text-xs text-muted-foreground">Includes deposits and earned rent</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#8C57FF]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Wallet className="h-5 w-5 md:h-6 md:w-6 text-[#8C57FF]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 shadow-lg border-l-4 border-l-green-500">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                <p className="text-xs md:text-sm text-muted-foreground">Total Earnings from Rentals</p>
              </div>
              <h2 className="text-[#4A4A68] mb-1">{totalRentalEarnings} USDT</h2>
              <p className="text-xs text-muted-foreground">Earnings from tenant rent payments</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Deposit & Withdraw Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
        <Card className="p-4 md:p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/20 transition-colors">
              <Upload className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-[#4A4A68] mb-1 text-sm md:text-base">💰 Add USDT to your wallet</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-3">Transfers USDT from your connected wallet into the platform wallet.</p>
              <Button 
                onClick={() => setShowDepositModal(true)}
                className="bg-blue-600 hover:bg-blue-700 w-full text-sm"
                disabled={!isConnected || isProcessing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Deposit Now
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition-colors">
              <Download className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-[#4A4A68] mb-1 text-sm md:text-base">💸 Withdraw USDT from your wallet</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-3">Send your rental earnings to your external wallet.</p>
              <Button 
                onClick={() => setShowWithdrawModal(true)}
                className="bg-green-600 hover:bg-green-700 w-full text-sm"
                disabled={!isConnected || isProcessing}
              >
                <Download className="h-4 w-4 mr-2" />
                Withdraw Now
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="shadow-lg">
        <div className="p-4 md:p-6 border-b">
          <h3 className="text-[#4A4A68] mb-1">Transaction History</h3>
          <p className="text-xs md:text-sm text-muted-foreground">View all deposits, withdrawals, and rental income transactions.</p>
        </div>

        {/* Filters */}
        <div className="p-3 md:p-4 border-b bg-[#F4F5FA]/50 flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px] md:w-[200px]">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdraw">Withdrawal</SelectItem>
              <SelectItem value="rent_received">Rent Received</SelectItem>
              <SelectItem value="rent_payment">Rent Payment</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-full sm:w-[180px] md:w-[200px]">
            <Button 
              variant="outline" 
              className="w-full justify-start text-left"
              onClick={() => setFromDateOpen(!fromDateOpen)}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span className="truncate">
                {fromDate ? fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'From Date'}
              </span>
            </Button>
            {fromDateOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={(date) => {
                    setFromDate(date);
                    setFromDateOpen(false);
                  }}
                  initialFocus
                />
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-[180px] md:w-[200px]">
            <Button 
              variant="outline" 
              className="w-full justify-start text-left"
              onClick={() => setToDateOpen(!toDateOpen)}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span className="truncate">
                {toDate ? toDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'To Date'}
              </span>
            </Button>
            {toDateOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={(date) => {
                    setToDate(date);
                    setToDateOpen(false);
                  }}
                  initialFocus
                />
              </div>
            )}
          </div>

          {(fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDateRange}
              className="text-[#8C57FF] hover:text-[#7645E8] w-full sm:w-auto"
            >
              <XIcon className="h-4 w-4 mr-1" />
              Clear Dates
            </Button>
          )}
        </div>

        {/* Table with Horizontal Scroll */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full w-full">
              <thead>
                <tr className="border-b bg-[#F4F5FA]">
                  <th className="text-left py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-[#8C57FF] whitespace-nowrap">Date</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-[#8C57FF] whitespace-nowrap">Type</th>
                  <th className="text-left py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-[#8C57FF] min-w-[200px]">Description</th>
                  <th className="text-right py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-[#8C57FF] whitespace-nowrap">Amount</th>
                  <th className="text-center py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-[#8C57FF] whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTransactions ? (
                  <tr>
                    <td colSpan={5} className="py-8 md:py-12 text-center text-muted-foreground text-sm">
                      Loading transactions...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 md:py-12 text-center text-muted-foreground text-sm">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction._id} className="border-b hover:bg-[#F4F5FA]/30 transition-colors">
                      <td className="py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-[#4A4A68] whitespace-nowrap">
                        {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-[#4A4A68] whitespace-nowrap">
                        {getTypeLabel(transaction.type)}
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-muted-foreground">
                        {transaction.description || (transaction.rental?.propertyInfo?.title ? `Transaction for ${transaction.rental.propertyInfo.title}` : 'No description')}
                      </td>
                      <td className={`py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-right whitespace-nowrap ${
                        transaction.type === 'deposit' || transaction.type === 'rent_received' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaction.type === 'deposit' || transaction.type === 'rent_received' ? '+' : '-'}
                        ${transaction.amount.toFixed(2)}
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-6 text-center">
                        {getStatusBadge(transaction.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="p-4 md:p-6 max-w-md w-full">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="h-5 w-5 text-blue-600" />
              <h3 className="text-[#4A4A68]">Deposit USDT</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Enter the amount of USDT you want to deposit from your connected wallet.
            </p>
            <div className="mb-6">
              <Label className="text-sm text-[#4A4A68] mb-2 block">Amount (USDT)</Label>
              <Input 
                type="number" 
                min="0"
                step="0.01"
                placeholder="0.00" 
                value={depositAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseFloat(val) >= 0) {
                    setDepositAmount(val);
                  }
                }}
                onKeyDown={(e) => e.key === '-' && e.preventDefault()}
                disabled={isProcessing}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C57FF]"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDepositModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleDeposit}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  '⏳ Processing...'
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirm Deposit
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="p-4 md:p-6 max-w-md w-full">
            <div className="flex items-center gap-2 mb-4">
              <Download className="h-5 w-5 text-green-600" />
              <h3 className="text-[#4A4A68]">Withdraw USDT</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Enter the amount of USDT you want to withdraw to your external wallet.
            </p>
            <div className="mb-4">
              <Label className="text-sm text-[#4A4A68] mb-2 block">Amount (USDT)</Label>
              <Input 
                type="number" 
                min="0"
                step="0.01"
                placeholder="0.00" 
                value={withdrawAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseFloat(val) >= 0) {
                    setWithdrawAmount(val);
                  }
                }}
                onKeyDown={(e) => e.key === '-' && e.preventDefault()}
                disabled={isProcessing}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C57FF]"
              />
            </div>
            <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-200 rounded-lg">
              <p className="text-xs text-[#4A4A68]">
                Available balance: <strong>{balance} USDT</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                A small gas fee will be applied to this transaction.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowWithdrawModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleWithdraw}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  '⏳ Processing...'
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirm Withdrawal
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Toast Notifications */}
      {showToast && (
        <div className={`fixed bottom-4 right-4 px-4 md:px-6 py-2 md:py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 ${
          showToast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white text-sm md:text-base max-w-[90vw] md:max-w-none`}>
          {showToast.type === 'success' ? (
            <Check className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
          ) : (
            <XIcon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
          )}
          <span className="truncate">{showToast.message}</span>
        </div>
      )}
    </div>
  );
}
