import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ArrowDownToDot, AlertTriangle, Loader2, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface PoolWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  poolId: string;
  poolName: string;
  totalShares: number;
  currentSharePrice: number;
  currentValue: number;
  totalAmountInvested: number;
  totalEarnings: number;
  riskLevel?: "Low" | "Medium" | "High";
  availableBalance: number; // Pool liquidity
}

export function PoolWithdrawalModal({
  isOpen,
  onClose,
  onSuccess,
  poolId,
  poolName,
  totalShares,
  currentSharePrice,
  currentValue,
  totalAmountInvested,
  totalEarnings,
  riskLevel = "Medium",
  availableBalance
}: PoolWithdrawalModalProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const amountNum = amount ? parseFloat(amount) : 0;
  const safeTotalShares = totalShares ?? 0;
  const safeCurrentSharePrice = currentSharePrice ?? 0;
  const safeCurrentValue = currentValue ?? 0;
  const safeTotalEarnings = totalEarnings ?? 0;
  const safeAvailableBalance = availableBalance ?? 0;
  
  // Maximum withdrawable is the minimum of share value and pool liquidity
  const maxWithdrawable = Math.min(safeCurrentValue, safeAvailableBalance);
  
  const sharesToSell = amountNum > 0 && safeCurrentSharePrice > 0 ? amountNum / safeCurrentSharePrice : 0;
  const remainingShares = safeTotalShares - sharesToSell;
  const remainingValue = remainingShares * safeCurrentSharePrice;
  const hasInsufficientShares = amountNum > 0 && amountNum > maxWithdrawable;
  const isAmountValid = amountNum > 0 && amountNum <= maxWithdrawable;

  // Reset amount when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount("");
    }
  }, [isOpen]);

  const getRiskColor = () => {
    switch (riskLevel) {
      case "Low": return "text-green-600 bg-green-50";
      case "Medium": return "text-orange-600 bg-orange-50";
      case "High": return "text-red-600 bg-red-50";
    }
  };

  const handleMaxClick = () => {
    setAmount(maxWithdrawable.toFixed(2));
  };

  const handleWithdraw = async () => {
    if (!poolId) {
      toast.error("Invalid pool", {
        description: "Pool ID is required for withdrawal"
      });
      return;
    }

    if (!amount || amountNum <= 0) {
      toast.error("Invalid amount", {
        description: "Please enter a valid withdrawal amount"
      });
      return;
    }

    if (amountNum > maxWithdrawable) {
      const limitReason = maxWithdrawable < safeCurrentValue ? 'pool liquidity' : 'share value';
      toast.error(`Insufficient ${limitReason}`, {
        description: `Maximum withdrawal is ${maxWithdrawable.toFixed(2)} USDT`
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Import the service function dynamically to avoid circular deps
      const { withdrawFromPool } = await import("../../services/investmentService");
      const response = await withdrawFromPool(poolId, amountNum);
      
      toast.success("Withdrawal successful! 💰", {
        description: `${amountNum.toFixed(2)} USDT has been added to your wallet`
      });

      // Call success callback to refresh data
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error("Withdrawal failed", {
        description: error.error || error.message || "Failed to process withdrawal"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2 text-2xl mb-2">
                <ArrowDownToDot className="h-6 w-6 text-primary" />
                Withdraw from {poolName}
              </DialogTitle>
              <DialogDescription>
                Sell your shares at current market price
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Current Position Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 space-y-3">
            <h4 className="font-semibold text-base text-blue-900">Your Position</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-blue-600">Total Shares</span>
                <p className="text-lg font-bold text-blue-900">{safeTotalShares.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-xs text-blue-600">Share Price</span>
                <p className="text-lg font-bold text-blue-900">${safeCurrentSharePrice.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-xs text-blue-600">Share Value</span>
                <p className="text-lg font-bold text-blue-900">${safeCurrentValue.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-xs text-blue-600">Pool Liquidity</span>
                <p className="text-lg font-bold text-blue-900">${safeAvailableBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Max Withdrawable Info */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-green-600 font-medium">Maximum Withdrawable</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {maxWithdrawable < safeCurrentValue 
                    ? 'Limited by pool liquidity' 
                    : 'Full share value available'}
                </p>
              </div>
              <p className="text-2xl font-bold text-green-900">${maxWithdrawable.toFixed(2)}</p>
            </div>
          </div>
          
          {/* Earnings Summary */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-3 border border-purple-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-purple-600 font-medium">Total Earnings</span>
              <p className={`text-lg font-bold ${safeTotalEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {safeTotalEarnings >= 0 ? '+' : ''}{safeTotalEarnings.toFixed(2)} USDT
              </p>
            </div>
          </div>

          {/* Warning Banner */}
          <div className={`${getRiskColor()} border border-current/20 rounded-lg p-4 flex items-start gap-3`}>
            <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Withdrawing will sell your shares at the current price. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="withdrawAmount">Withdrawal Amount (USDT)</Label>
            <div className="relative">
              <Input
                id="withdrawAmount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`text-lg h-12 pr-16 ${hasInsufficientShares ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                step="0.01"
                min="0"
                max={maxWithdrawable}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                USDT
              </span>
            </div>
            {hasInsufficientShares && (
              <p className="text-sm text-red-600 font-medium">
                ⚠️ Exceeds {maxWithdrawable < safeCurrentValue ? 'pool liquidity' : 'available value'}
              </p>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Min: 0.01 USDT</span>
              <Button 
                variant="link" 
                className="h-auto p-0 text-primary"
                onClick={handleMaxClick}
              >
                Max: {maxWithdrawable.toFixed(2)} USDT
              </Button>
            </div>
          </div>

          {/* Withdrawal Summary */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 space-y-3 border border-purple-200">
            <h4 className="font-semibold text-base">Withdrawal Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Withdrawal Amount</span>
                <span className="font-medium">{amountNum.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between text-sm bg-purple-100 -mx-2 px-2 py-1 rounded">
                <span className="text-purple-700 font-medium">Shares to Sell</span>
                <span className="font-bold text-purple-900">{sharesToSell.toFixed(6)} shares</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Share Price</span>
                <span className="font-medium">${safeCurrentSharePrice.toFixed(6)}/share</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining Shares</span>
                <span className="font-medium">{remainingShares >= 0 ? remainingShares.toFixed(6) : '0.000000'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-lg">Remaining Value</span>
                <span className="font-bold text-xl text-blue-600">
                  ${remainingValue >= 0 ? remainingValue.toFixed(2) : '0.00'} USDT
                </span>
              </div>
            </div>
          </div>

          {/* Profit/Loss Display */}
          {amountNum > 0 && (
            <div className={`rounded-lg p-4 border ${safeTotalEarnings >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className={`h-5 w-5 ${safeTotalEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <span className="text-sm font-medium text-muted-foreground">
                    {safeTotalEarnings >= 0 ? 'Total Profit' : 'Total Loss'}
                  </span>
                </div>
                <span className={`text-lg font-bold ${safeTotalEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {safeTotalEarnings >= 0 ? '+' : ''}{safeTotalEarnings.toFixed(2)} USDT
                </span>
              </div>
              {amountNum < safeCurrentValue && (
                <p className="text-xs text-muted-foreground mt-2">
                  Partial withdrawal - {((amountNum / safeCurrentValue) * 100).toFixed(1)}% of position
                </p>
              )}
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
              onClick={handleWithdraw}
              disabled={isLoading || !isAmountValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Withdrawal'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
