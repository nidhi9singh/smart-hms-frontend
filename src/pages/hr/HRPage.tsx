// src/pages/hr/HRPage.tsx
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Upload, Eye, Edit2, Trash2, Check, X, Download, Save } from 'lucide-react'
import { hrApi } from '@/api/hr'
import { useNavigate } from 'react-router-dom'
import StaffFormModal from './StaffFormModal'
import LeaveFormModal from './LeaveFormModal'
import { useAuthStore } from '@/store/authStore'
import { cn, fmtDate } from '@/lib/utils'
import { toast } from 'sonner'

type Tab = 'staff' | 'leaves' | 'attendance' | 'payroll'

const ATT_STATUSES = [
  { label: 'Present',               short: 'P',  value: 'Present'             },
  { label: 'Late',                  short: 'L',  value: 'Late'                },
  { label: 'Absent',                short: 'A',  value: 'Absent'              },
  { label: 'Half Day',              short: 'F',  value: 'Half Day'            },
  { label: 'Holiday',               short: 'H',  value: 'Holiday'             },
  { label: 'Half Day Second Shift', short: 'SH', value: 'Half Day Second Shift'},
]


const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

function PayrollTab({ staffList, markPaid }: { staffList: any[]; markPaid: any }) {
  const [role, setRole]         = useState('doctor')
  const [month, setMonth]       = useState(String(new Date().getMonth() + 1))
  const [year, setYear]         = useState(String(new Date().getFullYear()))
  const [searched, setSearched] = useState(false)
  const [results, setResults]   = useState<any[]>([])
  const [paySearch, setPaySearch] = useState('')

  const handleSearch = async () => {
    try {
      const res = await hrApi.listStaff({ role }).then(r => r.data)
      setResults(res.data ?? [])
      setSearched(true)
    } catch { /* ignore */ }
  }

  const filtered = results.filter((s: any) => {
    if (!paySearch) return true
    const q = paySearch.toLowerCase()
    return (
      String(s.staff_code).includes(q) ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Payroll</h2>
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Role</label>
            <select className="input" value={role} onChange={e => { setRole(e.target.value); setSearched(false) }}>
              {['doctor','nurse','admin','pharmacist','pathologist','radiologist','accountant','receptionist'].map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Month</label>
            <select className="input" value={month} onChange={e => setMonth(e.target.value)}>
              {MONTHS.map((m,i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Year</label>
            <select className="input" value={year} onChange={e => setYear(e.target.value)}>
              {[2026,2025,2024,2023].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={handleSearch} className="btn btn-primary flex items-center gap-1.5">
            <Search size={14}/> Search
          </button>
        </div>
      </div>

      {searched && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <input className="input h-8 text-sm w-48" placeholder="Search..."
              value={paySearch} onChange={e => setPaySearch(e.target.value)} />
            <div className="flex gap-1">
              {['copy','xls','csv','pdf','print'].map(t => (
                <button key={t} className="icon-btn text-xs" title={t}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Staff ID','Name','Role','Department','Designation','Phone','Status','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0
                  ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No staff found</td></tr>
                  : filtered.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono text-sm">{s.staff_code}</td>
                      <td className="px-4 py-3 font-medium">{s.first_name} {s.last_name}</td>
                      <td className="px-4 py-3 capitalize text-gray-600">{s.role}</td>
                      <td className="px-4 py-3 text-gray-500">{s.department || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{s.designation || s.role}</td>
                      <td className="px-4 py-3 text-gray-500">{s.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="badge badge-green">Paid</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button className="icon-btn" title="Reset">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                          </button>
                          <button className="btn btn-primary btn-sm text-xs px-3 py-1">
                            View Payslip
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
            <span>Records: 1 to {filtered.length} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button className="icon-btn">‹</button>
              <span className="px-2 py-1 bg-brand-600 text-white rounded text-xs">1</span>
              <button className="icon-btn">›</button>
            </div>
          </div>
        </div>
      )}

      {!searched && (
        <div className="card p-8 text-center text-gray-400">
          Select role, month and year then click Search
        </div>
      )}
    </div>
  )
}

export default function HRPage() {
  const qc = useQueryClient()
  const nav = useNavigate()
  const user = useAuthStore(s => s.user)
  const role = (user?.role ?? '').toLowerCase()
  // Admin-tier roles have full HR control (Add/Import/Export/Attendance/Payroll).
  // Accountant retains full HR access because payroll lives in their workflow.
  const canManageHR = !['pathologist', 'radiologist', 'pharmacist', 'doctor', 'nurse'].includes(role)
  // All clinical roles except pathologist get a read-only Staff Directory + My Leaves.
  // Pathologist still gets only the "My Leaves" workspace.
  const canViewStaff = canManageHR || ['doctor', 'nurse', 'pharmacist', 'radiologist'].includes(role)
  // Doctors can only open their OWN profile; everyone else's Show button is hidden for them.
  const canShowStaff = (s: any) =>
    canManageHR || Number(s?.staff_code) === Number(user?.staff_code)
  const [tab, setTab]           = useState<Tab>(canViewStaff ? 'staff' : 'leaves')
  const [search, setSearch]     = useState('')
  const [staffModal, setStaffModal] = useState<{ open: boolean; staff?: any }>({ open: false })
  const [leaveModal, setLeaveModal] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list')

  // Attendance state
  const [attRole, setAttRole]       = useState('doctor')
  const [attDate, setAttDate]       = useState(new Date().toISOString().split('T')[0])
  const [attSearch, setAttSearch]   = useState(false)
  const [attStaff, setAttStaff]     = useState<any[]>([])
  const [attValues, setAttValues]   = useState<Record<number, { status: string; entry_time: string; exit_time: string; note: string }>>({})

  // Staff
  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['staff', search],
    queryFn:  () => hrApi.listStaff({ search }).then(r => r.data),
  })
  const staffList = staffData?.data ?? []

  // Leave types
  const { data: ltData } = useQuery({
    queryKey: ['leave-types'],
    queryFn:  () => hrApi.listLeaveTypes().then(r => r.data),
  })
  const leaveTypes = ltData?.data ?? []

  // Leaves
  const { data: leavesData, isLoading: leavesLoading } = useQuery({
    queryKey: ['leaves'],
    queryFn:  () => hrApi.listLeaves().then(r => r.data),
    enabled:  tab === 'leaves',
  })
  const leaves = leavesData?.data ?? []

  // Payroll
  const { data: payrollData } = useQuery({
    queryKey: ['payroll'],
    queryFn:  () => hrApi.listPayroll().then(r => r.data),
    enabled:  tab === 'payroll',
  })
  const payrolls = payrollData?.data ?? []

  const updateLeaveStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      hrApi.updateStatus(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaves'] }),
  })

  const deleteLeave = useMutation({
    mutationFn: (id: number) => hrApi.deleteLeave(id),
    onSuccess: () => {
      toast.success('Leave request deleted')
      qc.invalidateQueries({ queryKey: ['leaves'] })
    },
    onError: (e: any) => {
      const d = e?.response?.data?.detail ?? e?.response?.data?.message ?? e?.message ?? 'Failed to delete leave'
      toast.error(typeof d === 'string' ? d : JSON.stringify(d))
    },
  })

  const markPaid = useMutation({
    mutationFn: (id: number) => hrApi.markPaid(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['payroll'] }),
  })

  const tabs: { id: Tab; label: string }[] = canManageHR
    ? [
        { id: 'staff',      label: 'Staff Directory' },
        { id: 'leaves',     label: 'Leave Requests'  },
        { id: 'attendance', label: 'Attendance'       },
        { id: 'payroll',    label: 'Payroll'          },
      ]
    : canViewStaff
    ? [
        { id: 'staff',  label: 'Staff Directory' },
        { id: 'leaves', label: 'My Leaves'       },
      ]
    : [
        { id: 'leaves', label: 'My Leaves' },
      ]

  const avatarColors = ['bg-brand-100 text-brand-700','bg-brand-100 text-brand-700','bg-amber-100 text-amber-700','bg-pink-100 text-pink-700']

  // Attendance search
  const handleAttSearch = async () => {
    try {
      const res = await hrApi.listStaff({ role: attRole }).then(r => r.data)
      const staff = res.data ?? []
      setAttStaff(staff)
      const defaults: Record<number, any> = {}
      staff.forEach((s: any) => {
        defaults[s.id] = { status: 'Present', entry_time: '', exit_time: '', note: '' }
      })
      setAttValues(defaults)
      setAttSearch(true)
    } catch {
      toast.error('Failed to load staff')
    }
  }

  // Set all staff to same status
  const setAllStatus = (status: string) => {
    setAttValues(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(id => {
        updated[Number(id)] = { ...updated[Number(id)], status }
      })
      return updated
    })
  }

  const saveAttendanceMut = useMutation({
    mutationFn: async () => {
      const promises = attStaff.map((s: any) => {
        const val = attValues[s.id]
        return hrApi.markAttendance({
          staff_id:   s.id,
          date:       attDate,
          status:     val?.status ?? 'Present',
          note:       val?.note   ?? '',
        })
      })
      return Promise.all(promises)
    },
    onSuccess: () => toast.success('Attendance saved successfully'),
    onError:   () => toast.error('Failed to save attendance'),
  })

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Human Resource</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {canManageHR ? 'Staff management, leaves, attendance and payroll' : 'Apply for and track your leave requests'}
          </p>
        </div>
        <div className="flex gap-2">
          {canManageHR && tab === 'staff' && <>
            <button className="btn btn-outline flex items-center gap-1.5"><Upload size={14}/> Import Staff</button>
            <button className="btn btn-outline flex items-center gap-1.5"><Download size={14}/> Export</button>
            <button
              onClick={() => setStaffModal({ open: true, staff: undefined })}
              className="btn btn-primary flex items-center gap-1.5"
            >
              <Plus size={14}/> Add Staff
            </button>
          </>}
          {tab === 'leaves' && <>
            <button onClick={() => setLeaveModal(true)} className="btn btn-primary flex items-center gap-1.5"><Plus size={14}/> Apply Leave</button>
          </>}
        </div>
      </div>

      {/* Stats — admin/manager view only */}
      {canManageHR && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:'Total Staff',     value: staffList.length,                                     color:'bg-brand-50 text-brand-700'   },
            { label:'Doctors',         value: staffList.filter((s:any) => s.role==='doctor').length, color:'bg-brand-50 text-brand-700'   },
            { label:'Pending Leaves',  value: leaves.filter((l:any) => l.status==='Pending').length, color:'bg-amber-50 text-amber-700' },
            { label:'Approved Leaves', value: leaves.filter((l:any) => l.status==='Approved').length,color:'bg-brand-50 text-brand-700' },
          ].map(s => (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm', s.color)}>{s.value}</div>
              <span className="text-sm text-gray-600">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors',
                tab === t.id ? 'border-brand-600 text-brand-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── STAFF TAB ─────────────────────────────────────────────── */}
      {tab === 'staff' && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="relative max-w-xs flex-1">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input className="input pl-8 h-9 text-sm" placeholder="Search by name, ID, role..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input h-9 text-sm w-36"><option>All Roles</option><option>doctor</option><option>nurse</option><option>admin</option><option>pharmacist</option></select>
            <div className="flex-1"/>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              {(['list','card'] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)} className={cn('px-3 py-1.5 text-xs capitalize', viewMode===m ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50')}>{m}</button>
              ))}
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['Staff ID','Name','Role','Designation','Department','Phone','Email','Join Date','Status','Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {staffLoading ? <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
                  : staffList.map((s: any, i: number) => (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">#{s.staff_code}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {s.photo_path
                            ? <img src={s.photo_path} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0"/>
                            : <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium', avatarColors[i % 4])}>
                                {s.first_name?.[0]}{s.last_name?.[0]}
                              </div>
                          }
                          <span className="font-medium">{s.first_name} {s.last_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="badge badge-blue capitalize">{s.role}</span></td>
                      <td className="px-4 py-3 text-gray-500">{s.designation || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{s.department || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{s.phone || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.email}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{s.date_of_joining ? fmtDate(s.date_of_joining) : '—'}</td>
                      <td className="px-4 py-3"><span className={cn('badge', s.is_active ? 'badge-green' : 'badge-gray')}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {canShowStaff(s) && (
                            <button className="icon-btn" title="Show" onClick={() => nav(`/hr/staff/${s.id}`)}><Eye size={13}/></button>
                          )}
                          {canManageHR && <>
                            <button className="icon-btn" onClick={() => setStaffModal({ open: true, staff: s })}><Edit2 size={13}/></button>
                            <button className="icon-btn text-red-400 hover:text-red-600"><Trash2 size={13}/></button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 p-4">
              {staffList.map((s: any, i: number) => (
                <div key={s.id} className="border border-gray-100 rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:border-brand-200 transition-colors">
                  {s.photo_path
                    ? <img src={s.photo_path} alt="" className="w-12 h-12 rounded-full object-cover"/>
                    : <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold', avatarColors[i % 4])}>
                        {s.first_name?.[0]}{s.last_name?.[0]}
                      </div>
                  }
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{s.first_name} {s.last_name}</div>
                    <div className="text-xs text-gray-500">#{s.staff_code}</div>
                  </div>
                  <span className="badge badge-blue text-xs capitalize">{s.role}</span>
                  <div className="text-xs text-gray-400">{s.department || '—'}</div>
                  <div className="flex gap-1 mt-1">
                    {canShowStaff(s) && (
                      <button className="icon-btn" title="Show" onClick={() => nav(`/hr/staff/${s.id}`)}><Eye size={12}/></button>
                    )}
                    {canManageHR && (
                      <button className="icon-btn" onClick={() => setStaffModal({ open: true, staff: s })}><Edit2 size={12}/></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            Showing {staffList.length} staff members
          </div>
        </div>
      )}

      {/* ── LEAVES TAB ────────────────────────────────────────────── */}
      {tab === 'leaves' && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <select className="input h-9 text-sm w-44"><option>All Leave Types</option>{leaveTypes.map((lt:any) => <option key={lt.id}>{lt.name}</option>)}</select>
            <select className="input h-9 text-sm w-36"><option>All Status</option><option>Pending</option><option>Approved</option><option>Disapprove</option></select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Staff','Leave Type','Leave Date','Days','Apply Date','Status','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leavesLoading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                : leaves.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No leave requests</td></tr>
                : leaves.map((l: any) => (
                  <tr key={l.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium">{l.staff?.first_name} {l.staff?.last_name}</td>
                    <td className="px-4 py-3 text-gray-600">{l.leave_type_rel?.name || l.leave_type || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(l.from_date)} – {fmtDate(l.to_date)}</td>
                    <td className="px-4 py-3 text-center">{l.days}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(l.apply_date)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', l.status==='Approved' ? 'badge-green' : l.status==='Pending' ? 'badge-amber' : 'badge-red')}>{l.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {canManageHR && l.status === 'Pending' && <>
                          <button className="icon-btn text-brand-600" title="Approve" onClick={() => updateLeaveStatus.mutate({ id: l.id, status: 'Approved' })}><Check size={13}/></button>
                          <button className="icon-btn text-red-400" title="Reject" onClick={() => updateLeaveStatus.mutate({ id: l.id, status: 'Disapprove' })}><X size={13}/></button>
                        </>}
                        <button className="icon-btn" title="View"><Eye size={13}/></button>
                        {l.status === 'Pending' && (
                          <button className="icon-btn text-red-500 hover:bg-red-50" title="Delete"
                            onClick={() => { if (window.confirm('Delete this leave request?')) deleteLeave.mutate(l.id) }}>
                            <Trash2 size={13}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ATTENDANCE TAB ────────────────────────────────────────── */}
      {tab === 'attendance' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Staff Attendance</h2>
            <div className="grid grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Role</label>
                <select className="input" value={attRole} onChange={e => { setAttRole(e.target.value); setAttSearch(false) }}>
                  {['doctor','nurse','admin','pharmacist','pathologist','radiologist','accountant','receptionist'].map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Attendance Date</label>
                <input type="date" className="input" value={attDate}
                  onChange={e => { setAttDate(e.target.value); setAttSearch(false) }} />
              </div>
              <button onClick={handleAttSearch} className="btn btn-primary flex items-center gap-1.5">
                <Search size={14}/> Search
              </button>
            </div>
          </div>

          {/* Results */}
          {attSearch && attStaff.length === 0 && (
            <div className="card p-8 text-center text-gray-400">No staff found for this role</div>
          )}

          {attSearch && attStaff.length > 0 && (
            <div className="card overflow-hidden p-0">
              {/* Bulk setter + Save */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap text-xs text-gray-600">
                  <span className="font-medium whitespace-nowrap">Set Attendance For All Staff As</span>
                  {ATT_STATUSES.map(s => (
                    <label key={s.value} className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                      <input type="radio" name="bulk-att" className="accent-brand-600"
                        onChange={() => setAllStatus(s.value)} />
                      {s.label} <span className="text-gray-400">({s.short})</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => saveAttendanceMut.mutate()}
                  disabled={saveAttendanceMut.isPending}
                  className="btn btn-primary flex items-center gap-1.5 text-sm"
                >
                  <Save size={13}/>
                  {saveAttendanceMut.isPending ? 'Saving...' : 'Save Attendance'}
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-white">
                      {['#','Staff ID','Name','Role','Staff Attendance','Source','Entry Time','Exit Time','Note'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {attStaff.map((s: any, i: number) => {
                      const val = attValues[s.id] ?? { status: 'Present', entry_time: '', exit_time: '', note: '' }
                      const setVal = (field: string, v: string) =>
                        setAttValues(prev => ({ ...prev, [s.id]: { ...val, [field]: v } }))
                      return (
                        <tr key={s.id} className="hover:bg-gray-50/30">
                          <td className="px-3 py-2.5 text-gray-400 text-xs">{i+1}</td>
                          <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{s.staff_code}</td>
                          <td className="px-3 py-2.5 font-medium whitespace-nowrap">{s.first_name} {s.last_name}</td>
                          <td className="px-3 py-2.5 capitalize text-gray-600">{s.role}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-3 flex-wrap">
                              {ATT_STATUSES.map(st => (
                                <label key={st.value} className="flex items-center gap-1 cursor-pointer text-xs whitespace-nowrap">
                                  <input type="radio"
                                    name={`att-${s.id}`}
                                    checked={val.status === st.value}
                                    onChange={() => setVal('status', st.value)}
                                    className="accent-brand-600"
                                  />
                                  {st.label}
                                </label>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-gray-400 text-xs">N/A</td>
                          <td className="px-3 py-2.5">
                            <input type="time" className="input h-7 text-xs w-28"
                              value={val.entry_time}
                              onChange={e => setVal('entry_time', e.target.value)} />
                          </td>
                          <td className="px-3 py-2.5">
                            <input type="time" className="input h-7 text-xs w-28"
                              value={val.exit_time}
                              onChange={e => setVal('exit_time', e.target.value)} />
                          </td>
                          <td className="px-3 py-2.5">
                            <input className="input h-7 text-xs w-32"
                              value={val.note}
                              onChange={e => setVal('note', e.target.value)} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!attSearch && (
            <div className="card p-8 text-center text-gray-400">
              Select a role and date to view attendance records
            </div>
          )}
        </div>
      )}

      {/* ── PAYROLL TAB ───────────────────────────────────────────── */}
      {tab === 'payroll' && <PayrollTab staffList={staffList} markPaid={markPaid} />}

      <StaffFormModal
        key={staffModal.staff?.id ?? 'new-staff'}
        open={staffModal.open}
        staff={staffModal.staff}
        onClose={() => setStaffModal({ open: false })}
        onSuccess={() => { setStaffModal({ open: false }); qc.invalidateQueries({ queryKey: ['staff'] }) }}
      />

      <LeaveFormModal open={leaveModal} onClose={() => setLeaveModal(false)}
        onSuccess={() => { setLeaveModal(false); qc.invalidateQueries({ queryKey: ['leaves'] }) }}
      />
    </div>
  )
}
