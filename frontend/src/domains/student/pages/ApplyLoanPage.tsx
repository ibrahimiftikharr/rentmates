import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Slider } from '@/shared/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { DollarSign, TrendingUp, Lock, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface LoanPool {
  id: string;
  name: string;
  availableLiquidity: number;
  duration: number; // in months
  interestRate: number; // APR percentage
  requiredCollateral: number; // PAXG
  monthlyRepayment: number;
}

interface ApplyLoanPageProps {
  onNavigate: (page: string) => void;
  onStartCollateralDeposit?: (data: {
    requiredCollateral: number;
    poolName: string;
    loanAmount: number;
    interestRate: number;
    monthlyRepayment: number;
    duration: number;
    expiryTime: number;
  }) => void;
}

export function ApplyLoanPage({ onNavigate, onStartCollateralDeposit }: ApplyLoanPageProps) {
  const hasActiveLoan = false; // Change to true to show active loan message
  const [loanPurpose, setLoanPurpose] = useState<string>('');
  const [loanAmount, setLoanAmount] = useState<number[]>([500]);
  const [loanDuration, setLoanDuration] = useState<string>('');
  const [showPools, setShowPools] = useState(false);
  const [selectedPool, setSelectedPool] = useState<LoanPool | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showCollateralDeposit, setShowCollateralDeposit] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds

  // Mock loan pools data
  const loanPools: LoanPool[] = [
    {
      id: '1',
      name: 'Conservative Growth',
      availableLiquidity: 50000,
      duration: 12,
      interestRate: 8.5,
      requiredCollateral: 2.5,
      monthlyRepayment: 85
    },
    {
      id: '2',
      name: 'Balanced Portfolio',
      availableLiquidity: 30000,
      duration: 9,
      interestRate: 10.2,
      requiredCollateral: 3.2,
      monthlyRepayment: 115
    },
    {
      id: '3',
      name: 'High Yield Growth',
      availableLiquidity: 20000,
      duration: 6,
      interestRate: 12.5,
      requiredCollateral: 4.0,
      monthlyRepayment: 175
    }
  ];

  const activeLoanData = {
    amount: 10000,
    poolName: 'Medium Risk Pool'
  };

  const handleCheckAvailability = () => {
    if (!loanPurpose) {
      toast.error('Please select a loan purpose');
      return;
    }
    if (!loanDuration) {
      toast.error('Please select a loan duration');
      return;
    }
    
    setShowPools(true);
    toast.success('Checking available pools...');
  };

  const handleApplyToPool = (pool: LoanPool) => {
    setSelectedPool(pool);
    setShowConfirmation(true);
  };

  const handleConfirmLoan = () => {
    setShowConfirmation(false);
    
    if (selectedPool) {
      // Calculate expiry time (5 minutes from now)
      const expiryTime = Date.now() + (5 * 60 * 1000);
      
      // Pass collateral data and navigate to collateral deposit page
      if (onStartCollateralDeposit) {
        onStartCollateralDeposit({
          requiredCollateral: selectedPool.requiredCollateral,
          poolName: selectedPool.name,
          loanAmount: loanAmount[0],
          interestRate: selectedPool.interestRate,
          monthlyRepayment: selectedPool.monthlyRepayment,
          duration: selectedPool.duration,
          expiryTime: expiryTime
        });
      }
      
      toast.success('Proceeding to collateral deposit...');
      setTimeout(() => {
        onNavigate('collateral-deposit');
      }, 500);
    }
  };

  const handleDepositCollateral = () => {
    toast.success('Connecting to wallet...');
    setTimeout(() => {
      toast.success('Collateral deposited successfully! Your loan application is being processed.');
      setShowCollateralDeposit(false);
      // Reset form
      setLoanPurpose('');
      setLoanAmount([500]);
      setLoanDuration('');
      setShowPools(false);
      setSelectedPool(null);
      setCountdown(300);
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredPools = loanPools.filter(pool => 
    pool.availableLiquidity >= loanAmount[0] && 
    pool.duration === parseInt(loanDuration || '0')
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-4 md:mb-6">
        <h1 className="mb-2">Apply for Loan</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Apply for new loans or view your active loan status
        </p>
      </div>

      {/* Active Loan Message */}
      {hasActiveLoan ? (
        <Card className="shadow-xl">
          <CardContent className="pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-medium text-blue-900 mb-2">Active Loan in Progress</h3>
              <p className="text-blue-800">
                You currently have an active loan of <span className="font-semibold">${activeLoanData.amount.toLocaleString()} USDT</span> in <span className="font-semibold">{activeLoanData.poolName}</span>.
              </p>
              <p className="text-blue-800 mt-2">
                Please repay or complete it before applying for a new loan.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Loan Application Form */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                New Loan Application
              </CardTitle>
              <CardDescription>
                Fill in the details to check loan availability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Loan Purpose */}
              <div className="space-y-2">
                <Label htmlFor="loan-purpose">Loan Purpose</Label>
                <Select value={loanPurpose} onValueChange={setLoanPurpose}>
                  <SelectTrigger id="loan-purpose">
                    <SelectValue placeholder="Select loan purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="education">Education Expenses</SelectItem>
                    <SelectItem value="rent">Rent Payment</SelectItem>
                    <SelectItem value="emergency">Emergency Funds</SelectItem>
                    <SelectItem value="equipment">Equipment Purchase</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Loan Amount Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Loan Amount</Label>
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    <span className="text-xl sm:text-2xl font-semibold text-primary">{loanAmount[0]}</span>
                    <span className="text-sm sm:text-base text-muted-foreground">USDT</span>
                  </div>
                </div>
                <Slider
                  value={loanAmount}
                  onValueChange={setLoanAmount}
                  min={1}
                  max={1000}
                  step={50}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 USDT</span>
                  <span>1,000 USDT</span>
                </div>
              </div>

              {/* Loan Duration */}
              <div className="space-y-2">
                <Label htmlFor="loan-duration">Loan Duration</Label>
                <Select value={loanDuration} onValueChange={setLoanDuration}>
                  <SelectTrigger id="loan-duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="9">9 Months</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Check Availability Button */}
              <Button 
                className="w-full bg-primary hover:bg-primary/90 h-12"
                onClick={handleCheckAvailability}
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Check Availability
              </Button>
            </CardContent>
          </Card>

          {/* Available Pools */}
          {showPools && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2>Available Loan Pools</h2>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {filteredPools.length} Pools Available
                </Badge>
              </div>

              {filteredPools.length === 0 ? (
                <Card className="shadow-xl">
                  <CardContent className="pt-6">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                      <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                      <h3 className="font-medium text-orange-900 mb-2">No Pools Available</h3>
                      <p className="text-orange-800">
                        No pools match your requested amount and duration. Please adjust your loan parameters.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPools.map((pool) => (
                    <Card key={pool.id} className="shadow-xl hover:shadow-2xl transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg">{pool.name}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          {pool.duration} months duration
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-muted-foreground">Available Liquidity</span>
                            <span className="font-medium text-sm sm:text-base">${pool.availableLiquidity.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-muted-foreground">Interest Rate (APR)</span>
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs sm:text-sm">
                              {pool.interestRate}%
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-muted-foreground">Required Collateral</span>
                            <span className="font-medium text-sm sm:text-base">{pool.requiredCollateral} PAXG</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-muted-foreground">Monthly Repayment</span>
                            <span className="font-medium text-primary text-sm sm:text-base">${pool.monthlyRepayment}</span>
                          </div>
                        </div>

                        <Button 
                          className="w-full bg-primary hover:bg-primary/90 h-10 sm:h-11 text-sm sm:text-base"
                          onClick={() => handleApplyToPool(pool)}
                          disabled={pool.availableLiquidity < loanAmount[0]}
                        >
                          {pool.availableLiquidity < loanAmount[0] ? 'Insufficient Liquidity' : 'Apply to Pool'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Confirmation Dialog */}
          <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Confirm Loan Application</DialogTitle>
                <DialogDescription>
                  Review your loan details before proceeding
                </DialogDescription>
              </DialogHeader>
              {selectedPool && (
                <div className="space-y-4">
                  <div className="bg-primary/10 rounded-lg p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Loan Amount</span>
                      <span className="font-semibold text-base sm:text-lg">${loanAmount[0]} USDT</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Selected Pool</span>
                      <span className="font-medium text-sm sm:text-base">{selectedPool.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Duration</span>
                      <span className="font-medium text-sm sm:text-base">{selectedPool.duration} months</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Interest Rate</span>
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs sm:text-sm">
                        {selectedPool.interestRate}% APR
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Required Collateral</span>
                      <span className="font-medium text-primary text-sm sm:text-base">{selectedPool.requiredCollateral} PAXG</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <span className="text-xs sm:text-sm text-muted-foreground">Monthly Repayment</span>
                      <span className="font-semibold text-base sm:text-lg text-primary">${selectedPool.monthlyRepayment}</span>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs sm:text-sm text-blue-800">
                      By confirming, you agree to deposit {selectedPool.requiredCollateral} PAXG as collateral. This will be locked until the loan is fully repaid.
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setShowConfirmation(false)} className="text-sm sm:text-base">
                  Cancel
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-sm sm:text-base"
                  onClick={handleConfirmLoan}
                >
                  Confirm & Proceed
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Collateral Deposit Dialog */}
          <Dialog open={showCollateralDeposit} onOpenChange={setShowCollateralDeposit}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Deposit Collateral</DialogTitle>
                <DialogDescription>
                  Deposit the required collateral to activate your loan
                </DialogDescription>
              </DialogHeader>
              {selectedPool && (
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                    <Lock className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                    <p className="text-sm text-orange-700 mb-2">Required Collateral</p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-4xl font-semibold text-orange-900">{selectedPool.requiredCollateral}</span>
                      <span className="text-xl text-orange-700">PAXG</span>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-blue-800">Time Remaining</span>
                      </div>
                      <Badge className="bg-blue-600 text-white text-lg px-4 py-1">
                        {formatTime(countdown)}
                      </Badge>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      Complete the collateral deposit within the time limit
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 h-12"
                      onClick={handleDepositCollateral}
                    >
                      <Lock className="w-5 h-5 mr-2" />
                      Deposit Collateral
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full h-12"
                      onClick={handleDepositCollateral}
                    >
                      <DollarSign className="w-5 h-5 mr-2" />
                      Connect Wallet
                    </Button>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-green-800">
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      Your collateral will be securely stored in a smart contract and automatically released upon full repayment.
                    </p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
