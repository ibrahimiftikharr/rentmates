import { Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface DashboardHeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview of your account activity and stats',
  },
  profile: {
    title: 'My Profile',
    subtitle: 'Manage your personal information and documents',
  },
  search: {
    title: 'Search Properties',
    subtitle: 'Find your perfect student accommodation',
  },
  wallet: {
    title: 'Wallet Management',
    subtitle: 'Connect your wallet, manage funds, and track transactions',
  },
  verification: {
    title: 'Identity Verification',
    subtitle: 'Complete your KYC process to unlock all features',
  },
  reputation: {
    title: 'Reputation Dashboard',
    subtitle: 'Track and improve your reputation score',
  },
  messages: {
    title: 'Messages',
    subtitle: 'Communicate with landlords and property managers',
  },
  notifications: {
    title: 'Notifications',
    subtitle: 'Stay updated with your account activity',
  },
  settings: {
    title: 'Settings & Preferences',
    subtitle: 'Customize your account settings and preferences',
  },
};

export function DashboardHeader({ currentPage, onNavigate }: DashboardHeaderProps) {
  const pageInfo = pageTitles[currentPage] || pageTitles.dashboard;

  return (
    <header className="bg-card border-b border-border px-4 sm:px-6 md:px-8 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        {/* Page Title */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate">{pageInfo.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm hidden sm:block">{pageInfo.subtitle}</p>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
          {/* Verification Status Badge */}
          <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50 px-2 py-1 text-xs sm:px-3 hidden sm:inline-flex">
            ✓ Verified
          </Badge>
          
          {/* Mobile: Just checkmark icon */}
          <div className="sm:hidden w-6 h-6 rounded-full bg-green-50 border border-green-500 flex items-center justify-center flex-shrink-0">
            <span className="text-green-600 text-xs">✓</span>
          </div>

          {/* Notification Bell */}
          <div className="relative flex-shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full w-9 h-9 sm:w-10 sm:h-10"
              onClick={() => onNavigate('notifications')}
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
          </div>

          {/* Profile Avatar */}
          <Avatar 
            className="cursor-pointer w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0"
            onClick={() => onNavigate('profile')}
          >
            <AvatarImage src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}