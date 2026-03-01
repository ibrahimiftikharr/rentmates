import { InvestmentPoolExplorer } from "../components/InvestmentPoolExplorer";
import { PortfolioPerformance } from "../components/PortfolioPerformance";

export function InvestmentsPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="mb-1 md:mb-2 text-xl md:text-2xl">Investment Pools</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Explore available pools and track your portfolio performance
        </p>
      </div>

      <InvestmentPoolExplorer />
      <PortfolioPerformance />
    </div>
  );
}