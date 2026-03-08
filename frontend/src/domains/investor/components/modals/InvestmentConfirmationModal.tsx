import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { investInPool } from "../../services/investmentService";

interface InvestmentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolId?: string;
  poolName: string;
  duration: number;
  riskLevel: "Low" | "Medium" | "High";
  estimatedROI: string;
  maxAmount: number;
  minAmount: number;
  walletBalance?: number;
  isWalletConnected?: boolean;
  currentSharePrice?: number;
  totalShares?: number;
}

/**
 * Calculate actual expected return using amortized loan formula
 * This matches how loans are calculated on the backend
 */
function calculateExpectedReturn(principal: number, annualAPR: number, months: number): number {
  const monthlyRate = annualAPR / 100 / 12;
  
  // Handle 0% interest edge case
  if (monthlyRate === 0) {
    return 0;
  }
  
  // Calculate monthly payment using amortization formula
  const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  const monthlyPayment = principal * (numerator / denominator);
  
  // Total interest earned = Total payments - Principal
  const totalRepayment = monthlyPayment * months;
  const totalInterest = totalRepayment - principal;
  
  return totalInterest;
}

export function InvestmentConfirmationModal({
  isOpen,
  onClose,
  poolId = '',
  poolName,
  duration,
  riskLevel,
  estimatedROI,
  maxAmount,
  minAmount,
  walletBalance = 0,
  isWalletConnected = true,
  currentSharePrice = 1.0,
  totalShares = 0
}: InvestmentConfirmationModalProps) {
  const [amount, setAmount] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const amountNum = amount ? parseFloat(amount) : 0;
  const sharesToReceive = amountNum > 0 ? amountNum / currentSharePrice : 0;
  
  // ✅ FIX: Calculate actual expected return using amortization formula
  const estimatedReturn = amountNum > 0 
    ? calculateExpectedReturn(amountNum, parseFloat(estimatedROI), duration).toFixed(2)
    : "0";
  const estimatedRevenue = amount ? (amountNum + parseFloat(estimatedReturn)).toFixed(2) : "0";
  
  // Calculate effective ROI percentage for display
  const effectiveROI = amountNum > 0 
    ? ((parseFloat(estimatedReturn) / amountNum) * 100).toFixed(2)
    : "0";
  
  const hasInsufficientBalance = amountNum > 0 && amountNum > walletBalance;
  const isAmountValid = amountNum >= minAmount && amountNum <= maxAmount && amountNum <= walletBalance;

  const getRiskColor = () => {
    switch (riskLevel) {
      case "Low": return "text-green-600 bg-green-50";
      case "Medium": return "text-orange-600 bg-orange-50";
      case "High": return "text-red-600 bg-red-50";
    }
  };

  const handleMaxClick = () => {
    const maxAllowedAmount = Math.min(maxAmount, walletBalance);
    setAmount(maxAllowedAmount.toString());
  };

  const handleConfirm = async () => {
    if (!poolId) {
      toast.error("Invalid pool", {
        description: "Pool ID is required for investment"
      });
      return;
    }

    if (!amount || amountNum < minAmount || amountNum > maxAmount) {
      toast.error("Invalid amount", {
        description: `Please enter an amount between ${minAmount} and ${maxAmount} USDT`
      });
      return;
    }

    if (amountNum > walletBalance) {
      toast.error("Insufficient balance", {
        description: `Your wallet balance is ${(walletBalance || 0).toFixed(2)} USDT`
      });
      return;
    }

    if (!agreedToTerms) {
      toast.warning("Terms not accepted", {
        description: "Please accept the terms and conditions to continue"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await investInPool(poolId, parseFloat(amount));
      
      toast.success("Investment successful! 🎉", {
        description: `You've invested ${amount} USDT in ${poolName}. New balance: $${response.newBalance.toFixed(2)}`
      });
      
      // Reset form
      setAmount("");
      setAgreedToTerms(false);
      onClose();
    } catch (error: any) {
      toast.error("Investment failed", {
        description: error.message || "Failed to process investment"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-0 gap-0 max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-2xl mb-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Invest in {poolName}
              </DialogTitle>
              <DialogDescription>
                Open-ended pool • Withdraw anytime • Duration: {duration} months (loan term, not lock period)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-5">
          {/* Risk Alert Banner */}
          <div className={`${getRiskColor()} border border-current/20 rounded-lg p-4 flex items-start gap-3`}>
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Risk: {riskLevel} | APR: {estimatedROI}% | Effective ROI: {effectiveROI}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                APR is annualized; your actual return for {duration} months will be approximately {effectiveROI}%
              </p>
            </div>
          </div>

          {/* Wallet Balance & Share Price Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <span className="text-xs text-blue-600 font-medium">Available Balance</span>
              <p className="text-xl font-bold text-blue-900 mt-1">${(walletBalance || 0).toFixed(2)} USDT</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <span className="text-xs text-purple-600 font-medium">Current Share Price</span>
              <p className="text-xl font-bold text-purple-900 mt-1">${currentSharePrice.toFixed(6)}</p>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Investment Amount (USDT)</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`text-lg h-12 pr-16 ${hasInsufficientBalance ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                USDT
              </span>
            </div>
            {hasInsufficientBalance && (
              <p className="text-sm text-red-600 font-medium">
                ⚠️ Insufficient wallet balance
              </p>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Min: {minAmount} USDT</span>
              <Button 
                variant="link" 
                className="h-auto p-0 text-primary"
                onClick={handleMaxClick}
              >
                Max: {Math.min(maxAmount, walletBalance)} USDT
              </Button>
            </div>
          </div>

          {/* Investment Summary */}
          <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-lg p-4 space-y-3 border border-primary/10">
            <h4 className="font-semibold text-base">Investment Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Investment Amount</span>
                <span className="font-medium">{amountNum.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-sm bg-purple-50 -mx-2 px-2 py-1 rounded">
                <span className="text-purple-700 font-medium">Shares You'll Receive</span>
                <span className="font-bold text-purple-900">{sharesToReceive.toFixed(6)} shares</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Loan Duration</span>
                <span className="font-medium">{duration} months</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pool APR (Annual)</span>
                <span className="font-medium text-muted-foreground">{estimatedROI}%</span>
              </div>
              <div className="flex justify-between text-sm bg-green-50 -mx-2 px-2 py-1 rounded">
                <span className="text-green-700 font-medium">Effective ROI ({duration}mo)</span>
                <span className="font-bold text-green-900">{effectiveROI}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated Return</span>
                <span className="font-medium text-green-600">~{estimatedReturn} USDT</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between">
                <span className="font-semibold text-lg">Estimated Final Value</span>
                <span className="font-bold text-xl text-green-600">{estimatedRevenue} USDT</span>
              </div>
            </div>
          </div>

          {/* Risk Disclosure */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="mt-0.5"
              />
              <Label 
                htmlFor="terms" 
                className="text-sm leading-relaxed cursor-pointer"
              >
                I understand this is an <span className="font-semibold">open-ended pool investment</span> where I can withdraw anytime. I accept the{" "}
                <span className="font-semibold">{riskLevel} Risk</span> associated with this pool. 
                Returns are automatically reinvested (compounded) to increase share value. 
                I have read and agree to the{" "}
                <span className="text-primary underline cursor-pointer">terms and conditions</span>.
              </Label>
            </div>
          </div>

          {/* Wallet Warning */}
          {!isWalletConnected && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 font-medium">
                ⚠️ Please connect your wallet to continue with the investment
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="text-xs text-muted-foreground text-center italic px-2">
            <p>
              Illustrative estimate assuming full-duration participation. Actual returns depend on entry time and pool activity.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 disabled:opacity-50"
              onClick={handleConfirm}
              disabled={!isWalletConnected || isLoading || !isAmountValid || !agreedToTerms}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Confirm Investment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}