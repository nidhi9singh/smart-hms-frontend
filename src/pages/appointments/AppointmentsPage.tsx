// src/pages/appointments/AppointmentsPage.tsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Copy, FileSpreadsheet, FileText, Printer, Stethoscope, List } from 'lucide-react'
import { appointmentsApi } from '@/api/appointments'
import AppointmentFormModal from './AppointmentFormModal'
import { cn, fmtDate } from '@/lib/utils'
//import EmptyState from '@/components/ui/EmptyState'

function EmptyState({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon}
      <p className="text-gray-400 mt-3 mb-4">{title}</p>
      {action}
    </div>
  )
}

type Tab = 'today' | 'upcoming' | 'old'
type View = 'list' | 'doctor_wise' | 'queue'

const TABS: { id: Tab; label: string }[] = [
  { id: 'today',    label: 'Today Appointment' },
  { id: 'upcoming', label: 'Upcoming Appointment' },
  { id: 'old',      label: 'Old Appointment' },
]

function statusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case 'approved':  return 'bg-emerald-500 text-white'
    case 'confirmed': return 'bg-emerald-500 text-white'
    case 'completed': return 'bg-emerald-500 text-white'
    case 'cancelled': return 'bg-red-500 text-white'
    default:          return 'bg-orange-400 text-white'
  }
}

function fmtDateTime(d: string) {
  if (!d) return '—'
  try {
    const dt = new Date(d)
    return dt.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) +
      ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch { return d }
}

