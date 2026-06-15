// src/pages/multi_branch/MultiBranchPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Plus, Edit2, X, FileText,
} from 'lucide-react'
import { multiBranchApi } from '@/api/multi_branch'
import AddBranchModal from './AddBranchModal'
import { cn } from '@/lib/utils'

type Tab = 'overview' | 'report' | 'setting'

const SECTIONS: { id: string; title: string; cols: { key: string; label: string }[] }[] = [
  { id: 'appointment', title: 'Appointment', cols: [
    { key: 'online_appointment',  label: 'Online Appointment' },
    { key: 'online_amount',       label: 'Online Amount (₹)' },
    { key: 'offline_appointment', label: 'Offline Appointment' },
    { key: 'offline_amount',      label: 'Offline Amount (₹)' },
    { key: 'total_appointments',  label: 'Total Appointments' },
    { key: 'total_amount',        label: 'Total Amount (₹)' },
  ]},
  { id: 'opd', title: 'OPD - Out Patient', cols: [
    { key: 'total_opd',     label: 'Total OPD' },
    { key: 'total_visit',   label: 'Total Visit' },
    { key: 'total_amount',  label: 'Total Amount (₹)' },
    { key: 'total_paid',    label: 'Total Paid' },
  ]},
  { id: 'ipd', title: 'IPD - In Patient', cols: [
    { key: 'patient_count', label: 'Patient Count' },
    { key: 'total_ipd',     label: 'Total IPD' },
    { key: 'total_amount',  label: 'Total Amount (₹)' },
    { key: 'total_paid',    label: 'Total Paid' },
  ]},
  { id: 'operation_theatre', title: 'Operation Theatre', cols: [
    { key: 'patient_count',  label: 'Patient Count' },
    { key: 'total_operation', label: 'Total Operation' },
  ]},
  { id: 'pharmacy', title: 'Pharmacy', cols: [
    { key: 'patient_count', label: 'Patient Count' },
    { key: 'total_amount',  label: 'Total Amount (₹)' },
    { key: 'total_paid',    label: 'Total Paid (₹)' },
    { key: 'total_refund',  label: 'Total Refund (₹)' },
  ]},
  { id: 'pathology', title: 'Pathology', cols: [
    { key: 'patient_count', label: 'Patient Count' },
    { key: 'total_amount',  label: 'Total Amount (₹)' },
    { key: 'total_paid',    label: 'Total Paid (₹)' },
  ]},
  { id: 'radiology', title: 'Radiology', cols: [
    { key: 'patient_count', label: 'Patient Count' },
    { key: 'total_amount',  label: 'Total Amount (₹)' },
    { key: 'total_paid',    label: 'Total Paid (₹)' },
  ]},
  { id: 'blood_donor', title: 'Blood Donor Transactions', cols: [
    { key: 'patient_count', label: 'Patient Count' },
    { key: 'total_amount',  label: 'Total Amount (₹)' },
    { key: 'total_paid',    label: 'Total Paid (₹)' },
  ]},
  { id: 'blood_issue', title: 'Blood Issue Transactions', cols: [
    { key: 'patient_count', label: 'Patient Count' },
    { key: 'total_amount',  label: 'Total Amount (₹)' },
    { key: 'total_paid',    label: 'Total Paid (₹)' },
  ]},
  { id: 'component_issue', title: 'Component Issue Transactions', cols: [
    { key: 'patient_count', label: 'Patient Count' },
    { key: 'total_amount',  label: 'Total Amount (₹)' },
    { key: 'total_paid',    label: 'Total Paid (₹)' },
  ]},
  { id: 'ambulance', title: 'Ambulance', cols: [
    { key: 'patient_count', label: 'Patient Count' },
    { key: 'total_amount',  label: 'Total Amount (₹)' },
    { key: 'total_paid',    label: 'Total Paid (₹)' },
  ]},
  { id: 'birth', title: 'Birth Record', cols: [
    { key: 'total_birth', label: 'Total Birth' },
  ]},
  { id: 'death', title: 'Death Record', cols: [
    { key: 'total_death', label: 'Total Death' },
  ]},
  { id: 'staff_attendance', title: 'Staff Attendance', cols: [
    { key: 'total_staff',   label: 'Total Staff' },
    { key: 'total_present', label: 'Total Present' },
    { key: 'total_absent',  label: 'Total Absent' },
  ]},
  { id: 'payroll', title: 'Payroll', cols: [
    { key: 'total_staff',         label: 'Total Staff' },
    { key: 'payroll_generated',   label: 'Payroll Generated' },
    { key: 'payroll_paid',        label: 'Payroll Paid' },
    { key: 'net_payroll_amount',  label: 'Net Payroll Amount (₹)' },
    { key: 'payroll_paid_amount', label: 'Payroll Paid (₹)' },
  ]},
  { id: 'transactions', title: 'Transactions', cols: [
    { key: 'patient_count', label: 'Patient Count' },
    { key: 'online_paid',   label: 'Online Paid (₹)' },
    { key: 'offline_paid',  label: 'Offline Paid (₹)' },
    { key: 'total_refund',  label: 'Total Refund (₹)' },
    { key: 'total',         label: 'Total (₹)' },
  ]},
]

