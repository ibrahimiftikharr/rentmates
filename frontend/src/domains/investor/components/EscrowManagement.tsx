import { useState } from "react";
import { Lock, Unlock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { EscrowReleaseModal } from "./modals/EscrowReleaseModal";

const escrowItems = [
  {
    loanId: "LN-2847",
    collateral: 5200,
    fulfillment: 100,
    status: "releasable",
    borrowerAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f89Ab",
  },
  {
    loanId: "LN-2846",
    collateral: 8500,
    fulfillment: 75,
    status: "locked",
    borrowerAddress: "0x1234567890abcdef1234567890abcdef12345678",
  },
  {
    loanId: "LN-2845",
    collateral: 3800,
    fulfillment: 45,
    status: "locked",
    borrowerAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
  },
];

export function EscrowManagement() {
  const [selectedEscrow, setSelectedEscrow] = useState<typeof escrowItems[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleReleaseClick = (item: typeof escrowItems[0]) => {
    setSelectedEscrow(item);
    setIsModalOpen(true);
  };

  return (
    <>
      <Card className="border-0 shadow-2xl hover:shadow-[0_20px_50px_rgba(140,87,255,0.15)] transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Escrow Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {escrowItems.map((item) => (
              <div
                key={item.loanId}
                className="rounded-lg border p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4>{item.loanId}</h4>
                      <Badge
                        variant="secondary"
                        className={
                          item.status === "releasable"
                            ? "bg-green-50 text-green-600 border-green-200"
                            : "bg-orange-50 text-orange-600 border-orange-200"
                        }
                      >
                        {item.status === "releasable" ? (
                          <Unlock className="mr-1 h-3 w-3" />
                        ) : (
                          <Lock className="mr-1 h-3 w-3" />
                        )}
                        {item.status === "releasable" ? "Releasable" : "Locked"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Locked Collateral</p>
                  </div>
                  <p>${item.collateral.toLocaleString()}</p>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Condition Fulfillment</span>
                    <span>{item.fulfillment}%</span>
                  </div>
                  <Progress value={item.fulfillment} className="h-2" />
                </div>

                {item.status === "releasable" && (
                  <div className="mt-3 space-y-2">
                    <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-xs text-green-700 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Auto-release conditions met
                      </p>
                    </div>
                    <Button
                      onClick={() => handleReleaseClick(item)}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:opacity-90"
                      size="sm"
                    >
                      <Unlock className="mr-2 h-4 w-4" />
                      Release Escrow
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>Auto Release Rule:</strong> Escrow funds are automatically released to your wallet once the borrower completes full repayment.
            </p>
          </div>
        </CardContent>
      </Card>

      {selectedEscrow && (
        <EscrowReleaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          loanId={selectedEscrow.loanId}
          borrowerAddress={selectedEscrow.borrowerAddress}
          collateralAmount={selectedEscrow.collateral}
        />
      )}
    </>
  );
}