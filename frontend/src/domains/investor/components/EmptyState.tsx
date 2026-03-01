import { Button } from "./ui/button";
import { TrendingUp, FileText, Wallet, Search } from "lucide-react";

interface EmptyStateProps {
  type: "investments" | "transactions" | "wallet" | "search";
  onAction?: () => void;
}

export function EmptyState({ type, onAction }: EmptyStateProps) {
  const configs = {
    investments: {
      icon: TrendingUp,
      title: "No investments yet",
      description: "Start investing to see your portfolio here",
      buttonText: "Browse Pools",
      illustration: (
        <div className="w-32 h-32 mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-2xl"></div>
          <div className="relative w-full h-full flex items-center justify-center">
            <TrendingUp className="w-16 h-16 text-primary/40" strokeWidth={1.5} />
          </div>
        </div>
      )
    },
    transactions: {
      icon: FileText,
      title: "No transactions yet",
      description: "Your transaction history will appear here",
      buttonText: null,
      illustration: (
        <div className="w-32 h-32 mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl"></div>
          <div className="relative w-full h-full flex items-center justify-center">
            <FileText className="w-16 h-16 text-blue-500/40" strokeWidth={1.5} />
          </div>
        </div>
      )
    },
    wallet: {
      icon: Wallet,
      title: "Wallet not connected",
      description: "Connect your wallet to view your dashboard",
      buttonText: "Connect Wallet",
      illustration: (
        <div className="w-32 h-32 mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full blur-2xl"></div>
          <div className="relative w-full h-full flex items-center justify-center">
            <Wallet className="w-16 h-16 text-orange-500/40" strokeWidth={1.5} />
          </div>
        </div>
      )
    },
    search: {
      icon: Search,
      title: "No results found",
      description: "Try adjusting your search or filters",
      buttonText: null,
      illustration: (
        <div className="w-32 h-32 mb-6 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-full blur-2xl"></div>
          <div className="relative w-full h-full flex items-center justify-center">
            <Search className="w-16 h-16 text-gray-500/40" strokeWidth={1.5} />
          </div>
        </div>
      )
    }
  };

  const config = configs[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {config.illustration}
      <h3 className="text-xl font-semibold mb-2 text-foreground/90">
        {config.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
        {config.description}
      </p>
      {config.buttonText && onAction && (
        <Button 
          onClick={onAction}
          className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"
        >
          <config.icon className="mr-2 h-4 w-4" />
          {config.buttonText}
        </Button>
      )}
    </div>
  );
}
