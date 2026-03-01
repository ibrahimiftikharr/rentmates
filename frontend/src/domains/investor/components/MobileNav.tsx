import { LayoutDashboard, TrendingUp, Wallet, BarChart3, User } from "lucide-react";
import { cn } from "./ui/utils";

interface MobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Home" },
  { id: "investments", icon: TrendingUp, label: "Invest" },
  { id: "wallet", icon: Wallet, label: "Wallet" },
  { id: "analytics", icon: BarChart3, label: "Analytics" },
  { id: "profile", icon: User, label: "Profile" },
];

export function MobileNav({ currentPage, onNavigate }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 py-2 px-3 transition-all flex-1",
              currentPage === item.id
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5",
              currentPage === item.id && "text-primary"
            )} />
            <span className={cn(
              "text-[10px]",
              currentPage === item.id && "font-medium"
            )}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
