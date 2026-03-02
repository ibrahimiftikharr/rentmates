import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Wallet, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { depositToVault, recordDeposit } from "../../../../shared/services/walletService";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
  const [amount, setAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Invalid amount", {
        description: "Please enter a valid amount to deposit"
      });
      return;
    }

    const depositAmount = parseFloat(amount);
    if (depositAmount < 1) {
      toast.error("Minimum deposit is 1 USDT");
      return;
    }

    try {
      setIsDepositing(true);
      
      // Step 1: Deposit USDT to vault (blockchain transaction)
      toast.info("Please approve the transaction in MetaMask...");
      const txHash = await depositToVault(amount);
      
      // Step 2: Record deposit in backend
      await recordDeposit(amount, txHash); // Pass amount as string
      
      toast.success("Deposit successful! ✅", {
        description: `${amount} USDT has been added to your wallet`
      });
      
      setAmount("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast.error("Deposit failed", {
        description: error.message || "Failed to deposit USDT"
      });
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] p-0 gap-0">
        <DialogHeader className="p-4 sm:p-6 pb-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wallet className="h-5 w-5 text-primary" />
            Deposit USDT
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Transfer USDT from your wallet to the platform
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900">
              <p className="font-medium mb-1">You will need to:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-blue-800">
                <li>Approve USDT spending (if first time)</li>
                <li>Confirm the deposit transaction</li>
              </ol>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">Deposit Amount (USDT)</Label>
            <div className="relative">
              <Input
                id="deposit-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isDepositing}
                className="text-lg h-11"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                USDT
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum deposit: 1 USDT
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isDepositing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeposit}
              disabled={isDepositing || !amount || parseFloat(amount) <= 0}
              className="flex-1 bg-gradient-to-r from-primary to-purple-600"
            >
              {isDepositing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Deposit'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}