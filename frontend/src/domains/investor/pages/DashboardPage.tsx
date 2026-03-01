import { InvestmentSummaryCards } from "../components/InvestmentSummaryCards";
import { WalletOverview } from "../components/WalletOverview";
import { BottomWidgets } from "../components/BottomWidgets";

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="mb-1 md:mb-2 text-xl md:text-2xl">Dashboard Overview</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Monitor your investments, track returns, and manage your portfolio
        </p>
      </div>

      <InvestmentSummaryCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <WalletOverview />
        <div className="rounded-xl border-0 bg-gradient-to-br from-primary/10 to-[#7367F0]/10 p-4 md:p-6 shadow-lg">
          <div className="mb-4">
            <h3 className="mb-2 text-base md:text-lg">Quick Actions</h3>
            <p className="text-xs md:text-sm text-muted-foreground">Manage your portfolio efficiently</p>
          </div>
          <div className="space-y-2 md:space-y-3">
            <button 
              onClick={() => onNavigate?.("investments")}
              className="w-full rounded-lg bg-gradient-to-r from-primary to-[#7367F0] px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-white hover:opacity-90 transition-all text-left flex items-center justify-between"
            >
              <span>Browse Investment Pools</span>
              <span>→</span>
            </button>
            <button 
              onClick={() => onNavigate?.("analytics")}
              className="w-full rounded-lg bg-white border border-primary/20 px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-foreground hover:bg-primary/5 transition-all text-left flex items-center justify-between"
            >
              <span>View Analytics & Insights</span>
              <span>→</span>
            </button>
            <button 
              onClick={() => onNavigate?.("profile")}
              className="w-full rounded-lg bg-white border border-primary/20 px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-foreground hover:bg-primary/5 transition-all text-left flex items-center justify-between"
            >
              <span>Manage Profile and Settings</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      <BottomWidgets />
    </div>
  );
}