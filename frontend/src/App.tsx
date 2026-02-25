import LoginPortal from './pages/Login.tsx'
import Home from './pages/Home.tsx'
import Classes from './pages/Classes.tsx'
import About from './pages/About.tsx'
import NotFound from './pages/NotFound.tsx'
import Library from './pages/Library.tsx'
import Settings from './pages/Settings.tsx'
import Calendar from './pages/Calendar.tsx'
import TestLoginResult from './pages/TestLoginResult.tsx'
import Logout from './pages/Logout.tsx'
import { useAuthStore } from './store/AuthStore.ts'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { useEffect } from 'react'
import { ProtectedRoute } from './pages/ProtectedRoute.tsx'

// todo: ouvir com  o wireshark como as requisicoes estao sendo feitas
const router = createBrowserRouter([
  { path: '/login', element: <LoginPortal /> },
  { path: '*', element: <NotFound /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <Home />, },
      { path: '/testauth', element: <TestLoginResult />, },
      { path: '/class/:id', element: <Classes />, },
      { path: '/about', element: <About />, },
      { path: '/calendar', element: <Calendar />, },
      { path: '/library', element: <Library />, },
      { path: '/settings', element: <Settings />, },
      { path: '/logout', element: <Logout />, },
    ]
  },
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
