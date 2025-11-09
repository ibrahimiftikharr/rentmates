import { useState, useEffect } from 'react';
import { LayoutDashboard, User, Settings, Bell, Shield, ChevronLeft, ChevronRight, Home, FileText, MessageSquare, Award, Search, Heart, CalendarCheck, UserPlus, Wallet, Users } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { TooltipProvider } from '@/shared/ui/tooltip';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

// MetaMask Icon Component
const MetaMaskIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M36.9 4.4L22.5 14.8L25.2 8.2L36.9 4.4Z" fill="currentColor" stroke="currentColor" strokeWidth="0.25"/>
    <path d="M3.1 4.4L17.3 15L14.8 8.2L3.1 4.4Z" fill="currentColor" stroke="currentColor" strokeWidth="0.25"/>
    <path d="M31.7 27.8L27.9 33.8L36 36L38.3 28L31.7 27.8Z" fill="currentColor" stroke="currentColor" strokeWidth="0.25"/>
    <path d="M1.7 28L4 36L12.1 33.8L8.3 27.8L1.7 28Z" fill="currentColor" stroke="currentColor" strokeWidth="0.25"/>
    <path d="M11.6 17.6L9.4 21.1L17.4 21.5L17.1 12.8L11.6 17.6Z" fill="currentColor" stroke="currentColor" strokeWidth="0.25"/>
    <path d="M28.4 17.6L22.8 12.6L22.6 21.5L30.6 21.1L28.4 17.6Z" fill="currentColor" stroke="currentColor" strokeWidth="0.25"/>
    <path d="M12.1 33.8L16.9 31.5L12.7 28L12.1 33.8Z" fill="currentColor" stroke="currentColor" strokeWidth="0.25"/>
    <path d="M23.1 31.5L27.9 33.8L27.3 28L23.1 31.5Z" fill="currentColor" stroke="currentColor" strokeWidth="0.25"/>
  </svg>
);

interface CollapsibleSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function CollapsibleSidebar({ currentPage, onNavigate }: CollapsibleSidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Detect mobile and set collapsed state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      // On mobile, always keep it collapsed
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggleCollapse = () => {
    // Only allow toggle on desktop/laptop
    if (!isMobile) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', customIcon: null },
    { id: 'profile', icon: User, label: 'Profile', customIcon: null },
    { id: 'search', icon: Search, label: 'Search Properties', customIcon: null },
    { id: 'search-students', icon: Users, label: 'Search Students', customIcon: null },
    { id: 'wishlist', icon: Heart, label: 'Wishlist', customIcon: null },
    { id: 'visit-requests', icon: CalendarCheck, label: 'Visit Requests', customIcon: null },
    { id: 'join-requests', icon: UserPlus, label: 'Join Requests', customIcon: null },
    { id: 'security-deposit', icon: Shield, label: 'Security Deposit', customIcon: null },
    { id: 'wallet', icon: Wallet, label: 'Wallet', customIcon: null },
    { id: 'messages', icon: MessageSquare, label: 'Messages', customIcon: null },
    { id: 'notifications', icon: Bell, label: 'Notifications', customIcon: null },
    { id: 'settings', icon: Settings, label: 'Settings', customIcon: null },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <div 
        className={`h-screen bg-card border-r border-border transition-all duration-300 flex flex-col ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="font-inter">StudentHub</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const IconComponent = item.customIcon || item.icon;
            const button = (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentPage === item.id
                    ? 'bg-primary text-white'
                    : 'text-foreground hover:bg-accent'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                {IconComponent && <IconComponent className="w-5 h-5 flex-shrink-0" />}
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );

            return isCollapsed ? (
              <TooltipPrimitive.Root key={item.id}>
                <TooltipPrimitive.Trigger asChild>
                  {button}
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                  <TooltipPrimitive.Content 
                    side="right" 
                    className="bg-primary text-white px-3 py-1.5 text-xs rounded-md z-50"
                    sideOffset={5}
                  >
                    {item.label}
                  </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
              </TooltipPrimitive.Root>
            ) : (
              button
            );
          })}
        </nav>

        {/* Collapse Toggle - Only show on desktop/laptop */}
        {!isMobile && (
          <div className="p-4 border-t border-border">
            {isCollapsed ? (
              <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleCollapse}
                    className="w-full justify-center"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                  <TooltipPrimitive.Content 
                    side="right" 
                    className="bg-primary text-white px-3 py-1.5 text-xs rounded-md z-50"
                    sideOffset={5}
                  >
                    Expand
                  </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
              </TooltipPrimitive.Root>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleCollapse}
                className="w-full justify-start"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                <span>Collapse</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
