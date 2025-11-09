import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface RentPricingInsightsProps {
  currentRent: number;
}

export function RentPricingInsightsSection({ currentRent }: RentPricingInsightsProps) {
  const aiEstimatedValue = 775;
  const difference = currentRent - aiEstimatedValue;
  const percentageDiff = ((difference / aiEstimatedValue) * 100).toFixed(1);
  const isFair = Math.abs(difference) <= 50;
  const isOverpriced = difference > 50;

  // Historical rent data
  const historicalData = [
    { month: 'Jan', rent: 720 },
    { month: 'Feb', rent: 730 },
    { month: 'Mar', rent: 745 },
    { month: 'Apr', rent: 750 },
    { month: 'May', rent: 760 },
    { month: 'Jun', rent: 770 },
    { month: 'Jul', rent: 775 },
    { month: 'Aug', rent: 780 },
  ];

  // Fair Rent Meter (0-100)
  const fairnessScore = isFair ? 85 : isOverpriced ? 45 : 95;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="border-b bg-card">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Rent & Pricing Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {/* Current vs AI Estimated */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-xl border-2 border-primary/20 bg-primary/5">
            <p className="text-sm text-muted-foreground mb-2">Listed Price</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl text-primary">£{currentRent}</p>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
          </div>
          
          <div className="p-6 rounded-xl border-2 border-green-200 bg-green-50/50">
            <p className="text-sm text-green-700 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              AI Fair Value Estimate
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl text-green-700">£{aiEstimatedValue}</p>
              <span className="text-sm text-green-600">/ month</span>
            </div>
            {difference !== 0 && (
              <p className={`text-sm mt-2 ${isOverpriced ? 'text-red-600' : 'text-green-600'}`}>
                {isOverpriced ? '▲' : '▼'} {Math.abs(Number(percentageDiff))}% {isOverpriced ? 'above' : 'below'} market value
              </p>
            )}
          </div>
        </div>

        {/* Fair Rent Meter */}
        <div className="p-6 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Fair Rent Meter
            </h3>
            <Badge className={
              fairnessScore >= 80 ? 'bg-green-500 hover:bg-green-600 text-white' :
              fairnessScore >= 60 ? 'bg-orange-500 hover:bg-orange-600 text-white' :
              'bg-red-500 hover:bg-red-600 text-white'
            }>
              {fairnessScore >= 80 ? 'Great Deal' : fairnessScore >= 60 ? 'Fair Price' : 'Overpriced'}
            </Badge>
          </div>

          {/* Progress Bar Meter */}
          <div className="relative">
            <div className="h-8 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-full overflow-hidden border-2 border-border">
              <div className="relative h-full flex items-center">
                {/* Indicator */}
                <div 
                  className="absolute w-1 h-10 bg-primary border-2 border-white shadow-lg transition-all duration-500"
                  style={{ left: `${fairnessScore}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1 rounded text-sm whitespace-nowrap">
                    {fairnessScore}/100
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Overpriced</span>
              <span>Fair</span>
              <span>Great Value</span>
            </div>
          </div>

          {/* Analysis */}
          <div className="mt-4 p-4 rounded-lg bg-card border border-border">
            <p className="text-sm">
              {isFair ? (
                <span className="text-green-700">
                  ✓ This property is priced fairly within the market range for this area.
                </span>
              ) : isOverpriced ? (
                <span className="text-red-700">
                  ⚠ This property is priced above the market average. Consider negotiating.
                </span>
              ) : (
                <span className="text-green-700">
                  ✓ Excellent value! This property is priced below market average.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Historical Rent Trend */}
        <div className="p-6 rounded-xl border border-border bg-muted/30">
          <h3 className="mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Area Rent Trends (Last 8 Months)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={historicalData}>
              <defs>
                <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8C57FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8C57FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '2px solid #8C57FF',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="rent" 
                stroke="#8C57FF" 
                strokeWidth={3}
                fill="url(#colorRent)" 
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-sm text-muted-foreground mt-3 text-center">
            Average rent in this area has increased by 8% over the past 8 months
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
