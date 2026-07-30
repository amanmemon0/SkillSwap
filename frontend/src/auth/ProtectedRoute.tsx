import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { api, getToken } from '../utils/api';

export default function ProtectedRoute({ role, children }: { role: 'admin' | 'user'; children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = getToken();
        if (!token) {
          setAuthenticated(false);
          setLoading(false);
          return;
        }

        const user = await api.getMe();
        setAuthenticated(true);
        console.log('ProtectedRoute: Active backend session found for User ID:', user._id);
        
        setUserRole(user.role);
        console.log('ProtectedRoute: Resolved role value:', user.role, 'Expected target role:', role);
      } catch (err) {
        console.error('Session check failed:', err);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [role]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f2]">
        <div className="text-sm font-bold text-ink/55 animate-pulse">Loading session...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== role) {
    return <Navigate to={userRole === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
}

