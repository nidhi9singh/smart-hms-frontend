// src/pages/dashboard/DashboardPage.tsx
import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '@/lib/axios'
import { fmtCurrency } from '@/lib/utils'
import { useMemo, useState } from 'react'
import { Activity, TrendingUp, Users, Bed, Pill, FlaskConical, RadioTower, Droplets, Ambulance, DollarSign, Megaphone, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { messagingApi } from '@/api/messaging'
import { appointmentsApi } from '@/api/appointments'
import { useAuthStore } from '@/store/authStore'
import RescheduleModal from '@/pages/appointments/RescheduleModal'
import { cn } from '@/lib/utils'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const PIE_COLORS = ['#0d9488','#f59e0b','#3b82f6','#8b5cf6','#06b6d4','#ec4899','#10b981','#6366f1']

const KPI_CARDS = [
  { key:'opd_income',      label:'OPD Income',       icon:Activity,  color:'text-emerald-600',   bg:'bg-emerald-50' },
  { key:'ipd_income',      label:'IPD Income',       icon:Bed,       color:'text-emerald-600',   bg:'bg-emerald-50' },
  { key:'pharmacy_income', label:'Pharmacy Income',  icon:Pill,      color:'text-amber-600',  bg:'bg-amber-50' },
  { key:'pathology_income',label:'Pathology Income', icon:FlaskConical,color:'text-purple-600',bg:'bg-purple-50' },
  { key:'radiology_income',label:'Radiology Income', icon:RadioTower,color:'text-indigo-600', bg:'bg-indigo-50' },
  { key:'blood_bank_income',label:'Blood Bank Income',icon:Droplets, color:'text-red-600',    bg:'bg-red-50' },
  { key:'ambulance_income',label:'Ambulance Income', icon:Ambulance, color:'text-orange-600', bg:'bg-orange-50' },
  { key:'general_income',  label:'General Income',   icon:TrendingUp,color:'text-emerald-600',  bg:'bg-emerald-50' },
  { key:'expenses',        label:'Expenses',         icon:DollarSign,color:'text-rose-600',   bg:'bg-rose-50' },
]

export default function DashboardPage() {
  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn:  () => api.get('/dashboard/income-summary').then(r => r.data?.data ?? {}),
  })
  const { data: yearlyData } = useQuery({
    queryKey: ['dashboard-yearly'],
    queryFn:  () => api.get('/dashboard/yearly-income-expense').then(r => r.data?.data ?? []),
  })
  const { data: monthlyData } = useQuery({
    queryKey: ['dashboard-monthly'],
    queryFn:  () => api.get('/dashboard/monthly-income-overview').then(r => r.data?.data ?? {}),
  })
  const { data: staffData } = useQuery({
    queryKey: ['dashboard-staff'],
    queryFn:  () => api.get('/dashboard/staff-count').then(r => r.data?.data ?? []),
  })

  const summary = summaryData ?? {}
  const yearly  = (yearlyData ?? []).length > 0 ? yearlyData :
    MONTHS.map((m, i) => ({ month: m, income: Math.random()*200000, expenses: Math.random()*350000 }))

  const pieData = Object.entries(monthlyData ?? {
    OPD:1808, IPD:607, Pharmacy:6166, Pathology:1316, Radiology:1148, 'Blood Bank':1310
  }).map(([k, v]) => ({ name: k, value: Number(v) }))

  const staff = staffData ?? [
    { role:'Doctor', count:4 },{ role:'Nurse', count:2 },{ role:'Admin', count:1 },{ role:'Pharmacist', count:1 },
    { role:'Pathologist', count:1 },{ role:'Radiologist', count:1 },{ role:'Receptionist', count:1 },{ role:'Accountant', count:1 }
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">Cognate — Overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPI_CARDS.map(k => (
          <div key={k.key} className="card-sm flex items-center gap-3 p-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${k.bg}`}>
              <k.icon size={16} className={k.color}/>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {fmtCurrency(summary[k.key] ?? 0)}
              </div>
              <div className="text-[10px] text-gray-400 truncate">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Yearly chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Yearly Income & Expense</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={yearly}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={(v: any) => fmtCurrency(v)}/>
              <Area type="monotone" dataKey="income" stroke="#0d9488" strokeWidth={2} fill="url(#gIncome)" name="Income"/>
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#gExpenses)" name="Expenses"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Overview */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Income Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                dataKey="value" nameKey="name">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
              </Pie>
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{fontSize:10}}>{v}</span>}/>
              <Tooltip formatter={(v: any) => fmtCurrency(v)}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calendar */}
      <CalendarWidget/>

      {/* Notice Board + Staff Count */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <NoticeBoard/>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Staff by Role</h3>
          <div className="grid grid-cols-4 gap-3">
            {(Array.isArray(staff) ? staff : Object.entries(staff).map(([role, count]) => ({ role, count }))).map((s: any, i: number) => (
              <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] + '20', color: PIE_COLORS[i % PIE_COLORS.length] }}>
                  {s.count ?? s.value ?? 0}
                </div>
                <span className="text-[10px] text-gray-500 text-center capitalize leading-tight">{s.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


/* ─────────────── Notice Board widget ─────────────── */
/* Reads /messaging/notices and filters to the notices that target the
   logged-in user's role (notice.message_to is a CSV of role labels).
   Broadcasts with empty message_to are shown to everyone. */
function NoticeBoard() {
  const role = useAuthStore(s => s.user?.role)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-notices'],
    queryFn:  () => messagingApi.listNotices({ per_page: 100 }).then(r => r.data),
    refetchInterval: 60_000,
  })

  const rows = ((data?.data ?? []) as any[]).filter((n: any) => {
    const targets = String(n.message_to || '').toLowerCase()
    if (!targets) return true
    // Match either canonical role (`doctor`) or display variants (`super admin`, `super_admin`).
    return [role, role?.replace('_', ' '), role?.replace('_', '')].some(
      r => r && targets.includes(r.toLowerCase())
    )
  })

  return (
    <div className="card lg:col-span-2 p-0 overflow-hidden flex flex-col">
      <header className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
        <Megaphone size={16} className="text-emerald-600"/>
        <h3 className="text-sm font-semibold text-gray-900">Notice Board</h3>
        <span className="ml-auto text-xs text-gray-400">{rows.length} notice{rows.length === 1 ? '' : 's'}</span>
      </header>

      <div className="overflow-y-auto max-h-[480px] divide-y divide-gray-100">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-gray-400">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-400">No notices for you right now</div>
        ) : rows.map((n: any) => (
          <details key={n.id} className="group">
            <summary className="px-5 py-3 cursor-pointer hover:bg-emerald-50/40 list-none flex items-center gap-3">
              <span className="flex-1 text-sm text-[#059669] font-medium truncate">{n.title}</span>
              <span className="text-[11px] text-gray-400 whitespace-nowrap">
                {n.notice_date ? new Date(n.notice_date).toLocaleDateString() : ''}
              </span>
              <span className="text-gray-300 group-open:rotate-90 transition-transform">›</span>
            </summary>
            {(n.message || n.description) && (
              <div className="px-5 pb-3 text-xs text-gray-600 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: n.message || n.description || '' }}/>
            )}
          </details>
        ))}
      </div>
    </div>
  )
}


