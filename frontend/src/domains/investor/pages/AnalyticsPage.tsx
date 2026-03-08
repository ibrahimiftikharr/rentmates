import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { AlertCircle, TrendingDown, Users, DollarSign, Loader2 } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { 
  getCompleteAnalytics, 
  type RiskAllocation, 
  type PoolUtilization,
  type InvestmentOpportunity 
} from "../services/analyticsService";
import { socketService } from "@/shared/services/socketService";
import { toast } from "sonner";

// Custom tooltip for pie chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">
          {payload[0].value}% of total allocation
        </p>
        <p className="text-sm font-semibold text-primary">
          ${payload[0].payload.amount.toLocaleString()} invested
        </p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for bar chart
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <p className="font-semibold mb-2">{label}</p>
        <p className="text-sm text-primary">Utilization: {payload[0].value}%</p>
        <p className="text-sm text-blue-600">Available Liquidity: {payload[1].value}%</p>
      </div>
    );
  }
  return null;
};

export function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [riskPoolData, setRiskPoolData] = useState<RiskAllocation[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [poolUtilizationData, setPoolUtilizationData] = useState<PoolUtilization[]>([]);
  const [utilizationInsights, setUtilizationInsights] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [opportunitiesSummary, setOpportunitiesSummary] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();

    // Listen for real-time updates
    socketService.on('analytics_updated', handleAnalyticsUpdate);
    socketService.on('dashboard_metrics_updated', handleAnalyticsUpdate);
    socketService.on('pool_updated', handleAnalyticsUpdate);

    return () => {
      socketService.off('analytics_updated', handleAnalyticsUpdate);
      socketService.off('dashboard_metrics_updated', handleAnalyticsUpdate);
      socketService.off('pool_updated', handleAnalyticsUpdate);
    };
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getCompleteAnalytics();
      
      // Set risk allocation data
      setRiskPoolData(data.riskAllocation.allocations);
      setTotalInvested(data.riskAllocation.totalInvested);
      
      // Set pool utilization data
      setPoolUtilizationData(data.poolUtilization.pools);
      setUtilizationInsights(data.poolUtilization.insights);
      
      // Set investment opportunities
      setOpportunities(data.opportunities.opportunities);
      setOpportunitiesSummary(data.opportunities.summary);
      
    } catch (error: any) {
      console.error('Load analytics error:', error);
      toast.error(error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyticsUpdate = (data: any) => {
    console.log('Analytics update event:', data);
    // Silently refresh analytics data
    loadAnalytics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="mb-1 md:mb-2 text-xl md:text-2xl">Portfolio Analytics</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Analyze fund allocation, pool utilization, and investment opportunities
        </p>
      </div>

      {/* Pie Chart - Risk Pool Allocation */}
      <Card className="border-0 shadow-2xl hover:shadow-[0_20px_50px_rgba(140,87,255,0.15)] transition-shadow duration-300">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-purple-50/50">
          <CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            Risk Pool Allocation
          </CardTitle>
          <p className="text-xs md:text-sm text-muted-foreground mt-2">
            Distribution of your funds across different risk categories
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {totalInvested === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No investments yet. Start investing to see your allocation.</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Pie Chart */}
              <div className="w-full lg:w-1/2 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskPoolData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => value > 0 ? `${name}: ${value}%` : ''}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {riskPoolData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend & Summary */}
              <div className="w-full lg:w-1/2 space-y-4">
                {riskPoolData.map((pool, index) => (
                  pool.value > 0 && (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl border-2 hover:border-primary/30 transition-all bg-gradient-to-r from-white to-gray-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-14 w-14 rounded-lg shadow-md flex items-center justify-center"
                          style={{ backgroundColor: pool.color }}
                        >
                          <span className="text-white font-bold text-sm">{pool.value}%</span>
                        </div>
                        <div>
                          <p className="font-semibold">{pool.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${pool.amount.toLocaleString()} invested
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          pool.name === "Low Risk"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : pool.name === "Medium Risk"
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : "bg-red-100 text-red-700 border-red-200"
                        }
                      >
                        {pool.name.split(" ")[0]}
                      </Badge>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bar Chart - Pool Utilization vs Liquidity */}
      <Card className="border-0 shadow-2xl">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-cyan-50/30">
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            Pool Utilization vs Available Liquidity
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Compare how efficiently funds are deployed across investment pools
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {poolUtilizationData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No active pools available</p>
            </div>
          ) : (
            <>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={poolUtilizationData.map(pool => ({
                      pool: pool.poolName,
                      utilization: pool.utilization,
                      liquidity: pool.liquidity
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="pool" stroke="#888" />
                    <YAxis stroke="#888" label={{ value: "Percentage (%)", angle: -90, position: "insideLeft" }} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend />
                    <Bar dataKey="utilization" name="Utilization" fill="#8C57FF" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="liquidity" name="Available Liquidity" fill="#00CFE8" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Key Insights */}
              {utilizationInsights && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
                        <TrendingDown className="h-4 w-4 text-white transform rotate-180" />
                      </div>
                      <p className="font-semibold text-green-900">High Utilization Pools</p>
                    </div>
                    <p className="text-sm text-green-700">{utilizationInsights.highUtilization.message}</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-white" />
                      </div>
                      <p className="font-semibold text-orange-900">Underutilized Pools</p>
                    </div>
                    <p className="text-sm text-orange-700">{utilizationInsights.underutilized.message}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Investment Opportunities with Student Demand */}
      {opportunities.length > 0 && (
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-amber-50/20">
          <CardHeader className="border-b bg-gradient-to-r from-amber-50/50 to-orange-50/30">
            <CardTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              Investment Opportunities - Student Demand
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              These pools have available capacity and queued student loan requests waiting for funding
            </p>
            {opportunitiesSummary && (
              <div className="mt-3 flex flex-wrap gap-3">
                <Badge variant="outline" className="bg-white">
                  {opportunitiesSummary.totalQueuedRequests} queued requests
                </Badge>
                <Badge variant="outline" className="bg-white">
                  ${opportunitiesSummary.totalQueuedAmount.toLocaleString()} total demand
                </Badge>
                <Badge variant="outline" className="bg-white">
                  ${opportunitiesSummary.avgRequestAmount.toLocaleString()} avg request
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {opportunities.map((pool) => (
              <div
                key={pool.poolId}
                className="bg-white rounded-2xl p-6 border-2 border-orange-200 hover:border-primary/50 transition-all shadow-lg"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Pool Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{pool.poolName}</h3>
                      <Badge
                        className={
                          pool.riskLevel === "Low"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : pool.riskLevel === "Medium"
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : "bg-red-100 text-red-700 border-red-200"
                        }
                      >
                        {pool.riskLevel} Risk
                      </Badge>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Utilization</p>
                        <p className="font-semibold text-orange-600">{(pool.utilization ?? 0).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Available Liquidity</p>
                        <p className="font-semibold text-green-600">${(pool.availableLiquidity ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Queued Requests</p>
                        <p className="font-semibold text-primary">{pool.queuedRequests ?? 0} students</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Requested</p>
                        <p className="font-semibold">${(pool.totalRequested ?? 0).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Student Demand Badge */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">
                          <span className="font-semibold text-orange-600">{pool.studentDemand ?? 'Low'}</span> student demand
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        APR: <span className="font-semibold text-primary">{(pool.apr ?? 0).toFixed(2)}%</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Monthly Return: <span className="font-semibold text-green-600">${(pool.potentialMonthlyReturn ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex flex-col gap-2">
                    <Button 
                      className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-lg whitespace-nowrap"
                      onClick={() => window.location.href = '/investor/investments'}
                    >
                      Invest Now
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      {pool.queuedRequests} students waiting
                    </p>
                  </div>
                </div>

                {/* Alert Banner */}
                <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">High Opportunity:</span> This pool has{" "}
                    ${pool.availableLiquidity.toLocaleString()} available capacity and active student demand. Investing here can generate immediate returns.
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
