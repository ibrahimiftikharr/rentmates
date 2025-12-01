import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/ui/card';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { Label } from '../../../shared/ui/label';
import { Switch } from '../../../shared/ui/switch';
import { Badge } from '../../../shared/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../shared/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../../shared/ui/popover';
import { Calendar } from '../../../shared/ui/calendar';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle, XCircle, CalendarIcon, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  connectMetaMask,
  getUSDTBalance,
  depositToVault,
  recordDeposit,
  getWalletBalance,
  connectWalletToBackend,
  withdrawFromVault,
  payRent,
  getTransactionHistory,
  getStudentRentalInfo
} from '../../../shared/services/walletService';

type TransactionType = 'deposit' | 'withdraw' | 'rent_payment' | 'rent_received';
type TransactionStatus = 'completed' | 'pending' | 'failed';

interface Transaction {
  _id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
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

interface RentalInfo {
  rentalId: string;
  propertyTitle: string;
  propertyAddress: string;
  monthlyRent: number;
  rentDueDay: number;
  nextDueDate: string;
  daysUntilDue: number;
  landlord: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  leaseStartDate: string;
  leaseEndDate: string;
  status: string;
}

export function WalletPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('');
  const [balance, setBalance] = useState(0);
  const [onChainBalance, setOnChainBalance] = useState('0');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [autoRepayment, setAutoRepayment] = useState(false);
  const [openPayRentDialog, setOpenPayRentDialog] = useState(false);
  const [isPayingRent, setIsPayingRent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState<string>('all');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [fromDateOpen, setFromDateOpen] = useState(false);
  const [toDateOpen, setToDateOpen] = useState(false);

  // Transaction and rental data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rentalInfo, setRentalInfo] = useState<RentalInfo | null>(null);
  const [hasActiveRental, setHasActiveRental] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingRental, setIsLoadingRental] = useState(false);

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
          setBalance(balanceData.offChainBalance);
          setOnChainBalance(balanceData.onChainBalance);
          setNetwork('Polygon Amoy Testnet');
          
