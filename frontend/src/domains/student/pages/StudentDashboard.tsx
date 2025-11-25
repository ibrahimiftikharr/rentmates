import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { CollapsibleSidebar } from '../components/CollapsibleSidebar';
import { DashboardHeader } from '../components/DashboardHeader';
import { DashboardPage } from './DashboardPage';
import { ProfilePage } from './ProfilePage';
import { VerificationPage } from './VerificationPage';
import { ReputationPage } from './ReputationPage';
import { SettingsPage } from './SettingsPage';
import { MessagesPage } from './MessagesPage';
import { NotificationsPage } from './NotificationsPage';
import { SearchPropertiesPage } from './SearchPropertiesPage';
import { SearchStudentsPage } from './SearchStudentsPage';
import { WalletPage } from './WalletPage';
import { WishlistPage } from './WishlistPage';
import { VisitRequestsPage } from './VisitRequestsPage';
import { JoinRequestsPage } from './JoinRequestsPage';
import { SecurityDepositPage } from './SecurityDepositPage';
import { Toaster } from '@/shared/ui/sonner';
import { socketService } from '@/shared/services/socketService';
import { toast } from 'sonner';
import '../styles/index.css';
import '../styles/globals.css';

export function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract current page from pathname
  const getCurrentPage = () => {
    const path = location.pathname.replace('/student', '').replace('/', '') || 'dashboard';
    return path;
  };

  const currentPage = getCurrentPage();

  const handleNavigate = (page: string) => {
    navigate(`/student/${page}`);
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    socketService.connect();

    // Listen for real-time visit notifications
    socketService.on('visit_confirmed', (data: any) => {
      toast.success(`Your visit request has been confirmed!`, {
        description: data.message,
      });
    });

    socketService.on('visit_rescheduled', (data: any) => {
      toast.info(`Your visit has been rescheduled`, {
        description: data.message,
      });
    });

    socketService.on('visit_rejected', (data: any) => {
      toast.error(`Your visit request was declined`, {
        description: data.message,
      });
    });

    socketService.on('new_notification', (data: any) => {
      toast.info(data.title, {
        description: data.message,
      });
    });

    return () => {
      socketService.off('visit_confirmed');
      socketService.off('visit_rescheduled');
      socketService.off('visit_rejected');
      socketService.off('new_notification');
      socketService.disconnect();
    };
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <CollapsibleSidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <DashboardHeader currentPage={currentPage} onNavigate={handleNavigate} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          <Routes>
            <Route path="/" element={<DashboardPage onNavigate={handleNavigate} />} />
            <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/search" element={<SearchPropertiesPage onNavigate={handleNavigate} />} />
            <Route path="/search-students" element={<SearchStudentsPage onNavigate={handleNavigate} />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/verification" element={<VerificationPage />} />
            <Route path="/reputation" element={<ReputationPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/notifications" element={<NotificationsPage onNavigate={handleNavigate} />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/wishlist" element={<WishlistPage onNavigate={handleNavigate} />} />
            <Route path="/visit-requests" element={<VisitRequestsPage />} />
            <Route path="/join-requests" element={<JoinRequestsPage />} />
            <Route path="/security-deposit" element={<SecurityDepositPage />} />
          </Routes>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

