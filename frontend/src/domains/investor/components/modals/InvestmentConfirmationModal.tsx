import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { TrendingUp, AlertTriangle, X, Loader2 } from "lucide-react";
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
  isWalletConnected = true
}: InvestmentConfirmationModalProps) {
  const [amount, setAmount] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const amountNum = amount ? parseFloat(amount) : 0;
  const estimatedReturn = amount ? (amountNum * parseFloat(estimatedROI) / 100).toFixed(2) : "0";
  const estimatedRevenue = amount ? (amountNum + parseFloat(estimatedReturn)).toFixed(2) : "0";
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
      <DialogContent className="max-w-[550px] p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 text-2xl mb-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Invest in {poolName}
              </DialogTitle>
              <DialogDescription>
                Lock your funds for {duration} months and earn returns
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Risk Alert Banner */}
          <div className={`${getRiskColor()} border border-current/20 rounded-lg p-4 flex items-start gap-3`}>
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Risk: {riskLevel} | Expected ROI: {estimatedROI}
              </p>
            </div>
          </div>

          {/* Wallet Balance Display */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Available Wallet Balance</span>
              <span className="text-xl font-bold text-blue-600">${(walletBalance || 0).toFixed(2)} USDT</span>
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{duration} months</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expected ROI</span>
                <span className="font-medium text-primary">{estimatedROI}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated Return</span>
                <span className="font-medium text-green-600">~{estimatedReturn} USDT</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between">
                <span className="font-semibold text-lg">Estimated Revenue</span>
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
                I understand that my funds will be locked for {duration} months and I accept the{" "}
                <span className="font-semibold">{riskLevel} Risk</span> associated with this investment pool. 
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