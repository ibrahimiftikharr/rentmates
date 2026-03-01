import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AlertCircle, TrendingDown, Users, DollarSign } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

// Data for pie chart - Risk pool allocation
const riskPoolData = [
  { name: "Low Risk", value: 45, color: "#10b981" },
  { name: "Medium Risk", value: 35, color: "#f59e0b" },
  { name: "High Risk", value: 20, color: "#ef4444" }
];

// Data for bar chart - Pool utilization vs liquidity
const poolUtilizationData = [
  { pool: "Pool A", utilization: 85, liquidity: 15, total: 100 },
  { pool: "Pool B", utilization: 92, liquidity: 8, total: 100 },
  { pool: "Pool C", utilization: 45, liquidity: 55, total: 100, underutilized: true },
  { pool: "Pool D", utilization: 78, liquidity: 22, total: 100 },
  { pool: "Pool E", utilization: 38, liquidity: 62, total: 100, underutilized: true },
  { pool: "Pool F", utilization: 88, liquidity: 12, total: 100 }
];

// Underutilized pools with student requests
const underutilizedPools = [
  {
    id: 1,
    poolName: "Conservative Growth",
    utilization: 45,
    availableLiquidity: 55000,
    queuedRequests: 12,
    studentDemand: "High",
    avgLoanSize: 4500,
    riskLevel: "Low"
  },
  {
    id: 2,
    poolName: "Balanced Growth",
    utilization: 38,
    availableLiquidity: 78000,
    queuedRequests: 18,
    studentDemand: "Very High",
    avgLoanSize: 3800,
    riskLevel: "Medium"
  }
];

// Custom tooltip for pie chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">
          {payload[0].value}% of total allocation
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
                    label={({ name, value }) => `${name}: ${value}%`}
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
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl border-2 hover:border-primary/30 transition-all bg-gradient-to-r from-white to-gray-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg shadow-md flex items-center justify-center"
                      style={{ backgroundColor: pool.color }}
                    >
                      <span className="text-white font-bold">{pool.value}%</span>
                    </div>
                    <div>
                      <p className="font-semibold">{pool.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${((pool.value / 100) * 125000).toLocaleString()} invested
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
              ))}
            </div>
          </div>
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
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={poolUtilizationData}
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
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-white transform rotate-180" />
                </div>
                <p className="font-semibold text-green-900">High Utilization Pools</p>
              </div>
              <p className="text-sm text-green-700">Pool A, B, D & F are performing well with 78-92% utilization</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <p className="font-semibold text-orange-900">Underutilized Pools</p>
              </div>
              <p className="text-sm text-orange-700">Pool C & E have high liquidity - consider rebalancing investments</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Underutilized Pools with Student Demand */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-amber-50/20">
        <CardHeader className="border-b bg-gradient-to-r from-amber-50/50 to-orange-50/30">
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            Investment Opportunities - Underutilized Pools
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            These pools have available liquidity and active student loan requests waiting for funding
          </p>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {underutilizedPools.map((pool) => (
            <div
              key={pool.id}
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
                          : "bg-yellow-100 text-yellow-700 border-yellow-200"
                      }
                    >
                      {pool.riskLevel} Risk
                    </Badge>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Utilization</p>
                      <p className="font-semibold text-orange-600">{pool.utilization}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Available Liquidity</p>
                      <p className="font-semibold text-green-600">${pool.availableLiquidity.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Queued Requests</p>
                      <p className="font-semibold text-primary">{pool.queuedRequests} students</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg Loan Size</p>
                      <p className="font-semibold">${pool.avgLoanSize.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Student Demand Badge */}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">
                      <span className="font-semibold text-orange-600">{pool.studentDemand}</span> student demand
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex flex-col gap-2">
                  <Button className="bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-lg whitespace-nowrap">
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
                  {100 - pool.utilization}% available capital and active student demand. Investing here can generate immediate returns.
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}