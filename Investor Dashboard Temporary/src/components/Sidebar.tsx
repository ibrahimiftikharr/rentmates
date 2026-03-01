import { LayoutDashboard, TrendingUp, Wallet, BarChart3, ChevronLeft, ChevronRight, Sparkles, User, Shield } from "lucide-react";
import { cn } from "./ui/utils";

type MenuItem = {
  id: string;
  icon: any;
  label: string;
};

const menuItems: MenuItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "profile", icon: User, label: "Profile" },
  { id: "investments", icon: TrendingUp, label: "Investments" },
  { id: "wallet", icon: Wallet, label: "Wallet" },
  { id: "analytics", icon: BarChart3, label: "Analytics" },
  { id: "demo", icon: Sparkles, label: "Demo" },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ currentPage, onNavigate, isCollapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside className={cn(
      "fixed left-0 top-14 md:top-16 bottom-0 border-r bg-card overflow-y-auto transition-all duration-300 z-40 hidden md:block",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center p-3 md:p-4 hover:bg-accent transition-colors border-b"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          )}
        </button>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-2 md:p-4 flex-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex items-center gap-2 md:gap-3 rounded-lg px-3 md:px-4 py-2.5 md:py-3 transition-all text-sm md:text-base",
                currentPage === item.id
                  ? "bg-gradient-to-r from-primary to-[#7367F0] text-white shadow-md"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        
        {/* Info Card */}
        {!isCollapsed && (
          <div className="mx-2 md:mx-4 mb-4 md:mb-6 rounded-xl bg-gradient-to-br from-primary/10 to-[#7367F0]/10 p-3 md:p-4 border border-primary/20">
            <div className="mb-2 flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#7367F0]">
              <Shield className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <h4 className="mb-1 text-sm md:text-base">Secure Investments</h4>
            <p className="text-[10px] md:text-xs text-muted-foreground mb-3">
              All transactions are blockchain-verified
            </p>
            <button 
              onClick={() => onNavigate("demo")}
              className="w-full rounded-lg bg-primary px-3 py-2 text-xs text-white hover:bg-primary/90 transition-colors"
            >
              Learn More
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}