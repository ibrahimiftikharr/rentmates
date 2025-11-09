import { Navigate } from 'react-router-dom';
import { authService } from '@/domains/auth/services/authService';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole) {
    const user = authService.getCurrentUser();
    if (user?.role !== requiredRole) {
      // Redirect to correct dashboard based on user role
      const redirectPath = user?.role === 'student' ? '/student' : '/landlord';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
}

