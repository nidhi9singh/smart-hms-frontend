// src/pages/dashboard/DashboardPage.tsx
import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '@/lib/axios'
import { fmtCurrency } from '@/lib/utils'
import { Activity, TrendingUp, Users, Bed, Pill, FlaskConical, RadioTower, Droplets, Ambulance, DollarSign } from 'lucide-react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const PIE_COLORS = ['#0d9488','#f59e0b','#3b82f6','#8b5cf6','#06b6d4','#ec4899','#10b981','#6366f1']

const KPI_CARDS = [
  { key:'opd_income',      label:'OPD Income',       icon:Activity,  color:'text-emerald-600',   bg:'bg-emerald-50' },
  { key:'ipd_income',      label:'IPD Income',       icon:Bed,       color:'text-blue-600',   bg:'bg-blue-50' },
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

      {/* Staff Count */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Staff by Role</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {(Array.isArray(staff) ? staff : Object.entries(staff).map(([role, count]) => ({ role, count }))).map((s: any, i: number) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${PIE_COLORS[i%8] ? '' : ''}`}
                style={{ background: PIE_COLORS[i % PIE_COLORS.length] + '20', color: PIE_COLORS[i % PIE_COLORS.length] }}>
                {s.count ?? s.value ?? 0}
              </div>
              <span className="text-[10px] text-gray-500 text-center capitalize leading-tight">{s.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
