// src/pages/auth/LoginPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Hospital } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

interface LoginForm { username: string; password: string }

const QUICK_FILL = [
  { label: 'Super Admin', username: 'superadmin',  password: 'Hospital@1234' },
  { label: 'Doctor',      username: 'dr.sania',    password: 'Hospital@1234' },
  { label: 'Admin',       username: 'jason.abbot', password: 'Hospital@1234' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore(s => s.setAuth)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>()
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const res = await api.post('/setup/login', data)
      // Handle multiple possible response shapes from backend
      const payload = res.data?.data ?? res.data
      const access_token = payload?.access_token ?? payload?.token
      const user = payload?.user ?? {
        id: payload?.user_id ?? 1,
        name: payload?.name ?? data.username,
        role: payload?.role ?? 'admin',
      }
      if (!access_token) throw new Error('No token in response')
      localStorage.setItem('hms_token', access_token)
      setAuth(access_token, user)
      toast.success(`Welcome back, ${user?.name ?? 'User'}!`)
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.detail
        ?? err.response?.data?.message
        ?? err.response?.data?.error
        ?? err.message
        ?? 'Login failed — check credentials'
      toast.error(msg)
      console.error('Login error:', err.response?.data ?? err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-200">
            <Hospital size={22} className="text-white"/>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-lg leading-tight">Smart Hospital</div>
            <div className="text-xs text-gray-400">& Research Center</div>
          </div>
        </div>

        <div className="card shadow-xl shadow-gray-100/50">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-5">Enter your credentials to access the system</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Username</label>
              <input className={`input ${errors.username ? 'input-error' : ''}`}
                {...register('username', { required: 'Username is required' })}
                placeholder="superadmin" autoFocus />
              {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  {...register('password', { required: 'Password is required' })}
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Quick fill (dev only):</p>
            <div className="flex gap-2 flex-wrap">
              {QUICK_FILL.map(q => (
                <button key={q.label} type="button"
                  onClick={() => { setValue('username', q.username); setValue('password', q.password) }}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 transition text-gray-600">
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          © 2026 Smart Hospital & Research Center
        </p>
      </div>
    </div>
  )
}