export default function AppointmentsPage() {
  const qc = useQueryClient()
  const [tab, setTab]         = useState<Tab>('today')
  const [search, setSearch]   = useState('')
  const [perPage, setPerPage] = useState(100)
  const [page, setPage]       = useState(1)
  const [modal, setModal]     = useState(false)
  const [view, setView]       = useState<View>('list')

  // Doctor wise state
  const [dwDoctor, setDwDoctor] = useState('')
  const [dwDate, setDwDate]     = useState('')

  // Queue state
  const [qDoctor, setQDoctor] = useState('')
  const [qShift, setQShift]   = useState('')
  const [qDate, setQDate]     = useState('')
  const [qSlot, setQSlot]     = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', tab, search, page, perPage],
    queryFn: () => appointmentsApi.list({
      filter_type: tab,
      search: search || undefined,
      page,
      per_page: perPage,
    }).then(r => r.data),
    enabled: view === 'list',
  })

  const appointments = (data?.data ?? []) as any[]
  const total = data?.pagination?.total ?? appointments.length

  return (
    <div className="p-6 space-y-0 animate-fade-in">

      {/* ── Tabs + Buttons ──────────── */}
      <div className="flex items-center justify-between border-b border-gray-200 mb-0">
        <nav className="flex gap-0 -mb-px">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setPage(1); setView('list') }}
              className={cn(
                'px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                tab === t.id && view === 'list'
                  ? 'border-[#00a8e8] text-[#00a8e8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="flex gap-2">
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#00a8e8] hover:bg-[#0090c7] text-white text-sm font-medium rounded transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Appointment
          </button>
          <button
            onClick={() => setView('doctor_wise')}
            className={cn('flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded transition-colors border',
              view === 'doctor_wise' ? 'bg-[#1a2332] text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            <Stethoscope className="w-4 h-4" /> Doctor Wise
          </button>
          <button
            onClick={() => setView('queue')}
            className={cn('flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded transition-colors border',
              view === 'queue' ? 'bg-[#1a2332] text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
          >
            <List className="w-4 h-4" /> Queue
          </button>
        </div>
      </div>

      {/* ── Doctor Wise View ────────── */}
      {view === 'doctor_wise' && (
        <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Doctor Wise Appointment</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor <span className="text-red-500">*</span></label>
              <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white" value={dwDoctor} onChange={e => setDwDoctor(e.target.value)}>
                <option value="">Select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" className="w-full h-10 px-3 border border-gray-300 rounded text-sm" value={dwDate} onChange={e => setDwDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <button className="px-5 py-2 bg-[#00a8e8] text-white text-sm font-medium rounded hover:bg-[#0090c7]">Search</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Queue View ──────────────── */}
      {view === 'queue' && (
        <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Patient Queue</h3>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor <span className="text-red-500">*</span></label>
              <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white" value={qDoctor} onChange={e => setQDoctor(e.target.value)}>
                <option value="">Select</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift <span className="text-red-500">*</span></label>
              <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white" value={qShift} onChange={e => setQShift(e.target.value)}>
                <option value="">Select</option>
                <option>Morning</option>
                <option>Evening</option>
                <option>Night</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
              <input type="date" className="w-full h-10 px-3 border border-gray-300 rounded text-sm" value={qDate} onChange={e => setQDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slot</label>
              <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white" value={qSlot} onChange={e => setQSlot(e.target.value)}>
                <option value="">Select</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button className="px-4 py-2 bg-[#00a8e8] text-white text-sm font-medium rounded hover:bg-[#0090c7]">Reorder Queue</button>
              <button className="px-4 py-2 bg-[#00a8e8] text-white text-sm font-medium rounded hover:bg-[#0090c7]">Search</button>
            </div>
          </div>
        </div>
      )}

      {/* ── List View ───────────────── */}
      {view === 'list' && (
        <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg">
          {/* Search + Export */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <input type="text" placeholder="Search..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-48 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400" />
            <div className="flex items-center gap-2">
              <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-600">
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <div className="flex items-center gap-1 ml-1">
                {[Copy, FileSpreadsheet, FileText, FileText, Printer].map((Icon, i) => (
                  <button key={i} className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded">
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-[#00a8e8] rounded-full animate-spin" />
              </div>
            ) : appointments.length === 0 ? (
              <EmptyState icon={<Stethoscope className="w-8 h-8 text-gray-400" />} title="No appointments found"
                action={<button onClick={() => setModal(true)} className="px-4 py-2 bg-[#00a8e8] text-white text-sm rounded">+ Add Appointment</button>} />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    {['Patient Name', 'Appointment No', 'Created By', 'Appointment Date', 'Phone',
                      'Gender', 'Doctor', 'Source', 'Priority', 'Live Consultant',
                      'Alternate Address', 'Fees (₹)', 'Discount (%)', 'Paid (₹)', 'Status'
                    ].map(h => (
                      <th key={h} className="px-3 py-3 text-left font-semibold text-gray-700 whitespace-nowrap text-xs">
                        {h} <span className="text-gray-400 text-[10px]">▼</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appointments.map((a: any) => (
                    <tr key={a.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-3">
                        <span className="text-[#00a8e8] hover:underline cursor-pointer font-medium">
                          {a.patient_name ?? `Patient #${a.patient_id}`} ({a.patient_id})
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-700">{a.appointment_no ?? '—'}</td>
                      <td className="px-3 py-3 text-gray-600 text-xs">{a.created_by_name ?? `Super Admin (${a.created_by ?? 9001})`}</td>
                      <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{fmtDateTime(a.appointment_date)}</td>
                      <td className="px-3 py-3 text-gray-600 text-xs">{a.phone ?? '—'}</td>
                      <td className="px-3 py-3 text-gray-700">{a.gender ?? '—'}</td>
                      <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                        {a.doctor_name ? `${a.doctor_name} (${a.doctor_code ?? a.doctor_id})` : a.doctor_id ?? '—'}
                      </td>
                      <td className="px-3 py-3 text-gray-600">{a.source ?? 'Offline'}</td>
                      <td className="px-3 py-3 text-gray-700">{a.priority ?? 'Normal'}</td>
                      <td className="px-3 py-3 text-gray-600">{a.live_consultant ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-3 text-gray-500 max-w-[100px] truncate">{a.alternate_address ?? ''}</td>
                      <td className="px-3 py-3 text-gray-700 text-right">{Number(a.fees ?? 0).toFixed(2)}</td>
                      <td className="px-3 py-3 text-gray-700 text-right">{Number(a.discount ?? 0).toFixed(2)} ({Number(a.discount_percent ?? 0).toFixed(2)} %)</td>
                      <td className="px-3 py-3 text-gray-700 text-right">{Number(a.paid ?? 0).toFixed(2)}</td>
                      <td className="px-3 py-3">
                        <span className={cn('inline-block px-3 py-1 rounded text-xs font-medium', statusBadge(a.status))}>
                          {a.status ?? 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Records: 1 to {appointments.length} of {total}</span>
            {total > perPage && (
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40">‹</button>
                <span className="px-3 py-1 border border-[#00a8e8] bg-[#00a8e8] text-white rounded text-xs">{page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={appointments.length < perPage}
                  className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40">›</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      <AppointmentFormModal
        open={modal}
        onClose={() => setModal(false)}
        onSuccess={() => { setModal(false); qc.invalidateQueries({ queryKey: ['appointments'] }) }}
      />
    </div>
  )
}
