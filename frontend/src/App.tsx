import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './domains/auth/pages/AuthPage';
import { ResetPasswordPage } from './domains/auth/pages/ResetPasswordPage';
import { StudentDashboard } from './domains/student/pages/StudentDashboard';
import { LandlordDashboard } from './domains/landlord/pages/LandlordDashboard';
import { authService } from './domains/auth/services/authService';
import { ProtectedRoute } from './shared/components/ProtectedRoute';

function App() {
  console.log('[App] Rendering, current path:', window.location.pathname);
  
  return (
    <Routes>
      <Route 
        path="/auth" 
        element={
          authService.isAuthenticated() ? (
            <Navigate to={getDashboardPath()} replace />
          ) : (
            <AuthPage />
          )
        } 
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/student/*"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/landlord/*"
        element={
          <ProtectedRoute requiredRole="landlord">
            <LandlordDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}

function getDashboardPath(): string {
  const user = authService.getCurrentUser();
  if (!user) return '/auth';
  return user.role === 'student' ? '/student' : '/landlord';
}

export default App;