          // Load rental info and transactions after wallet is connected
          loadRentalInfo();
          loadTransactions();
        }
      } catch (error) {
        console.error('Error loading wallet state:', error);
      }
    };

    loadWalletState();
  }, []);

  // Load rental information
  const loadRentalInfo = async () => {
    setIsLoadingRental(true);
    try {
      const response = await getStudentRentalInfo();
      if (response.hasActiveRental && response.rental) {
        setHasActiveRental(true);
        setRentalInfo(response.rental);
      } else {
        setHasActiveRental(false);
        setRentalInfo(null);
      }
    } catch (error) {
      console.error('Error loading rental info:', error);
    } finally {
      setIsLoadingRental(false);
    }
  };

  // Load transactions
  const loadTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const filters: any = {};
      
      if (filterType && filterType !== 'all') {
        filters.type = filterType;
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
      toast.error('Failed to load transaction history');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Reload transactions when filters change
  useEffect(() => {
    if (isConnected) {
      loadTransactions();
    }
  }, [filterType, fromDate, toDate]);

  const handleConnectWallet = async () => {
    setIsProcessing(true);
    try {
      // Connect MetaMask
      const address = await connectMetaMask();
      
      // Connect to backend
      await connectWalletToBackend(address);
      
      // Get balances
      const balanceData = await getWalletBalance();
      const usdtBalance = await getUSDTBalance(address);
      
      setIsConnected(true);
      setWalletAddress(address);
      setBalance(balanceData.offChainBalance);
      setOnChainBalance(usdtBalance);
      setNetwork('Polygon Amoy Testnet');
      
      toast.success('MetaMask wallet connected successfully!');
      
      // Load rental info and transactions after connection
      loadRentalInfo();
      loadTransactions();
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount');
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
      setBalance(balanceData.offChainBalance);
      
      // Refresh on-chain balance
      const usdtBalance = await getUSDTBalance(walletAddress);
      setOnChainBalance(usdtBalance);
      
      toast.success(`Deposited ${depositAmount} USDT successfully!`);
      setDepositAmount('');
      
      // Reload transactions
      loadTransactions();
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error(error.message || 'Deposit failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (parseFloat(withdrawAmount) > balance) {
      toast.error('Insufficient balance');
      return;
    }

    setIsProcessing(true);
    try {
      // Withdraw from vault
      await withdrawFromVault(withdrawAmount);
      
      // Refresh balance
      const balanceData = await getWalletBalance();
      setBalance(balanceData.offChainBalance);
      
      // Refresh on-chain balance
      const usdtBalance = await getUSDTBalance(walletAddress);
      setOnChainBalance(usdtBalance);
      
      toast.success(`Withdrawn ${withdrawAmount} USDT successfully!`);
      setWithdrawAmount('');
      
      // Reload transactions
      loadTransactions();
    } catch (error: any) {
      console.error('Withdraw error:', error);
      toast.error(error.message || 'Withdrawal failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const formatTransactionType = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdraw':
        return 'Withdraw';
      case 'rent_payment':
        return 'Rent Payment';
      case 'rent_received':
        return 'Rent Received';
      default:
        return type;
    }
  };

  const handlePayRent = async () => {
    if (!hasActiveRental || !rentalInfo) {
      toast.error('No active rental found');
      return;
    }

    setIsPayingRent(true);
    
    try {
      if (balance < rentalInfo.monthlyRent) {
        toast.error('Insufficient balance to pay rent');
        setOpenPayRentDialog(false);
        return;
      }

      // Pay rent
      const result = await payRent();
      
      // Refresh balance
      const balanceData = await getWalletBalance();
      setBalance(balanceData.offChainBalance);
      
      setOpenPayRentDialog(false);
      toast.success(`Rent of $${rentalInfo.monthlyRent} USDT paid successfully to ${result.landlordName}!`);
      
      // Reload rental info and transactions
      loadRentalInfo();
      loadTransactions();
    } catch (error: any) {
      console.error('Pay rent error:', error);
      toast.error(error.message || 'Failed to pay rent');
    } finally {
      setIsPayingRent(false);
    }
  };

  // Filter transactions based on type and date range (no longer needed as backend does this)
  const filteredTransactions = transactions;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-4 md:mb-6">
        <h1 className="mb-2">Wallet Management</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Connect your wallet, manage funds, and track transactions
        </p>
      </div>

      {/* Connect Wallet Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Connect Your Wallet
          </CardTitle>
          <CardDescription>
            Connect MetaMask to access all wallet features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="w-10 h-10 text-primary" />
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={handleConnectWallet}
                disabled={isProcessing}
              >
                <Wallet className="w-5 h-5" />
                <span className="ml-2">{isProcessing ? 'Connecting...' : 'Connect Wallet'}</span>
              </Button>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                By connecting your wallet, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium text-green-900">Wallet Connected</span>
                  </div>
                  <Badge className="bg-green-500 text-white">Active</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-green-700 flex-shrink-0">Address:</span>
                    <span className="font-mono text-xs sm:text-sm text-green-900 truncate">{walletAddress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700">Network:</span>
                    <span className="text-sm text-green-900">{network}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsConnected(false);
                  setWalletAddress('');
                  setBalance(0);
                  setOnChainBalance('0');
                  setNetwork('');
                  toast.success('Wallet disconnected');
                }}
                className="mt-3 text-red-600 hover:text-red-700 hover:border-red-300"
              >
                🔴 Disconnect Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage Funds Card */}
      {isConnected && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              USDT Deposits & Withdrawals
            </CardTitle>
            <CardDescription>
              Manage your USDT balance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Balance Display */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 text-center">
              <p className="text-muted-foreground mb-2">Total Wallet Balance</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-semibold text-primary">{balance.toFixed(2)}</span>
                <span className="text-2xl text-muted-foreground">USDT</span>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                On-chain (MetaMask): {parseFloat(onChainBalance).toFixed(2)} USDT
              </p>
            </div>

            {/* Deposit and Withdraw Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Deposit Section */}
              <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <ArrowDownToLine className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Deposit</h3>
                    <p className="text-sm text-muted-foreground">Add USDT to your wallet</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Enter amount (USDT)</Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleDeposit}
                  disabled={isProcessing}
                >
                  <ArrowDownToLine className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Deposit Now'}
                </Button>
              </div>

              {/* Withdraw Section */}
              <div className="space-y-4 p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <ArrowUpFromLine className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Withdraw</h3>
                    <p className="text-sm text-muted-foreground">Withdraw USDT from your wallet</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Enter amount (USDT)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={handleWithdraw}
                  disabled={isProcessing}
                >
                  <ArrowUpFromLine className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Withdraw Now'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction & Repayment Overview */}
      {isConnected && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transaction History */}
            <Card className="shadow-lg lg:col-span-2">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Recent transactions and activities</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-6 space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-primary" />
                    <span className="font-medium">Filter Transactions</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Transaction Type Filter */}
                    <div className="space-y-2">
                      <Label>Transaction Type</Label>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="deposit">Deposit</SelectItem>
                          <SelectItem value="withdraw">Withdraw</SelectItem>
                          <SelectItem value="rent_payment">Rent Payment</SelectItem>
                          <SelectItem value="rent_received">Rent Received</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* From Date Filter */}
                    <div className="space-y-2">
                      <Label>From Date</Label>
                      <Popover open={fromDateOpen} onOpenChange={setFromDateOpen} modal={true}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setFromDateOpen(true);
                            }}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fromDate ? format(fromDate, 'MMM d, yyyy') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start" side="bottom">
                          <Calendar
                            mode="single"
                            selected={fromDate}
                            onSelect={(date) => {
                              setFromDate(date);
                              setFromDateOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* To Date Filter */}
                    <div className="space-y-2">
                      <Label>To Date</Label>
                      <Popover open={toDateOpen} onOpenChange={setToDateOpen} modal={true}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setToDateOpen(true);
                            }}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {toDate ? format(toDate, 'MMM d, yyyy') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start" side="bottom">
                          <Calendar
                            mode="single"
                            selected={toDate}
                            onSelect={(date) => {
                              setToDate(date);
                              setToDateOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {(filterType !== 'all' || fromDate || toDate) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterType('all');
                        setFromDate(undefined);
                        setToDate(undefined);
                        toast.success('Filters cleared');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Transaction Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2">Date</th>
                        <th className="text-left py-3 px-2">Type</th>
                        <th className="text-right py-3 px-2">Amount</th>
                        <th className="text-center py-3 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingTransactions ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-muted-foreground">
                            Loading transactions...
                          </td>
                        </tr>
                      ) : filteredTransactions.length > 0 ? (
                        filteredTransactions.map((transaction) => (
                          <tr key={transaction._id} className="border-b border-border hover:bg-muted/50">
                            <td className="py-3 px-2 text-sm">
                              {new Date(transaction.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="py-3 px-2">
                              <span className={`text-sm ${
                                transaction.type === 'deposit' ? 'text-green-600' :
                                transaction.type === 'withdraw' ? 'text-orange-600' :
                                'text-blue-600'
                              }`}>
                                {formatTransactionType(transaction.type)}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right font-medium">
                              <span className={
                                transaction.type === 'deposit' || transaction.type === 'rent_received' ? 'text-green-600' :
                                'text-orange-600'
                              }>
                                {transaction.type === 'deposit' || transaction.type === 'rent_received' ? '+' : '-'}${transaction.amount.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center justify-center">
                                <Badge variant="outline" className={getStatusColor(transaction.status)}>
                                  {getStatusIcon(transaction.status)}
                                  <span className="ml-1 capitalize">{transaction.status}</span>
                                </Badge>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-muted-foreground">
                            No transactions found matching the selected filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Repayment Schedule */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Rent Payment Schedule</CardTitle>
                <CardDescription>Upcoming rent payment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingRental ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading rental information...
                  </div>
                ) : !hasActiveRental || !rentalInfo ? (
                  <div className="text-center py-8 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                      <Clock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No active rental found</p>
                    <p className="text-sm text-muted-foreground">Rent payment information will appear here once you have an active rental.</p>
                  </div>
                ) : (
                  <>
                    {/* Next Repayment */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900">Next Rent Payment</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700">Property:</span>
                          <span className="font-medium text-blue-900 text-right text-sm">{rentalInfo.propertyTitle}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700">Date:</span>
                          <span className="font-medium text-blue-900">
                            {new Date(rentalInfo.nextDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-700">Amount:</span>
                          <span className="font-medium text-blue-900">${rentalInfo.monthlyRent} USDT</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-blue-300">
                          <span className="text-sm text-blue-700">Days Until:</span>
                          <Badge className="bg-blue-600 text-white">
                            {rentalInfo.daysUntilDue} {rentalInfo.daysUntilDue === 1 ? 'day' : 'days'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                {/* Auto Repayment Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex-1 pr-4">
                      <Label htmlFor="auto-repayment" className="cursor-pointer">
                        Auto-trigger repayments
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Automatically pay on due date
                      </p>
                    </div>
                    <Switch
                      id="auto-repayment"
                      checked={autoRepayment}
                      onCheckedChange={(checked) => {
                        setAutoRepayment(checked);
                        toast.success(
                          checked 
                            ? 'Auto-repayment enabled' 
                            : 'Auto-repayment disabled'
                        );
                      }}
                    />
                  </div>
                  {autoRepayment && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        ✓ Repayments will be automatically processed on the due date
                      </p>
                    </div>
                  )}
                </div>

                    {/* Pay Rent Now Button */}
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 h-11"
                      onClick={() => setOpenPayRentDialog(true)}
                      disabled={!hasActiveRental || !rentalInfo}
                    >
                      Pay Rent Now
                    </Button>
                  </>
                )}

                {/* Pay Rent Dialog */}
                {hasActiveRental && rentalInfo && (
                  <Dialog open={openPayRentDialog} onOpenChange={setOpenPayRentDialog}>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Pay Rent</DialogTitle>
                        <DialogDescription>
                          Pay the next rent of ${rentalInfo.monthlyRent} USDT for {rentalInfo.propertyTitle}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 text-center">
                          <p className="text-muted-foreground mb-2">Total Wallet Balance</p>
                          <div className="flex items-baseline justify-center gap-2">
                            <span className="text-5xl font-semibold text-primary">{balance.toFixed(2)}</span>
                            <span className="text-2xl text-muted-foreground">USDT</span>
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-5 h-5 text-blue-600" />
                            <span className="font-medium text-blue-900">Rent Payment</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-blue-700">Property:</span>
                              <span className="font-medium text-blue-900 text-right text-sm">{rentalInfo.propertyTitle}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-blue-700">Landlord:</span>
                              <span className="font-medium text-blue-900">{rentalInfo.landlord.name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-blue-700">Due Date:</span>
                              <span className="font-medium text-blue-900">
                                {new Date(rentalInfo.nextDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-blue-300">
                              <span className="text-sm text-blue-700">Amount:</span>
                              <span className="font-medium text-blue-900 text-lg">${rentalInfo.monthlyRent} USDT</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={handlePayRent}
                          disabled={isPayingRent}
                        >
                          {isPayingRent ? 'Paying...' : 'Pay Rent'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
