import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { ShieldCheck, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EscrowReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: string;
  borrowerAddress: string;
  collateralAmount: number;
}

export function EscrowReleaseModal({
  isOpen,
  onClose,
  loanId,
  borrowerAddress,
  collateralAmount
}: EscrowReleaseModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const conditions = [
    { label: "Principal repaid", value: 100, status: "completed" },
    { label: "Interest paid", value: 100, status: "completed" },
    { label: "No disputes filed", value: 100, status: "completed" },
    { label: "Waiting period", value: 60, status: "pending", remaining: "2 days" }
  ];

  const allConditionsMet = conditions.every(c => c.status === "completed");
  const overallProgress = conditions.reduce((acc, c) => acc + c.value, 0) / conditions.length;

  const handleRelease = async () => {
    if (!allConditionsMet) {
      toast.warning("Conditions not met", {
        description: "Not all conditions are satisfied yet"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate blockchain transaction
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    toast.success("Escrow released! ✅", {
      description: `${collateralAmount} USDT released to borrower`
    });
    
    setIsLoading(false);
    onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-orange-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[550px] p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Release Escrow
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Verify conditions before releasing collateral
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Loan Details */}
          <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-lg p-4 border border-primary/10 space-y-2">
            <h4 className="font-semibold">Loan Details</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loan ID</span>
                <span className="font-medium font-mono">{loanId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Borrower</span>
                <span className="font-medium font-mono text-xs">
                  {borrowerAddress.slice(0, 6)}...{borrowerAddress.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Collateral Amount</span>
                <span className="font-bold text-primary">{collateralAmount.toLocaleString()} USDT</span>
              </div>
            </div>
          </div>

          {/* Release Conditions */}
          <div className="space-y-3">
            <h4 className="font-semibold">Release Conditions</h4>
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div 
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    condition.status === "completed" 
                      ? "bg-green-50/50 border-green-200" 
                      : "bg-orange-50/50 border-orange-200"
                  }`}
                >
                  {getStatusIcon(condition.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{condition.label}: {condition.value}%</p>
                      {condition.remaining && (
                        <span className="text-xs text-orange-600 font-medium">
                          {condition.remaining} remaining
                        </span>
                      )}
                    </div>
                    <Progress value={condition.value} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Progress */}
          <div className="bg-accent/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold">Overall Progress</span>
              <span className="text-sm font-bold text-primary">{overallProgress.toFixed(0)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>

          {/* Warning Banner */}
          {!allConditionsMet && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Not all conditions met</p>
                <p className="text-xs text-red-800 mt-1">
                  Escrow cannot be released until all conditions are satisfied.
                </p>
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
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:opacity-90"
              onClick={handleRelease}
              disabled={!allConditionsMet || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Release Escrow
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}