import { useState } from "react";
import { Wallet, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Badge } from "./ui/badge";
import { WithdrawalModal } from "./modals/WithdrawalModal";
import { DepositModal } from "./modals/DepositModal";
import { TransferModal } from "./modals/TransferModal";
import { toast } from "sonner";

export function WalletOverview() {
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  return (
    <>
      <Card className="border-0 shadow-2xl hover:shadow-[0_20px_50px_rgba(140,87,255,0.15)] transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span className="flex items-center gap-2 text-base md:text-lg">
              <Wallet className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              Wallet & Escrow Overview
            </span>
            <Badge variant="secondary" className="bg-green-50 text-green-600 border-green-200">
              Connected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-[#7367F0]/10 p-3 md:p-4 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs md:text-sm text-muted-foreground">Connected Wallet</p>
              <img 
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23F6851B' stroke-width='2'%3E%3Cpath d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z'/%3E%3Cpath d='M9 12l2 2 4-4'/%3E%3C/svg%3E" 
                alt="MetaMask" 
                className="h-5 w-5"
              />
            </div>
            <p className="font-mono text-sm md:text-base">0x742d...89Ab</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Available Balance</p>
                <p className="mt-1 text-base md:text-lg">2,450 USDT</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-[#7367F0] flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button variant="outline" className="flex-col h-auto py-2 md:py-3 gap-1" onClick={() => setIsDepositModalOpen(true)}>
              <ArrowDownToLine className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="text-[10px] md:text-xs">Deposit</span>
            </Button>
            <Button variant="outline" className="flex-col h-auto py-2 md:py-3 gap-1" onClick={() => setIsWithdrawalModalOpen(true)}>
              <ArrowUpFromLine className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="text-[10px] md:text-xs">Withdraw</span>
            </Button>
            <Button variant="outline" className="flex-col h-auto py-2 md:py-3 gap-1" onClick={() => setIsTransferModalOpen(true)}>
              <ArrowRightLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="text-[10px] md:text-xs">Transfer</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <WithdrawalModal isOpen={isWithdrawalModalOpen} onClose={() => setIsWithdrawalModalOpen(false)} availableBalance={2450} />
      <DepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} />
      <TransferModal 
        isOpen={isTransferModalOpen} 
        onClose={() => setIsTransferModalOpen(false)} 
        walletBalance={2450}
        escrowBalance={45800}
      />
    </>
  );
}