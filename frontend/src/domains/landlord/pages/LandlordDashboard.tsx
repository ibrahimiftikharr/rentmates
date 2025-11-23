import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { DashboardPage } from './DashboardPage';
import { AddPropertyPage } from './AddPropertyPage';
import { MyPropertiesPage } from './MyPropertiesPage';
import { PropertyDetailsPage } from './PropertyDetailsPage';
import { VisitRequestsPage } from './VisitRequestsPage';
import { JoinRequestsPage } from './JoinRequestsPage';
import { SignContractPage } from './SignContractPage';
import { ViewContractPage } from './ViewContractPage';
import { TenantsPage } from './TenantsPage';
import { SearchStudentsPage } from './SearchStudentsPage';
import { StudentProfilePage } from './StudentProfilePage';
import { MessagesPage } from './MessagesPage';
import { WalletPage } from './WalletPage';
import { SettingsPage } from './SettingsPage';
import { NotificationsPage } from './NotificationsPage';
import '../styles/index.css';
import '../styles/globals.css';

export function LandlordDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const getCurrentPage = () => {
    const path = location.pathname.replace('/landlord', '').replace('/', '') || 'dashboard';
    return path;
  };

  const currentPage = getCurrentPage();

  const handleNavigate = (page: string, id?: string) => {
    if (page === 'property-details') {
      navigate(`/landlord/property-details/${id}`);
    } else if (page === 'sign-contract') {
      setSelectedRequestId(id || null);
      navigate(`/landlord/sign-contract/${id}`);
    } else if (page === 'view-contract') {
      setSelectedContractId(id || null);
      navigate(`/landlord/view-contract/${id}`);
    } else if (page === 'student-profile') {
      setSelectedStudentId(id || null);
      navigate(`/landlord/student-profile/${id}`);
    } else {
      navigate(`/landlord/${page}`);
    }
  };

  return (
    <div className="flex h-screen bg-[#F4F5FA] overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={(page) => navigate(`/landlord/${page}`)} />
      <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-auto">
        <Header currentPage={currentPage} onNavigate={handleNavigate} />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<DashboardPage onNavigate={handleNavigate} />} />
            <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
            <Route path="/add-property" element={<AddPropertyPage onPublish={() => handleNavigate('my-properties')} onNavigate={handleNavigate} />} />
            <Route path="/my-properties" element={<MyPropertiesPage onNavigate={handleNavigate} onAddNew={() => handleNavigate('add-property')} />} />
            <Route path="/property-details/:id" element={<PropertyDetailsPage onNavigate={handleNavigate} />} />
            <Route path="/visit-requests" element={<VisitRequestsPage />} />
            <Route path="/join-requests" element={<JoinRequestsPage onNavigate={handleNavigate} />} />
            <Route path="/sign-contract/:id" element={<SignContractPage requestId={selectedRequestId || ''} onNavigate={handleNavigate} onContractSigned={(reqId, contractId) => handleNavigate('view-contract', contractId)} />} />
            <Route path="/view-contract/:id" element={<ViewContractPage contractId={selectedContractId || ''} onNavigate={handleNavigate} />} />
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="/search-students" element={<SearchStudentsPage onNavigate={handleNavigate} />} />
            <Route path="/student-profile/:id" element={<StudentProfilePage studentId={selectedStudentId || ''} onNavigate={handleNavigate} />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

