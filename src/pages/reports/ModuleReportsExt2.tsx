// src/pages/reports/ModuleReportsExt2.tsx
// Ambulance / Birth-Death / HR / TPA / Inventory / Live Consultation / Log
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Search, Trash2 } from 'lucide-react'
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
const GENDER_OPTIONS = ['Male', 'Female', 'Other']
const MONTHS = [
  { v: 1, l: 'January' }, { v: 2, l: 'February' }, { v: 3, l: 'March' },
  { v: 4, l: 'April' },   { v: 5, l: 'May' },      { v: 6, l: 'June' },
  { v: 7, l: 'July' },    { v: 8, l: 'August' },   { v: 9, l: 'September' },
  { v: 10, l: 'October' },{ v: 11, l: 'November' },{ v: 12, l: 'December' },
]
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]


// ════════════════════════════════════════════════════════════════
//  AMBULANCE
// ════════════════════════════════════════════════════════════════
export function AmbulanceReports() {
  return (
    <>
      <CardGrid title="Ambulance" reports={[{ key: 'ambulance', label: 'Ambulance Report' }]} active="ambulance" onChange={() => {}} />
      <AmbulanceReport />
    </>
  )
}

function AmbulanceReport() {
  const [f, setF] = useState({ time: '', collected_by: '', vehicle: '' })
  const [submitted, setS] = useState(false)
  const { data: users    } = useQuery({ queryKey: ['mr-users'],    queryFn: () => modReportsApi.users().then(r => r.data) })
  const { data: vehicles } = useQuery({ queryKey: ['mr-vehicles'], queryFn: () => modReportsApi.vehicles().then(r => r.data) })

  const { data } = useQuery({
    queryKey: ['mr-amb', f, submitted],
    queryFn: () => modReportsApi.ambulance({
      time_duration: f.time || undefined,
      collected_by:  f.collected_by || undefined,
      vehicle_id:    f.vehicle || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Ambulance Call Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Time Duration" required>
            <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Collected By">
            <select value={f.collected_by} onChange={e => setF({ ...f, collected_by: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(users?.data ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Vehicle Model">
            <select value={f.vehicle} onChange={e => setF({ ...f, vehicle: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(vehicles?.data ?? []).map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <div className="col-span-3 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">Ambulance Call No</th>
              <th className="px-3 py-2">Patient Name</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Contact No</th>
              <th className="px-3 py-2">Vehicle Number</th>
              <th className="px-3 py-2">Vehicle Model</th>
              <th className="px-3 py-2">Driver Name</th>
              <th className="px-3 py-2">Address</th>
              <th className="px-3 py-2 text-right">Amount (₹)</th>
              <th className="px-3 py-2 text-right">Discount</th>
              <th className="px-3 py-2 text-right">Tax</th>
              <th className="px-3 py-2 text-right">Net (₹)</th>
              <th className="px-3 py-2 text-right">Paid (₹)</th>
              <th className="px-3 py-2 text-right">Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={14} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-brand-700">{r.ambulance_call_no}</td>
                  <td className="px-3 py-2">{r.patient_name || '—'}</td>
                  <td className="px-3 py-2">{r.date}</td>
                  <td className="px-3 py-2">{r.contact_no || '—'}</td>
                  <td className="px-3 py-2">{r.vehicle_number || '—'}</td>
                  <td className="px-3 py-2">{r.vehicle_model || '—'}</td>
                  <td className="px-3 py-2">{r.driver_name || '—'}</td>
                  <td className="px-3 py-2">{r.address || '—'}</td>
                  <td className="px-3 py-2 text-right">{Number(r.amount || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.discount || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.tax || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.net_amount || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.paid || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{Number(r.balance || 0).toFixed(2)}</td>
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
//  BIRTH / DEATH
// ════════════════════════════════════════════════════════════════
type BdTab = 'birth' | 'death'

export function BirthDeathReports() {
  const [tab, setTab] = useState<BdTab>('birth')
  return (
    <>
      <div className="card">
        <div className="px-5 py-3 border-b">
          <h2 className="text-base font-semibold text-gray-800">Birth Death Report</h2>
        </div>
        <div className="p-5 grid grid-cols-3 gap-y-3 gap-x-6">
          {[
            { key: 'birth', label: 'Birth Report' },
            { key: 'death', label: 'Death Report' },
          ].map(r => (
            <button key={r.key} onClick={() => setTab(r.key as BdTab)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded text-sm text-left',
                tab === r.key ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
              )}>
              <FileText size={14} className="text-gray-400 shrink-0"/>{r.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'birth' && <BirthReport />}
      {tab === 'death' && <DeathReport />}
    </>
  )
}

function BirthReport() {
  const [f, setF] = useState({ time: '', gender: '' })
  const [submitted, setS] = useState(false)
  const { data } = useQuery({
    queryKey: ['mr-birth', f, submitted],
    queryFn: () => modReportsApi.birth({ time_duration: f.time || undefined, gender: f.gender || undefined }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Birth Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Time Duration" required>
            <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Gender">
            <select value={f.gender} onChange={e => setF({ ...f, gender: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <div className="col-span-6 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Reference No</th>
            <th className="px-3 py-2">Case ID</th>
            <th className="px-3 py-2">Child Name</th>
            <th className="px-3 py-2">Gender</th>
            <th className="px-3 py-2">Birth Date</th>
            <th className="px-3 py-2">Weight</th>
            <th className="px-3 py-2">Mother Name</th>
            <th className="px-3 py-2">Father Name</th>
            <th className="px-3 py-2">Report</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={9} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-brand-700">{r.reference_no}</td>
                <td className="px-3 py-2">{r.case_id || '—'}</td>
                <td className="px-3 py-2">{r.child_name || '—'}</td>
                <td className="px-3 py-2">{r.gender}</td>
                <td className="px-3 py-2">{r.birth_date}</td>
                <td className="px-3 py-2">{r.weight ?? '—'}</td>
                <td className="px-3 py-2">{r.mother_name || '—'}</td>
                <td className="px-3 py-2">{r.father_name || '—'}</td>
                <td className="px-3 py-2">{r.report || '—'}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}

function DeathReport() {
  const [f, setF] = useState({ time: '', gender: '' })
  const [submitted, setS] = useState(false)
  const { data } = useQuery({
    queryKey: ['mr-death', f, submitted],
    queryFn: () => modReportsApi.death({ time_duration: f.time || undefined, gender: f.gender || undefined }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Death Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Time Duration" required>
            <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Gender">
            <select value={f.gender} onChange={e => setF({ ...f, gender: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <div className="col-span-6 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Reference No</th>
            <th className="px-3 py-2">Case ID</th>
            <th className="px-3 py-2">Guardian Name</th>
            <th className="px-3 py-2">Death Date</th>
            <th className="px-3 py-2">Patient Name</th>
            <th className="px-3 py-2">Gender</th>
            <th className="px-3 py-2">Report</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={7} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-brand-700">{r.reference_no}</td>
                <td className="px-3 py-2">{r.case_id || '—'}</td>
                <td className="px-3 py-2">{r.guardian_name || '—'}</td>
                <td className="px-3 py-2">{r.death_date}</td>
                <td className="px-3 py-2">{r.patient_name || '—'}</td>
                <td className="px-3 py-2">{r.gender || '—'}</td>
                <td className="px-3 py-2 text-xs text-gray-600">{r.report || ''}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}


// ════════════════════════════════════════════════════════════════
//  HUMAN RESOURCE  (4 reports)
// ════════════════════════════════════════════════════════════════
type HrTab = 'payroll' | 'payroll-month' | 'attendance' | 'attendance-day'

export function HRReports() {
  const [tab, setTab] = useState<HrTab>('payroll')
  const REPORTS = [
    { key: 'payroll',        label: 'Payroll Report' },
    { key: 'payroll-month',  label: 'Payroll Month Report' },
    { key: 'attendance',     label: 'Staff Attendance Report' },
    { key: 'attendance-day', label: 'Staff Day Wise Attendance Report' },
  ]
  return (
    <>
      <CardGrid title="Human Resource" reports={REPORTS as any} active={tab} onChange={(k) => setTab(k as HrTab)} />
      {tab === 'payroll'        && <PayrollReport />}
      {tab === 'payroll-month'  && <PayrollMonthReport />}
      {tab === 'attendance'     && <StaffAttendanceReport />}
      {tab === 'attendance-day' && <StaffDayAttendanceReport />}
    </>
  )
}

function PayrollReport() {
  const [f, setF] = useState({ time: '' })
  const [submitted, setS] = useState(false)
  const { data } = useQuery({
    queryKey: ['mr-payroll', f, submitted],
    queryFn: () => modReportsApi.hrPayroll({ time_duration: f.time || undefined }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Payroll Report"
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Designation</th>
              <th className="px-3 py-2">Month</th>
              <th className="px-3 py-2">Year</th>
              <th className="px-3 py-2">Payment Date</th>
              <th className="px-3 py-2">Payslip #</th>
              <th className="px-3 py-2 text-right">Basic Salary (₹)</th>
              <th className="px-3 py-2 text-right">Earning (₹)</th>
              <th className="px-3 py-2 text-right">Deduction (₹)</th>
              <th className="px-3 py-2 text-right">Gross (₹)</th>
              <th className="px-3 py-2 text-right">Tax (₹)</th>
              <th className="px-3 py-2 text-right">Net (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={13} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-brand-700">{r.name || '—'}</td>
                  <td className="px-3 py-2">{r.role || '—'}</td>
                  <td className="px-3 py-2">{r.designation || '—'}</td>
                  <td className="px-3 py-2">{r.month}</td>
                  <td className="px-3 py-2">{r.year}</td>
                  <td className="px-3 py-2">{r.payment_date || '—'}</td>
                  <td className="px-3 py-2">{r.payslip_no}</td>
                  <td className="px-3 py-2 text-right">{Number(r.basic_salary || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.earning || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.deduction || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.gross_salary || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.tax || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{Number(r.net_salary || 0).toFixed(2)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function PayrollMonthReport() {
  const [f, setF] = useState({ role: '', month: '', year: String(CURRENT_YEAR) })
  const [submitted, setS] = useState(false)
  const { data } = useQuery({
    queryKey: ['mr-payroll-month', f, submitted],
    queryFn: () => modReportsApi.hrPayrollMonth({
      role: f.role || undefined,
      month: f.month || undefined,
      year: Number(f.year),
    }).then(r => r.data),
    enabled: submitted && !!f.year,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Payroll Month Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Role">
            <select value={f.role} onChange={e => setF({ ...f, role: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {['doctor','nurse','admin','accountant','receptionist','pharmacist'].map(r =>
                <option key={r} value={r}>{r}</option>
              )}
            </select>
          </Field>
          <Field className="col-span-3" label="Month">
            <select value={f.month} onChange={e => setF({ ...f, month: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Year" required>
            <select required value={f.year} onChange={e => setF({ ...f, year: e.target.value })} className="input w-full">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
          <div className="col-span-3 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Designation</th>
              <th className="px-3 py-2">Month</th>
              <th className="px-3 py-2">Year</th>
              <th className="px-3 py-2">Payment Date</th>
              <th className="px-3 py-2">Payslip #</th>
              <th className="px-3 py-2 text-right">Basic (₹)</th>
              <th className="px-3 py-2 text-right">Earning</th>
              <th className="px-3 py-2 text-right">Deduction</th>
              <th className="px-3 py-2 text-right">Gross</th>
              <th className="px-3 py-2 text-right">Net (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={12} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-brand-700">{r.name || '—'}</td>
                  <td className="px-3 py-2">{r.role || '—'}</td>
                  <td className="px-3 py-2">{r.designation || '—'}</td>
                  <td className="px-3 py-2">{r.month}</td>
                  <td className="px-3 py-2">{r.year}</td>
                  <td className="px-3 py-2">{r.payment_date || '—'}</td>
                  <td className="px-3 py-2">{r.payslip_no}</td>
                  <td className="px-3 py-2 text-right">{Number(r.basic_salary || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.earning || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.deduction || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.gross_salary || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{Number(r.net_salary || 0).toFixed(2)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function StaffAttendanceReport() {
  const today = new Date()
  const [f, setF] = useState({ role: '', month: String(today.getMonth() + 1), year: String(today.getFullYear()) })
  const [submitted, setS] = useState(false)
  const { data } = useQuery({
    queryKey: ['mr-attendance', f, submitted],
    queryFn: () => modReportsApi.hrAttendance({
      role: f.role || undefined,
      month: Number(f.month),
      year:  Number(f.year),
    }).then(r => r.data),
    enabled: submitted && !!f.month,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Staff Attendance Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Role">
            <select value={f.role} onChange={e => setF({ ...f, role: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {['doctor','nurse','admin','accountant','receptionist','pharmacist'].map(r =>
                <option key={r} value={r}>{r}</option>
              )}
            </select>
          </Field>
          <Field className="col-span-3" label="Month" required>
            <select required value={f.month} onChange={e => setF({ ...f, month: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {MONTHS.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Year">
            <select value={f.year} onChange={e => setF({ ...f, year: e.target.value })} className="input w-full">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
          <div className="col-span-3 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Staff ID</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Designation</th>
            <th className="px-3 py-2 text-right">Present</th>
            <th className="px-3 py-2 text-right">Absent</th>
            <th className="px-3 py-2 text-right">Late</th>
            <th className="px-3 py-2 text-right">Half Day</th>
            <th className="px-3 py-2 text-right">Holiday</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={9} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{r.staff_id}</td>
                <td className="px-3 py-2 text-brand-700">{r.name || '—'}</td>
                <td className="px-3 py-2">{r.role || '—'}</td>
                <td className="px-3 py-2">{r.designation || '—'}</td>
                <td className="px-3 py-2 text-right text-brand-700">{r.present}</td>
                <td className="px-3 py-2 text-right text-rose-600">{r.absent}</td>
                <td className="px-3 py-2 text-right">{r.late}</td>
                <td className="px-3 py-2 text-right">{r.half_day}</td>
                <td className="px-3 py-2 text-right">{r.holiday}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}

function StaffDayAttendanceReport() {
  const today = new Date().toISOString().slice(0, 10)
  const [f, setF] = useState({ role: '', date: today, source: '' })
  const [submitted, setS] = useState(false)
  const [search, setSearch] = useState('')
  const { data } = useQuery({
    queryKey: ['mr-att-day', f, submitted],
    queryFn: () => modReportsApi.hrAttendanceDay({
      role:   f.role || undefined,
      date:   f.date,
      source: f.source || undefined,
    }).then(r => r.data),
    enabled: submitted && !!f.date,
  })
  const items: any[] = data?.data?.items ?? []
  const filtered = search ? items.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase())) : items
  return (
    <Panel title="Staff Day Wise Attendance Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Role">
            <select value={f.role} onChange={e => setF({ ...f, role: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {['doctor','nurse','admin','accountant','receptionist','pharmacist'].map(r =>
                <option key={r} value={r}>{r}</option>
              )}
            </select>
          </Field>
          <Field className="col-span-3" label="Date" required>
            <input type="date" required value={f.date} onChange={e => setF({ ...f, date: e.target.value })} className="input w-full"/>
          </Field>
          <Field className="col-span-3" label="Source">
            <select value={f.source} onChange={e => setF({ ...f, source: e.target.value })} className="input w-full">
              <option value="">Select</option>
              <option value="Manual">Manual</option>
              <option value="QR">QR</option>
              <option value="Biometric">Biometric</option>
            </select>
          </Field>
          <div className="col-span-3 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <div className="px-5 pt-3 pb-1">
        <div className="relative max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search…" className="input pl-8 w-full"/>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Staff ID</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Attendance</th>
            <th className="px-3 py-2">Source</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0
            ? <tr><td colSpan={6} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : filtered.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{r.row_no}</td>
                <td className="px-3 py-2">{r.staff_id}</td>
                <td className="px-3 py-2">{r.role}</td>
                <td className="px-3 py-2 text-brand-700">{r.name}</td>
                <td className="px-3 py-2">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs',
                    r.attendance === 'Present' ? 'bg-brand-50 text-brand-700' :
                    r.attendance === 'Absent'  ? 'bg-rose-50 text-rose-600' :
                    'bg-amber-50 text-amber-700'
                  )}>{r.attendance}</span>
                </td>
                <td className="px-3 py-2">{r.source}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}


// ════════════════════════════════════════════════════════════════
//  TPA
// ════════════════════════════════════════════════════════════════
export function TPAReports() {
  return (
    <>
      <CardGrid title="TPA" reports={[{ key: 'tpa', label: 'TPA Report' }]} active="tpa" onChange={() => {}} />
      <TpaReport />
    </>
  )
}

function TpaReport() {
  const [f, setF] = useState({ time: '', doctor: '', tpa: '', case_id: '' })
  const [submitted, setS] = useState(false)
  const { data: doctors } = useQuery({ queryKey: ['mr-doctors'], queryFn: () => modReportsApi.doctors().then(r => r.data) })
  const { data: tpas }    = useQuery({ queryKey: ['mr-tpas'],    queryFn: () => modReportsApi.tpas().then(r => r.data) })

  const { data } = useQuery({
    queryKey: ['mr-tpa', f, submitted],
    queryFn: () => modReportsApi.tpa({
      time_duration: f.time || undefined,
      doctor_id:     f.doctor || undefined,
      tpa_id:        f.tpa || undefined,
      case_id:       f.case_id || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="TPA Report"
      filters={(
        <>
          <div className="grid grid-cols-12 gap-3 items-end">
            <Field className="col-span-3" label="Time Duration">
              <select value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
                {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Doctor">
              <select value={f.doctor} onChange={e => setF({ ...f, doctor: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {(doctors?.data ?? []).map((d: any) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="TPA">
              <select value={f.tpa} onChange={e => setF({ ...f, tpa: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {(tpas?.data ?? []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Case ID">
              <input value={f.case_id} onChange={e => setF({ ...f, case_id: e.target.value })} className="input w-full" placeholder="Case ID"/>
            </Field>
          </div>
          <div className="flex justify-end mt-3"><SearchBtn onClick={() => setS(true)}/></div>
        </>
      )}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">Checkup / IPD No</th>
              <th className="px-3 py-2">Case ID</th>
              <th className="px-3 py-2">Head</th>
              <th className="px-3 py-2">TPA ID</th>
              <th className="px-3 py-2">TPA Name</th>
              <th className="px-3 py-2">Patient Name</th>
              <th className="px-3 py-2">Appointment Date</th>
              <th className="px-3 py-2">Doctor</th>
              <th className="px-3 py-2">Charge Name</th>
              <th className="px-3 py-2">Charge Category</th>
              <th className="px-3 py-2">Charge Type</th>
              <th className="px-3 py-2 text-right">Standard (₹)</th>
              <th className="px-3 py-2 text-right">Applied (₹)</th>
              <th className="px-3 py-2 text-right">TPA Charge (₹)</th>
              <th className="px-3 py-2 text-right">Tax</th>
              <th className="px-3 py-2 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={16} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-brand-700">{r.checkup_ipd_no || '—'}</td>
                  <td className="px-3 py-2">{r.case_id || '—'}</td>
                  <td className="px-3 py-2">{r.head}</td>
                  <td className="px-3 py-2">{r.tpa_id || '—'}</td>
                  <td className="px-3 py-2">{r.tpa_name || '—'}</td>
                  <td className="px-3 py-2">{r.patient_name || '—'}</td>
                  <td className="px-3 py-2">{r.appointment_date}</td>
                  <td className="px-3 py-2">{r.doctor || '—'}</td>
                  <td className="px-3 py-2">{r.charge_name || '—'}</td>
                  <td className="px-3 py-2">{r.charge_category || '—'}</td>
                  <td className="px-3 py-2">{r.charge_type || '—'}</td>
                  <td className="px-3 py-2 text-right">{Number(r.standard_charge || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.applied_charge || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.tpa_charge || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.tax || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{Number(r.amount || 0).toFixed(2)}</td>
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
//  INVENTORY  (Stock / Item / Issue)
// ════════════════════════════════════════════════════════════════
type InvTab = 'stock' | 'item' | 'issue'

export function InventoryReports() {
  const [tab, setTab] = useState<InvTab>('stock')
  const REPORTS = [
    { key: 'stock', label: 'Inventory Stock Report' },
    { key: 'item',  label: 'Inventory Item Report' },
    { key: 'issue', label: 'Inventory issue Report' },
  ]
  return (
    <>
      <CardGrid title="Inventory" reports={REPORTS as any} active={tab} onChange={(k) => setTab(k as InvTab)} />
      {tab === 'stock' && <InventoryStockReport />}
      {tab === 'item'  && <InventoryItemReport />}
      {tab === 'issue' && <InventoryIssueReport />}
    </>
  )
}

function InventoryStockReport() {
  const [f, setF] = useState({ time: '' })
  const [submitted, setS] = useState(false)
  const { data } = useQuery({
    queryKey: ['mr-inv-stock', f, submitted],
    queryFn: () => modReportsApi.inventoryStock({ time_duration: f.time || undefined }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Inventory Stock Report"
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
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Supplier</th>
            <th className="px-3 py-2">Store</th>
            <th className="px-3 py-2 text-right">Total Quantity</th>
            <th className="px-3 py-2 text-right">Total Issued</th>
            <th className="px-3 py-2 text-right">Available Quantity</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={7} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-brand-700">{r.name}</td>
                <td className="px-3 py-2">{r.category || '—'}</td>
                <td className="px-3 py-2">{r.supplier || '—'}</td>
                <td className="px-3 py-2">{r.store || '—'}</td>
                <td className="px-3 py-2 text-right">{r.total_quantity}</td>
                <td className="px-3 py-2 text-right">{r.total_issued}</td>
                <td className="px-3 py-2 text-right font-semibold">{r.available_quantity}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}

function InventoryItemReport() {
  const [f, setF] = useState({ time: '' })
  const [submitted, setS] = useState(false)
  const { data } = useQuery({
    queryKey: ['mr-inv-item', f, submitted],
    queryFn: () => modReportsApi.inventoryItem({ time_duration: f.time || undefined }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Inventory Item Report"
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
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Supplier</th>
            <th className="px-3 py-2">Store</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2 text-right">Quantity</th>
            <th className="px-3 py-2 text-right">Purchase Price (₹)</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={7} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-brand-700">{r.name || '—'}</td>
                <td className="px-3 py-2">{r.category || '—'}</td>
                <td className="px-3 py-2">{r.supplier || '—'}</td>
                <td className="px-3 py-2">{r.store || '—'}</td>
                <td className="px-3 py-2">{r.date || '—'}</td>
                <td className="px-3 py-2 text-right">{r.quantity}</td>
                <td className="px-3 py-2 text-right">{Number(r.purchase_price || 0).toFixed(2)}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}

function InventoryIssueReport() {
  const [f, setF] = useState({ time: '' })
  const [submitted, setS] = useState(false)
  const { data } = useQuery({
    queryKey: ['mr-inv-issue', f, submitted],
    queryFn: () => modReportsApi.inventoryIssue({ time_duration: f.time || undefined }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Inventory Issue Report"
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
            <th className="px-3 py-2">Item</th>
            <th className="px-3 py-2">Item Category</th>
            <th className="px-3 py-2">Issue - Return</th>
            <th className="px-3 py-2">Issue To</th>
            <th className="px-3 py-2">Issued By</th>
            <th className="px-3 py-2 text-right">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={6} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-brand-700">{r.item || '—'}</td>
                <td className="px-3 py-2">{r.item_category || '—'}</td>
                <td className="px-3 py-2">{r.issue_return}</td>
                <td className="px-3 py-2">{r.issue_to || '—'}</td>
                <td className="px-3 py-2">{r.issued_by || '—'}</td>
                <td className="px-3 py-2 text-right">{r.quantity}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}


// ════════════════════════════════════════════════════════════════
//  LIVE CONSULTATION (2 reports)
// ════════════════════════════════════════════════════════════════
type LiveTab = 'live-consultation' | 'live-meeting'

export function LiveConsultationReports() {
  const [tab, setTab] = useState<LiveTab>('live-consultation')
  const REPORTS = [
    { key: 'live-consultation', label: 'Live Consultation Report' },
    { key: 'live-meeting',      label: 'Live Meeting Report' },
  ]
  return (
    <>
      <CardGrid title="Live Consultation" reports={REPORTS as any} active={tab} onChange={(k) => setTab(k as LiveTab)} />
      {tab === 'live-consultation' && <LiveConsultationReport />}
      {tab === 'live-meeting'      && <LiveMeetingReport />}
    </>
  )
}

function LiveConsultationReport() {
  const [f, setF] = useState({ time: '', created_by: '', opd_ipd: '' })
  const [submitted, setS] = useState(false)
  const { data: users } = useQuery({ queryKey: ['mr-users'], queryFn: () => modReportsApi.users().then(r => r.data) })
  const { data } = useQuery({
    queryKey: ['mr-live-cons', f, submitted],
    queryFn: () => modReportsApi.liveConsultation({
      time_duration: f.time || undefined,
      created_by:    f.created_by || undefined,
      opd_ipd:       f.opd_ipd || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Live Consultation Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Time Duration">
            <select value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Created By">
            <select value={f.created_by} onChange={e => setF({ ...f, created_by: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(users?.data ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="OPD / IPD">
            <select value={f.opd_ipd} onChange={e => setF({ ...f, opd_ipd: e.target.value })} className="input w-full">
              <option value="">Select</option>
              <option value="opd">OPD</option>
              <option value="ipd">IPD</option>
            </select>
          </Field>
          <div className="col-span-3 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Module</th>
            <th className="px-3 py-2">Consultation Title</th>
            <th className="px-3 py-2">Patient</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Api Used</th>
            <th className="px-3 py-2">Created By</th>
            <th className="px-3 py-2 text-right">Total Join</th>
            <th className="px-3 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={8} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{r.module}</td>
                <td className="px-3 py-2 text-brand-700">{r.consultation_title}</td>
                <td className="px-3 py-2">{r.patient || '—'}</td>
                <td className="px-3 py-2">{r.date}</td>
                <td className="px-3 py-2">{r.api_used}</td>
                <td className="px-3 py-2">{r.created_by || '—'}</td>
                <td className="px-3 py-2 text-right">{r.total_join}</td>
                <td className="px-3 py-2">
                  {r.meeting_link && (
                    <a href={r.meeting_link} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline text-xs">Open</a>
                  )}
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}

function LiveMeetingReport() {
  const [f, setF] = useState({ time: '', created_by: '' })
  const [submitted, setS] = useState(false)
  const { data: users } = useQuery({ queryKey: ['mr-users'], queryFn: () => modReportsApi.users().then(r => r.data) })
  const { data } = useQuery({
    queryKey: ['mr-live-meet', f, submitted],
    queryFn: () => modReportsApi.liveMeeting({
      time_duration: f.time || undefined,
      created_by:    f.created_by || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Live Meeting Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-4" label="Time Duration">
            <select value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-4" label="Created By">
            <select value={f.created_by} onChange={e => setF({ ...f, created_by: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(users?.data ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <div className="col-span-4 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Meeting Title</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Api Used</th>
            <th className="px-3 py-2">Created By</th>
            <th className="px-3 py-2 text-right">Total Join</th>
            <th className="px-3 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={6} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-brand-700">{r.meeting_title}</td>
                <td className="px-3 py-2">{r.date}</td>
                <td className="px-3 py-2">{r.api_used}</td>
                <td className="px-3 py-2">{r.created_by || '—'}</td>
                <td className="px-3 py-2 text-right">{r.total_join}</td>
                <td className="px-3 py-2">
                  {r.meeting_link && (
                    <a href={r.meeting_link} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline text-xs">Open</a>
                  )}
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}


// ════════════════════════════════════════════════════════════════
//  LOG (User / Email-SMS / Audit Trail)
// ════════════════════════════════════════════════════════════════
type LogTab = 'user' | 'email-sms' | 'audit'

export function LogReports() {
  const [tab, setTab] = useState<LogTab>('user')
  const REPORTS = [
    { key: 'user',      label: 'User Log' },
    { key: 'email-sms', label: 'Email / SMS Log' },
    { key: 'audit',     label: 'Audit Trail Report' },
  ]
  return (
    <>
      <CardGrid title="Log" reports={REPORTS as any} active={tab} onChange={(k) => setTab(k as LogTab)} />
      {tab === 'user'      && <UserLogReport />}
      {tab === 'email-sms' && <EmailSmsLogReport />}
      {tab === 'audit'     && <AuditTrailReport />}
    </>
  )
}

function UserLogReport() {
  const [f, setF] = useState({ time: '', role: 'all' })
  const [submitted, setS] = useState(false)
  const { data } = useQuery({
    queryKey: ['mr-log-user', f, submitted],
    queryFn: () => modReportsApi.logUser({ time_duration: f.time || undefined, role: f.role !== 'all' ? f.role : undefined }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="User Log" headerRight={<DeleteAllBtn />}
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Time Duration" required>
            <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="User Role">
            <select value={f.role} onChange={e => setF({ ...f, role: e.target.value })} className="input w-full">
              <option value="all">All</option>
              {['doctor','nurse','admin','accountant','receptionist','pharmacist'].map(r =>
                <option key={r} value={r}>{r}</option>
              )}
            </select>
          </Field>
          <div className="col-span-6 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Users</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">IP Address</th>
            <th className="px-3 py-2">Login Time</th>
            <th className="px-3 py-2">User Agent</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No log records</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-brand-700">{r.user}</td>
                <td className="px-3 py-2">{r.role}</td>
                <td className="px-3 py-2">{r.ip_address}</td>
                <td className="px-3 py-2">{r.login_time}</td>
                <td className="px-3 py-2 text-xs">{r.user_agent}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}

function EmailSmsLogReport() {
  const [f, setF] = useState({ time: 'this_month' })
  const [submitted, setS] = useState(true)
  const { data } = useQuery({
    queryKey: ['mr-log-email-sms', f, submitted],
    queryFn: () => modReportsApi.logEmailSms({ time_duration: f.time || undefined }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Email / SMS Log"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-4" label="Time Duration">
            <select value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <div className="col-span-8 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">SMS</th>
            <th className="px-3 py-2">Group</th>
            <th className="px-3 py-2">Individual</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={6} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-brand-700">{r.title}</td>
                <td className="px-3 py-2">{r.date}</td>
                <td className="px-3 py-2">{r.email}</td>
                <td className="px-3 py-2">{r.sms}</td>
                <td className="px-3 py-2">{r.group}</td>
                <td className="px-3 py-2">{r.individual}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}

function AuditTrailReport() {
  const [f, setF] = useState({ time: '' })
  const [submitted, setS] = useState(false)
  const { data } = useQuery({
    queryKey: ['mr-log-audit', f, submitted],
    queryFn: () => modReportsApi.logAudit({ time_duration: f.time || undefined }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Audit Trail Report List" headerRight={<DeleteAllBtn />}
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
            <th className="px-3 py-2">Message</th>
            <th className="px-3 py-2">Users</th>
            <th className="px-3 py-2">IP Address</th>
            <th className="px-3 py-2">Action</th>
            <th className="px-3 py-2">Platform</th>
            <th className="px-3 py-2">Agent</th>
            <th className="px-3 py-2">Date Time</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">No audit entries</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{r.message}</td>
                <td className="px-3 py-2">{r.user}</td>
                <td className="px-3 py-2">{r.ip_address}</td>
                <td className="px-3 py-2">{r.action}</td>
                <td className="px-3 py-2">{r.platform}</td>
                <td className="px-3 py-2">{r.agent}</td>
                <td className="px-3 py-2">{r.date_time}</td>
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
                ? 'bg-brand-50 text-brand-700 font-semibold'
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

function Panel({ title, filters, children, headerRight }: {
  title: string; filters: React.ReactNode; children: React.ReactNode; headerRight?: React.ReactNode
}) {
  return (
    <div className="card">
      <div className="px-5 py-3 border-b flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        {headerRight}
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

function DeleteAllBtn() {
  return (
    <button type="button"
      onClick={() => alert('Bulk delete not yet wired')}
      className="btn btn-danger flex items-center gap-1.5 text-xs">
      <Trash2 size={12}/> Delete All
    </button>
  )
}
