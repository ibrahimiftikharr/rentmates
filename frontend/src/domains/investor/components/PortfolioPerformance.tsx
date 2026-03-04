import { useState, useEffect } from "react";
import { BarChart3, ChevronDown, ChevronUp, Loader2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getActiveInvestments } from "@/shared/services/investorPortfolioService";
import { PoolWithdrawalModal } from "./modals/PoolWithdrawalModal";
import { socketService } from "@/shared/services/socketService";
import { toast } from "sonner";

// ✅ SHARE-BASED: Updated interface for aggregated investments
interface Investment {
  poolId: string;
  poolName: string;
  poolDescription: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  
  // ✅ SHARE-BASED: Aggregated amounts
  totalAmountInvested: number;
  currentValue: number;
  totalEarnings: number;
  
  // ✅ SHARE-BASED: Share info
  totalShares: number;
  currentSharePrice: number;
  averageEntryPrice: number;
  
  // ROI metrics
  expectedROI: number;
  actualROI: number;
  
  // Time tracking
  earliestInvestmentDate: string;
  durationMonths: number;
  
  // Pool info
  ltv: number;
  availableBalance: number; // Pool liquidity for withdrawals
  
  // Meta info
  investmentCount: number;
  investmentIds: string[];
  
  // ✅ SHARE-BASED: Performance history
  earningsHistory: Array<{
    date: string;
    amount: number;
    sharePrice: number;
    totalValue: number;
    source: string;
  }>;
  
  status: string;
}

interface Summary {
  totalInvested: number;
  totalCurrentValue: number;
  totalEarnings: number;
  portfolioROI: number;
  activePools: number;
  totalInvestments: number;
}

