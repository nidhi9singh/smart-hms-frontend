// src/pages/auth/LoginPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  Eye, EyeOff, ShieldCheck, UserCog, Stethoscope, HeartPulse, Pill,
  FlaskConical, RadioTower, Calculator, Building2, User as UserIcon, Globe, KeyRound,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

interface LoginForm { username: string; password: string }

const QUICK_FILL = [
  { role: 'super_admin',  label: 'Super Admin',  username: 'superadmin',  icon: ShieldCheck },
  { role: 'admin',        label: 'Admin',        username: 'jason.abbot', icon: UserCog },
  { role: 'doctor',       label: 'Doctor',       username: 'dr.sonia',    icon: Stethoscope },
  { role: 'nurse',        label: 'Nurse',        username: 'natasha',     icon: HeartPulse },
  { role: 'pharmacist',   label: 'Pharmacist',   username: 'harry.grant', icon: Pill },
  { role: 'pathologist',  label: 'Pathologist',  username: 'belina',      icon: FlaskConical },
  { role: 'radiologist',  label: 'Radiologist',  username: 'john.hook',   icon: RadioTower },
  { role: 'accountant',   label: 'Accountant',   username: 'brad.frost',  icon: Calculator },
  { role: 'receptionist', label: 'Receptionist', username: 'maria.ford',  icon: Building2 },
]
const DEFAULT_PASSWORD = 'Hospital@1234'


export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore(s => s.setAuth)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>()
  const [showPwd,   setShowPwd]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [pickedRole, setPickedRole] = useState<string | null>(null)

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const res = await api.post('/setup/login', data)
      const payload = res.data?.data ?? res.data
      const access_token = payload?.access_token ?? payload?.token
      const user = payload?.user ?? {
        id:   payload?.user_id ?? 1,
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

  const pickRole = (q: typeof QUICK_FILL[number]) => {
    setValue('username', q.username, { shouldValidate: true })
    setValue('password', DEFAULT_PASSWORD, { shouldValidate: true })
    setPickedRole(q.role)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <img src="/cognate.jpg" alt="Cognate" className="h-16 w-auto max-w-[220px] object-contain"/>
        </div>

        <div className="card shadow-xl shadow-gray-100/50">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Admin Login</h1>
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
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Role quick-fill — one button per role, all 9 */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Sign in as:</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_FILL.map(q => {
                const active = pickedRole === q.role
                return (
                  <button key={q.role} type="button" onClick={() => pickRole(q)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs border transition
                      ${active
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'}`}>
                    <q.icon size={13} className="flex-shrink-0"/>
                    <span className="truncate">{q.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer links: Forgot Password · Front Site · User Login */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <button type="button"
              onClick={() => toast.info('Password reset is not yet wired — contact your admin.')}
              className="flex items-center gap-1 text-emerald-700 hover:underline">
              <KeyRound size={12}/> Forgot Password?
            </button>
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-1 text-gray-500 hover:text-emerald-700">
                <Globe size={12}/> Front Site
              </a>
              <button type="button"
                onClick={() => toast.info('Patient portal login is not yet wired.')}
                className="flex items-center gap-1 text-gray-500 hover:text-emerald-700">
                <UserIcon size={12}/> User Login
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          © 2026 Xenocipher — Leading the way
        </p>
      </div>
    </div>
  )
}
