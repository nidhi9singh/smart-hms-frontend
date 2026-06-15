// src/pages/duty_roster/DutyRosterPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import { dutyRosterApi } from '@/api/duty_roster'
import { hrApi } from '@/api/hr'
import AddShiftModal from './AddShiftModal'
import AddRosterModal from './AddRosterModal'
import AssignRosterModal from './AssignRosterModal'
import { cn } from '@/lib/utils'

type Tab = 'duty_roster' | 'shifts' | 'rosters' | 'assign'

const DURATION_OPTIONS = [
  { value: '',      label: 'All'        },
  { value: 'today', label: 'Today'      },
  { value: 'week',  label: 'This week'  },
  { value: 'month', label: 'This month' },
]

function dateRange(d: string): { from?: string; to?: string } {
  const now = new Date()
  const iso = (x: Date) => x.toISOString().slice(0, 10)
  if (d === 'today') return { from: iso(now), to: iso(now) }
  if (d === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay())
    const end = new Date(start); end.setDate(start.getDate() + 6)
    return { from: iso(start), to: iso(end) }
  }
  if (d === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { from: iso(start), to: iso(end) }
  }
  return {}
}

export default function DutyRosterPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('duty_roster')
  const [duration, setDuration] = useState('')
  const [staffFilter, setStaffFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  const [shiftModal,  setShiftModal]  = useState<{ open: boolean; shift?: any }>({ open: false })
  const [rosterModal, setRosterModal] = useState<{ open: boolean; roster?: any }>({ open: false })
  const [assignModal, setAssignModal] = useState(false)

  const { data: staffData } = useQuery({
    queryKey: ['dr-staff'], queryFn: () => hrApi.listStaff({ per_page: 500 }).then(r => r.data),
  })
  const staffList: any[] = staffData?.data ?? []

  const { from, to } = dateRange(duration)
  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['dr-entries', from, to, staffFilter],
    queryFn:  () => dutyRosterApi.listEntries({
      date_from: from, date_to: to,
      staff_id : staffFilter ? Number(staffFilter) : undefined,
    }).then(r => r.data),
    enabled:  tab === 'duty_roster',
  })
  const entries: any[] = entriesData?.data ?? []

  const { data: shiftsData, isLoading: shiftsLoading } = useQuery({
    queryKey: ['dr-shifts', search],
    queryFn:  () => dutyRosterApi.listShifts({ search }).then(r => r.data),
    enabled:  tab === 'shifts',
  })
  const shifts: any[] = shiftsData?.data ?? []

  const { data: rostersData, isLoading: rostersLoading } = useQuery({
    queryKey: ['dr-rosters', search],
    queryFn:  () => dutyRosterApi.listRosters({ search }).then(r => r.data),
    enabled:  tab === 'rosters',
  })
  const rosters: any[] = rostersData?.data ?? []

  const { data: assignedData, isLoading: assignedLoading } = useQuery({
    queryKey: ['dr-assigned', search],
    queryFn:  () => dutyRosterApi.listAssigned({ search }).then(r => r.data),
    enabled:  tab === 'assign',
  })
  const assigned: any[] = assignedData?.data ?? []

  const delShift  = useMutation({ mutationFn: (id: number) => dutyRosterApi.deleteShift(id),  onSuccess: () => qc.invalidateQueries({ queryKey: ['dr-shifts'] }) })
  const delRoster = useMutation({ mutationFn: (id: number) => dutyRosterApi.deleteRoster(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['dr-rosters'] }) })
  const delAssigned = useMutation({
    mutationFn: ({ staff_id, roster_id }: { staff_id: number; roster_id: number }) =>
      dutyRosterApi.removeAssigned(staff_id, roster_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dr-assigned'] })
      qc.invalidateQueries({ queryKey: ['dr-entries'] })
    },
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Duty Roster</h1>
          <p className="text-sm text-gray-500 mt-0.5">Shifts, rosters and staff assignments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('shifts')}  className="btn btn-outline flex items-center gap-1.5">≡ Shift</button>
          <button onClick={() => setTab('rosters')} className="btn btn-outline flex items-center gap-1.5">≡ Roster</button>
          <button onClick={() => setTab('assign')}  className="btn btn-outline flex items-center gap-1.5">≡ Assign Roster</button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex">
          {[
            { id: 'duty_roster', label: 'Duty Roster'  },
            { id: 'shifts',      label: 'Shift'        },
            { id: 'rosters',     label: 'Roster List'  },
            { id: 'assign',      label: 'Assign Roster'},
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id as Tab); setSearch('') }}
              className={cn('px-4 py-2.5 text-sm border-b-2 -mb-px',
                tab === t.id ? 'border-brand-600 text-brand-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}>{t.label}</button>
          ))}
        </div>
      </div>

      {tab === 'duty_roster' && (
        <div className="card p-0 overflow-hidden">
          <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-100 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Time Duration<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select className="input" value={duration} onChange={e => setDuration(e.target.value)}>
                {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Staff</label>
              <select className="input" value={staffFilter} onChange={e => setStaffFilter(e.target.value)}>
                <option value="">All staff</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>
                    {[s.first_name, s.last_name].filter(Boolean).join(' ')} {s.staff_code ? `(${s.staff_code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <button onClick={() => qc.invalidateQueries({ queryKey: ['dr-entries'] })}
                      className="btn btn-primary flex items-center gap-1.5">
                <Search size={13}/> Search
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Staff','Date','Shift Start','Shift End','Shift Hour','Shift','Department','Floor'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entriesLoading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
                : entries.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No roster entries</td></tr>
                : entries.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      {e.staff_name || `#${e.staff_id}`}
                      {e.staff_code ? <span className="text-gray-400 text-xs ml-1">({e.staff_code})</span> : null}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{e.date}</td>
                    <td className="px-4 py-3 text-gray-500">{e.start_time || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{e.end_time || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{e.shift_hours || '—'}</td>
                    <td className="px-4 py-3 text-brand-600">{e.shift_name || '—'}</td>
                    <td className="px-4 py-3 text-brand-600">{e.department || '—'}</td>
                    <td className="px-4 py-3 text-brand-600">{e.floor || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'shifts' && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input className="input pl-8 h-9 text-sm" placeholder="Search shifts..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex-1" />
            <button onClick={() => setShiftModal({ open: true })} className="btn btn-primary text-sm flex items-center gap-1.5">
              <Plus size={13}/> Add Shift
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Shift Name','Shift Start','Shift End','Shift Hour','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shiftsLoading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              : shifts.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No shifts</td></tr>
              : shifts.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-brand-600 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.start_time}</td>
                  <td className="px-4 py-3 text-gray-500">{s.end_time}</td>
                  <td className="px-4 py-3 text-gray-500">{s.shift_hours || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="icon-btn" onClick={() => setShiftModal({ open: true, shift: s })}><Edit2 size={12}/></button>
                      <button className="icon-btn text-red-400" onClick={() => confirm(`Delete ${s.name}?`) && delShift.mutate(s.id)}><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'rosters' && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input className="input pl-8 h-9 text-sm" placeholder="Search rosters..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex-1" />
            <button onClick={() => setRosterModal({ open: true })} className="btn btn-primary text-sm flex items-center gap-1.5">
              <Plus size={13}/> Add Roster
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Shift Name','Start Date','End Date','Shift Start','Shift End','Shift Hour','Roster Days','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rostersLoading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              : rosters.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No rosters</td></tr>
              : rosters.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-brand-600 font-medium">{r.shift_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.start_date}</td>
                  <td className="px-4 py-3 text-gray-500">{r.end_date}</td>
                  <td className="px-4 py-3 text-gray-500">{r.start_time || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.end_time || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.shift_hours || '—'}</td>
                  <td className="px-4 py-3">{r.roster_days}</td>
                  <td className="px-4 py-3">
                    <button className="icon-btn text-red-400" onClick={() => confirm('Delete roster?') && delRoster.mutate(r.id)}><Trash2 size={12}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'assign' && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input className="input pl-8 h-9 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex-1" />
            <button onClick={() => setAssignModal(true)} className="btn btn-primary text-sm flex items-center gap-1.5">
              <Plus size={13}/> Assign Roster
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Staff','Floor','Department','Roster','Start Date - End Date','Shift Start - Shift End','Generated By','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assignedLoading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
                : assigned.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No assigned rosters</td></tr>
                : assigned.map((a, idx) => (
                  <tr key={`${a.staff_id}-${a.roster_id}-${idx}`} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-brand-600 font-medium">
                      {a.staff_name || `#${a.staff_id}`}
                      {a.staff_code ? <span className="text-gray-400 text-xs ml-1">({a.staff_code})</span> : null}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{a.floor || '—'}</td>
                    <td className="px-4 py-3 text-brand-600">{a.department || '—'}</td>
                    <td className="px-4 py-3 text-brand-600">{a.shift_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{a.start_date} - {a.end_date}</td>
                    <td className="px-4 py-3 text-gray-500">{a.start_time || '—'} - {a.end_time || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{a.generated_by_name || '—'}</td>
                    <td className="px-4 py-3">
                      <button className="icon-btn text-red-400"
                              onClick={() => confirm('Remove this assignment?') && delAssigned.mutate({ staff_id: a.staff_id, roster_id: a.roster_id })}>
                        <Trash2 size={12}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AddShiftModal
        open={shiftModal.open} shift={shiftModal.shift}
        onClose={() => setShiftModal({ open: false })}
        onSuccess={() => { setShiftModal({ open: false }); qc.invalidateQueries({ queryKey: ['dr-shifts'] }) }}
      />
      <AddRosterModal
        open={rosterModal.open} roster={rosterModal.roster}
        onClose={() => setRosterModal({ open: false })}
        onSuccess={() => { setRosterModal({ open: false }); qc.invalidateQueries({ queryKey: ['dr-rosters'] }) }}
      />
      <AssignRosterModal
        open={assignModal}
        onClose={() => setAssignModal(false)}
        onSuccess={() => {
          setAssignModal(false)
          qc.invalidateQueries({ queryKey: ['dr-assigned'] })
          qc.invalidateQueries({ queryKey: ['dr-entries'] })
        }}
      />
    </div>
  )
}
