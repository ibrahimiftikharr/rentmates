import { useState } from 'react';
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
import '../styles/index.css';
import '../styles/globals.css';
import '../styles/mobile.css';

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

  return (
    <div className="investor-dashboard min-h-screen bg-background pb-16 md:pb-0">
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
