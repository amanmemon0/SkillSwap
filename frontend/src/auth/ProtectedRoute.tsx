import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function ProtectedRoute({ role, children }: { role: 'admin' | 'user'; children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setAuthenticated(false);
          setLoading(false);
          return;
        }

        setAuthenticated(true);
        console.log('ProtectedRoute: Active session found for User ID:', session.user.id);

        // Fetch the user's role from public.profiles
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        console.log('ProtectedRoute: Fetched database profile:', profile);
        if (error) {
          console.error('ProtectedRoute: Error fetching user role:', error.message, error);
        }

        const roleVal = profile?.role || session.user.user_metadata?.role || 'user';
        console.log('ProtectedRoute: Resolved role value:', roleVal, 'Expected target role:', role);
        setUserRole(roleVal as 'admin' | 'user');
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

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
