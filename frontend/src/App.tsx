import LoginPortal from './pages/Login.tsx'
import Home from './pages/Home.tsx'
import Classes from './pages/Classes.tsx'
import About from './pages/About.tsx'
import NotFound from './pages/NotFound.tsx'
import Library from './pages/Library.tsx'
import Settings from './pages/Settings.tsx'
import Calendar from './pages/Calendar.tsx'
import Profile from './pages/Profile.tsx'
import Logout from './pages/Logout.tsx'
import { useAuthStore } from './store/AuthStore.ts'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { useEffect } from 'react'
import { ProtectedRoute } from './pages/ProtectedRoute.tsx'

// todo: ouvir com  o wireshark como as requisicoes estao sendo feitas
const router = createBrowserRouter([
  { path: '/login', element: <LoginPortal /> },
  { path: '/', element: (<ProtectedRoute><Home /></ProtectedRoute>) },
  { path: '/profile', element: (<ProtectedRoute><Profile /></ProtectedRoute>) },
  { path: '/class/:id', element: (<ProtectedRoute><Classes /></ProtectedRoute>) },
  { path: '/class/:id/courseplan', element: (<ProtectedRoute><Classes /></ProtectedRoute>) },
  { path: '/class/:id/people', element: (<ProtectedRoute><Classes /></ProtectedRoute>) },
  { path: '/class/:id/other', element: (<ProtectedRoute><Classes /></ProtectedRoute>) },
  { path: '/about', element: (<ProtectedRoute><About /></ProtectedRoute>) },
  { path: '/calendar', element: (<ProtectedRoute><Calendar /></ProtectedRoute>) },
  { path: '/library', element: (<ProtectedRoute><Library /></ProtectedRoute>) },
  { path: '/settings', element: (<ProtectedRoute><Settings /></ProtectedRoute>) },
  { path: '/logout', element: (<ProtectedRoute><Logout /></ProtectedRoute>) },
  { path: '*', element: <NotFound /> },
])

export function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isBooting = useAuthStore((state) => state.isBooting);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isBooting) {
    return <div className="spinner">Carregando SIGAA...</div>; 
  }

  return (
    <RouterProvider router={router} />
  );
}
