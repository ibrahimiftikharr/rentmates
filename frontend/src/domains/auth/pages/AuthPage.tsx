import { Header } from '../components/Header';
import { IllustrationPanel } from '../components/IllustrationPanel';
import { AuthCard } from '../components/AuthCard';
import '../styles/index.css';
import '../styles/globals.css';

export function AuthPage() {
  console.log('[AuthPage] Rendering');
  
  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ minHeight: '100vh', backgroundColor: '#FAFBFC' }}>
      <div className="lg:hidden">
        <Header />
      </div>
      <div className="flex-1 flex overflow-hidden">
        <IllustrationPanel />
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 overflow-y-auto">
          <AuthCard />
        </div>
      </div>
    </div>
  );
}

