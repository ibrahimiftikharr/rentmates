import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Wallet, Copy, ExternalLink, User, Settings, LogOut, Check } from "lucide-react";
import { toast } from "sonner";

interface WalletDropdownProps {
  address: string;
  ethBalance: string;
  usdtBalance: string;
}

export function WalletDropdown({ address, ethBalance, usdtBalance }: WalletDropdownProps) {
  const [copied, setCopied] = useState(false);

  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied!", {
      description: "Wallet address copied to clipboard"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    toast.info("Wallet disconnected", {
      description: "You have been disconnected from your wallet"
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="font-normal">
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground font-medium">Wallet Info</p>
            <div className="flex items-center justify-between">
              <code className="text-xs bg-accent px-2 py-1 rounded font-mono">
                {truncatedAddress}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopyAddress}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ETH Balance:</span>
                <span className="font-semibold">{ethBalance} ETH</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">USDT Balance:</span>
                <span className="font-semibold">{usdtBalance} USDT</span>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleCopyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a 
            href={`https://etherscan.io/address/${address}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center cursor-pointer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Explorer
          </a>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Preferences
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleDisconnect}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
