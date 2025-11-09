import { OverviewCards } from '../components/OverviewCards';
import { UpcomingPayments } from '../components/UpcomingPayments';
import { ReputationTracking } from '../components/ReputationTracking';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Card } from '@/shared/ui/card';
import { Bell, ChevronRight } from 'lucide-react';

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  return (
    <div className="p-4 sm:p-6">
      {/* Hero Section with Illustration */}
      <div className="mb-4 sm:mb-6 bg-gradient-to-br from-[#8C57FF] to-[#B794F6] rounded-xl sm:rounded-2xl p-4 sm:p-6 flex items-center justify-between overflow-hidden relative shadow-xl">
        <div className="text-white z-10 flex-1">
          <h2 className="text-white mb-2 text-xl sm:text-2xl">Welcome back, John!</h2>
          <p className="text-white/90 text-xs sm:text-sm mb-3 sm:mb-4">
            Here's what's happening with your properties today
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-lg">
              <p className="text-xs text-white/80">This Month</p>
              <p className="text-white text-sm sm:text-base">+5 New Requests</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-lg">
              <p className="text-xs text-white/80">Total Deposits Held</p>
              <p className="text-white text-sm sm:text-base">$12,800</p>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 hidden sm:block">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1742415106160-594d07f6cc23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYW5kbG9yZCUyMHByb3BlcnR5JTIwbWFuYWdlciUyMGlsbHVzdHJhdGlvbnxlbnwxfHx8fDE3NjAwODk2Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Property Management"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Notifications Card */}
      <Card 
        className="mb-4 sm:mb-6 shadow-lg hover:shadow-xl transition-all cursor-pointer border-l-4 border-l-[#8C57FF]"
        onClick={() => onNavigate?.('notifications')}
      >
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 flex-1">
            <div className="flex-shrink-0 p-2.5 sm:p-3 rounded-lg bg-[#8C57FF]/10 border border-[#8C57FF]/20">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-[#8C57FF]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[#4A4A68] text-sm sm:text-base mb-0.5">
                You have <span className="text-[#8C57FF]">2 new notifications</span>
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                New join request and visit scheduled
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[#8C57FF] flex-shrink-0" />
        </div>
      </Card>

      {/* Overview Cards */}
      <div className="mb-4 sm:mb-6">
        <OverviewCards />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <ReputationTracking />
        <UpcomingPayments />
      </div>
    </div>
  );
}
