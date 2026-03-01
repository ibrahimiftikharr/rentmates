import { useState } from "react";
import { TrendingUp, Shield, Zap, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { InvestmentConfirmationModal } from "./modals/InvestmentConfirmationModal";

const pools = [
  {
    name: "Conservative Growth",
    risk: "Low",
    riskColor: "green",
    roi: "8-12%",
    poolSize: "$2.4M",
    duration: 12,
    filled: 85,
    icon: Shield,
    gradient: "from-green-400 to-emerald-500",
    maxAmount: 10000,
    minAmount: 100,
    contributionShare: 12.5,
  },
  {
    name: "Balanced Portfolio",
    risk: "Medium",
    riskColor: "blue",
    roi: "14-18%",
    poolSize: "$1.8M",
    duration: 9,
    filled: 62,
    icon: TrendingUp,
    gradient: "from-[#00CFE8] to-[#0099CC]",
    maxAmount: 15000,
    minAmount: 250,
    contributionShare: 18.3,
  },
  {
    name: "High Yield Growth",
    risk: "High",
    riskColor: "orange",
    roi: "22-28%",
    poolSize: "$980K",
    duration: 6,
    filled: 43,
    icon: Zap,
    gradient: "from-[#FFA726] to-[#FB8C00]",
    maxAmount: 20000,
    minAmount: 500,
    contributionShare: 8.7,
  },
];

export function InvestmentPoolExplorer() {
  const [selectedPool, setSelectedPool] = useState<typeof pools[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedPool, setExpandedPool] = useState<string | null>(null);
  const [showContribution, setShowContribution] = useState<string | null>(null);

  const handleInvestClick = (pool: typeof pools[0]) => {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {pools.map((pool) => (
              <div
                key={pool.name}
                className="rounded-xl border bg-card p-3 md:p-4 shadow-xl hover:shadow-2xl transition-all"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br ${pool.gradient} shadow-md`}>
                    <pool.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      pool.riskColor === "green"
                        ? "bg-green-50 text-green-600 border-green-200"
                        : pool.riskColor === "blue"
                        ? "bg-blue-50 text-blue-600 border-blue-200"
                        : "bg-orange-50 text-orange-600 border-orange-200"
                    }`}
                  >
                    {pool.risk} Risk
                  </Badge>
                </div>

                <h4 className="mb-2 text-base md:text-lg">{pool.name}</h4>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-muted-foreground">Expected ROI</span>
                    <span className="text-primary font-medium">{pool.roi}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-muted-foreground">Pool Size</span>
                    <span className="font-medium">{pool.poolSize}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{pool.duration} months</span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Pool Filled</span>
                    <span>{pool.filled}%</span>
                  </div>
                  <Progress value={pool.filled} className="h-2" />
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-[#7367F0] hover:opacity-90 text-sm md:text-base"
                    onClick={() => handleInvestClick(pool)}
                  >
                    Invest Now
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1 text-xs md:text-sm"
                      onClick={() => toggleContributionShare(pool.name)}
                    >
                      <Eye className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">See Contribution</span>
                      <span className="sm:hidden">Share</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePoolExpansion(pool.name)}
                    >
                      {expandedPool === pool.name ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Contribution Share Display */}
                {showContribution === pool.name && (
                  <div className="mt-3 p-2.5 md:p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">Your Contribution Share</span>
                      <span className="text-base md:text-lg font-semibold text-primary">{pool.contributionShare}%</span>
                    </div>
                  </div>
                )}

                {/* Expanded Pool Details */}
                {expandedPool === pool.name && (
                  <div className="mt-3 p-3 md:p-4 rounded-lg bg-accent/50 space-y-2 md:space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Minimum Investment</span>
                        <span className="font-medium">${pool.minAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Maximum Investment</span>
                        <span className="font-medium">${pool.maxAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-muted-foreground">Remaining Capacity</span>
                        <span className="font-medium">{100 - pool.filled}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedPool && (
        <InvestmentConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          poolName={selectedPool.name}
          duration={selectedPool.duration}
          riskLevel={selectedPool.risk as "Low" | "Medium" | "High"}
          estimatedROI={selectedPool.roi}
          maxAmount={selectedPool.maxAmount}
          minAmount={selectedPool.minAmount}
        />
      )}
    </>
  );
}