/* ─────────────── Calendar widget ─────────────── */
/* Weekly grid showing the logged-in user's appointments. The appointments API
   is already doctor-scoped server-side (see modules/appointment/router.py), so
   doctors only ever see their own slots. Admins see everything. */
type CalView = 'day' | 'week' | 'month'

function CalendarWidget() {
  const [anchor, setAnchor] = useState(new Date())
  const [view, setView]     = useState<CalView>('week')
  const [editing, setEditing] = useState<any | null>(null)

  // Compute the start of the current period (Sunday for week, day itself for day, 1st for month)
  const { start, end, days, label } = useMemo(() => {
    const a = new Date(anchor); a.setHours(0, 0, 0, 0)
    if (view === 'day') {
      const end = new Date(a); end.setDate(end.getDate() + 1)
      return { start: a, end, days: [a], label: a.toLocaleDateString(undefined, { dateStyle: 'full' }) }
    }
    if (view === 'week') {
      const dow = a.getDay()                // 0 = Sun
      const start = new Date(a); start.setDate(a.getDate() - dow)
      const end   = new Date(start); end.setDate(start.getDate() + 7)
      const days  = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start); d.setDate(start.getDate() + i); return d
      })
      const last = new Date(end); last.setDate(end.getDate() - 1)
      const monthStr = start.getMonth() === last.getMonth()
        ? start.toLocaleDateString(undefined, { month: 'long' })
        : `${start.toLocaleDateString(undefined, { month: 'short' })} – ${last.toLocaleDateString(undefined, { month: 'short' })}`
      return { start, end, days, label: `${monthStr} ${start.getDate()} – ${last.getDate()} ${start.getFullYear()}` }
    }
    // month
    const start = new Date(a.getFullYear(), a.getMonth(), 1)
    const end   = new Date(a.getFullYear(), a.getMonth() + 1, 1)
    const cells: Date[] = []
    const startGrid = new Date(start); startGrid.setDate(1 - start.getDay())
    for (let i = 0; i < 42; i++) {
      const d = new Date(startGrid); d.setDate(startGrid.getDate() + i)
      cells.push(d)
    }
    return { start: startGrid, end, days: cells, label: a.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) }
  }, [anchor, view])

  // Keying under ['appointments', ...] so RescheduleModal's invalidateQueries({queryKey:['appointments']})
  // also re-fetches the calendar.
  const { data } = useQuery({
    queryKey: ['appointments', 'calendar', view, start.toISOString()],
    queryFn:  () => appointmentsApi.list({ filter_type: 'all', per_page: 500 }).then(r => r.data),
    staleTime: 30_000,
  })

  const appointments = ((data?.data ?? []) as any[])
    .map(a => ({ ...a, _d: a.appointment_date ? new Date(a.appointment_date) : null }))
    .filter(a => a._d && a._d >= start && a._d < end)

  const shiftAnchor = (delta: number) => {
    const d = new Date(anchor)
    if (view === 'day')   d.setDate(d.getDate() + delta)
    if (view === 'week')  d.setDate(d.getDate() + 7 * delta)
    if (view === 'month') d.setMonth(d.getMonth() + delta)
    setAnchor(d)
  }

  return (
    <div className="card p-0 overflow-hidden">
      <header className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
        <CalendarIcon size={16} className="text-emerald-600"/>
        <h3 className="text-sm font-semibold text-gray-900">Calendar</h3>

        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => shiftAnchor(-1)} className="icon-btn" title="Previous"><ChevronLeft size={14}/></button>
          <button onClick={() => shiftAnchor( 1)} className="icon-btn" title="Next"><ChevronRight size={14}/></button>
          <button onClick={() => setAnchor(new Date())}
            className="ml-1 px-3 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700">Today</button>
        </div>

        <span className="px-3 text-sm font-medium text-gray-700">{label}</span>

        <div className="flex border border-gray-200 rounded overflow-hidden">
          {(['month','week','day'] as CalView[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn('px-3 py-1 text-xs capitalize',
                view === v ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>
              {v}
            </button>
          ))}
        </div>
      </header>

      {view === 'month'
        ? <MonthView days={days} anchor={anchor} appointments={appointments} onPick={setEditing}/>
        : <WeekDayView days={days} appointments={appointments} onPick={setEditing}/>}

      <RescheduleModal open={!!editing} appointment={editing} onClose={() => setEditing(null)}/>
    </div>
  )
}

