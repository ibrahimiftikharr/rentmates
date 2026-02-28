import { useState } from 'react';
import { CollapsibleSidebar } from './components/CollapsibleSidebar';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardPage } from './components/pages/DashboardPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { VerificationPage } from './components/pages/VerificationPage';
import { ReputationPage } from './components/pages/ReputationPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { MessagesPage } from './components/pages/MessagesPage';
import { NotificationsPage } from './components/pages/NotificationsPage';
import { SearchPropertiesPage } from './components/pages/SearchPropertiesPage';
import { SearchStudentsPage } from './components/pages/SearchStudentsPage';
import { WalletPage } from './components/pages/WalletPage';
import { WishlistPage } from './components/pages/WishlistPage';
import { VisitRequestsPage } from './components/pages/VisitRequestsPage';
import { JoinRequestsPage } from './components/pages/JoinRequestsPage';
import { SecurityDepositPage } from './components/pages/SecurityDepositPage';
import { LoanCenterPage } from './components/pages/LoanCenterPage';
import { AppliedLoansPage } from './components/pages/AppliedLoansPage';
import { LoanRepaymentPage } from './components/pages/LoanRepaymentPage';
import { CollateralDepositPage } from './components/pages/CollateralDepositPage';
import { Toaster } from './components/ui/sonner';

interface CollateralDepositData {
  requiredCollateral: number;
  poolName: string;
  loanAmount: number;
  interestRate: number;
  monthlyRepayment: number;
  duration: number;
  expiryTime: number;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [collateralData, setCollateralData] = useState<CollateralDepositData | null>(null);

  const handleStartCollateralDeposit = (data: CollateralDepositData) => {
    setCollateralData(data);
  };

  const handleDepositComplete = () => {
    setCollateralData(null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />;
      case 'profile':
        return <ProfilePage />;
      case 'search':
        return <SearchPropertiesPage onNavigate={setCurrentPage} />;
      case 'search-students':
        return <SearchStudentsPage onNavigate={setCurrentPage} />;
      case 'wallet':
        return <WalletPage />;
      case 'verification':
        return <VerificationPage />;
      case 'reputation':
        return <ReputationPage />;
      case 'messages':
        return <MessagesPage />;
      case 'notifications':
        return <NotificationsPage onNavigate={setCurrentPage} />;
      case 'settings':
        return <SettingsPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'visit-requests':
        return <VisitRequestsPage />;
      case 'join-requests':
        return <JoinRequestsPage />;
      case 'security-deposit':
        return <SecurityDepositPage />;
      case 'loan-center':
        return <LoanCenterPage onNavigate={setCurrentPage} collateralData={collateralData} />;
      case 'applied-loans':
        return <AppliedLoansPage onNavigate={setCurrentPage} onStartCollateralDeposit={handleStartCollateralDeposit} />;
      case 'loan-repayment':
        return <LoanRepaymentPage />;
      case 'collateral-deposit':
        return <CollateralDepositPage onNavigate={setCurrentPage} collateralData={collateralData} onDepositComplete={handleDepositComplete} />;
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Collapsible Sidebar */}
      <CollapsibleSidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <DashboardHeader currentPage={currentPage} onNavigate={setCurrentPage} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 md:p-8">
          {renderPage()}
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}