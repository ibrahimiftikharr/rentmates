import { 
  LayoutDashboard, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Home,
  CalendarCheck,
  UserCheck,
  Wallet,
  MessageSquare,
  Search
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: Home, label: 'My Properties', id: 'my-properties' },
  { icon: PlusCircle, label: 'Add New Property', id: 'add-property' },
  { icon: CalendarCheck, label: 'Visit Requests', id: 'visit-requests' },
  { icon: UserCheck, label: 'Join Requests', id: 'join-requests' },
  { icon: Users, label: 'Tenants', id: 'tenants' },
  { icon: Search, label: 'Search Students', id: 'search-students' },
  { icon: MessageSquare, label: 'Messages', id: 'messages' },
  { icon: Wallet, label: 'Wallet', id: 'wallet' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-border"
      >
        <LayoutDashboard className="h-5 w-5 text-[#8C57FF]" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`bg-white border-r border-border h-screen flex flex-col transition-all duration-300 fixed lg:relative z-40 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-4 sm:p-6 flex items-center justify-between">
          <div className={`flex items-center gap-2 flex-1 ${isCollapsed ? 'hidden' : ''} ${isMobileOpen ? 'lg:justify-start justify-center' : ''}`}>
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#8C57FF] to-[#B794F6] rounded-lg flex items-center justify-center flex-shrink-0 hidden lg:flex">
              <LayoutDashboard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 text-center lg:text-left">
              <h2 className="text-[#4A4A68] text-base sm:text-lg truncate">RentMates</h2>
              <p className="text-xs text-muted-foreground truncate">Landlord Portal</p>
            </div>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 sm:p-2 hover:bg-[#F4F5FA] rounded-lg transition-colors hidden lg:block ${isCollapsed ? 'mx-auto' : ''}`}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-[#4A4A68]" />
            ) : (
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-[#4A4A68]" />
            )}
          </button>
        </div>

        <nav className="flex-1 px-2 sm:px-3 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-[#8C57FF]/10 text-[#8C57FF]'
                      : 'text-[#4A4A68] hover:bg-[#F4F5FA]'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="text-xs sm:text-sm truncate">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
