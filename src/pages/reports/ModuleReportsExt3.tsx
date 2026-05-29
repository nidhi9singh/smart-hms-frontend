// src/pages/reports/ModuleReportsExt3.tsx
// OT / Patient
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Search } from 'lucide-react'
import { modReportsApi } from '@/api/moduleReports'
import { cn } from '@/lib/utils'

const TIME_OPTIONS = [
  { value: '',             label: 'Select' },
  { value: 'today',        label: 'Today' },
  { value: 'yesterday',    label: 'Yesterday' },
  { value: 'last_7_days',  label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_month',   label: 'This Month' },
  { value: 'last_month',   label: 'Last Month' },
  { value: 'this_year',    label: 'This Year' },
]


// ════════════════════════════════════════════════════════════════
//  OT REPORTS
// ════════════════════════════════════════════════════════════════
export function OTReports() {
  return (
    <>
      <CardGrid title="OT" reports={[{ key: 'ot', label: 'OT Report' }]} active="ot" onChange={() => {}} />
      <OTReport />
    </>
  )
}

function OTReport() {
  const [f, setF] = useState({ time: '', doctor: '', category: '', operation: '' })
  const [submitted, setS] = useState(false)
  const { data: doctors    } = useQuery({ queryKey: ['mr-doctors'],    queryFn: () => modReportsApi.doctors().then(r => r.data) })
  const { data: categories } = useQuery({ queryKey: ['mr-op-cats'],    queryFn: () => modReportsApi.operationCategories().then(r => r.data) })
  const { data: operations } = useQuery({ queryKey: ['mr-operations'], queryFn: () => modReportsApi.operations().then(r => r.data) })

  const { data } = useQuery({
    queryKey: ['mr-ot', f, submitted],
    queryFn: () => modReportsApi.ot({
      time_duration: f.time || undefined,
      doctor_id:     f.doctor || undefined,
      category:      f.category || undefined,
      operation:     f.operation || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="OT Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Time Duration" required>
            <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Consultant Doctor">
            <select value={f.doctor} onChange={e => setF({ ...f, doctor: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(doctors?.data ?? []).map((d: any) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Operation Category">
            <select value={f.category} onChange={e => setF({ ...f, category: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(categories?.data ?? []).map((c: any) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Operation Name">
            <select value={f.operation} onChange={e => setF({ ...f, operation: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(operations?.data ?? []).map((o: any) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </Field>
          <div className="col-span-12 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">Patient Name</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Reference No</th>
              <th className="px-3 py-2">OPD No</th>
              <th className="px-3 py-2">IPD No</th>
              <th className="px-3 py-2">Consultant Doctor</th>
              <th className="px-3 py-2">Assistant Consultant 1</th>
              <th className="px-3 py-2">Operation Name</th>
              <th className="px-3 py-2">Operation Category</th>
              <th className="px-3 py-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={10} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-emerald-700">{r.patient_name || '—'}</td>
                  <td className="px-3 py-2">{r.date}</td>
                  <td className="px-3 py-2">{r.reference_no || '—'}</td>
                  <td className="px-3 py-2">{r.opd_no || '—'}</td>
                  <td className="px-3 py-2">{r.ipd_no || '—'}</td>
                  <td className="px-3 py-2">{r.consultant_doctor || '—'}</td>
                  <td className="px-3 py-2">{r.assistant_consultant || '—'}</td>
                  <td className="px-3 py-2">{r.operation_name}</td>
                  <td className="px-3 py-2">{r.operation_category || '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{r.result || ''}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </Panel>
  )
}


// ════════════════════════════════════════════════════════════════
//  PATIENT REPORTS  (Visit + Login Credential)
// ════════════════════════════════════════════════════════════════
type PatTab = 'visit' | 'credential'

export function PatientReports() {
  const [tab, setTab] = useState<PatTab>('visit')
  const REPORTS = [
    { key: 'visit',      label: 'Patient Visit Report' },
    { key: 'credential', label: 'Patient Login Credential' },
  ]
  return (
    <>
      <CardGrid title="Patient" reports={REPORTS as any} active={tab} onChange={(k) => setTab(k as PatTab)} />
      {tab === 'visit'      && <PatientVisitReport />}
      {tab === 'credential' && <PatientCredentialReport />}
    </>
  )
}

function PatientVisitReport() {
  const [pid, setPid] = useState('')
  const [submitted, setSubmitted] = useState<number | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['mr-patient-visit', submitted],
    queryFn:  () => modReportsApi.patientVisit(submitted!).then(r => r.data),
    enabled:  submitted != null,
  })
  const sections = data?.data?.sections ?? {}
  const patient  = data?.data?.patient
  const hasResult = submitted != null && !isLoading

  return (
    <Panel title="Patient Visit Report"
      filters={(
        <form onSubmit={(e) => { e.preventDefault(); if (pid) setSubmitted(Number(pid)) }}
              className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-4" label="Patient Id" required>
            <input required placeholder="Patient Id" value={pid}
              onChange={e => setPid(e.target.value)} className="input w-full"/>
          </Field>
          <div className="col-span-4">
            <button type="submit" className="btn btn-primary flex items-center justify-center gap-1.5 px-6">
              <Search size={14}/> Search
            </button>
          </div>
        </form>
      )}>
      {!hasResult ? null : !patient ? (
        <div className="px-5 py-6 text-center text-rose-500 text-sm">Patient not found</div>
      ) : (
        <div className="p-5 space-y-6">
          <PatientSummary p={patient} />
          <Section title="OPD Details" rows={sections.opd ?? []} columns={[
            ['opd_no','OPD No'], ['case_id','Case ID'], ['date','Date'],
            ['opd_checkup_id','OPD Checkup ID'], ['doctor_name','Doctor Name'],
            ['symptoms','Symptoms'], ['findings','Findings'],
          ]} />
          <Section title="IPD Details" rows={sections.ipd ?? []} columns={[
            ['ipd_no','IPD No'], ['case_id','Case ID'], ['date','Date'],
            ['doctor_name','Doctor Name'], ['symptoms','Symptoms'], ['findings','Findings'],
          ]} />
          <Section title="Pharmacy Details" rows={sections.pharmacy ?? []} columns={[
            ['bill_no','Bill No'], ['case_id','Case ID'], ['date','Date'],
            ['amount','Amount (₹)'], ['discount','Discount'], ['tax','Tax'],
            ['net_amount','Net Amount (₹)'], ['paid','Paid (₹)'],
            ['refund','Refund (₹)'], ['balance','Balance (₹)'],
          ]} money={['amount','discount','tax','net_amount','paid','refund','balance']} />
          <Section title="Pathology Details" rows={sections.pathology ?? []} columns={[
            ['bill_no','Bill No'], ['case_id','Case ID'], ['date','Date'],
            ['amount','Amount (₹)'], ['discount','Discount'], ['tax','Tax'],
            ['net_amount','Net Amount (₹)'], ['paid','Paid (₹)'], ['balance','Balance (₹)'],
          ]} money={['amount','discount','tax','net_amount','paid','balance']} />
          <Section title="Radiology Details" rows={sections.radiology ?? []} columns={[
            ['bill_no','Bill No'], ['case_id','Case ID'], ['date','Date'],
            ['amount','Amount (₹)'], ['discount','Discount'], ['tax','Tax'],
            ['net_amount','Net Amount (₹)'], ['paid','Paid (₹)'], ['balance','Balance (₹)'],
          ]} money={['amount','discount','tax','net_amount','paid','balance']} />
          <Section title="Blood Bank Issue Details" rows={sections.blood_issues ?? []} columns={[
            ['bill_no','Bill No'], ['case_id','Case ID'], ['issue_date','Issue Date'],
            ['donor_name','Donor Name'], ['bags','Bags'],
            ['amount','Amount (₹)'], ['discount','Discount'], ['tax','Tax'],
            ['net_amount','Net Amount (₹)'], ['paid','Paid (₹)'], ['balance','Balance (₹)'],
          ]} money={['amount','discount','tax','net_amount','paid','balance']} />
          <Section title="Blood Bank Component Details" rows={sections.component_issues ?? []} columns={[
            ['bill_no','Bill No'], ['case_id','Case ID'], ['issue_date','Issue Date'],
            ['donor_name','Donor Name'], ['component','Component'], ['bags','Bags'],
            ['amount','Amount (₹)'], ['discount','Discount'], ['tax','Tax'],
            ['net_amount','Net Amount (₹)'], ['paid','Paid (₹)'], ['balance','Balance (₹)'],
          ]} money={['amount','discount','tax','net_amount','paid','balance']} />
          <Section title="Ambulance Details" rows={sections.ambulance ?? []} columns={[
            ['bill_no','Bill No'], ['case_id','Case ID'], ['date','Date'],
            ['vehicle_number','Vehicle Number'],
            ['amount','Amount (₹)'], ['discount','Discount'], ['tax','Tax'],
            ['net_amount','Net Amount (₹)'], ['paid','Paid (₹)'], ['balance','Balance (₹)'],
          ]} money={['amount','discount','tax','net_amount','paid','balance']} />
        </div>
      )}
    </Panel>
  )
}

function PatientSummary({ p }: { p: any }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-emerald-50 rounded text-sm">
      <div><span className="text-gray-500 text-xs">ID:</span> <span className="text-emerald-700 font-medium">{p.id}</span></div>
      <div><span className="text-gray-500 text-xs">Name:</span> <span className="text-emerald-700 font-medium">{p.name}</span></div>
      <div><span className="text-gray-500 text-xs">Gender:</span> {p.gender}</div>
      <div><span className="text-gray-500 text-xs">Age:</span> {p.age_years}</div>
      <div><span className="text-gray-500 text-xs">Phone:</span> {p.phone || '—'}</div>
    </div>
  )
}

function Section({ title, rows, columns, money = [] }: {
  title: string
  rows: any[]
  columns: Array<[string, string]>
  money?: string[]
}) {
  const moneySet = new Set(money)
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">{title}</h3>
      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              {columns.map(([k, label]) => (
                <th key={k} className={cn('px-3 py-2', moneySet.has(k) && 'text-right')}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0
              ? <tr><td colSpan={columns.length} className="px-3 py-3 text-center text-gray-400 text-xs">No records</td></tr>
              : rows.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  {columns.map(([k]) => (
                    <td key={k} className={cn('px-3 py-2', moneySet.has(k) && 'text-right')}>
                      {moneySet.has(k)
                        ? Number(r[k] ?? 0).toFixed(2)
                        : (r[k] != null && r[k] !== '' ? String(r[k]) : '—')
                      }
                    </td>
                  ))}
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PatientCredentialReport() {
  const [f, setF] = useState({ time: '' })
  const [submitted, setS] = useState(false)
  const { data } = useQuery({
    queryKey: ['mr-patient-cred', f, submitted],
    queryFn: () => modReportsApi.patientCredential({ time_duration: f.time || undefined }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Patient Login Credential"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-4" label="Time Duration" required>
            <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <div className="col-span-8 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Patient Id</th>
            <th className="px-3 py-2">Patient Name</th>
            <th className="px-3 py-2">Username</th>
            <th className="px-3 py-2">Password</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={4} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-emerald-700">{r.patient_id || '—'}</td>
                <td className="px-3 py-2">{r.patient_name || '—'}</td>
                <td className="px-3 py-2">{r.username}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.password}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}


// ════════════════════════════════════════════════════════════════
//  Shared primitives
// ════════════════════════════════════════════════════════════════
function CardGrid({ title, reports, active, onChange }: {
  title: string
  reports: Array<{ key: string; label: string }>
  active: string
  onChange: (key: string) => void
}) {
  const cols = reports.length === 1 ? 'grid-cols-1' : 'grid-cols-3'
  return (
    <div className="card">
      <div className="px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      <div className={cn('p-5 grid gap-y-3 gap-x-6', cols)}>
        {reports.map(r => (
          <button key={r.key} onClick={() => onChange(r.key)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded text-sm text-left',
              active === r.key
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-50'
            )}>
            <FileText size={14} className="text-gray-400 shrink-0"/>
            {r.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Panel({ title, filters, children }: {
  title: string; filters: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="card">
      <div className="px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      {filters && <div className="px-5 py-4 border-b">{filters}</div>}
      <div>{children}</div>
    </div>
  )
}

function Field({ label, required, children, className }: {
  label: string; required?: boolean; children: React.ReactNode; className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function SearchBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="btn btn-primary flex items-center justify-center gap-1.5 px-6">
      <Search size={14}/> Search
    </button>
  )
}