const REPORTS: { id: string; label: string }[] = [
  { id: 'appointment',       label: 'Appointment Report' },
  { id: 'opd',               label: 'OPD Report' },
  { id: 'ipd',               label: 'IPD Report' },
  { id: 'ot',                label: 'OT Report' },
  { id: 'pharmacy',          label: 'Pharmacy Report' },
  { id: 'medicine_expiry',   label: 'Medicine Expiry Report' },
  { id: 'pathology',         label: 'Pathology Report' },
  { id: 'radiology',         label: 'Radiology Report' },
  { id: 'blood_issue',       label: 'Blood Issue Report' },
  { id: 'component_issue',   label: 'Component Issue Report' },
  { id: 'blood_donor',       label: 'Blood Donor Report' },
  { id: 'ambulance',         label: 'Ambulance Report' },
  { id: 'birth',             label: 'Birth Report' },
  { id: 'payroll',           label: 'Payroll Report' },
  { id: 'income',            label: 'Income Report' },
  { id: 'expense',           label: 'Expense Report' },
  { id: 'live_consultation', label: 'Live Consultation Report' },
  { id: 'transaction',       label: 'Transaction Report' },
  { id: 'death',             label: 'Death Report' },
]

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function MultiBranchPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')
  const [branchSearch, setBranchSearch] = useState('')
  const [branchModal, setBranchModal] = useState<{ open: boolean; branch?: any }>({ open: false })

  // Report tab state
  const [selectedReport, setSelectedReport] = useState<string>('appointment')
  const [fromDate,       setFromDate]       = useState<string>(todayISO())
  const [toDate,         setToDate]         = useState<string>(todayISO())
  const [appliedReport, setAppliedReport] = useState<{ id: string; from: string; to: string } | null>(null)

  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ['mb-report', appliedReport],
    queryFn:  () => multiBranchApi.report(appliedReport!.id, appliedReport!.from, appliedReport!.to).then(r => r.data),
    enabled:  !!appliedReport,
  })
  const report = reportData?.data

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['mb-stats'],
    queryFn:  () => multiBranchApi.stats().then(r => r.data),
    enabled:  tab === 'overview',
  })
  const stats: Record<string, any[]> = statsData?.data ?? {}

  const { data: branchData, isLoading: branchLoading } = useQuery({
    queryKey: ['mb-branches'],
    queryFn:  () => multiBranchApi.listBranches().then(r => r.data),
    enabled:  tab === 'setting',
  })
  const branches: any[] = branchData?.data ?? []
  const filtered = branchSearch
    ? branches.filter(b => b.name.toLowerCase().includes(branchSearch.toLowerCase()))
    : branches

  const delBranch = useMutation({
    mutationFn: (id: number) => multiBranchApi.deleteBranch(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['mb-branches'] }),
  })

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Multi Branch</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview, reports and branch configuration</p>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'report',   label: 'Report'   },
            { id: 'setting',  label: 'Setting'  },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)}
              className={cn('px-4 py-2.5 text-sm border-b-2 -mb-px',
                tab === t.id ? 'border-brand-600 text-brand-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-5">
          {statsLoading && <div className="text-center py-12 text-gray-400">Loading…</div>}
          {!statsLoading && SECTIONS.map(section => {
            const rows = stats[section.id] ?? []
            return (
              <div key={section.id} className="card p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-800">{section.title}</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 text-xs text-gray-500">
                        <th className="px-4 py-2 text-left font-medium">Branch</th>
                        {section.cols.map(c => (
                          <th key={c.key} className="px-4 py-2 text-right font-medium whitespace-nowrap">{c.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rows.length === 0
                        ? <tr><td colSpan={section.cols.length + 1} className="px-4 py-4 text-center text-gray-400 text-xs">No data</td></tr>
                        : rows.map((r, idx) => (
                          <tr key={`${section.id}-${idx}`} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2 text-xs">{r.branch_name}</td>
                            {section.cols.map(c => (
                              <td key={c.key} className="px-4 py-2 text-right text-xs">
                                {typeof r[c.key] === 'number'
                                  ? (Number.isInteger(r[c.key]) ? r[c.key] : Number(r[c.key]).toFixed(2))
                                  : (r[c.key] ?? '—')}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* REPORT */}
      {tab === 'report' && (
        <div className="space-y-5">
          {/* Tile grid */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Report</h2>
            </div>
            <div className="grid grid-cols-3 gap-0">
              {REPORTS.map(r => {
                const isSelected = selectedReport === r.id
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReport(r.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 text-left border-b border-r border-gray-100 transition',
                      isSelected ? 'bg-gray-200 font-medium' : 'hover:bg-gray-50'
                    )}
                  >
                    <FileText size={13} className="text-gray-500 flex-shrink-0"/>
                    <span className="text-sm text-brand-700">{r.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date filter for the selected report */}
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">
                {REPORTS.find(r => r.id === selectedReport)?.label}
              </h2>
            </div>
            <form
              onSubmit={e => { e.preventDefault(); setAppliedReport({ id: selectedReport, from: fromDate, to: toDate }) }}
              className="p-4 grid grid-cols-12 gap-3 items-end"
            >
              <div className="col-span-4">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  From Date<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input type="date" className="input bg-gray-50" value={fromDate} onChange={e => setFromDate(e.target.value)} required />
              </div>
              <div className="col-span-4">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  To Date<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input type="date" className="input bg-gray-50" value={toDate} onChange={e => setToDate(e.target.value)} required />
              </div>
              <div className="col-span-4 flex justify-end">
                <button type="submit" disabled={reportLoading}
                  className="btn btn-primary flex items-center gap-1.5">
                  <Search size={13}/>{reportLoading ? 'Searching…' : 'Search'}
                </button>
              </div>
            </form>
          </div>

          {/* Results */}
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-xs text-gray-500">
                  <th className="px-4 py-3 text-left font-medium">Branch</th>
                  {report?.extra_label && <th className="px-4 py-3 text-left font-medium">{report.extra_label}</th>}
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">{report?.value_label ?? 'Value'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!appliedReport ? (
                  <tr><td colSpan={report?.extra_label ? 4 : 3} className="px-4 py-12 text-center text-gray-400 text-xs">
                    Select date range and click Search
                  </td></tr>
                ) : reportLoading ? (
                  <tr><td colSpan={report?.extra_label ? 4 : 3} className="px-4 py-12 text-center text-gray-400 text-xs">Loading…</td></tr>
                ) : !report?.rows?.length ? (
                  <tr><td colSpan={report?.extra_label ? 4 : 3} className="px-4 py-12 text-center">
                    <div className="text-rose-400 text-xs mb-2">No data available in table</div>
                    <div className="text-brand-600 text-xs">← Add new record or search with different criteria.</div>
                  </td></tr>
                ) : report.rows.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs">{row.branch}</td>
                    {report.extra_label && <td className="px-4 py-3 text-xs">{row.extra || '—'}</td>}
                    <td className="px-4 py-3 text-xs text-gray-500">{row.date}</td>
                    <td className="px-4 py-3 text-right text-xs">
                      {report.value_type === 'currency'
                        ? `₹${Number(row.value).toFixed(2)}`
                        : Number(row.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SETTING */}
      {tab === 'setting' && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Setting</h2>
            <button onClick={() => setBranchModal({ open: true })} className="btn btn-primary text-sm flex items-center gap-1.5">
              <Plus size={13}/> Add New Branch
            </button>
          </div>
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input className="input pl-8 h-9 text-sm" placeholder="Search..." value={branchSearch} onChange={e => setBranchSearch(e.target.value)} />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Branch','URL','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {branchLoading ? <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No branches</td></tr>
              : filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-brand-600 font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-brand-600">{b.url || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="icon-btn" onClick={() => setBranchModal({ open: true, branch: b })}><Edit2 size={12}/></button>
                      <button className="icon-btn text-red-400" onClick={() => confirm(`Delete ${b.name}?`) && delBranch.mutate(b.id)}><X size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">Records: 1 to {filtered.length} of {branches.length}</div>
        </div>
      )}

      <AddBranchModal
        open={branchModal.open} branch={branchModal.branch}
        onClose={() => setBranchModal({ open: false })}
        onSuccess={() => { setBranchModal({ open: false }); qc.invalidateQueries({ queryKey: ['mb-branches'] }) }}
      />
    </div>
  )
}
