import { useState, useEffect } from "react";
import { TrendingUp, Shield, Zap, Eye, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { InvestmentConfirmationModal } from "./modals/InvestmentConfirmationModal";
import { getAllPools, InvestmentPool } from "../services/investmentService";
import { toast } from "sonner";

export function InvestmentPoolExplorer() {
  const [pools, setPools] = useState<InvestmentPool[]>([]);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<InvestmentPool | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedPool, setExpandedPool] = useState<string | null>(null);
  const [showContribution, setShowContribution] = useState<string | null>(null);

  // Fetch pools on mount
  useEffect(() => {
    loadPools();
  }, []);

  const loadPools = async () => {
    try {
      setIsLoading(true);
      const data = await getAllPools();
      setPools(data.pools);
      setUserBalance(data.userBalance);
    } catch (error: any) {
      toast.error("Failed to load investment pools", {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get pool icon based on name
  const getPoolIcon = (poolName: string) => {
    if (poolName.includes("Conservative")) return Shield;
    if (poolName.includes("Balanced")) return TrendingUp;
    if (poolName.includes("High")) return Zap;
    return TrendingUp;
  };

  // Get pool gradient based on LTV
  const getPoolGradient = (ltv: number) => {
    if (ltv <= 0.7) return "from-green-400 to-emerald-500";
    if (ltv <= 0.8) return "from-[#00CFE8] to-[#0099CC]";
    return "from-[#FFA726] to-[#FB8C00]";
  };

  // Get risk level and color based on LTV
  const getRiskInfo = (ltv: number) => {
    if (ltv <= 0.7) {
      return { level: "Low", color: "green", class: "bg-green-50 text-green-600 border-green-200" };
    }
    if (ltv <= 0.8) {
      return { level: "Medium", color: "blue", class: "bg-blue-50 text-blue-600 border-blue-200" };
    }
    return { level: "High", color: "orange", class: "bg-orange-50 text-orange-600 border-orange-200" };
  };

  const handleInvestClick = (pool: InvestmentPool) => {
    setSelectedPool(pool);
    setIsModalOpen(true);
  };

  const togglePoolExpansion = (poolName: string) => {
    setExpandedPool(expandedPool === poolName ? null : poolName);
  };

  const toggleContributionShare = (poolName: string) => {
    setShowContribution(showContribution === poolName ? null : poolName);
  };

  return (
    <>
      <Card className="border-0 shadow-2xl hover:shadow-[0_20px_50px_rgba(140,87,255,0.15)] transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Investment Pool Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pools.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No investment pools available at this time
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {pools.map((pool) => {
                const PoolIcon = getPoolIcon(pool.name);
                const gradient = getPoolGradient(pool.ltv);
                const riskInfo = getRiskInfo(pool.ltv);

                return (
                  <div
                    key={pool._id}
                    className="rounded-xl border bg-card p-3 md:p-4 shadow-xl hover:shadow-2xl transition-all"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md`}>
                        <PoolIcon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${riskInfo.class}`}
                      >
                        {riskInfo.level} Risk
                      </Badge>
                    </div>

                    <h4 className="mb-2 text-base md:text-lg">{pool.name}</h4>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Expected ROI</span>
                        <span className="text-primary font-medium">{pool.expectedROI.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Available Capital</span>
                        <span className="font-medium">${pool.availableBalance?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">{pool.durationMonths} months</span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Investors</span>
                        <span className="font-medium">{pool.investorCount}</span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Pool Capacity</span>
                        <span className="font-medium">${pool.poolSize.toLocaleString()} / ${pool.maxCapital.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Pool Filled</span>
                        <span>{pool.poolFilledPercentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={pool.poolFilledPercentage} className="h-2" />
                    </div>

                    <div className="space-y-2">
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-[#7367F0] hover:opacity-90 text-sm md:text-base"
                        onClick={() => handleInvestClick(pool)}
                        disabled={pool.isFull || !pool.canInvest}
                      >
                        {pool.isFull ? "Pool Full" : pool.canInvest ? "Invest Now" : "Already Invested"}
                      </Button>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1 text-xs md:text-sm"
                          onClick={() => toggleContributionShare(pool._id)}
                        >
                          <Eye className="h-3 w-3 md:h-4 md:w-4" />
                          <span className="hidden sm:inline">See Contribution</span>
                          <span className="sm:hidden">Share</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePoolExpansion(pool._id)}
                        >
                          {expandedPool === pool._id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Contribution Share Display */}
                    {showContribution === pool._id && (
                      <div className="mt-3 p-2.5 md:p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex items-center justify-between">
                          <span className="text-xs md:text-sm text-muted-foreground">Your Share Percentage</span>
                          <span className="text-base md:text-lg font-semibold text-primary">
                            {pool.userSharePercentage > 0 ? `${pool.userSharePercentage.toFixed(2)}%` : "0%"}
                          </span>
                        </div>
                        {pool.userTotalShares && pool.userTotalShares > 0 && (
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            <div>Shares owned: {pool.userTotalShares.toLocaleString()}</div>
                            <div>Current value: ${pool.userCurrentValue.toLocaleString()}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expanded Pool Details */}
                    {expandedPool === pool._id && (
                      <div className="mt-3 p-3 md:p-4 rounded-lg bg-accent/50 space-y-2 md:space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs md:text-sm">
                            <span className="text-muted-foreground">Minimum Investment</span>
                            <span className="font-medium">${pool.minInvestment.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs md:text-sm">
                            <span className="text-muted-foreground">Maximum Investment</span>
                            <span className="font-medium">${pool.maxInvestment.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs md:text-sm">
                            <span className="text-muted-foreground">Remaining Capacity</span>
                            <span className="font-medium">{pool.remainingCapacity.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-xs md:text-sm">
                            <span className="text-muted-foreground">LTV Ratio</span>
                            <span className="font-medium">{(pool.ltv * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPool && (
        <InvestmentConfirmationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            loadPools(); // Refresh pools after closing modal
          }}
          poolId={selectedPool._id}
          poolName={selectedPool.name}
          duration={selectedPool.durationMonths}
          riskLevel={getRiskInfo(selectedPool.ltv).level as "Low" | "Medium" | "High"}
          estimatedROI={selectedPool.expectedROI.toFixed(2)}
          maxAmount={selectedPool.maxInvestment}
          minAmount={selectedPool.minInvestment}
          walletBalance={userBalance}
          currentSharePrice={selectedPool.currentSharePrice}
          totalShares={selectedPool.totalShares}
        />
      )}
    </>
  );
}