export function PortfolioPerformance() {
  const [expandedInvestment, setExpandedInvestment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalInvested: 0,
    totalCurrentValue: 0,
    totalEarnings: 0,
    portfolioROI: 0,
    activePools: 0,
    totalInvestments: 0
  });
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  useEffect(() => {
    loadInvestments();

    // Connect to Socket.IO and listen for investment updates
    const socket = socketService.connect();
    
    // Listen for investment value updates (from loan repayments)
    socketService.on('investment_value_updated', handleInvestmentValueUpdated);
    socketService.on('investment_created', handleInvestmentCreated);
    socketService.on('withdrawal_completed', handleWithdrawalCompleted);

    return () => {
      // Clean up event listeners
      socketService.off('investment_value_updated', handleInvestmentValueUpdated);
      socketService.off('investment_created', handleInvestmentCreated);
      socketService.off('withdrawal_completed', handleWithdrawalCompleted);
    };
  }, []);

  const loadInvestments = async () => {
    try {
      setLoading(true);
      const data = await getActiveInvestments();
      
      if (data.hasInvestments) {
        setInvestments(data.investments);
        setSummary(data.summary);
      }
    } catch (error: any) {
      console.error('Load investments error:', error);
      toast.error(error.error || 'Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  // Socket.IO event handlers
  const handleInvestmentValueUpdated = (data: any) => {
    console.log('Investment value updated event:', data);
    // Refresh investments to show new values
    loadInvestments();
    toast.success('Investment value increased! 📈', {
      description: `Your investment in ${data.poolName} earned $${data.valueIncrease.toFixed(2)}`,
      duration: 5000
    });
  };

  const handleInvestmentCreated = (data: any) => {
    console.log('New investment created:', data);
    // Refresh to show new investment
    loadInvestments();
  };

  const handleWithdrawalCompleted = (data: any) => {
    console.log('Withdrawal completed:', data);
    // Refresh after withdrawal
    loadInvestments();
    toast.success('Withdrawal successful! 💰', {
      description: `Withdrew $${data.amount.toFixed(2)} from ${data.poolName}`,
      duration: 3000
    });
  };

  const toggleInvestmentExpansion = (poolId: string) => {
    setExpandedInvestment(expandedInvestment === poolId ? null : poolId);
  };

  const handleWithdraw = (poolId: string, _poolName: string) => {
    const investment = investments.find(inv => inv.poolId === poolId);
    if (investment) {
      setSelectedInvestment(investment);
      setWithdrawalModalOpen(true);
    }
  };

  const handleWithdrawalSuccess = () => {
    // Reload investments after successful withdrawal
    loadInvestments();
    toast.success('Portfolio updated');
  };

  // ✅ SHARE-BASED: Format earnings history for performance graph
  const getPerformanceData = (investment: Investment) => {
    if (!investment.earningsHistory || investment.earningsHistory.length === 0) {
      return [];
    }

    // Format data for recharts
    return investment.earningsHistory.map((earning, index) => ({
      date: new Date(earning.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: earning.totalValue,
      sharePrice: earning.sharePrice,
      index: index
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border shadow-xl">
          <CardContent className="flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Loading portfolio data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (investments.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Portfolio Performance Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-muted-foreground">No active investments yet</p>
              <p className="text-sm text-muted-foreground mt-2">Start investing to see your portfolio performance</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Card */}
      <Card 
        className="border transition-shadow duration-300"
        style={{ boxShadow: '0 6px 25px rgba(0, 0, 0, 0.15)' }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 35px rgba(0, 0, 0, 0.25)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.15)'}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Portfolio Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div 
              className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/30"
              style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
            >
              <p className="text-xs text-blue-600 mb-1 font-medium">Total Invested</p>
              <p className="text-xl font-bold text-blue-900">${(summary.totalInvested ?? 0).toLocaleString()}</p>
            </div>
            <div 
              className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100/30"
              style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
            >
              <p className="text-xs text-green-600 mb-1 font-medium">Current Value</p>
              <p className="text-xl font-bold text-green-900">${(summary.totalCurrentValue ?? 0).toLocaleString()}</p>
            </div>
            <div 
              className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/30"
              style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
            >
              <p className="text-xs text-purple-600 mb-1 font-medium">Total Earnings</p>
              <p className="text-xl font-bold text-purple-900">${(summary.totalEarnings ?? 0).toLocaleString()}</p>
            </div>
            <div 
              className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100/30"
              style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
            >
              <p className="text-xs text-orange-600 mb-1 font-medium">Portfolio ROI</p>
              <p className="text-xl font-bold text-orange-900">{(summary.portfolioROI ?? 0).toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Active Pool Investments</h3>
        <Badge variant="outline" className="text-xs">
          {summary.activePools} {summary.activePools === 1 ? 'Pool' : 'Pools'} • {summary.totalInvestments} Total Investments
        </Badge>
      </div>

      {/* Individual Investment Cards - ONE PER POOL */}
      {investments.map((investment) => (
        <Card 
          key={investment.poolId}
          className="border transition-all duration-300 overflow-hidden"
          style={{ boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)' }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.35)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.25)'}
        >
          {/* Card Header - Pool Summary */}
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{investment.poolName}</CardTitle>
                    {investment.investmentCount > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        {investment.investmentCount}x invested
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(investment.totalShares ?? 0).toFixed(6)} shares @ ${(investment.currentSharePrice ?? 0).toFixed(6)}/share
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {(investment.actualROI ?? 0) > 0 ? `+${(investment.actualROI ?? 0).toFixed(1)}%` : '0%'}
                  </p>
                  <p className="text-xs text-muted-foreground">Current ROI</p>
                </div>
                <Badge className={`${
                  investment.riskLevel === "Low" ? "bg-green-100 text-green-700 border-green-300" :
                  investment.riskLevel === "Medium" ? "bg-blue-100 text-blue-700 border-blue-300" :
                  "bg-orange-100 text-orange-700 border-orange-300"
                } border font-medium`}>
                  {investment.riskLevel} Risk
                </Badge>
                <button 
                  className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                  onClick={() => toggleInvestmentExpansion(investment.poolId)}
                >
                  {expandedInvestment === investment.poolId ? 
                    <ChevronUp className="h-5 w-5 text-primary" /> : 
                    <ChevronDown className="h-5 w-5 text-primary" />
                  }
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Section 1: Investment Metrics - SHARE-BASED */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Investment Metrics
                </h4>
                <Button 
                  onClick={() => handleWithdraw(investment.poolId, investment.poolName)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Withdraw
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div 
                  className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200"
                  style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                >
                  <p className="text-xs text-blue-600 mb-2 font-medium">Total Invested</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${(investment.totalAmountInvested ?? 0).toLocaleString()}
                  </p>
                </div>
                <div 
                  className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200"
                  style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                >
                  <p className="text-xs text-green-600 mb-2 font-medium">Current Value</p>
                  <p className="text-2xl font-bold text-green-900">
                    ${(investment.currentValue ?? 0).toLocaleString()}
                  </p>
                </div>
                <div 
                  className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200"
                  style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                >
                  <p className="text-xs text-purple-600 mb-2 font-medium">Total Earnings</p>
                  <p className="text-2xl font-bold text-purple-900">
                    ${(investment.totalEarnings ?? 0).toLocaleString()}
                  </p>
                </div>
                <div 
                  className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4 border border-orange-200"
                  style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
                >
                  <p className="text-xs text-orange-600 mb-2 font-medium">Share Price</p>
                  <p className="text-2xl font-bold text-orange-900">
                    ${(investment.currentSharePrice ?? 0).toFixed(6)}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Entry: ${(investment.averageEntryPrice ?? 0).toFixed(6)}
                  </p>
                </div>
              </div>
            </div>

            {expandedInvestment === investment.poolId && (
              <>
                {/* Divider */}
                <div className="border-t my-6"></div>

                {/* Section 2: Performance Graph - SHARE-BASED */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                    Value Growth Over Time
                  </h4>
                  <div 
                    className="bg-gradient-to-br from-gray-50 to-gray-100/30 rounded-xl p-6 border"
                    style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)' }}
                  >
                    {getPerformanceData(investment).length > 0 ? (
                      <div>
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart data={getPerformanceData(investment)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 12 }}
                              stroke="#9ca3af"
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              stroke="#9ca3af"
                              label={{ value: 'Value ($)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                            />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                              }}
                              formatter={(value: any, name: string) => {
                                if (name === 'value') return [`$${Number(value).toFixed(2)}`, 'Total Value'];
                                return [value, name];
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#8C57FF" 
                              strokeWidth={3}
                              dot={{ fill: '#8C57FF', r: 5 }}
                              activeDot={{ r: 7 }}
                              name="Total Value"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-muted-foreground text-center mt-4">
                          📈 Your investment value increases as loan repayments are received (returns are auto-reinvested)
                        </p>
                      </div>
                    ) : (
                      <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground">
                        <TrendingUp className="w-12 h-12 mb-2 text-muted-foreground/40" />
                        <p>No earnings history yet</p>
                        <p className="text-xs mt-1">Value will update as loans are repaid</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Earnings Transaction History */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                    Earnings Transaction History
                  </h4>
                  <div 
                    className="bg-gradient-to-br from-gray-50 to-gray-100/30 rounded-xl border overflow-hidden"
                    style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)' }}
                  >
                    {investment.earningsHistory && investment.earningsHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gradient-to-r from-primary/10 to-purple-500/10">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Amount Earned
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Share Price
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Total Value
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Source
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {investment.earningsHistory.map((earning, index) => (
                              <tr 
                                key={index}
                                className="hover:bg-primary/5 transition-colors"
                              >
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {new Date(earning.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-green-600">
                                  +${(earning.amount ?? 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                  ${(earning.sharePrice ?? 0).toFixed(6)}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-blue-600">
                                  ${(earning.totalValue ?? 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <Badge variant="outline" className="text-xs">
                                    {earning.source?.replace(/_/g, ' ') || 'Unknown'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 flex flex-col items-center justify-center text-muted-foreground">
                        <BarChart3 className="w-12 h-12 mb-2 text-muted-foreground/40" />
                        <p>No earnings transactions yet</p>
                        <p className="text-xs mt-1">Earnings will be recorded as loans are repaid</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Withdrawal Modal */}
      {selectedInvestment && (
        <PoolWithdrawalModal
          isOpen={withdrawalModalOpen}
          onClose={() => setWithdrawalModalOpen(false)}
          onSuccess={handleWithdrawalSuccess}
          poolId={selectedInvestment.poolId}
          poolName={selectedInvestment.poolName}
          totalShares={selectedInvestment.totalShares}
          currentSharePrice={selectedInvestment.currentSharePrice}
          currentValue={selectedInvestment.currentValue}
          totalAmountInvested={selectedInvestment.totalAmountInvested}
          totalEarnings={selectedInvestment.totalEarnings}
          riskLevel={selectedInvestment.riskLevel}
          availableBalance={selectedInvestment.availableBalance}
        />
      )}
    </div>
  );
}