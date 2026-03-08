import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from '../components/ui/sonner';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { MobileNav } from '../components/MobileNav';
import { DashboardPage } from './DashboardPage';
import { InvestmentsPage } from './InvestmentsPage';
import { WalletPage } from './WalletPage';
import { AnalyticsPage } from './AnalyticsPage';
import { ProfilePage } from './ProfilePage';
import { DemoPage } from './DemoPage';
import { NotificationsPage } from './NotificationsPage';
import { socketService } from '@/shared/services/socketService';
import { authService } from '@/domains/auth/services/authService';
import { toast } from 'sonner';

export function InvestorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Extract current page from pathname
  const getCurrentPage = () => {
    const path = location.pathname.replace('/investor', '').replace('/', '') || 'dashboard';
    return path;
  };

  const currentPage = getCurrentPage();

  const handleNavigate = (page: string) => {
    navigate(`/investor/${page}`);
  };

  // Initialize Socket.IO connection for real-time updates
  useEffect(() => {
    socketService.connect();

    // Listen for real-time notifications
    socketService.on('new_notification', (data: any) => {
      // Don't show toast for message notifications if user is on messages page
      if (data.type === 'message' && window.location.pathname.includes('/messages')) {
        return;
      }
      
      toast.info(data.title || 'New Notification', {
        description: data.message,
      });
    });

    // Listen for investment-related events
    socketService.on('investment_value_updated', (data: any) => {
      console.log('Investment value updated:', data);
    });

    socketService.on('loan_repayment_updated', (data: any) => {
      console.log('Loan repayment updated:', data);
    });

    socketService.on('pool_share_price_updated', (data: any) => {
      console.log('Pool share price updated:', data);
    });

    return () => {
      socketService.off('new_notification');
      socketService.off('investment_value_updated');
      socketService.off('loan_repayment_updated');
      socketService.off('pool_share_price_updated');
      socketService.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Toaster position="top-right" richColors closeButton />
      <Header onNavigate={handleNavigate} />
      
      <div className="flex">
        <Sidebar 
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <main className={`flex-1 p-3 md:p-6 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          <div className="max-w-[1600px] mx-auto">
            <Routes>
              <Route path="/" element={<DashboardPage onNavigate={handleNavigate} />} />
              <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
              <Route path="/investments" element={<InvestmentsPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/notifications" element={<NotificationsPage onNavigate={handleNavigate} />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/demo" element={<DemoPage />} />
            </Routes>
          </div>
        </main>
      </div>

      <MobileNav currentPage={currentPage} onNavigate={handleNavigate} />
    </div>
  );
}
