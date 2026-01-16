import { type PropsWithChildren, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from './Auth';

type ProtectedRouteProps = PropsWithChildren;

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authData === null) {
      navigate('/login', { replace: true });
    }
  }, [navigate, authData]);

  return children;
}