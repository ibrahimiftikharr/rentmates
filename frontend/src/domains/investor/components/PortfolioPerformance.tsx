import { useState, useEffect } from "react";
import { BarChart3, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getActiveInvestments, getInvestmentDetails } from "@/shared/services/investorPortfolioService";
import { RepaymentScheduleTable } from "./RepaymentScheduleTable";
import { toast } from "sonner";

interface Investment {
  _id: string;
  poolId: string;
  poolName: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  amountInvested: number;
  currentValue: number;
  totalEarnings: number;
  principalReturned: number;
  lockedROI: number;
  actualROI: number;
  daysRemaining: number;
  status: string;
}

interface PerformanceDataPoint {
  month: string;
  value: number;
}

export function PortfolioPerformance() {
  const [expandedInvestment, setExpandedInvestment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState({
    totalInvested: 0,
    totalCurrentValue: 0,
    totalEarnings: 0,
    averageROI: 0,
    activeInvestments: 0
  });
  const [performanceDataMap, setPerformanceDataMap] = useState<Record<string, PerformanceDataPoint[]>>({});

  useEffect(() => {
    loadInvestments();
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

  const toggleInvestmentExpansion = async (poolId: string) => {
    const newExpandedId = expandedInvestment === poolId ? null : poolId;
    setExpandedInvestment(newExpandedId);
    
    // Load performance data for expanded investment if not already loaded
    if (newExpandedId && !performanceDataMap[newExpandedId]) {
      const investment = investments.find(inv => inv.poolId === newExpandedId);
      if (investment) {
        try {
          const details = await getInvestmentDetails(investment._id);
          setPerformanceDataMap(prev => ({
            ...prev,
            [newExpandedId]: details.performanceData
          }));
        } catch (error) {
          console.error('Load performance data error:', error);
        }
      }
    }
  };

  const getInvestmentData = (investment: Investment) => {
    return {
      amountInvested: investment.amountInvested,
      currentValue: investment.currentValue,
      roiPercentage: investment.actualROI,
      daysRemaining: investment.daysRemaining,
      riskLevel: investment.riskLevel
    };
  };

  const getPerformanceData = (poolId: string): PerformanceDataPoint[] => {
    return performanceDataMap[poolId] || [];
  };

  const calculateRepaidPercentage = () => {
    if (summary.totalInvested === 0) return 0;
    return ((summary.totalEarnings + investments.reduce((sum, inv) => sum + inv.principalReturned, 0)) / summary.totalInvested * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="border shadow-lg">
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
        <Card className="border shadow-lg">
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
      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Portfolio Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/30">
              <p className="text-xs text-blue-600 mb-1 font-medium">Total Invested</p>
              <p className="text-xl font-bold text-blue-900">${summary.totalInvested.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100/30">
              <p className="text-xs text-green-600 mb-1 font-medium">Total Earnings</p>
              <p className="text-xl font-bold text-green-900">${summary.totalEarnings.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/30">
              <p className="text-xs text-purple-600 mb-1 font-medium">Average ROI</p>
              <p className="text-xl font-bold text-purple-900">{summary.averageROI.toFixed(1)}%</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100/30">
              <p className="text-xs text-orange-600 mb-1 font-medium">Repaid %</p>
              <p className="text-xl font-bold text-orange-900">{calculateRepaidPercentage()}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Active Investments</h3>
        <Badge variant="outline" className="text-xs">
          {investments.length} {investments.length === 1 ? 'Investment' : 'Investments'}
        </Badge>
      </div>

      {/* Individual Investment Cards */}
      {investments.map((investment) => (
        <Card 
          key={investment.poolId}
          className="border shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
        >
          {/* Card Header - Investment Summary */}
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <CardTitle className="text-lg">{investment.poolName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Invested: ${investment.amountInvested.toLocaleString()} USDT
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {investment.actualROI > 0 ? `+${investment.actualROI.toFixed(1)}%` : '0%'}
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
            {/* Section 1: Investment Metrics */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Investment Metrics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200 shadow-sm">
                  <p className="text-xs text-blue-600 mb-2 font-medium">Amount Invested</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${getInvestmentData(investment).amountInvested.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200 shadow-sm">
                  <p className="text-xs text-green-600 mb-2 font-medium">Current Value</p>
                  <p className="text-2xl font-bold text-green-900">
                    ${getInvestmentData(investment).currentValue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200 shadow-sm">
                  <p className="text-xs text-purple-600 mb-2 font-medium">Total Earnings</p>
                  <p className="text-2xl font-bold text-purple-900">
                    ${investment.totalEarnings.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-4 border border-orange-200 shadow-sm">
                  <p className="text-xs text-orange-600 mb-2 font-medium">Days Remaining</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {getInvestmentData(investment).daysRemaining}
                  </p>
                </div>
              </div>
            </div>

            {expandedInvestment === investment.poolId && (
              <>
                {/* Divider */}
                <div className="border-t my-6"></div>

                {/* Section 2: Performance Graph */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                    Performance Over Time
                  </h4>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/30 rounded-xl p-6 border shadow-sm">
                    {getPerformanceData(investment.poolId).length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={getPerformanceData(investment.poolId)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 12 }}
                            stroke="#9ca3af"
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            stroke="#9ca3af"
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#8C57FF" 
                            strokeWidth={3}
                            dot={{ fill: '#8C57FF', r: 5 }}
                            activeDot={{ r: 7 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t my-6"></div>

                {/* Section 3: Repayment Schedule */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                    Loan Repayment Schedule & History
                  </h4>
                  <div className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30 rounded-xl p-6 border shadow-sm">
                    <RepaymentScheduleTable poolId={investment.poolId} />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}