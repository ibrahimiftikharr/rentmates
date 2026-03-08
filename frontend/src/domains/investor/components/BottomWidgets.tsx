import { useState, useEffect } from "react";
import { TrendingUp, Bell, AlertTriangle, CheckCircle2, Info, XCircle, Shield, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { getPoolRiskAnalytics, type PoolRiskMetric } from "../services/dashboardService";
import { socketService } from "@/shared/services/socketService";
import { toast } from "sonner";

const notifications = [
  {
    title: "Repayment Made by Student",
    message: "Student ID #4521 made on-time repayment of $850",
    time: "1 hour ago",
    type: "success",
  },
  {
    title: "Student Missed Repayment",
    message: "Student ID #3847 missed scheduled repayment - $620 overdue",
    time: "3 hours ago",
    type: "warning",
  },
  {
    title: "Collateral Received",
    message: "Collateral against defaulted loan LN-8824 secured in escrow",
    time: "5 hours ago",
    type: "info",
  },
  {
    title: "Repayment Made by Student",
    message: "Student ID #7293 paid $1,200 towards loan balance",
    time: "1 day ago",
    type: "success",
  },
];

export function BottomWidgets() {
  const [loading, setLoading] = useState(true);
  const [riskMetrics, setRiskMetrics] = useState<PoolRiskMetric[]>([]);

  useEffect(() => {
    loadRiskMetrics();

    // Listen for risk updates
    socketService.on('dashboard_metrics_updated', handleRiskUpdate);
    socketService.on('pool_share_price_updated', handleRiskUpdate);

    return () => {
      socketService.off('dashboard_metrics_updated', handleRiskUpdate);
      socketService.off('pool_share_price_updated', handleRiskUpdate);
    };
  }, []);

  const loadRiskMetrics = async () => {
    try {
      const data = await getPoolRiskAnalytics();
      setRiskMetrics(data.poolRisks);
    } catch (error: any) {
      console.error('Load risk metrics error:', error);
      toast.error(error.message || 'Failed to load risk analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRiskUpdate = (data: any) => {
    console.log('Risk update event:', data);
    // Silently refresh risk metrics
    loadRiskMetrics();
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High':
        return 'orange';
      case 'Medium':
        return 'blue';
      case 'Low':
      default:
        return 'green';
    }
  };

  const getRiskGradient = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High':
        return 'from-orange-400 to-orange-500';
      case 'Medium':
        return 'from-blue-400 to-blue-500';
      case 'Low':
      default:
        return 'from-green-400 to-green-500';
    }
  };

  const getRiskBadgeClass = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'Medium':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Low':
      default:
        return 'bg-green-50 text-green-600 border-green-200';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-4">
      {/* Risk Analytics Feed */}
      <Card className="border-0 shadow-2xl hover:shadow-[0_20px_50px_rgba(140,87,255,0.15)] transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Risk Analytics Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 md:space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : riskMetrics.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No active pools to analyze
            </div>
          ) : (
            riskMetrics.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
              >
                <div className={`mt-0.5 h-7 w-7 md:h-8 md:w-8 rounded-lg bg-gradient-to-br ${getRiskGradient(item.riskLevel)} flex items-center justify-center`}>
                  <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm mb-1 truncate">{item.poolName}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    Risk: {item.riskScore.toFixed(2)}% ({item.riskLevel})
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={`shrink-0 ${getRiskBadgeClass(item.riskLevel)}`}
                >
                  {item.trend === "up" ? "↑" : item.trend === "down" ? "↓" : "→"}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Notifications Panel */}
      <Card className="border-0 shadow-2xl hover:shadow-[0_20px_50px_rgba(140,87,255,0.15)] transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Bell className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 md:space-y-3">
          {notifications.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
            >
              <div className={`mt-0.5 h-7 w-7 md:h-8 md:w-8 shrink-0 rounded-lg flex items-center justify-center ${
                item.type === "success"
                  ? "bg-green-100"
                  : item.type === "warning"
                  ? "bg-orange-100"
                  : "bg-blue-100"
              }`}>
                {item.type === "success" && <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />}
                {item.type === "warning" && <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-600" />}
                {item.type === "info" && <Info className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm mb-1">{item.title}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground mb-1 line-clamp-2">{item.message}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">{item.time}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}