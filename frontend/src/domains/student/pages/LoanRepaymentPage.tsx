import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Switch } from '@/shared/ui/switch';
import { DollarSign, Lock, TrendingUp, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RepaymentRecord {
  id: string;
  amount: number;
  date: string;
  remainingBalance: number;
  status: 'Paid' | 'Pending';
}

export function LoanRepaymentPage() {
  const [autoRepayment, setAutoRepayment] = useState(false);
  const [isPayingInstallment, setIsPayingInstallment] = useState(false);

  // Active loan details
  const activeLoan = {
    loanAmount: 10000,
    poolName: 'Balanced Portfolio',
    collateralLocked: 5.2,
    interestRate: 10.2,
    monthlyInstallment: 1150,
    nextDueDate: 'Dec 15, 2025',
    daysUntil: 9,
    status: 'ACTIVE' as 'ACTIVE' | 'DEFAULT' | 'PAID',
    totalRepaid: 3450,
    remainingBalance: 6550
  };

  // Repayment history
  const repaymentHistory: RepaymentRecord[] = [
    { id: '1', amount: 1150, date: 'Sep 15, 2025', remainingBalance: 8850, status: 'Paid' },
    { id: '2', amount: 1150, date: 'Oct 15, 2025', remainingBalance: 7700, status: 'Paid' },
    { id: '3', amount: 1150, date: 'Nov 15, 2025', remainingBalance: 6550, status: 'Paid' },
    { id: '4', amount: 1150, date: 'Dec 15, 2025', remainingBalance: 5400, status: 'Pending' },
  ];

  const getStatusBadge = (status: typeof activeLoan.status) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-700 border-green-200">ACTIVE</Badge>;
      case 'DEFAULT':
        return <Badge className="bg-red-100 text-red-700 border-red-200">DEFAULT</Badge>;
      case 'PAID':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">PAID</Badge>;
    }
  };

  const handlePayInstallment = () => {
    setIsPayingInstallment(true);
    
    setTimeout(() => {
      setIsPayingInstallment(false);
      toast.success(`Payment of $${activeLoan.monthlyInstallment} USDT processed successfully!`);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-4 md:mb-6">
        <h1 className="mb-2">Loan Repayment</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Manage your active loan and track repayment progress
        </p>
      </div>

      {/* Active Loan Details Card */}
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Active Loan Details
              </CardTitle>
              <CardDescription>
                Overview of your current loan
              </CardDescription>
            </div>
            {getStatusBadge(activeLoan.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Loan Amount */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Loan Amount</p>
                  <p className="font-semibold text-base sm:text-lg">${activeLoan.loanAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Pool Name */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Pool Name</p>
                  <p className="font-semibold text-base sm:text-lg">{activeLoan.poolName}</p>
                </div>
              </div>
            </div>

            {/* Collateral Locked */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Collateral Locked</p>
                  <p className="font-semibold text-base sm:text-lg">{activeLoan.collateralLocked} PAXG</p>
                </div>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Interest Rate</p>
                  <p className="font-semibold text-base sm:text-lg">{activeLoan.interestRate}% APR</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Repayment Progress</span>
              <span className="font-medium">{Math.round((activeLoan.totalRepaid / activeLoan.loanAmount) * 100)}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(activeLoan.totalRepaid / activeLoan.loanAmount) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Repaid: ${activeLoan.totalRepaid.toLocaleString()}</span>
              <span>Remaining: ${activeLoan.remainingBalance.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repayment Schedule & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repayment Schedule Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Repayment Schedule
            </CardTitle>
            <CardDescription>
              Next payment details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Next Repayment Details */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4 border border-blue-200 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="font-medium text-blue-900 text-sm sm:text-base">Next Payment</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-blue-700">Date:</span>
                  <span className="font-medium text-blue-900 text-xs sm:text-sm">{activeLoan.nextDueDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-blue-700">Amount:</span>
                  <span className="font-medium text-blue-900 text-xs sm:text-sm">${activeLoan.monthlyInstallment} USDT</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-blue-300">
                  <span className="text-xs sm:text-sm text-blue-700">Days Until:</span>
                  <Badge className="bg-blue-600 text-white text-xs sm:text-sm">
                    {activeLoan.daysUntil} days
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
                  <p className="text-sm text-green-800 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Repayments will be automatically processed on the due date from your wallet balance.</span>
                  </p>
                </div>
              )}
            </div>

            {/* Pay Now Button */}
            <Button 
              className="w-full bg-primary hover:bg-primary/90 h-12 sm:h-12 text-sm sm:text-base px-4 sm:px-6"
              onClick={handlePayInstallment}
              disabled={isPayingInstallment}
            >
              {isPayingInstallment ? (
                <>
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                  <span className="truncate">Processing...</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="truncate">Pay Loan Installment Now</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Repayment History Card */}
        <Card className="shadow-xl lg:col-span-2">
          <CardHeader>
            <CardTitle>Repayment History</CardTitle>
            <CardDescription>
              Track all your past and upcoming payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-xs sm:text-sm">Date</th>
                    <th className="text-right py-3 px-2 text-xs sm:text-sm">Amount</th>
                    <th className="text-right py-3 px-2 text-xs sm:text-sm">Balance</th>
                    <th className="text-center py-3 px-2 text-xs sm:text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {repaymentHistory.map((record) => (
                    <tr key={record.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                          <span className="text-xs sm:text-sm">{record.date}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className={`font-medium text-xs sm:text-sm ${record.status === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>
                          ${record.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className="font-medium text-muted-foreground text-xs sm:text-sm">
                          ${record.remainingBalance.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center justify-center">
                          {record.status === 'Paid' ? (
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Paid
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Section */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-green-700 mb-1">Total Paid</p>
                <p className="text-xl sm:text-2xl font-semibold text-green-900">${activeLoan.totalRepaid.toLocaleString()}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-orange-700 mb-1">Remaining Balance</p>
                <p className="text-xl sm:text-2xl font-semibold text-orange-900">${activeLoan.remainingBalance.toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-blue-700 mb-1">Monthly Installment</p>
                <p className="text-xl sm:text-2xl font-semibold text-blue-900">${activeLoan.monthlyInstallment.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Information */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                <Lock className="w-4 h-4" />
                Collateral Release
              </h4>
              <p className="text-xs sm:text-sm text-blue-700">
                Your collateral of {activeLoan.collateralLocked} PAXG will be automatically released once all payments are completed and the loan is fully repaid.
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
              <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                <AlertCircle className="w-4 h-4" />
                Late Payment Warning
              </h4>
              <p className="text-xs sm:text-sm text-orange-700">
                Missing consecutive payments may result in your loan being marked as delinquent, which could trigger collateral liquidation procedures.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
