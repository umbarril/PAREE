import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import './index.css'
import LoginPortal from './pages/Login.tsx'
import Home from './pages/Home.tsx'
import Classes from './pages/Classes.tsx'
import About from './pages/About.tsx'
import NotFound from './pages/NotFound.tsx'
import Library from './pages/Library.tsx'
import Settings from './pages/Settings.tsx'
import Calendar from './pages/Calendar.tsx'
import ProtectedRoute from './utils/ProtectedRoute.tsx'
import AuthProvider from './utils/Auth.tsx'
import TestLoginResult from './pages/TestLoginResult.tsx'

const router = createBrowserRouter([
  { path: '/', element: (<ProtectedRoute><Home /></ProtectedRoute>) },
  { path: '/testauth', element: (<ProtectedRoute><TestLoginResult /></ProtectedRoute>) },
  { path: '/class/:id', element: (<ProtectedRoute><Classes /></ProtectedRoute>) },
  { path: '/about', element: (<ProtectedRoute><About /></ProtectedRoute>) },
  { path: '/calendar', element: (<ProtectedRoute><Calendar /></ProtectedRoute>) },
  { path: '/library', element: (<ProtectedRoute><Library /></ProtectedRoute>) },
  { path: '/settings', element: (<ProtectedRoute><Settings /></ProtectedRoute>) },
  { path: '/login', element: <LoginPortal /> },
  { path: '*', element: <NotFound /> },
])
const root = document.getElementById('root')!

createRoot(root).render(
  <StrictMode>
      <AuthProvider testMode={false}>
        <RouterProvider router={router} />
      </AuthProvider>
  </StrictMode>,
)
