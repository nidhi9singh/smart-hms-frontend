import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function ProtectedRoute() {
  const isAuth = useAuthStore(s => s.isAuth())
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />
}
