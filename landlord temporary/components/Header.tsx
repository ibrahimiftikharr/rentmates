import { Bell, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/domains/auth/services/authService';
import { landlordService } from '@/domains/landlord/services/landlordService';
import { toast } from '@/shared/utils/toast';
import { useState, useEffect } from 'react';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const pageLabels: Record<string, string> = {
  dashboard: 'Landlord Dashboard',
  properties: 'My Properties',
  tenants: 'Tenant Management',
  contracts: 'Contracts & Agreements',
  analytics: 'Analytics & Insights',
  maintenance: 'Maintenance & Repairs',
  calendar: 'Calendar & Events',
  blockchain: 'Blockchain & Security',
  messages: 'Messages',
  wallet: 'Wallet Management',
  settings: 'Settings',
  notifications: 'Notifications',
};

export function Header({ currentPage, onNavigate }: HeaderProps) {
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
      const profile = await landlordService.getProfile();
      setProfileImage(profile.profileImage || '');
      setUserName(profile.name || '');
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Logged out successfully');
      // Use window.location instead of navigate to force a full page reload
      window.location.href = '/auth';
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="bg-white border-b border-border px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 lg:justify-start justify-center">
          <h1 className="text-[#4A4A68] text-base sm:text-xl md:text-2xl truncate text-center lg:text-left">{pageLabels[currentPage] || 'Landlord Dashboard'}</h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 lg:relative absolute right-4">
          <button 
            onClick={() => onNavigate('notifications')}
            className="relative p-1.5 sm:p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-[#4A4A68]" />
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:opacity-80 transition-opacity">
                <Avatar className="h-7 w-7 sm:h-9 sm:w-9">
                  {profileImage && <AvatarImage src={profileImage} />}
                  <AvatarFallback>{userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'LL'}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
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
    </div>
  );
}
