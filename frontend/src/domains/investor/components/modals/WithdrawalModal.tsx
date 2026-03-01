import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Wallet, Info, Shield, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
}

export function WithdrawalModal({
  isOpen,
  onClose,
  availableBalance
}: WithdrawalModalProps) {
  const [amount, setAmount] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

    if (!destinationAddress || destinationAddress.length < 10) {
      toast.error("Invalid address", {
        description: "Please enter a valid destination address"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    toast.success("Withdrawal initiated! ✅", {
      description: `${amount} USDT will be sent to your wallet`
    });
    
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[550px] p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-2xl">
            <Wallet className="h-6 w-6 text-primary" />
            Withdraw Funds
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Transfer your USDT to an external wallet
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Balance Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-900 font-medium">
              Available Balance: {availableBalance} USDT
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
                className="text-lg h-12 pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                USDT
              </span>
            </div>
            <div className="flex justify-end">
              <Button 
                variant="link" 
                className="h-auto p-0 text-primary"
                onClick={handleMaxClick}
              >
                Withdraw Maximum
              </Button>
            </div>
          </div>

          {/* Destination Address */}
          <div className="space-y-2">
            <Label htmlFor="destination">Destination Address</Label>
            <Input
              id="destination"
              type="text"
              placeholder="0x..."
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              className="font-mono text-sm h-12"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Double-check the address before confirming
            </p>
          </div>

          {/* Transaction Summary */}
          <div className="bg-gradient-to-br from-purple-50 to-primary/5 rounded-lg p-4 space-y-3 border border-primary/10">
            <h4 className="font-semibold text-base flex items-center gap-2">
              Transaction Summary
              <ArrowRight className="h-4 w-4 text-primary" />
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Withdrawal Amount</span>
                <span className="font-medium">{amount || "0.00"} USDT</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between items-center">
                <span className="font-semibold">You'll Receive</span>
                <span className="font-bold text-xl text-green-600">{amount || "0.00"} USDT</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-900 mb-1">Security Notice</p>
              <p className="text-xs text-orange-800 leading-relaxed">
                Withdrawals are final and cannot be reversed. Please verify the destination address carefully.
              </p>
            </div>
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
              className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Confirm Withdrawal
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}