// src/pages/ForbiddenPage.tsx
import { useLocation, useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function ForbiddenPage() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const user     = useAuthStore(s => s.user)
  const blocked  = location.state?.from

  return (
    <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center p-6">
      <div className="card max-w-md w-full p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 flex items-center justify-center">
          <ShieldOff size={28} className="text-rose-600"/>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Access Denied</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your role <span className="font-medium text-gray-700">({user?.role || 'unknown'})</span> doesn't have permission to view this page.
          </p>
          {blocked && (
            <p className="text-xs text-gray-400 mt-2 font-mono">{blocked}</p>
          )}
        </div>
        <div className="flex gap-2 justify-center pt-2">
          <button onClick={() => navigate(-1)} className="btn btn-outline">Go Back</button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">Dashboard</button>
        </div>
      </div>
    </div>
  )
}
