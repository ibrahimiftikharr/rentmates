import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { DollarSign, TrendingUp, Calendar, Bell, Lock, AlertTriangle, CheckCircle, XCircle, Unlock, Clock, ArrowRight, ClipboardList, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getMyLoans, getLoanStats, LoanStats } from '../services/loanService';
import { getMyQueuedRequests, cancelQueuedRequest, QueuedLoanRequest } from '../services/queueService';
import { withdrawCollateral, getCollateralStatus, getContractAddresses } from '../services/collateralService';
import { withdrawCollateral as withdrawCollateralBlockchain } from '@/shared/utils/web3Utils';
import { socketService } from '@/shared/services/socketService';
import { toast } from 'sonner';

type NotificationType = 'approved' | 'active' | 'collateral-locked' | 'collateral-released' | 'payment-due' | 'payment-missed' | 'delinquent' | 'defaulted' | 'liquidation';

interface LoanNotification {
  id: string;
  type: NotificationType;
  message: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
}

interface LoanCenterPageProps {
  onNavigate: (page: string) => void;
  collateralData?: {
    requiredCollateral: number;
    poolName: string;
    loanAmount: number;
    interestRate: number;
    monthlyRepayment: number;
    duration: number;
    expiryTime: number;
  } | null;
}

export function LoanCenterPage({ onNavigate, collateralData: propsCollateralData }: LoanCenterPageProps) {
  const [countdown, setCountdown] = useState(0);
  const [pendingLoan, setPendingLoan] = useState<any>(null);
  const [collateralData, setCollateralData] = useState(propsCollateralData);
  const [isLoading, setIsLoading] = useState(true);
  const [queuedRequests, setQueuedRequests] = useState<QueuedLoanRequest[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [loanStats, setLoanStats] = useState<LoanStats>({
    totalLoanAmount: 0,
    totalRepaid: 0,
    totalInterest: 0,
    nextInstallment: { date: 'N/A', amount: 0 },
    hasActiveLoan: false
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Collateral withdrawal state
  const [completedLoans, setCompletedLoans] = useState<any[]>([]);
  const [withdrawingCollateral, setWithdrawingCollateral] = useState(false);

  // Fetch loan stats on mount
  useEffect(() => {
    fetchLoanStats();
  }, []);

  const fetchLoanStats = async () => {
    try {
      setStatsLoading(true);
      const response = await getLoanStats();
      if (response.success && response.stats) {
        setLoanStats(response.stats);
      }
    } catch (error) {
      console.error('Failed to fetch loan stats:', error);
      toast.error('Failed to load loan statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch loans on mount to check for pending collateral deposits
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setIsLoading(true);
        const response = await getMyLoans();
        const loans = response.loans || [];
        
        // Find any loan with collateral_pending status
        const pendingCollateralLoan = loans.find(
          (loan: any) => loan.status === 'collateral_pending'
        );
        
        if (pendingCollateralLoan) {
          setPendingLoan(pendingCollateralLoan);
          
          // Calculate expiry time (5 minutes from application date)
          const applicationTime = new Date(pendingCollateralLoan.applicationDate).getTime();
          const expiryTime = applicationTime + (5 * 60 * 1000); // 5 minutes
          
          // Only set collateral data if not expired
          if (Date.now() < expiryTime) {
            const data = {
              loanId: pendingCollateralLoan._id,
              requiredCollateral: pendingCollateralLoan.requiredCollateral,
              poolName: pendingCollateralLoan.poolName,
              loanAmount: pendingCollateralLoan.loanAmount,
              interestRate: pendingCollateralLoan.lockedAPR,
              monthlyRepayment: pendingCollateralLoan.monthlyRepayment,
              duration: pendingCollateralLoan.duration,
              expiryTime: expiryTime
            };
            setCollateralData(data);
            // Also store in localStorage for persistence
            localStorage.setItem('pendingCollateralData', JSON.stringify(data));
          }
        } else {
          // No pending loan, clear any stale data
          localStorage.removeItem('pendingCollateralData');
        }
        
        // Find completed loans with withdrawable collateral
        const loansWithWithdrawableCollateral = loans.filter(
          (loan: any) => loan.status === 'completed' && 
                         loan.collateralStatus === 'returned' &&
                         loan.collateralStatus !== 'withdrawn'
        );
        setCompletedLoans(loansWithWithdrawableCollateral);
        
      } catch (error) {
        console.error('Failed to fetch loans:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLoans();
  }, []);
  
  // Sync with props if changed externally
  useEffect(() => {
    if (propsCollateralData) {
      setCollateralData(propsCollateralData);
    }
  }, [propsCollateralData]);

  // Fetch queued requests on mount
  useEffect(() => {
    fetchQueuedRequests();

    // Listen for real-time updates
    socketService.on('pool_available', fetchQueuedRequests);
    socketService.on('analytics_updated', fetchQueuedRequests);

    return () => {
      socketService.off('pool_available', fetchQueuedRequests);
      socketService.off('analytics_updated', fetchQueuedRequests);
    };
  }, []);

  const fetchQueuedRequests = async () => {
    try {
      setIsLoadingQueue(true);
      const requests = await getMyQueuedRequests();
      setQueuedRequests(requests || []);
    } catch (error: any) {
      console.error('Failed to fetch queued requests:', error);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelQueuedRequest(requestId);
      toast.success('Queued request cancelled');
      fetchQueuedRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel request');
    }
  };
  
  const handleWithdrawCollateral = async (loanId: string) => {
    try {
      setWithdrawingCollateral(true);
      
      // Find the loan to get collateral amount
      const loan = completedLoans.find(l => l._id === loanId);
      if (!loan) {
        throw new Error('Loan not found');
      }
      
      toast.info('Initiating blockchain withdrawal...', { description: 'Please confirm the transaction in MetaMask' });
      
      // Step 1: Get contract addresses
      const contracts = await getContractAddresses();
      
      // Step 2: Execute blockchain withdrawal (transfer PAXG back to student's wallet)
      const txHash = await withdrawCollateralBlockchain(
        contracts.collateralHolder,
        loan.requiredCollateral.toString()
      );
      
      console.log('✅ Blockchain withdrawal successful. TxHash:', txHash);
      toast.success('PAXG transferred to your wallet!', { description: `Transaction: ${txHash.substring(0, 10)}...` });
      
      // Step 3: Update backend to mark as withdrawn
      await withdrawCollateral(loanId);
      
      toast.success('Collateral withdrawal complete!', { description: `${loan.requiredCollateral.toFixed(4)} PAXG returned to your wallet` });
      
      // Refresh loan list
      const response = await getMyLoans();
      const loans = response.loans || [];
      const loansWithWithdrawableCollateral = loans.filter(
        (loan: any) => loan.status === 'completed' && 
                       loan.collateralStatus === 'returned' &&
                       loan.collateralStatus !== 'withdrawn'
      );
      setCompletedLoans(loansWithWithdrawableCollateral);
    } catch (error: any) {
      console.error('Withdraw collateral error:', error);
      if (error.message?.includes('user rejected')) {
        toast.error('Transaction cancelled');
      } else {
        toast.error(error.message || 'Failed to withdraw collateral');
      }
    } finally {
      setWithdrawingCollateral(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'queued':
        return { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Queued' };
      case 'matched':
        return { color: 'bg-green-100 text-green-700 border-green-200', label: 'Matched' };
      case 'expired':
        return { color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Expired' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-700 border-red-200', label: 'Cancelled' };
      default:
        return { color: 'bg-gray-100 text-gray-700 border-gray-200', label: status };
    }
  };

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    if (!collateralData) return;

    const calculateRemaining = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((collateralData.expiryTime - now) / 1000));
      return remaining;
    };

    setCountdown(calculateRemaining());

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setCountdown(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [collateralData]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const notifications: LoanNotification[] = [
    { 
      id: '1', 
      type: 'active', 
      message: 'Your loan of $10,000 USDT in Medium Risk Pool is currently active', 
      date: 'Nov 1, 2025',
      priority: 'low'
    },
    { 
      id: '2', 
      type: 'collateral-locked', 
      message: 'Collateral of 5.2 PAXG has been successfully locked', 
      date: 'Nov 1, 2025',
      priority: 'low'
    },
    { 
      id: '3', 
      type: 'payment-due', 
      message: 'Payment of $1,150 USDT due on Dec 15, 2025', 
      date: 'Dec 5, 2025',
      priority: 'medium'
    },
    { 
      id: '4', 
      type: 'payment-missed', 
      message: 'Payment of $1,150 USDT was missed on Nov 15, 2025', 
      date: 'Nov 16, 2025',
      priority: 'high'
    },
  ];

  const getNotificationBadgeColor = (type: NotificationType) => {
    switch (type) {
      case 'approved':
      case 'active':
      case 'collateral-locked':
      case 'collateral-released':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'payment-due':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'payment-missed':
      case 'delinquent':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'defaulted':
      case 'liquidation':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'approved':
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'collateral-locked':
        return <Lock className="w-4 h-4" />;
      case 'collateral-released':
        return <Unlock className="w-4 h-4" />;
      case 'payment-due':
        return <Calendar className="w-4 h-4" />;
      case 'payment-missed':
      case 'delinquent':
        return <AlertTriangle className="w-4 h-4" />;
      case 'defaulted':
      case 'liquidation':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'low':
        return 'bg-green-50 border-green-100';
      case 'medium':
        return 'bg-blue-50 border-blue-100';
      case 'high':
        return 'bg-red-50 border-red-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-4 md:mb-6">
        <h1 className="mb-2">Loan Center</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Overview of your loans, repayments, and important notifications
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Loan Amount */}
        <Card className="shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm mb-1">Total Loan Amount</p>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-foreground">${loanStats.totalLoanAmount.toLocaleString()}</span>
              <span className="text-sm sm:text-base text-muted-foreground">USDT</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Repaid */}
        <Card className="shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm mb-1">Total Repaid</p>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-green-600">${loanStats.totalRepaid.toLocaleString()}</span>
              <span className="text-sm sm:text-base text-muted-foreground">USDT</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Interest */}
        <Card className="shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm mb-1">Total Interest</p>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-2xl sm:text-3xl font-semibold text-orange-600">${loanStats.totalInterest.toLocaleString()}</span>
              <span className="text-sm sm:text-base text-muted-foreground">USDT</span>
            </div>
          </CardContent>
        </Card>

        {/* Next Installment Due */}
        <Card className="shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm mb-1">Next Installment Due</p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">{loanStats.nextInstallment.date}</p>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span className="text-xl sm:text-2xl font-semibold text-blue-600">${loanStats.nextInstallment.amount}</span>
              <span className="text-sm sm:text-base text-muted-foreground">USDT</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pay Collateral Widget - Show if collateral deposit is pending */}
      {collateralData && countdown > 0 && (
        <Card className="shadow-xl border-2 border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-orange-900 mb-1">Collateral Deposit Pending</h3>
                  <p className="text-xs sm:text-sm text-orange-700">
                    Complete your collateral deposit of <span className="font-semibold">{collateralData.requiredCollateral} PAXG</span> for {collateralData.poolName}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                    <span className="text-xs sm:text-sm text-orange-800">Time remaining: </span>
                    <Badge className="bg-orange-600 text-white text-sm sm:text-base">
                      {formatTime(countdown)}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button 
                className="bg-orange-600 hover:bg-orange-700 text-white h-10 sm:h-12 px-4 sm:px-6 whitespace-nowrap w-full sm:w-auto text-sm sm:text-base"
                onClick={() => onNavigate('collateral-deposit')}
              >
                Pay Collateral
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdraw Collateral Widget - Show if loan completed and collateral available */}
      {completedLoans.length > 0 && completedLoans.map((loan) => (
        <Card key={loan._id} className="shadow-xl border-2 border-green-500 bg-gradient-to-r from-green-50 to-emerald-100">
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                  <Unlock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-green-900 mb-1">🎉 Collateral Available for Withdrawal</h3>
                  <p className="text-xs sm:text-sm text-green-700 mb-2">
                    Congratulations! You've completed your loan from <span className="font-semibold">{loan.poolName}</span>. Your collateral of <span className="font-semibold">{loan.requiredCollateral.toFixed(4)} PAXG</span> is ready for withdrawal.
                  </p>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    <span className="text-xs sm:text-sm text-green-800">
                      Loan completed • All payments made
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white h-10 sm:h-12 px-4 sm:px-6 whitespace-nowrap w-full sm:w-auto text-sm sm:text-base"
                onClick={() => handleWithdrawCollateral(loan._id)}
                disabled={withdrawingCollateral}
              >
                {withdrawingCollateral ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  <>
                    Withdraw Collateral
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Quick Actions & Notifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Manage your loan applications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full bg-primary hover:bg-primary/90 h-12"
              disabled={loanStats.hasActiveLoan}
              onClick={() => onNavigate('apply-loan')}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Apply for New Loan
            </Button>
            {loanStats.hasActiveLoan && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  You currently have an active loan. Please repay or complete it before applying for a new loan.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts & Notifications Card */}
        <Card className="shadow-xl lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Alerts & Notifications
                </CardTitle>
                <CardDescription>
                  Important updates about your loans
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {notifications.length} Alerts
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-3 sm:p-4 rounded-lg border ${getPriorityColor(notification.priority)} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotificationBadgeColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1">
                        <Badge variant="outline" className={`${getNotificationBadgeColor(notification.type)} text-xs w-fit`}>
                          {notification.type.replace(/-/g, ' ').toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{notification.date}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-foreground">{notification.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queued Loan Requests Section */}
      {queuedRequests.length > 0 && (
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  Queued Loan Requests
                </CardTitle>
                <CardDescription className="mt-1">
                  Your pending loan requests waiting for pool availability
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-sm">
                {queuedRequests.length} {queuedRequests.length === 1 ? 'Request' : 'Requests'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingQueue ? (
              <div className="flex justify-center py-8">
                <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3">
                {queuedRequests.map((request) => {
                  const statusBadge = getStatusBadge(request.status);
                  const daysRemaining = Math.ceil(
                    (new Date(request.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <div 
                      key={request._id}
                      className="p-4 rounded-lg border bg-card hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={statusBadge.color}>
                              {statusBadge.label}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {request.purpose.charAt(0).toUpperCase() + request.purpose.slice(1)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Amount</p>
                              <p className="font-semibold">${request.requestedAmount} USDT</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Duration</p>
                              <p className="font-semibold">{request.duration} months</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Requested</p>
                              <p className="font-semibold">{formatDate(request.requestedAt)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Expires In</p>
                              <p className={`font-semibold ${
                                daysRemaining <= 7 ? 'text-orange-600' : 'text-foreground'
                              }`}>
                                {daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {request.status === 'queued' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelRequest(request._id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      {request.status === 'matched' && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2 text-sm text-green-700">
                            <CheckCircle className="w-4 h-4" />
                            <span>A suitable pool is now available! Check your notifications.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Loan Management Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 sm:p-4 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2 sm:mb-3" />
              <h4 className="font-medium text-green-900 mb-1 sm:mb-2 text-sm sm:text-base">On-Time Payments</h4>
              <p className="text-xs sm:text-sm text-green-700">
                Making payments on time helps build your credit score and avoids penalties.
              </p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-blue-50 border border-blue-200">
              <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2 sm:mb-3" />
              <h4 className="font-medium text-blue-900 mb-1 sm:mb-2 text-sm sm:text-base">Collateral Protection</h4>
              <p className="text-xs sm:text-sm text-blue-700">
                Your collateral is safely locked in a smart contract and will be released upon full repayment.
              </p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-orange-50 border border-orange-200">
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mb-2 sm:mb-3" />
              <h4 className="font-medium text-orange-900 mb-1 sm:mb-2 text-sm sm:text-base">Avoid Defaults</h4>
              <p className="text-xs sm:text-sm text-orange-700">
                Missing multiple payments may trigger collateral liquidation. Set up auto-payments to stay safe.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
