import { Search, Bell, User, Wallet } from "lucide-react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { WalletDropdown } from "./WalletDropdown";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { ProfileDropdown } from "./ProfileDropdown";

interface HeaderProps {
  onNavigate?: (page: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="flex h-14 md:h-16 items-center gap-2 md:gap-4 px-3 md:px-6">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#7367F0]">
            <Wallet className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base md:text-lg tracking-tight">RentMates</h1>
            <p className="text-xs text-muted-foreground">Investor Dashboard</p>
          </div>
        </div>
        
        <div className="ml-auto flex items-center gap-1.5 md:gap-3">
          <WalletDropdown 
            address="0x742d35Cc6634C0532925a3b844Bc9e7595f89Ab"
            ethBalance="1.2543"
            usdtBalance="2,450"
          />
          
          <div className="relative hidden lg:block w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-10 bg-accent/50 border-0"
            />
          </div>
          
          <NotificationsDropdown />
          
          <ProfileDropdown onNavigate={onNavigate} />
        </div>
      </div>
    </header>
  );
}