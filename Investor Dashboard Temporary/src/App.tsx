import { useState } from "react";
import { Toaster } from "sonner";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { MobileNav } from "./components/MobileNav";
import { DashboardPage } from "./components/pages/DashboardPage";
import { InvestmentsPage } from "./components/pages/InvestmentsPage";
import { WalletPage } from "./components/pages/WalletPage";
import { AnalyticsPage } from "./components/pages/AnalyticsPage";
import { ProfilePage } from "./components/pages/ProfilePage";
import { DemoPage } from "./components/pages/DemoPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage onNavigate={setCurrentPage} />;
      case "investments":
        return <InvestmentsPage />;
      case "wallet":
        return <WalletPage />;
      case "analytics":
        return <AnalyticsPage />;
      case "profile":
        return <ProfilePage />;
      case "demo":
        return <DemoPage />;
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Toaster position="top-right" richColors closeButton />
      <Header onNavigate={setCurrentPage} />
      
      <div className="flex">
        <Sidebar 
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <main className={`flex-1 p-3 md:p-6 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          <div className="max-w-[1600px] mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>

      <MobileNav currentPage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
}