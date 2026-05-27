// src/pages/opd/OPDPage.tsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, Printer, FileText, FileSpreadsheet,
  Copy, List, Edit2, Trash2, Eye, Stethoscope,
} from 'lucide-react'
import { opdApi } from '@/api/opd'
import type { OPDRecord } from '@/api/opd'
import AddOPDModal from './AddOPDModal'
import OPDDetailPage from './OPDDetailPage'
import { useDeleteOPD } from '@/hooks/useOPD'
function PageLoader() {
  return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-gray-300 border-t-[#00a8e8] rounded-full animate-spin" /></div>
}

function EmptyState({ icon, title, action }: { icon?: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-3">{icon}</div>}
      <p className="text-gray-500 text-sm mb-3">{title}</p>
      {action}
    </div>
  )
}
import { cn, fmtDate } from '@/lib/utils'

type Tab = 'today' | 'upcoming' | 'old' | 'patient_view'

const TABS: { id: Tab; label: string }[] = [
  { id: 'today',        label: 'Today OPD' },
  { id: 'upcoming',     label: 'Upcoming OPD' },
  { id: 'old',          label: 'Old OPD' },
  { id: 'patient_view', label: 'Patient View' },
]

function fmtDateTime(d: string) {
  if (!d) return '—'
  try {
    const dt = new Date(d)
    return dt.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) +
      ' ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch { return fmtDate(d) }
}

export default function OPDPage() {
  const qc = useQueryClient()
  const [tab, setTab]         = useState<Tab>('today')
  const [search, setSearch]   = useState('')
  const [perPage, setPerPage] = useState(100)
  const [page, setPage]       = useState(1)
  const [modal, setModal]     = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)

  const deleteOPD = useDeleteOPD()

  const filterType = tab === 'patient_view' ? undefined : tab
  const { data, isLoading } = useQuery({
    queryKey: ['opd', tab, search, page, perPage],
    queryFn: () => opdApi.list({
      filter_type: filterType,
      search: search || undefined,
      page,
      per_page: perPage,
    }).then(r => r.data),
  })

  const visits = (data?.data ?? []) as OPDRecord[]
  const total  = data?.pagination?.total ?? visits.length

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this OPD record?')) return
    await deleteOPD.mutateAsync(id)
  }

  // ── Detail view ─────────────────────────
  if (detailId) {
    return <OPDDetailPage opdId={detailId} onBack={() => setDetailId(null)} />
  }

  /* ═══════════════════════════════════════════
     LIST VIEW
     ═══════════════════════════════════════════ */
  return (
    <div className="p-6 space-y-0 animate-fade-in">

      {/* ── Tabs + Add Patient ──────────── */}
      <div className="flex items-center justify-between border-b border-gray-200 mb-0">
        <nav className="flex gap-0 -mb-px">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setPage(1) }}
              className={cn(
                'px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                tab === t.id
                  ? 'border-[#00a8e8] text-[#00a8e8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#00a8e8] hover:bg-[#0090c7] text-white text-sm font-medium rounded transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Patient
        </button>
      </div>

      {/* ── Search + Export Bar ─────────── */}
      <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-48 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <div className="flex items-center gap-2">
            <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
              className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-600">
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <div className="flex items-center gap-1 ml-1">
              {[
                { icon: Copy,            title: 'Copy' },
                { icon: FileSpreadsheet, title: 'Excel' },
                { icon: FileText,        title: 'CSV' },
                { icon: FileText,        title: 'PDF' },
                { icon: Printer,         title: 'Print' },
              ].map(({ icon: Icon, title }) => (
                <button key={title} title={title} className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded">
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Table ─────────────────────── */}
        <div className="overflow-x-auto">
          {isLoading ? <PageLoader /> : visits.length === 0 ? (
            <EmptyState
              icon={<Stethoscope className="w-8 h-8 text-gray-400" />}
              title="No OPD records found"
              action={<button onClick={() => setModal(true)} className="px-4 py-2 bg-[#00a8e8] text-white text-sm rounded hover:bg-[#0090c7]">+ Add Patient</button>}
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  {[
                    'OPD No', 'Patient Name', 'Case ID', 'Appointment Date',
                    'Generated By', 'Consultant', 'Reference', 'Symptoms',
                    'Is Antenatal', 'Previous Medical Issue', 'Action',
                  ].map(h => (
                    <th key={h} className={cn(
                      'px-4 py-3 font-semibold text-gray-700 whitespace-nowrap text-left',
                      h === 'Action' && 'text-right',
                    )}>
                      {h} {h !== 'Action' && <span className="text-gray-400 text-[10px] ml-0.5">▼</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visits.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50/50 group">
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailId(v.id)} className="text-[#00a8e8] hover:underline font-medium">
                        {v.opd_no}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{v.patient_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{v.case_id}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtDateTime(v.appointment_date)}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{v.generated_by ?? 'Super Admin (9001)'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {v.consultant_name
                        ? `${v.consultant_name} (${v.consultant_code ?? v.consultant_id})`
                        : v.consultant_id ? `Doctor #${v.consultant_id}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{v.reference ?? ''}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{v.symptoms ?? ''}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs', v.is_antenatal ? 'text-teal-600 font-medium' : 'text-gray-400')}>
                        {v.is_antenatal ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">{v.previous_medical_issue ?? ''}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button title="Print" className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded hover:bg-gray-50">
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button title="Prescription" className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded hover:bg-gray-50">
                          <Stethoscope className="w-3.5 h-3.5" />
                        </button>
                        <button title="Documents" className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded hover:bg-gray-50">
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDetailId(v.id)} title="Details"
                          className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded hover:bg-gray-50">
                          <List className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDetailId(v.id)} title="View"
                          className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded hover:bg-gray-50">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer ────────────────────── */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Records: 1 to {visits.length} of {total}</span>
          {total > perPage && (
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40">‹</button>
              <span className="px-3 py-1 border border-[#00a8e8] bg-[#00a8e8] text-white rounded text-xs">{page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={visits.length < perPage}
                className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40">›</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Patient Modal ───────────── */}
      <AddOPDModal
        open={modal}
        onClose={() => setModal(false)}
        onSuccess={() => { setModal(false); qc.invalidateQueries({ queryKey: ['opd'] }) }}
      />
    </div>
  )
}
