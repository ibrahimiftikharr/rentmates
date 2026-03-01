import { TrendingUp, DollarSign, Target, Calendar } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const summaryData = [
  {
    title: "Total Invested",
    value: "$124,580",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
    gradient: "from-[#8C57FF] to-[#7367F0]",
  },
  {
    title: "Earnings Generated",
    value: "$28,450",
    change: "+3 new",
    trend: "up",
    icon: Target,
    gradient: "from-[#00CFE8] to-[#0099CC]",
  },
  {
    title: "Annual ROI",
    value: "18.2%",
    change: "+2.1%",
    trend: "up",
    icon: TrendingUp,
    gradient: "from-[#FF6B9D] to-[#FF4081]",
  },
  {
    title: "Pool Utilization Rate",
    value: "76.8%",
    change: "In 7 days",
    trend: "neutral",
    icon: Calendar,
    gradient: "from-[#FFA726] to-[#FB8C00]",
  },
];

export function InvestmentSummaryCards() {
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