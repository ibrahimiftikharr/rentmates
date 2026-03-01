import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Wallet, Copy, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("ethereum");
  const [copied, setCopied] = useState(false);

  const depositAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f89Ab";
  
  const networks = {
    ethereum: {
      name: "Ethereum",
      symbol: "ERC-20",
      confirmations: 12,
      minDeposit: 10
    },
    polygon: {
      name: "Polygon",
      symbol: "Polygon",
      confirmations: 50,
      minDeposit: 5
    },
    bsc: {
      name: "BSC",
      symbol: "BEP-20",
      confirmations: 15,
      minDeposit: 5
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    toast.success("Address copied!", {
      description: "Deposit address copied to clipboard"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const recentDeposits = [
    { amount: 1000, status: "Confirmed", confirmations: "12/12" },
    { amount: 500, status: "Pending", confirmations: "8/12" },
    { amount: 2500, status: "Confirmed", confirmations: "12/12" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[550px] p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Wallet className="h-6 w-6 text-primary" />
            Deposit USDT
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Send USDT to your wallet address
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Network Selector */}
          <Tabs value={selectedNetwork} onValueChange={setSelectedNetwork} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
              <TabsTrigger value="polygon">Polygon</TabsTrigger>
              <TabsTrigger value="bsc">BSC</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* QR Code Placeholder */}
          <div className="flex justify-center py-6">
            <div className="w-48 h-48 bg-gradient-to-br from-primary/10 to-purple-500/10 border-2 border-primary/20 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-40 h-40 bg-white rounded-lg flex items-center justify-center mb-2">
                  <div className="grid grid-cols-8 gap-1 p-2">
                    {[...Array(64)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1 h-1 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Scan to deposit</p>
              </div>
            </div>
          </div>

          {/* Address Display */}
          <div className="space-y-2">
            <Label>Deposit Address</Label>
            <div className="flex gap-2">
              <Input
                value={depositAddress}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <h4 className="font-semibold text-yellow-900">Important Notes</h4>
            </div>
            <ul className="text-xs text-yellow-800 space-y-1 ml-7">
              <li>• Minimum deposit: {networks[selectedNetwork as keyof typeof networks].minDeposit} USDT</li>
              <li>• Network: {networks[selectedNetwork as keyof typeof networks].name} ({networks[selectedNetwork as keyof typeof networks].symbol})</li>
              <li>• Confirmations required: {networks[selectedNetwork as keyof typeof networks].confirmations}</li>
              <li>• Only send USDT to this address - other tokens will be lost</li>
            </ul>
          </div>

          {/* Recent Deposits */}
          <div className="space-y-3">
            <h4 className="font-semibold">Recent Deposits</h4>
            <div className="border rounded-lg overflow-hidden">
              <div className="divide-y">
                {recentDeposits.map((deposit, index) => (
                  <div key={index} className="p-3 flex items-center justify-between hover:bg-accent/50 transition-colors">
                    <div>
                      <p className="font-medium">{deposit.amount} USDT</p>
                      <p className="text-xs text-muted-foreground">
                        {deposit.confirmations} confirmations
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      deposit.status === "Confirmed" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      {deposit.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}