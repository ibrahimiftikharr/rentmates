import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DollarSign, TrendingUp, Calendar, Bell, Lock, AlertTriangle, CheckCircle, XCircle, Unlock, Clock, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  collateralData: {
    requiredCollateral: number;
    poolName: string;
    loanAmount: number;
    interestRate: number;
    monthlyRepayment: number;
    duration: number;
    expiryTime: number;
  } | null;
}

export function LoanCenterPage({ onNavigate, collateralData }: LoanCenterPageProps) {
  const hasActiveLoan = true; // Set to false to enable "Apply for New Loan" button
  const [countdown, setCountdown] = useState(0);

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

  const loanStats = {
    totalLoanAmount: 10000,
    totalRepaid: 3000,
    totalInterest: 1200,
    nextInstallment: {
      date: 'Dec 15, 2025',
      amount: 1150
    }
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
              disabled={hasActiveLoan}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Apply for New Loan
            </Button>
            {hasActiveLoan && (
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