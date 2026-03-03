import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Switch } from '@/shared/ui/switch';
import { DollarSign, Lock, TrendingUp, Calendar, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getActiveLoan, 
  payLoanInstallment, 
  toggleAutoRepayment as toggleAutoRepaymentAPI,
  getRepaymentHistory 
} from '@/shared/services/loanRepaymentService';

interface RepaymentRecord {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'defaulted';
  paidAt?: string;
  remainingBalance: number;
}

interface ActiveLoan {
  _id: string;
  loanAmount: number;
  poolName: string;
  collateralLocked: number;
  interestRate: number;
  monthlyInstallment: number;
  totalRepaid: number;
  remainingBalance: number;
  status: 'active' | 'repaying' | 'completed';
  duration: number;
  paymentsCompleted: number;
  autoRepaymentEnabled: boolean;
  currentInstallment?: {
    installmentNumber: number;
    dueDate: string;
    amount: number;
    daysUntilDue: number;
    isOverdue: boolean;
    canPayNow: boolean;
  };
}

export function LoanRepaymentPage() {
  const [autoRepayment, setAutoRepayment] = useState(false);
  const [isPayingInstallment, setIsPayingInstallment] = useState(false);
  const [isTogglingAuto, setIsTogglingAuto] = useState(false);
  const [isLoadingLoan, setIsLoadingLoan] = useState(true);
  const [hasActiveLoan, setHasActiveLoan] = useState(false);
  const [activeLoan, setActiveLoan] = useState<ActiveLoan | null>(null);
  const [repaymentHistory, setRepaymentHistory] = useState<RepaymentRecord[]>([]);
  
  // ⚠️ DEV ONLY: Allow paying outside payment window for testing
  // Persist in localStorage so it survives page refreshes
  const [devBypassPaymentWindow, setDevBypassPaymentWindow] = useState(() => {
    const saved = localStorage.getItem('devBypassPaymentWindow');
    return saved === 'true';
  });

  // Persist dev bypass setting to localStorage
  useEffect(() => {
    localStorage.setItem('devBypassPaymentWindow', String(devBypassPaymentWindow));
  }, [devBypassPaymentWindow]);

  // Load active loan data
  useEffect(() => {
    loadLoanData();
  }, []);

  const loadLoanData = async () => {
    try {
      setIsLoadingLoan(true);
      const loanData = await getActiveLoan();
      
      if (loanData.hasActiveLoan && loanData.loan) {
        setHasActiveLoan(true);
        setActiveLoan(loanData.loan);
        setAutoRepayment(loanData.loan.autoRepaymentEnabled);
        
        // Load repayment history
        const historyData = await getRepaymentHistory();
        if (historyData.repaymentHistory) {
          setRepaymentHistory(historyData.repaymentHistory);
        }
      } else {
        setHasActiveLoan(false);
      }
    } catch (error: any) {
      console.error('Error loading loan data:', error);
      toast.error(error.error || 'Failed to load loan data');
    } finally {
      setIsLoadingLoan(false);
    }
  };

  const getStatusBadge = (status: 'active' | 'repaying' | 'completed') => {
    switch (status) {
      case 'active':
      case 'repaying':
        return <Badge className="bg-green-100 text-green-700 border-green-200">ACTIVE</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">PAID</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{String(status).toUpperCase()}</Badge>;
    }
  };

  const handlePayInstallment = async () => {
    try {
      setIsPayingInstallment(true);
      const result = await payLoanInstallment(devBypassPaymentWindow);
      toast.success(`Payment of $${result.amount} USDT processed successfully!`);
      
      // Reload loan data to get updated information
      await loadLoanData();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.error || 'Failed to process payment');
    } finally {
      setIsPayingInstallment(false);
    }
  };

  const handleToggleAutoRepayment = async (checked: boolean) => {
    try {
      setIsTogglingAuto(true);
      await toggleAutoRepaymentAPI(checked);
      setAutoRepayment(checked);
      toast.success(
        checked 
          ? 'Auto-repayment enabled' 
          : 'Auto-repayment disabled'
      );
    } catch (error: any) {
      console.error('Toggle auto-repayment error:', error);
      toast.error(error.error || 'Failed to toggle auto-repayment');
      // Revert the switch if API call failed
      setAutoRepayment(!checked);
    } finally {
      setIsTogglingAuto(false);
    }
  };

  // Loading state
  if (isLoadingLoan) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading loan data...</p>
        </div>
      </div>
    );
  }

  // No active loan state
  if (!hasActiveLoan || !activeLoan) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-4 md:mb-6">
          <h1 className="mb-2">Loan Repayment</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage your active loan and track repayment progress
          </p>
        </div>

        <Card className="shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Active Loan</h3>
            <p className="text-muted-foreground text-center">
              You do not have an active loan at this time.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              {activeLoan.currentInstallment ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-blue-700">Date:</span>
                    <span className="font-medium text-blue-900 text-xs sm:text-sm">
                      {new Date(activeLoan.currentInstallment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-blue-700">Amount:</span>
                    <span className="font-medium text-blue-900 text-xs sm:text-sm">${activeLoan.currentInstallment.amount.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-blue-300">
                    <span className="text-xs sm:text-sm text-blue-700">Days Until:</span>
                    <Badge className={`text-xs sm:text-sm ${
                      activeLoan.currentInstallment.isOverdue 
                        ? 'bg-red-600 text-white' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      {activeLoan.currentInstallment.isOverdue ? 'OVERDUE' : `${activeLoan.currentInstallment.daysUntilDue} days`}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-blue-700">All installments paid!</p>
                </div>
              )}
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
                  onCheckedChange={handleToggleAutoRepayment}
                  disabled={isTogglingAuto}
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
              disabled={isPayingInstallment || (!activeLoan.currentInstallment?.canPayNow && !devBypassPaymentWindow) || activeLoan.status === 'completed'}
            >
              {isPayingInstallment ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                  <span className="truncate">Processing...</span>
                </>
              ) : activeLoan.status === 'completed' ? (
                <>
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="truncate">Loan Fully Paid</span>
                </>
              ) : !activeLoan.currentInstallment?.canPayNow && !devBypassPaymentWindow ? (
                <>
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="truncate">Payment Window Not Open</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="truncate">{devBypassPaymentWindow && !activeLoan.currentInstallment?.canPayNow ? '🔓 Pay Now (Dev Mode)' : 'Pay Loan Installment Now'}</span>
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
                  {repaymentHistory.length > 0 ? (
                    repaymentHistory.map((record) => (
                      <tr key={record.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                            <span className="text-xs sm:text-sm">
                              {new Date(record.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <span className={`font-medium text-xs sm:text-sm ${
                            record.status === 'paid' ? 'text-green-600' : 
                            record.status === 'overdue' ? 'text-red-600' :
                            'text-orange-600'
                          }`}>
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
                            {record.status === 'paid' ? (
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Paid
                              </Badge>
                            ) : record.status === 'overdue' ? (
                              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Overdue
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground text-sm">
                        No repayment history available
                      </td>
                    </tr>
                  )}
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

      {/* ⚠️ DEV ONLY: Payment Window Bypass Feature */}
      <Card style={{ 
        border: '2px solid #e0e7ff', 
        background: '#ffffff',
        boxShadow: '0 10px 25px rgba(99, 102, 241, 0.25), 0 5px 10px rgba(0, 0, 0, 0.08)',
        borderRadius: '0.75rem',
        overflow: 'hidden'
      }}>
        <CardHeader style={{ 
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: '#ffffff',
          padding: '1.5rem'
        }}>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <AlertCircle className="w-5 h-5" />
            Development Mode
          </CardTitle>
          <CardDescription style={{ color: '#e0e7ff', fontWeight: 400, fontSize: '0.875rem' }}>
            Testing feature - disable in production
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{ 
            backgroundColor: '#fef9c3', 
            border: '1px solid #fde047',
            borderRadius: '0.5rem',
            padding: '1rem',
            borderLeft: '4px solid #eab308'
          }}>
            <p style={{ 
              fontSize: '0.8125rem', 
              fontWeight: 600, 
              color: '#713f12',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>ℹ️</span>
              Payment Window Restriction
            </p>
            <p style={{ 
              fontSize: '0.75rem', 
              color: '#854d0e',
              lineHeight: '1.6'
            }}>
              Normally, loans can only be paid within 20 days before the due date. Toggle below to bypass this restriction for immediate testing.
            </p>
          </div>
          
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: devBypassPaymentWindow ? '#f0f9ff' : '#f9fafb',
            border: devBypassPaymentWindow ? '2px solid #7dd3fc' : '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '1.25rem',
            transition: 'all 0.2s ease'
          }}>
            <div style={{ flex: 1 }}>
              <Label htmlFor="dev-bypass" style={{ 
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#111827',
                cursor: 'pointer',
                display: 'block',
                marginBottom: '0.375rem'
              }}>
                Bypass Payment Window
              </Label>
              <p style={{ 
                fontSize: '0.8125rem',
                color: devBypassPaymentWindow ? '#0369a1' : '#6b7280',
                fontWeight: 500
              }}>
                {devBypassPaymentWindow 
                  ? '✅ Enabled - payments allowed anytime' 
                  : '⭕ Disabled - normal payment rules active'}
              </p>
            </div>
            <Switch
              id="dev-bypass"
              checked={devBypassPaymentWindow}
              onCheckedChange={setDevBypassPaymentWindow}
              className="data-[state=checked]:bg-indigo-600"
              style={{
                boxShadow: devBypassPaymentWindow ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none'
              }}
            />
          </div>

          {devBypassPaymentWindow && (
            <div style={{ 
              backgroundColor: '#f0fdf4',
              border: '2px solid #86efac',
              borderRadius: '0.5rem',
              padding: '1rem',
              borderLeft: '4px solid #22c55e',
              animation: 'fadeIn 0.3s ease'
            }}>
              <p style={{ 
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#14532d',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.375rem'
              }}>
                <CheckCircle className="w-4 h-4" />
                Bypass Active
              </p>
              <p style={{ 
                fontSize: '0.75rem',
                color: '#166534',
                lineHeight: '1.6'
              }}>
                Payment window check disabled. You can now make loan payments immediately for testing purposes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
