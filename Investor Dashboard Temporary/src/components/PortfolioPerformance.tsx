import { useState } from "react";
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function PortfolioPerformance() {
  const [expandedInvestment, setExpandedInvestment] = useState<string | null>(null);

  const activeInvestments = [
    { poolName: "Conservative Growth", riskLevel: "Low" as const, amount: 5000, roi: 12.5 },
    { poolName: "Balanced Portfolio", riskLevel: "Medium" as const, amount: 7500, roi: 16.2 },
    { poolName: "High Yield Growth", riskLevel: "High" as const, amount: 3200, roi: 24.8 }
  ];

  const toggleInvestmentExpansion = (poolName: string) => {
    setExpandedInvestment(expandedInvestment === poolName ? null : poolName);
  };

  const getInvestmentData = (poolName: string) => {
    const investment = activeInvestments.find(inv => inv.poolName === poolName);
    const amountInvested = investment?.amount || 0;
    const currentValue = Math.round(amountInvested * (1 + (investment?.roi || 0) / 100));
    
    return {
      amountInvested,
      currentValue,
      roiPercentage: investment?.roi || 0,
      daysRemaining: poolName === "Conservative Growth" ? 180 : poolName === "Balanced Portfolio" ? 120 : 90,
      riskLevel: investment?.riskLevel || "Low"
    };
  };

  const getPerformanceData = (poolName: string) => {
    const investment = activeInvestments.find(inv => inv.poolName === poolName);
    const baseAmount = investment?.amount || 5000;
    const roi = investment?.roi || 12.5;
    
    return [
      { month: "Jan", value: baseAmount },
      { month: "Feb", value: Math.round(baseAmount * 1.02) },
      { month: "Mar", value: Math.round(baseAmount * 1.04) },
      { month: "Apr", value: Math.round(baseAmount * 1.07) },
      { month: "May", value: Math.round(baseAmount * 1.10) },
      { month: "Jun", value: Math.round(baseAmount * (1 + roi / 100)) }
    ];
  };

  return (
    <>
      <Card className="border-0 shadow-2xl hover:shadow-[0_20px_50px_rgba(140,87,255,0.15)] transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Portfolio Performance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Active Investments */}
          <div className="mb-4">
            <h4 className="mb-3">Active Investments</h4>
            <div className="space-y-2">
              {activeInvestments.map((investment) => (
                <div key={investment.poolName}>
                  <div 
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium">{investment.poolName}</p>
                        <p className="text-xs text-muted-foreground">${investment.amount.toLocaleString()} invested</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">+{investment.roi}%</p>
                        <Badge className={`text-xs ${
                          investment.riskLevel === "Low" ? "bg-green-100 text-green-700" :
                          investment.riskLevel === "Medium" ? "bg-blue-100 text-blue-700" :
                          "bg-orange-100 text-orange-700"
                        }`}>
                          {investment.riskLevel}
                        </Badge>
                      </div>
                      <button 
                        className="text-primary hover:text-primary/75"
                        onClick={() => toggleInvestmentExpansion(investment.poolName)}
                      >
                        {expandedInvestment === investment.poolName ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedInvestment === investment.poolName && (
                    <div className="mt-2 p-4 rounded-lg bg-accent/30 border space-y-4">
                      {/* Investment Info Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 border border-blue-200">
                          <p className="text-xs text-blue-600 mb-1">Amount Invested</p>
                          <p className="text-lg font-bold text-blue-900">
                            ${getInvestmentData(investment.poolName).amountInvested.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-3 border border-green-200">
                          <p className="text-xs text-green-600 mb-1">Current Value</p>
                          <p className="text-lg font-bold text-green-900">
                            ${getInvestmentData(investment.poolName).currentValue.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-3 border border-purple-200">
                          <p className="text-xs text-purple-600 mb-1">ROI</p>
                          <p className="text-lg font-bold text-purple-900">
                            +{getInvestmentData(investment.poolName).roiPercentage}%
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg p-3 border border-orange-200">
                          <p className="text-xs text-orange-600 mb-1">Days Remaining</p>
                          <p className="text-lg font-bold text-orange-900">
                            {getInvestmentData(investment.poolName).daysRemaining}
                          </p>
                        </div>
                      </div>

                      {/* Performance Chart */}
                      <div className="border rounded-lg p-4 bg-card">
                        <h4 className="font-semibold mb-4 text-sm">Performance (6 Months)</h4>
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={getPerformanceData(investment.poolName)}>
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
                                borderRadius: '8px'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#8C57FF" 
                              strokeWidth={3}
                              dot={{ fill: '#8C57FF', r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Average ROI</p>
              <p className="text-primary">18.2%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
              <p>$28,450</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Repaid %</p>
              <p className="text-green-600">94.5%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}