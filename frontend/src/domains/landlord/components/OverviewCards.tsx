import { Home, Users, Clock, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';

const stats = [
  {
    title: 'Total Properties',
    value: '5',
    change: '+12%',
    isPositive: true,
    icon: Home,
    gradient: 'from-[#8C57FF] to-[#B794F6]',
  },
  {
    title: 'Active Tenants',
    value: '12',
    change: '+8%',
    isPositive: true,
    icon: Users,
    gradient: 'from-[#00CFE8] to-[#5BE7F5]',
  },
  {
    title: 'Pending Requests',
    value: '2',
    change: '-4%',
    isPositive: false,
    icon: Clock,
    gradient: 'from-[#FF9F43] to-[#FFB976]',
  },
  {
    title: 'Total Earnings',
    value: '$12,800',
    change: '+18%',
    isPositive: true,
    icon: DollarSign,
    gradient: 'from-[#28C76F] to-[#68DA89]',
  },
];

export function OverviewCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">{stat.title}</p>
                <h3 className="text-[#4A4A68] mb-2 truncate">{stat.value}</h3>
                <div className="flex items-center gap-1">
                  {stat.isPositive ? (
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-[#28C76F] flex-shrink-0" />
                  ) : (
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-[#EA5455] flex-shrink-0" />
                  )}
                  <span className={`text-xs sm:text-sm ${stat.isPositive ? 'text-[#28C76F]' : 'text-[#EA5455]'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${stat.gradient} flex-shrink-0`}>
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
