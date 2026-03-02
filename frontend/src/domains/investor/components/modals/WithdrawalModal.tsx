import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Wallet, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { withdrawFromVault } from "../../../../shared/services/walletService";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSuccess?: () => void;
}

export function WithdrawalModal({
  isOpen,
  onClose,
  availableBalance,
  onSuccess
}: WithdrawalModalProps) {
  const [amount, setAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleMaxClick = () => {
    setAmount(availableBalance.toString());
  };

  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableBalance) {
      toast.error("Invalid amount", {
        description: `Please enter an amount up to ${availableBalance} USDT`
      });
      return;
    }

    const withdrawAmount = parseFloat(amount);

    try {
      setIsWithdrawing(true);
      
      toast.info("Processing withdrawal...");
      await withdrawFromVault(amount); // Pass as string
      
      toast.success("Withdrawal successful! ✅", {
        description: `${amount} USDT has been sent to your wallet`
      });
      
      setAmount("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error("Withdrawal failed", {
        description: error.message || "Failed to withdraw USDT"
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="p-4 sm:p-6 pb-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wallet className="h-5 w-5 text-primary" />
            Withdraw Funds
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Transfer your USDT to your connected wallet
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Balance Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-900">
              Available: <span className="font-bold">{availableBalance.toFixed(2)} USDT</span>
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="withdrawal-amount">Withdrawal Amount (USDT)</Label>
            <div className="relative">
              <Input
                id="withdrawal-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isWithdrawing}
                className="text-lg h-11"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                USDT
              </span>
            </div>
            <div className="flex justify-end">
              <Button 
                variant="link" 
                className="h-auto p-0 text-xs text-primary"
                onClick={handleMaxClick}
                disabled={isWithdrawing}
              >
                Withdraw Maximum
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isWithdrawing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={isWithdrawing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > availableBalance}
              className="flex-1 bg-gradient-to-r from-primary to-purple-600"
            >
              {isWithdrawing ? (
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