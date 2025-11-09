import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Badge } from '@/shared/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Calendar } from '@/shared/ui/calendar';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle, XCircle, CalendarIcon, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type TransactionType = 'Deposit' | 'Withdraw' | 'Loan Repayment';
type TransactionStatus = 'Completed' | 'Pending' | 'Failed';

interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
}

export function WalletPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [network, setNetwork] = useState('');
  const [balance, setBalance] = useState(1250.50);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [autoRepayment, setAutoRepayment] = useState(false);
  const [openPayRentDialog, setOpenPayRentDialog] = useState(false);
  const [isPayingRent, setIsPayingRent] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState<string>('all');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [fromDateOpen, setFromDateOpen] = useState(false);
  const [toDateOpen, setToDateOpen] = useState(false);

  const [transactions] = useState<Transaction[]>([
    { id: '1', date: 'Nov 5, 2025', type: 'Deposit', amount: 500, status: 'Completed' },
    { id: '2', date: 'Nov 4, 2025', type: 'Loan Repayment', amount: 150, status: 'Completed' },
    { id: '3', date: 'Nov 3, 2025', type: 'Withdraw', amount: 200, status: 'Completed' },
    { id: '4', date: 'Nov 2, 2025', type: 'Deposit', amount: 300, status: 'Completed' },
    { id: '5', date: 'Nov 1, 2025', type: 'Loan Repayment', amount: 150, status: 'Pending' },
    { id: '6', date: 'Oct 30, 2025', type: 'Deposit', amount: 400, status: 'Completed' },
    { id: '7', date: 'Oct 28, 2025', type: 'Withdraw', amount: 100, status: 'Completed' },
  ]);

  const nextRepayment = {
    date: 'Nov 15, 2025',
    amount: 150,
    daysUntil: 9,
  };

  const handleConnectWallet = () => {
    // Mock wallet connection
    setTimeout(() => {
      setIsConnected(true);
      setWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
      setNetwork('Ethereum Mainnet');
      toast.success('MetaMask wallet connected successfully!');
    }, 1000);
  };

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setBalance(prev => prev + parseFloat(depositAmount));
    toast.success(`Deposited ${depositAmount} USDT successfully!`);
    setDepositAmount('');
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (parseFloat(withdrawAmount) > balance) {
      toast.error('Insufficient balance');
      return;
    }
    setBalance(prev => prev - parseFloat(withdrawAmount));
    toast.success(`Withdrawn ${withdrawAmount} USDT successfully!`);
    setWithdrawAmount('');
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Pending':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'Failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case 'Completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Pending':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Failed':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const handlePayRent = () => {
    setIsPayingRent(true);
    
    setTimeout(() => {
      if (balance < nextRepayment.amount) {
        setIsPayingRent(false);
        setOpenPayRentDialog(false);
        toast.error('Insufficient balance to pay rent');
        return;
      }

      setBalance(prev => prev - nextRepayment.amount);
      setIsPayingRent(false);
      setOpenPayRentDialog(false);
      toast.success(`Rent of $${nextRepayment.amount} USDT paid successfully!`);
    }, 1500);
  };

  // Filter transactions based on type and date range
  const filteredTransactions = transactions.filter(transaction => {
    // Filter by type
    if (filterType !== 'all' && transaction.type !== filterType) {
      return false;
    }

    // Parse transaction date
    const transactionDate = new Date(transaction.date);

    // Filter by from date
    if (fromDate) {
      const fromDateStart = new Date(fromDate);
      fromDateStart.setHours(0, 0, 0, 0);
      if (transactionDate < fromDateStart) {
        return false;
      }
    }

    // Filter by to date
    if (toDate) {
      const toDateEnd = new Date(toDate);
      toDateEnd.setHours(23, 59, 59, 999);
      if (transactionDate > toDateEnd) {
        return false;
      }
    }

    return true;
  });

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
              >
                <Wallet className="w-5 h-5" />
                <span className="ml-2">Connect Wallet</span>
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
                  />
                </div>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleDeposit}
                >
                  <ArrowDownToLine className="w-4 h-4 mr-2" />
                  Deposit Now
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
                  />
                </div>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={handleWithdraw}
                >
                  <ArrowUpFromLine className="w-4 h-4 mr-2" />
                  Withdraw Now
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
                          <SelectItem value="Deposit">Deposit</SelectItem>
                          <SelectItem value="Withdraw">Withdraw</SelectItem>
                          <SelectItem value="Loan Repayment">Loan Repayment</SelectItem>
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
                      {filteredTransactions.length > 0 ? (
                        filteredTransactions.map((transaction) => (
                          <tr key={transaction.id} className="border-b border-border hover:bg-muted/50">
                            <td className="py-3 px-2 text-sm">{transaction.date}</td>
                            <td className="py-3 px-2">
                              <span className={`text-sm ${
                                transaction.type === 'Deposit' ? 'text-green-600' :
                                transaction.type === 'Withdraw' ? 'text-orange-600' :
                                'text-blue-600'
                              }`}>
                                {transaction.type}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right font-medium">
                              <span className={
                                transaction.type === 'Deposit' ? 'text-green-600' :
                                transaction.type === 'Withdraw' ? 'text-orange-600' :
                                'text-blue-600'
                              }>
                                {transaction.type === 'Deposit' ? '+' : '-'}${transaction.amount}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center justify-center">
                                <Badge variant="outline" className={getStatusColor(transaction.status)}>
                                  {getStatusIcon(transaction.status)}
                                  <span className="ml-1">{transaction.status}</span>
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
                <CardTitle>Repayment Schedule</CardTitle>
                <CardDescription>Upcoming loan repayments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Next Repayment */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Next Repayment</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700">Date:</span>
                      <span className="font-medium text-blue-900">{nextRepayment.date}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700">Amount:</span>
                      <span className="font-medium text-blue-900">${nextRepayment.amount} USDT</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-blue-300">
                      <span className="text-sm text-blue-700">Days Until:</span>
                      <Badge className="bg-blue-600 text-white">
                        {nextRepayment.daysUntil} days
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
                >
                  Pay Rent Now
                </Button>

                {/* Pay Rent Dialog */}
                <Dialog open={openPayRentDialog} onOpenChange={setOpenPayRentDialog}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Pay Rent</DialogTitle>
                      <DialogDescription>
                        Pay the next rent of ${nextRepayment.amount} USDT
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
                          <span className="font-medium text-blue-900">Next Repayment</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-700">Date:</span>
                            <span className="font-medium text-blue-900">{nextRepayment.date}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-700">Amount:</span>
                            <span className="font-medium text-blue-900">${nextRepayment.amount} USDT</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-blue-300">
                            <span className="text-sm text-blue-700">Days Until:</span>
                            <Badge className="bg-blue-600 text-white">
                              {nextRepayment.daysUntil} days
                            </Badge>
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
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
