import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Lock, DollarSign, Clock, CheckCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface CollateralDepositPageProps {
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
  onDepositComplete: () => void;
}

export function CollateralDepositPage({ onNavigate, collateralData, onDepositComplete }: CollateralDepositPageProps) {
  const [countdown, setCountdown] = useState(0);
  const [isDepositing, setIsDepositing] = useState(false);

  useEffect(() => {
    if (!collateralData) {
      onNavigate('loan-center');
      return;
    }

    // Calculate initial countdown from expiry time
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
        toast.error('Collateral deposit time expired');
        setTimeout(() => {
          onNavigate('loan-center');
        }, 2000);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [collateralData, onNavigate]);

  const handleDepositCollateral = () => {
    setIsDepositing(true);
    toast.success('Connecting to wallet...');
    
    setTimeout(() => {
      setIsDepositing(false);
      toast.success('Collateral deposited successfully! Your loan application is being processed.');
      onDepositComplete();
      setTimeout(() => {
        onNavigate('loan-center');
      }, 1500);
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!collateralData) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-4 md:mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('loan-center')}
          className="flex items-center gap-2 text-sm sm:text-base"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          Back to Loan Center
        </Button>
      </div>

      <div>
        <h1 className="mb-2">Deposit Collateral</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Complete your collateral deposit to activate your loan
        </p>
      </div>

      {/* Countdown Timer Alert */}
      <Card className="shadow-xl border-2 border-orange-200 bg-orange-50">
        <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-orange-900 text-sm sm:text-base">Time Remaining to Complete Deposit</p>
                <p className="text-xs sm:text-sm text-orange-700">Complete within the time limit to secure your loan</p>
              </div>
            </div>
            <Badge className="bg-orange-600 text-white text-xl sm:text-2xl px-4 sm:px-6 py-1.5 sm:py-2 h-auto">
              {formatTime(countdown)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Loan Summary Card */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Loan Summary
          </CardTitle>
          <CardDescription>
            Review your loan details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-border">
                <span className="text-muted-foreground text-xs sm:text-sm">Loan Amount</span>
                <span className="font-semibold text-base sm:text-lg">${collateralData.loanAmount} USDT</span>
              </div>
              <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-border">
                <span className="text-muted-foreground text-xs sm:text-sm">Selected Pool</span>
                <span className="font-medium text-sm sm:text-base">{collateralData.poolName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-border">
                <span className="text-muted-foreground text-xs sm:text-sm">Duration</span>
                <span className="font-medium text-sm sm:text-base">{collateralData.duration} months</span>
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-border">
                <span className="text-muted-foreground text-xs sm:text-sm">Interest Rate</span>
                <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs sm:text-sm">
                  {collateralData.interestRate}% APR
                </Badge>
              </div>
              <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-border">
                <span className="text-muted-foreground text-xs sm:text-sm">Monthly Repayment</span>
                <span className="font-semibold text-primary text-sm sm:text-base">${collateralData.monthlyRepayment}</span>
              </div>
              <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-border">
                <span className="text-muted-foreground text-xs sm:text-sm">Total Repayment</span>
                <span className="font-medium text-sm sm:text-base">${collateralData.monthlyRepayment * collateralData.duration}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collateral Deposit Card */}
      <Card className="shadow-xl border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Required Collateral
          </CardTitle>
          <CardDescription>
            Deposit collateral to secure your loan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Collateral Amount Display */}
          <div className="bg-gradient-to-br from-primary/10 to-purple-50 rounded-lg p-6 sm:p-8 text-center border-2 border-primary/20">
            <Lock className="w-12 h-12 sm:w-16 sm:h-16 text-primary mx-auto mb-3 sm:mb-4" />
            <p className="text-muted-foreground mb-2 text-xs sm:text-sm">You must deposit</p>
            <div className="flex items-baseline justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <span className="text-4xl sm:text-6xl font-semibold text-primary">{collateralData.requiredCollateral}</span>
              <span className="text-2xl sm:text-3xl text-primary/70">PAXG</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              This collateral will be locked in a smart contract and automatically released upon full loan repayment
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              className="w-full bg-primary hover:bg-primary/90 h-12 sm:h-14 text-base sm:text-lg"
              onClick={handleDepositCollateral}
              disabled={isDepositing || countdown === 0}
            >
              {isDepositing ? (
                <>
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                  Processing Deposit...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Deposit {collateralData.requiredCollateral} PAXG Collateral
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              className="w-full h-12 sm:h-14 text-base sm:text-lg border-2"
              onClick={handleDepositCollateral}
              disabled={isDepositing || countdown === 0}
            >
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Connect Wallet & Deposit
            </Button>
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mb-2" />
              <h4 className="font-medium text-green-900 mb-1 text-xs sm:text-sm">Secure Storage</h4>
              <p className="text-xs text-green-700">
                Your collateral is stored in a verified smart contract with automated release mechanisms
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mb-2" />
              <h4 className="font-medium text-blue-900 mb-1 text-xs sm:text-sm">Automatic Release</h4>
              <p className="text-xs text-blue-700">
                Collateral is automatically released to your wallet once all loan payments are completed
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-900 mb-1 text-xs sm:text-sm">Important Notice</h4>
                <p className="text-xs sm:text-sm text-orange-700">
                  If you miss multiple consecutive payments, your collateral may be subject to liquidation to cover the outstanding loan balance. Always ensure timely payments to protect your collateral.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
