import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ArrowRightLeft, Wallet, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletBalance: number;
  escrowBalance: number;
}

export function TransferModal({ isOpen, onClose, walletBalance, escrowBalance }: TransferModalProps) {
  const [transferDirection, setTransferDirection] = useState<"wallet-to-escrow" | "escrow-to-wallet">("wallet-to-escrow");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sourceBalance = transferDirection === "wallet-to-escrow" ? walletBalance : escrowBalance;
  const destinationBalance = transferDirection === "wallet-to-escrow" ? escrowBalance : walletBalance;
  const sourceName = transferDirection === "wallet-to-escrow" ? "Wallet" : "Escrow";
  const destinationName = transferDirection === "wallet-to-escrow" ? "Escrow" : "Wallet";

  const handleMaxClick = () => {
    setAmount(sourceBalance.toString());
  };

  const handleTransfer = async () => {
    const transferAmount = parseFloat(amount);

    if (!amount || transferAmount <= 0) {
      toast.error("Invalid amount", {
        description: "Please enter a valid transfer amount"
      });
      return;
    }

    if (transferAmount > sourceBalance) {
      toast.error("Insufficient balance", {
        description: `You only have ${sourceBalance.toLocaleString()} USDT in your ${sourceName}`
      });
      return;
    }

    setIsLoading(true);

    // Simulate transfer processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast.success("Transfer successful! ✅", {
      description: `${transferAmount.toLocaleString()} USDT transferred from ${sourceName} to ${destinationName}`
    });

    setIsLoading(false);
    setAmount("");
    onClose();
  };

  const handleDirectionSwitch = () => {
    setTransferDirection(prev => 
      prev === "wallet-to-escrow" ? "escrow-to-wallet" : "wallet-to-escrow"
    );
    setAmount("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[550px] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
            Transfer Funds
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Move funds between your wallet and escrow
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Transfer Direction Visual */}
          <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-lg p-4 border border-primary/10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-center">
                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-full mb-2 ${
                  transferDirection === "wallet-to-escrow" 
                    ? "bg-gradient-to-br from-primary to-purple-600" 
                    : "bg-gray-200"
                }`}>
                  <Wallet className={`h-6 w-6 ${
                    transferDirection === "wallet-to-escrow" ? "text-white" : "text-gray-600"
                  }`} />
                </div>
                <p className="text-sm font-semibold">Wallet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {walletBalance.toLocaleString()} USDT
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-primary/10"
                onClick={handleDirectionSwitch}
              >
                <ArrowRight className="h-5 w-5 text-primary" />
              </Button>

              <div className="flex-1 text-center">
                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-full mb-2 ${
                  transferDirection === "escrow-to-wallet" 
                    ? "bg-gradient-to-br from-primary to-purple-600" 
                    : "bg-gray-200"
                }`}>
                  <Wallet className={`h-6 w-6 ${
                    transferDirection === "escrow-to-wallet" ? "text-white" : "text-gray-600"
                  }`} />
                </div>
                <p className="text-sm font-semibold">Escrow</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {escrowBalance.toLocaleString()} USDT
                </p>
              </div>
            </div>
          </div>

          {/* Transfer Direction Label */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-900">
              Transferring from <span className="font-semibold">{sourceName}</span> to <span className="font-semibold">{destinationName}</span>
            </p>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="transfer-amount">Transfer Amount (USDT)</Label>
            <div className="relative">
              <Input
                id="transfer-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-16 text-lg"
                min="0"
                step="0.01"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-xs font-semibold text-primary hover:text-primary"
                onClick={handleMaxClick}
              >
                MAX
              </Button>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Available: {sourceBalance.toLocaleString()} USDT</span>
              {amount && parseFloat(amount) > 0 && (
                <span>After transfer: {(sourceBalance - parseFloat(amount)).toLocaleString()} USDT</span>
              )}
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map((percentage) => (
              <Button
                key={percentage}
                variant="outline"
                size="sm"
                onClick={() => setAmount((sourceBalance * (percentage / 100)).toFixed(2))}
                className="text-xs"
              >
                {percentage}%
              </Button>
            ))}
          </div>

          {/* Summary */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-accent/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transfer Amount</span>
                <span className="font-semibold">{parseFloat(amount).toLocaleString()} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">From</span>
                <span className="font-medium">{sourceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium">{destinationName}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between font-semibold">
                <span>New {destinationName} Balance</span>
                <span className="text-primary">
                  {(destinationBalance + parseFloat(amount)).toLocaleString()} USDT
                </span>
              </div>
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
              className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
              onClick={handleTransfer}
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Transfer Funds
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
