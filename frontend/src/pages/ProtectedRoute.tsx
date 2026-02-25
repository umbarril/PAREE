import { Navigate } from 'react-router';
import { useAuthStore } from '../store/AuthStore';
import type { PropsWithChildren } from 'react';

type ProtectedRouteProps = PropsWithChildren;

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBooting = useAuthStore((state) => state.isBooting);

  // While checking the cookie, show nothing or a spinner
  if (isBooting) return <div>Carregando...</div>;

  // If not logged in, kick them to /login
  if (!isAuthenticated) {
    return (<Navigate to="/login" replace />);
  }

  // If logged in, show the child components
  return children;
};