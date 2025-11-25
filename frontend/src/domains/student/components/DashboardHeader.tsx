import { Bell, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/domains/auth/services/authService';
import { studentService } from '@/domains/student/services/studentService';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

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
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    fetchProfileData();

    // Listen for profile image updates
    const handleProfileUpdate = () => {
      fetchProfileData();
    };
    window.addEventListener('profileImageUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileUpdate);
    };
  }, []);

  const fetchProfileData = async () => {
    try {
      const profile = await studentService.getProfile();
      setProfileImage(profile.documents?.profileImage || '');
      setUserName(profile.name || '');
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

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

          {/* Profile Avatar with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                <Avatar className="cursor-pointer w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
                  {profileImage && <AvatarImage src={profileImage} />}
                  <AvatarFallback>{userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'ST'}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate('profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate('settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
