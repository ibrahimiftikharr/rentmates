import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, Target, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { getDashboardMetrics, type DashboardMetrics } from "../services/dashboardService";
import { socketService } from "@/shared/services/socketService";
import { toast } from "sonner";

export function InvestmentSummaryCards() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    loadMetrics();

    // Connect to Socket.IO and listen for dashboard updates
    const socket = socketService.connect();
    socketService.on('dashboard_metrics_updated', handleDashboardUpdate);
    socketService.on('investment_value_updated', handleDashboardUpdate);
    socketService.on('pool_share_price_updated', handleDashboardUpdate);

    return () => {
      socketService.off('dashboard_metrics_updated', handleDashboardUpdate);
      socketService.off('investment_value_updated', handleDashboardUpdate);
      socketService.off('pool_share_price_updated', handleDashboardUpdate);
    };
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await getDashboardMetrics();
      setMetrics(data.metrics);
    } catch (error: any) {
      console.error('Load dashboard metrics error:', error);
      toast.error(error.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleDashboardUpdate = (data: any) => {
    console.log('Dashboard update event:', data);
    // Silently refresh metrics
    loadMetrics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const summaryData = [
    {
      title: "Total Invested",
      value: `$${metrics?.totalInvested?.toLocaleString() || '0'}`,
      change: metrics && metrics.activePools > 0 ? `${metrics.activePools} pools` : "No investments",
      trend: metrics && metrics.activePools > 0 ? "up" : "neutral",
      icon: DollarSign,
      gradient: "from-[#8C57FF] to-[#7367F0]",
    },
    {
      title: "Earnings Generated",
      value: `$${metrics?.earningsGenerated?.toLocaleString() || '0'}`,
      change: metrics && metrics.earningsGenerated > 0 ? "+from interest" : "No earnings yet",
      trend: metrics && metrics.earningsGenerated > 0 ? "up" : "neutral",
      icon: Target,
      gradient: "from-[#00CFE8] to-[#0099CC]",
    },
    {
      title: "Annual ROI",
      value: `${metrics?.annualROI?.toFixed(1) || '0.0'}%`,
      change: metrics && metrics.annualROI > 0 ? `+${((metrics.currentValue - metrics.totalInvested) || 0).toFixed(2)}` : "$0.00",
      trend: metrics && metrics.annualROI > 0 ? "up" : "neutral",
      icon: TrendingUp,
      gradient: "from-[#FF6B9D] to-[#FF4081]",
    },
    {
      title: "Pool Utilization Rate",
      value: `${metrics?.poolUtilizationRate?.toFixed(1) || '0.0'}%`,
      change: "System-wide",
      trend: "neutral",
      icon: Calendar,
      gradient: "from-[#FFA726] to-[#FB8C00]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
      {summaryData.map((item) => (
        <Card key={item.title} className="border-0 shadow-2xl overflow-hidden hover:shadow-[0_20px_50px_rgba(140,87,255,0.15)] transition-shadow duration-300">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between mb-2 md:mb-3">
              <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg`}>
                <item.icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <div className="flex items-center gap-1">
                <svg width="40" height="20" className="opacity-50">
                  <polyline
                    points="0,15 10,10 20,12 30,8 40,5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={item.trend === "up" ? "text-green-500" : "text-muted-foreground"}
                  />
                </svg>
              </div>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mb-1">{item.title}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-xl md:text-2xl lg:text-3xl">{item.value}</h3>
              <span className={`text-xs ${item.trend === "up" ? "text-green-500" : "text-muted-foreground"}`}>
                {item.change}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}