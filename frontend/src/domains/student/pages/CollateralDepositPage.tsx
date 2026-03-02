import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Lock, DollarSign, Clock, CheckCircle, ArrowLeft, AlertTriangle, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { connectWallet, depositCollateral, isMetaMaskInstalled, getPAXGBalance } from '@/shared/utils/web3Utils';
import { getContractAddresses, confirmCollateralDeposit, getPendingLoan, getWalletBalances } from '../services/collateralService';

interface CollateralDepositPageProps {
  onNavigate: (page: string) => void;
  collateralData: {
    loanId: string;
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [paxgBalance, setPaxgBalance] = useState<string>('0');
  const [contractAddresses, setContractAddresses] = useState<any>(null);
  const [depositStep, setDepositStep] = useState<'connect' | 'approve' | 'deposit' | 'confirm'>('connect');

  useEffect(() => {
    if (!collateralData) {
      onNavigate('loan-center');
      return;
    }

    // Load contract addresses
    loadContractAddresses();

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

  const loadContractAddresses = async () => {
    try {
      const addresses = await getContractAddresses();
      setContractAddresses(addresses);
    } catch (error: any) {
      console.error('Failed to load contract addresses:', error);
      toast.error('Failed to load smart contract addresses');
    }
  };

  const handleConnectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      toast.error('MetaMask not detected. Please install MetaMask extension.');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      
      // Get PAXG balance
      if (contractAddresses) {
        const balance = await getPAXGBalance(address, contractAddresses.paxgToken);
        setPaxgBalance(balance);
        
        toast.success(`Wallet connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
        setDepositStep('deposit');
      }
    } catch (error: any) {
      console.error('Connect wallet error:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDepositCollateral = async () => {
    if (!walletAddress || !contractAddresses || !collateralData) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Check if user has enough PAXG
    const requiredAmount = collateralData.requiredCollateral.toString();
    if (parseFloat(paxgBalance) < collateralData.requiredCollateral) {
      toast.error(`Insufficient PAXG balance. Required: ${requiredAmount} PAXG, Available: ${paxgBalance} PAXG`);
      return;
    }

    setIsDepositing(true);
    setDepositStep('approve');
    
    try {
      toast.info('Step 1/2: Approving PAXG spending...');
      
      // Deposit collateral (includes approval)
      const txHash = await depositCollateral(
        contractAddresses.paxgToken,
        contractAddresses.collateralHolder,
        requiredAmount
      );
      
      setDepositStep('confirm');
      toast.success(`Deposit transaction sent: ${txHash.slice(0, 10)}...`);
      toast.info('Step 2/2: Verifying deposit on blockchain...');
      
      // Get loan ID from collateralData
      const loanId = collateralData.loanId;
      
      if (!loanId) {
        throw new Error('Loan ID not found. Please apply for the loan again.');
      }
      
      // Confirm deposit with backend
      const confirmation = await confirmCollateralDeposit(loanId, txHash, walletAddress);
      
      toast.success('✅ Collateral deposited successfully! Your loan has been approved.');
      console.log('Loan approved:', confirmation);
      
      // Complete deposit
      onDepositComplete();
      
      setTimeout(() => {
        onNavigate('loan-center');
      }, 2000);
      
    } catch (error: any) {
      console.error('Deposit collateral error:', error);
      toast.error(error.message || 'Failed to deposit collateral');
      setDepositStep('deposit'); // Reset to deposit step
    } finally {
      setIsDepositing(false);
    }
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
            {!walletAddress ? (
              /* Show Connect Wallet button */
              <Button 
                className="w-full bg-primary hover:bg-primary/90 h-12 sm:h-14 text-base sm:text-lg"
                onClick={handleConnectWallet}
                disabled={isConnecting || countdown === 0}
              >
                {isConnecting ? (
                  <>
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                    Connecting Wallet...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Connect MetaMask Wallet
                  </>
                )}
              </Button>
            ) : (
              /* Show Deposit button after wallet connected */
              <>
                {/* Wallet Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-700 mb-1">Connected Wallet</p>
                      <p className="font-medium text-green-900 text-sm">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-700 mb-1">PAXG Balance</p>
                      <p className="font-semibold text-green-900 text-sm">{parseFloat(paxgBalance).toFixed(4)} PAXG</p>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-primary hover:bg-primary/90 h-12 sm:h-14 text-base sm:text-lg"
                  onClick={handleDepositCollateral}
                  disabled={isDepositing || countdown === 0 || parseFloat(paxgBalance) < collateralData.requiredCollateral}
                >
                  {isDepositing ? (
                    <>
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      {depositStep === 'approve' && 'Approving PAXG...'}
                      {depositStep === 'deposit' && 'Depositing Collateral...'}
                      {depositStep === 'confirm' && 'Confirming on Blockchain...'}
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Deposit {collateralData.requiredCollateral.toFixed(9)} PAXG Collateral
                    </>
                  )}
                </Button>

                {parseFloat(paxgBalance) < collateralData.requiredCollateral && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-xs sm:text-sm">
                      ⚠️ Insufficient PAXG balance. You need {(collateralData.requiredCollateral - parseFloat(paxgBalance)).toFixed(4)} more PAXG.
                    </p>
                  </div>
                )}
              </>
            )}
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
