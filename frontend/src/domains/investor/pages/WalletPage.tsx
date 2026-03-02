import { useState, useEffect } from "react";
import { Wallet, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Copy, Filter, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { WithdrawalModal } from "../components/modals/WithdrawalModal";
import { DepositModal } from "../components/modals/DepositModal";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import {
  connectMetaMask,
  getWalletBalance,
  connectWalletToBackend,
  getTransactionHistory
} from "../../../shared/services/walletService";

type TransactionType = 'deposit' | 'withdraw' | 'investment_income';
type TransactionStatus = 'completed' | 'pending' | 'failed';

interface Transaction {
  _id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  description?: string;
  txHash?: string;
}

export function WalletPage() {
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [offChainBalance, setOffChainBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [onChainBalance, setOnChainBalance] = useState("0");
  const [network, setNetwork] = useState("Polygon Amoy Testnet");
  const [isConnecting, setIsConnecting] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Load wallet state on mount
  useEffect(() => {
    const loadWalletState = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const balanceData = await getWalletBalance();
        if (balanceData.walletAddress) {
          setIsWalletConnected(true);
          setWalletAddress(balanceData.walletAddress);
          setOffChainBalance(balanceData.offChainBalance || 0);
          setOnChainBalance(balanceData.onChainBalance || "0");
          setTotalEarnings(balanceData.totalInvestmentEarnings || 0);
          
          // Load transactions
          loadTransactions();
        }
      } catch (error) {
        console.error('Error loading wallet state:', error);
      }
    };

    loadWalletState();
  }, []);

  // Load transactions
  const loadTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      const txData = await getTransactionHistory();
      setTransactions(txData.transactions || []);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Connect wallet handler
  const handleConnectWallet = async () => {
    try {
      setIsConnecting(true);
      
      // Connect MetaMask
      const address = await connectMetaMask();
      toast.success('MetaMask connected!');
      
      // Save to backend
      await connectWalletToBackend(address);
      
      // Fetch updated balance
      const balanceData = await getWalletBalance();
      
      setIsWalletConnected(true);
      setWalletAddress(address);
      setOffChainBalance(balanceData.offChainBalance || 0);
      setOnChainBalance(balanceData.onChainBalance || "0");
      setTotalEarnings(balanceData.totalInvestmentEarnings || 0);
      
      toast.success('Wallet connected successfully!');
      
      // Load transactions
      loadTransactions();
    } catch (error: any) {
      console.error('Connect wallet error:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success('Address copied to clipboard');
    }
  };

  const handleDepositSuccess = async () => {
    // Refresh balance and transactions after deposit
    try {
      const balanceData = await getWalletBalance();
      setOffChainBalance(balanceData.offChainBalance || 0);
      setOnChainBalance(balanceData.onChainBalance || "0");
      loadTransactions();
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  const handleWithdrawSuccess = async () => {
    // Refresh balance and transactions after withdrawal
    try {
      const balanceData = await getWalletBalance();
      setOffChainBalance(balanceData.offChainBalance || 0);
      setOnChainBalance(balanceData.onChainBalance || "0");
      loadTransactions();
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    // Filter by type
    if (filterType !== "all" && tx.type !== filterType) return false;

    // Filter by date range
    if (fromDate || toDate) {
      const txDate = new Date(tx.createdAt);
      if (fromDate && txDate < new Date(fromDate)) return false;
      if (toDate && txDate > new Date(toDate)) return false;
    }

    return true;
  });

  const getTransactionBadgeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'withdraw':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'investment_income':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdraw':
        return 'Withdrawal';
      case 'investment_income':
        return 'Investment Income';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="mb-1 md:mb-2 text-xl md:text-2xl">Wallet Management</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Manage your funds and view transaction history
        </p>
      </div>

      {/* Wallet Connection Card */}
      <Card className="border-0 shadow-2xl hover:shadow-[0_20px_50px_rgba(140,87,255,0.15)] transition-shadow duration-300">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Wallet className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Wallet Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isWalletConnected ? (
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                  Wallet Connected
                </Badge>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Address:</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs md:text-sm">{formatAddress(walletAddress)}</p>
                    <button onClick={handleCopyAddress} className="text-primary hover:text-primary/75 p-1">
                      <Copy className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Network:</p>
                  <p className="text-xs md:text-sm">{network}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setIsWalletConnected(false);
                  setWalletAddress("");
                  setOffChainBalance(0);
                  setOnChainBalance("0");
                  setTotalEarnings(0);
                  setTransactions([]);
                }}
                className="mt-3 md:mt-4 w-full md:w-auto border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                size="sm"
              >
                Disconnect Wallet
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <p className="text-xs md:text-sm text-muted-foreground mb-4">No wallet connected</p>
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="bg-gradient-to-r from-primary to-[#7367F0] hover:opacity-90 w-full md:w-auto"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Wallet'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {/* Total Wallet Balance */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6">
            <div className="mb-2">
              <p className="text-xs md:text-sm text-muted-foreground mb-2">Total Wallet Balance</p>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-1 md:mb-2">
                {offChainBalance.toFixed(2)} USDT
              </h2>
              <p className="text-[10px] md:text-xs text-muted-foreground">Includes deposits and earned interest</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Earnings */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6">
            <div className="mb-2">
              <p className="text-xs md:text-sm text-muted-foreground mb-2">Total Earnings from Investments</p>
              <h2 className="text-3xl md:text-4xl font-bold text-green-600 mb-1 md:mb-2">
                {totalEarnings.toFixed(2)} USDT
              </h2>
              <p className="text-[10px] md:text-xs text-muted-foreground">Earnings from student loan payments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deposit and Withdraw Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Add USDT */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6">
            <div className="mb-3 md:mb-4">
              <h3 className="mb-1 md:mb-2 flex items-center gap-2 text-base md:text-lg">
                💰 Add USDT to your wallet
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Transfers USDT from your connected wallet into the platform wallet.
              </p>
            </div>
            <Button
              onClick={() => setIsDepositModalOpen(true)}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:opacity-90 text-sm md:text-base"
            >
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Deposit Now
            </Button>
          </CardContent>
        </Card>

        {/* Withdraw USDT */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6">
            <div className="mb-3 md:mb-4">
              <h3 className="mb-1 md:mb-2 flex items-center gap-2 text-base md:text-lg">
                💸 Withdraw USDT from your wallet
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">Sends USDT from your platform wallet into the connected wallet.</p>
            </div>
            <Button
              onClick={() => setIsWithdrawalModalOpen(true)}
              className="w-full bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-sm md:text-base"
            >
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              Withdraw Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-base md:text-lg">Transaction History</CardTitle>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            View all deposits, withdrawals, and income transactions.
          </p>
        </CardHeader>
        <CardContent>
          {/* Date Filters and Type Filter */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="flex-1">
              <label className="text-xs md:text-sm text-muted-foreground mb-1.5 md:mb-2 block">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs md:text-sm text-muted-foreground mb-1.5 md:mb-2 block">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs md:text-sm text-muted-foreground mb-1.5 md:mb-2 block">Filter by Type</label>
              <Select onValueChange={setFilterType} value={filterType}>
                <SelectTrigger className="w-full text-sm">
                  <Filter className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="earnings">Earnings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transaction Table - Desktop */}
          <div className="hidden md:block rounded-lg border overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-accent/50">
                <tr>
                  <th className="text-left p-2 md:p-3 text-xs md:text-sm font-medium">Date</th>
                  <th className="text-left p-2 md:p-3 text-xs md:text-sm font-medium">Type</th>
                  <th className="text-left p-2 md:p-3 text-xs md:text-sm font-medium">Description</th>
                  <th className="text-right p-2 md:p-3 text-xs md:text-sm font-medium">Amount</th>
                  <th className="text-center p-2 md:p-3 text-xs md:text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoadingTransactions ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-accent/30 transition-colors">
                      <td className="p-2 md:p-3 text-xs md:text-sm whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="p-2 md:p-3 text-xs md:text-sm">
                        <Badge variant="secondary" className={`text-[10px] md:text-xs ${getTransactionBadgeColor(tx.type)}`}>
                          {getTransactionLabel(tx.type)}
                        </Badge>
                      </td>
                      <td className="p-2 md:p-3 text-xs md:text-sm text-muted-foreground">
                        {tx.description || 'No description'}
                      </td>
                      <td className={`p-2 md:p-3 text-xs md:text-sm text-right font-medium whitespace-nowrap ${
                        tx.type === 'deposit' || tx.type === 'investment_income' ? 'text-green-600' : 'text-foreground'
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'investment_income' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </td>
                      <td className="p-2 md:p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {tx.status === 'completed' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                              <span className="text-[10px] md:text-xs text-green-600">Completed</span>
                            </>
                          ) : tx.status === 'failed' ? (
                            <>
                              <XCircle className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                              <span className="text-[10px] md:text-xs text-red-600">Failed</span>
                            </>
                          ) : (
                            <>
                              <Loader2 className="h-3 w-3 md:h-4 md:w-4 text-yellow-600 animate-spin" />
                              <span className="text-[10px] md:text-xs text-yellow-600">Pending</span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Transaction Cards - Mobile */}
          <div className="md:hidden space-y-3">
            {isLoadingTransactions ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No transactions found
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <Card key={tx._id} className="border shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className={`text-[10px] ${getTransactionBadgeColor(tx.type)}`}>
                            {getTransactionLabel(tx.type)}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{formatDate(tx.createdAt)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{tx.description || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {tx.status === 'completed' ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span className="text-[10px] text-green-600">Completed</span>
                          </>
                        ) : tx.status === 'failed' ? (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="text-[10px] text-red-600">Failed</span>
                          </>
                        ) : (
                          <>
                            <Loader2 className="h-3 w-3 text-yellow-600 animate-spin" />
                            <span className="text-[10px] text-yellow-600">Pending</span>
                          </>
                        )}
                      </div>
                      <span className={`text-sm font-bold ${
                        tx.type === 'deposit' || tx.type === 'investment_income' ? 'text-green-600' : 'text-foreground'
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'investment_income' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        availableBalance={offChainBalance}
        onSuccess={handleWithdrawSuccess}
      />

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onSuccess={handleDepositSuccess}
      />
    </div>
  );
}