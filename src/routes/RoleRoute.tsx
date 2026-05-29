// src/routes/RoleRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { canAccess } from '@/lib/access'

/**
 * Wraps protected routes with role-based access enforcement.
 * Place inside <ProtectedRoute>. Unauthenticated → /login; lacking access → /403.
 */
export default function RoleRoute() {
  const user     = useAuthStore(s => s.user)
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace />
  if (!canAccess(user.role, location.pathname)) {
    return <Navigate to="/403" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
