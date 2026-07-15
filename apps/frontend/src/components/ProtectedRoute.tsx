import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect to their respective dashboard based on role
    switch (profile.role) {
      case 'parent': return <Navigate to="/parent" replace />;
      case 'manager': return <Navigate to="/manager" replace />;
      case 'tutor': return <Navigate to="/tutor" replace />;
      default: return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
};
