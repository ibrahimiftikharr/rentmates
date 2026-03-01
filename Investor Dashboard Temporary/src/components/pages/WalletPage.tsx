import { useState } from "react";
import { Wallet, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Copy, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { WithdrawalModal } from "../modals/WithdrawalModal";
import { DepositModal } from "../modals/DepositModal";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function WalletPage() {
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterType, setFilterType] = useState("all");

  const walletAddress = "0xa274...1a50c3";
  const network = "Polygon Amoy Testnet";

  const handleCopyAddress = () => {
    navigator.clipboard.writeText("0xa2741a50c3");
  };

  const transactions = [
    { date: "Feb 24, 2026", type: "Deposit", description: "Deposited 1 USDT to wallet", amount: "+$1.00", status: "Completed" },
    { date: "Feb 23, 2026", type: "Withdrawal", description: "Withdrew earnings to wallet", amount: "-$5.00", status: "Completed" },
    { date: "Feb 22, 2026", type: "Earnings", description: "Student loan repayment received", amount: "+$2.50", status: "Completed" },
    { date: "Feb 20, 2026", type: "Deposit", description: "Deposited 50 USDT to wallet", amount: "+$50.00", status: "Completed" },
    { date: "Feb 18, 2026", type: "Earnings", description: "Monthly interest payment", amount: "+$3.20", status: "Completed" },
  ];

  // Filter transactions by type
  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === "all") return true;
    return tx.type.toLowerCase() === filterType.toLowerCase();
  });

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
                    <p className="font-mono text-xs md:text-sm">{walletAddress}</p>
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
                onClick={() => setIsWalletConnected(false)}
                className="mt-3 md:mt-4 w-full md:w-auto text-sm"
                size="sm"
              >
                Disconnect Wallet
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <p className="text-xs md:text-sm text-muted-foreground mb-4">No wallet connected</p>
              <Button
                onClick={() => setIsWalletConnected(true)}
                className="bg-gradient-to-r from-primary to-[#7367F0] hover:opacity-90 w-full md:w-auto"
              >
                Connect Wallet
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
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-1 md:mb-2">100 USDT</h2>
              <p className="text-[10px] md:text-xs text-muted-foreground">Includes deposits and earned interest</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Earnings */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6">
            <div className="mb-2">
              <p className="text-xs md:text-sm text-muted-foreground mb-2">Total Earnings from Investments</p>
              <h2 className="text-3xl md:text-4xl font-bold text-green-600 mb-1 md:mb-2">9 USDT</h2>
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
                {filteredTransactions.map((tx, index) => (
                  <tr key={index} className="hover:bg-accent/30 transition-colors">
                    <td className="p-2 md:p-3 text-xs md:text-sm whitespace-nowrap">{tx.date}</td>
                    <td className="p-2 md:p-3 text-xs md:text-sm">
                      <Badge variant="secondary" className={`text-[10px] md:text-xs
                        ${tx.type === "Deposit" ? "bg-green-100 text-green-700 border-green-200" : ""}
                        ${tx.type === "Withdrawal" ? "bg-orange-100 text-orange-700 border-orange-200" : ""}
                        ${tx.type === "Earnings" ? "bg-blue-100 text-blue-700 border-blue-200" : ""}
                      `}>
                        {tx.type}
                      </Badge>
                    </td>
                    <td className="p-2 md:p-3 text-xs md:text-sm text-muted-foreground">{tx.description}</td>
                    <td className={`p-2 md:p-3 text-xs md:text-sm text-right font-medium whitespace-nowrap ${
                      tx.amount.startsWith('+') ? 'text-green-600' : 'text-foreground'
                    }`}>
                      {tx.amount}
                    </td>
                    <td className="p-2 md:p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                        <span className="text-[10px] md:text-xs text-green-600">{tx.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Transaction Cards - Mobile */}
          <div className="md:hidden space-y-3">
            {filteredTransactions.map((tx, index) => (
              <Card key={index} className="border shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className={`text-[10px]
                          ${tx.type === "Deposit" ? "bg-green-100 text-green-700 border-green-200" : ""}
                          ${tx.type === "Withdrawal" ? "bg-orange-100 text-orange-700 border-orange-200" : ""}
                          ${tx.type === "Earnings" ? "bg-blue-100 text-blue-700 border-blue-200" : ""}
                        `}>
                          {tx.type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{tx.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{tx.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      <span className="text-[10px] text-green-600">{tx.status}</span>
                    </div>
                    <span className={`text-sm font-bold ${
                      tx.amount.startsWith('+') ? 'text-green-600' : 'text-foreground'
                    }`}>
                      {tx.amount}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        availableBalance={100}
      />

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
    </div>
  );
}