function WeekDayView({ days, appointments, onPick }: { days: Date[]; appointments: any[]; onPick: (a: any) => void }) {
  const HOURS = Array.from({ length: 24 }, (_, h) => h)
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const apptsByDay = days.map(d => {
    const start = new Date(d); start.setHours(0, 0, 0, 0)
    const end   = new Date(d); end.setDate(end.getDate() + 1)
    return appointments.filter(a => a._d >= start && a._d < end)
  })

  return (
    <div className="overflow-auto max-h-[520px]">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 bg-white z-10">
          <tr>
            <th className="w-14 border-b border-r border-gray-200"/>
            {days.map(d => {
              const isToday = d.getTime() === today.getTime()
              return (
                <th key={d.toISOString()} className={cn(
                  'border-b border-r border-gray-200 px-2 py-2 text-center font-medium',
                  isToday ? 'bg-amber-50 text-amber-700' : 'text-gray-600'
                )}>
                  {d.toLocaleDateString(undefined, { weekday: 'short' })} {d.getMonth()+1}/{d.getDate()}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {HOURS.map(h => (
            <tr key={h} className="h-10">
              <td className="border-r border-b border-gray-100 text-[10px] text-gray-400 text-right pr-1 align-top">
                {h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`}
              </td>
              {days.map((d, di) => {
                const slotStart = new Date(d); slotStart.setHours(h, 0, 0, 0)
                const slotEnd   = new Date(d); slotEnd.setHours(h + 1, 0, 0, 0)
                const items = apptsByDay[di].filter(a => a._d >= slotStart && a._d < slotEnd)
                return (
                  <td key={di} className="border-r border-b border-gray-100 align-top p-0.5 relative">
                    {items.map((a: any) => (
                      <button key={a.id}
                        onClick={() => onPick(a)}
                        className="block w-full text-left text-[10px] leading-tight px-1 py-0.5 mb-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white truncate cursor-pointer"
                        title={`Click to reschedule · ${a.patient_name ?? `Patient #${a.patient_id}`} · ${a._d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`}>
                        {a._d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} {a.patient_name ?? ''}
                      </button>
                    ))}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MonthView({ days, anchor, appointments, onPick }: { days: Date[]; anchor: Date; appointments: any[]; onPick: (a: any) => void }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const month = anchor.getMonth()
  return (
    <div>
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50 text-xs text-center text-gray-500 font-medium">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const inMonth = d.getMonth() === month
          const isToday = d.getTime() === today.getTime()
          const dayStart = new Date(d); dayStart.setHours(0,0,0,0)
          const dayEnd   = new Date(d); dayEnd.setDate(dayEnd.getDate() + 1)
          const items = appointments.filter(a => a._d >= dayStart && a._d < dayEnd)
          return (
            <div key={i} className={cn(
              'border-b border-r border-gray-100 min-h-[80px] p-1 text-xs',
              !inMonth && 'bg-gray-50/40 text-gray-300',
              isToday && 'bg-amber-50'
            )}>
              <div className={cn('text-[11px] font-medium mb-1', isToday && 'text-amber-700')}>{d.getDate()}</div>
              {items.slice(0, 3).map((a: any) => (
                <button key={a.id}
                  onClick={() => onPick(a)}
                  className="block w-full text-left text-[10px] leading-tight px-1 py-0.5 mb-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white truncate cursor-pointer"
                  title={`Click to reschedule · ${a.patient_name ?? `Patient #${a.patient_id}`}`}>
                  {a._d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} {a.patient_name ?? ''}
                </button>
              ))}
              {items.length > 3 && (
                <div className="text-[10px] text-gray-500 px-1">+{items.length - 3} more</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
