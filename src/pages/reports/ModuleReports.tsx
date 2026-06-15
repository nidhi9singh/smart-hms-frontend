// src/pages/reports/ModuleReports.tsx
// Appointment / OPD / IPD / Pharmacy report tabs
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Search } from 'lucide-react'
import { modReportsApi } from '@/api/moduleReports'
import { cn } from '@/lib/utils'

export const TIME_OPTIONS = [
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


// ════════════════════════════════════════════════════════════════
//  APPOINTMENT REPORTS
// ════════════════════════════════════════════════════════════════
export function AppointmentReports() {
  return (
    <>
      <CardGrid title="Appointment" reports={[
        { key: 'appointment', label: 'Appointment Report' },
      ]} active="appointment" onChange={() => {}} />
      <AppointmentReport />
    </>
  )
}


function AppointmentReport() {
  const [f, setF] = useState({ time: '', doctor: '', shift: '', priority: '', source: '', status: '' })
  const [submitted, setS] = useState(false)
  const { data: doctors } = useQuery({ queryKey: ['mr-doctors'], queryFn: () => modReportsApi.doctors().then(r => r.data) })

  const { data } = useQuery({
    queryKey: ['mr-appt', f, submitted],
    queryFn: () => modReportsApi.appointment({
      time_duration: f.time || undefined,
      doctor_id:     f.doctor || undefined,
      shift:         f.shift || undefined,
      priority:      f.priority || undefined,
      source:        f.source || undefined,
      status:        f.status || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []

  return (
    <Panel title="Appointment Report"
      filters={(
        <>
          <div className="grid grid-cols-12 gap-3 items-end">
            <Field className="col-span-3" label="Time Duration" required>
              <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
                {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Doctor">
              <select value={f.doctor} onChange={e => setF({ ...f, doctor: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {(doctors?.data ?? []).map((d: any) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Shift">
              <select value={f.shift} onChange={e => setF({ ...f, shift: e.target.value })} className="input w-full">
                <option value="">Select</option>
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
              </select>
            </Field>
            <Field className="col-span-3" label="Appointment Priority">
              <select value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })} className="input w-full">
                <option value="">Select</option>
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
                <option value="Very Urgent">Very Urgent</option>
                <option value="Low">Low</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-12 gap-3 items-end mt-3">
            <Field className="col-span-3" label="Source">
              <select value={f.source} onChange={e => setF({ ...f, source: e.target.value })} className="input w-full">
                <option value="">Select</option>
                <option value="Walk-in">Walk-in</option>
                <option value="Phone">Phone</option>
                <option value="Online">Online</option>
              </select>
            </Field>
            <Field className="col-span-3" label="Status">
              <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })} className="input w-full">
                <option value="">Select</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </Field>
            <div className="col-span-6 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
          </div>
        </>
      )}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Patient Name</th>
            <th className="px-3 py-2">Appointment Date</th>
            <th className="px-3 py-2">Phone</th>
            <th className="px-3 py-2">Gender</th>
            <th className="px-3 py-2">Doctor</th>
            <th className="px-3 py-2">Source</th>
            <th className="px-3 py-2">Alternate Address</th>
            <th className="px-3 py-2 text-right">Discount (%)</th>
            <th className="px-3 py-2 text-right">Fees (₹)</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={10} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-brand-700">{r.patient_name || '—'}</td>
                <td className="px-3 py-2">{(r.appointment_date || '').slice(0, 16).replace('T', ' ')}</td>
                <td className="px-3 py-2">{r.phone || '—'}</td>
                <td className="px-3 py-2">{r.gender || '—'}</td>
                <td className="px-3 py-2">{r.doctor || '—'}</td>
                <td className="px-3 py-2">{r.source || '—'}</td>
                <td className="px-3 py-2">{r.alternate_address || '—'}</td>
                <td className="px-3 py-2 text-right">{Number(r.discount || 0).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{Number(r.fees || 0).toFixed(2)}</td>
                <td className="px-3 py-2">{r.status}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}


// ════════════════════════════════════════════════════════════════
//  OPD REPORTS
// ════════════════════════════════════════════════════════════════
type OpdTab = 'opd' | 'opd-balance' | 'opd-discharged'

export function OpdReports() {
  const [tab, setTab] = useState<OpdTab>('opd')
  const REPORTS = [
    { key: 'opd',            label: 'OPD Report' },
    { key: 'opd-balance',    label: 'OPD Balance Report' },
    { key: 'opd-discharged', label: 'OPD Discharged Patient' },
  ]
  return (
    <>
      <CardGrid title="OPD" reports={REPORTS as any} active={tab} onChange={(k) => setTab(k as OpdTab)} />
      {tab === 'opd' && <OpdMainReport />}
      {tab === 'opd-balance' && <OpdBalanceReport />}
      {tab === 'opd-discharged' && <OpdDischargedReport />}
    </>
  )
}

function OpdMainReport() {
  const [f, setF] = useState({ time: '', doctor: '', from_age: '', to_age: '', gender: '', symptoms: '', findings: '' })
  const [submitted, setS] = useState(false)
  const { data: doctors } = useQuery({ queryKey: ['mr-doctors'], queryFn: () => modReportsApi.doctors().then(r => r.data) })

  const { data } = useQuery({
    queryKey: ['mr-opd', f, submitted],
    queryFn: () => modReportsApi.opd({
      time_duration: f.time || undefined,
      doctor_id: f.doctor || undefined,
      from_age:  f.from_age || undefined,
      to_age:    f.to_age || undefined,
      gender:    f.gender || undefined,
      symptoms:  f.symptoms || undefined,
      findings:  f.findings || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []

  return (
    <Panel title="OPD Report"
      filters={(
        <>
          <div className="grid grid-cols-12 gap-3 items-end">
            <Field className="col-span-3" label="Time Duration" required>
              <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
                {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Doctor">
              <select value={f.doctor} onChange={e => setF({ ...f, doctor: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {(doctors?.data ?? []).map((d: any) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="From Age">
              <input type="number" value={f.from_age} onChange={e => setF({ ...f, from_age: e.target.value })} className="input w-full"/>
            </Field>
            <Field className="col-span-3" label="To Age">
              <input type="number" value={f.to_age} onChange={e => setF({ ...f, to_age: e.target.value })} className="input w-full"/>
            </Field>
          </div>
          <div className="grid grid-cols-12 gap-3 items-end mt-3">
            <Field className="col-span-3" label="Gender">
              <select value={f.gender} onChange={e => setF({ ...f, gender: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Symptoms">
              <input value={f.symptoms} onChange={e => setF({ ...f, symptoms: e.target.value })} className="input w-full" placeholder="Symptoms Type"/>
            </Field>
            <Field className="col-span-3" label="Findings">
              <input value={f.findings} onChange={e => setF({ ...f, findings: e.target.value })} className="input w-full"/>
            </Field>
            <div className="col-span-3 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
          </div>
        </>
      )}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">OPD No</th>
              <th className="px-3 py-2">OPD Checkup ID</th>
              <th className="px-3 py-2">Patient Name</th>
              <th className="px-3 py-2">Age</th>
              <th className="px-3 py-2">Gender</th>
              <th className="px-3 py-2">Mobile Number</th>
              <th className="px-3 py-2">Is Antenatal</th>
              <th className="px-3 py-2">Guardian Name</th>
              <th className="px-3 py-2">Doctor Name</th>
              <th className="px-3 py-2">Symptoms</th>
              <th className="px-3 py-2">Findings</th>
              <th className="px-3 py-2">Previous Medical Issue</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={13} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">{(r.date || '').slice(0, 10)}</td>
                  <td className="px-3 py-2 text-brand-700">{r.opd_no}</td>
                  <td className="px-3 py-2">{r.opd_checkup_id || '—'}</td>
                  <td className="px-3 py-2">{r.patient_name || '—'}</td>
                  <td className="px-3 py-2">{r.age ?? '—'}</td>
                  <td className="px-3 py-2">{r.gender || '—'}</td>
                  <td className="px-3 py-2">{r.mobile_number || '—'}</td>
                  <td className="px-3 py-2">{r.is_antenatal}</td>
                  <td className="px-3 py-2">{r.guardian_name || '—'}</td>
                  <td className="px-3 py-2">{r.doctor_name || '—'}</td>
                  <td className="px-3 py-2">{r.symptoms || '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{r.findings || ''}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{r.previous_medical_issue || ''}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function OpdBalanceReport() {
  const [f, setF] = useState({ time: '', from_age: '', to_age: '', gender: '' })
  const [submitted, setS] = useState(false)
  const { data } = useQuery({
    queryKey: ['mr-opd-bal', f, submitted],
    queryFn: () => modReportsApi.opdBalance({
      time_duration: f.time || undefined,
      from_age: f.from_age || undefined,
      to_age:   f.to_age || undefined,
      gender:   f.gender || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="OPD Balance Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Time Duration" required>
            <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-2" label="From Age">
            <input type="number" value={f.from_age} onChange={e => setF({ ...f, from_age: e.target.value })} className="input w-full"/>
          </Field>
          <Field className="col-span-2" label="To Age">
            <input type="number" value={f.to_age} onChange={e => setF({ ...f, to_age: e.target.value })} className="input w-full"/>
          </Field>
          <Field className="col-span-2" label="Gender">
            <select value={f.gender} onChange={e => setF({ ...f, gender: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <div className="col-span-3 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">OPD No</th>
              <th className="px-3 py-2">Patient Name</th>
              <th className="px-3 py-2">Case ID</th>
              <th className="px-3 py-2">TPA Name</th>
              <th className="px-3 py-2">Age</th>
              <th className="px-3 py-2">Gender</th>
              <th className="px-3 py-2">Mobile Number</th>
              <th className="px-3 py-2">Antenatal</th>
              <th className="px-3 py-2">Discharged</th>
              <th className="px-3 py-2 text-right">Net (₹)</th>
              <th className="px-3 py-2 text-right">Paid (₹)</th>
              <th className="px-3 py-2 text-right">Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={12} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-brand-700">{r.opd_no}</td>
                  <td className="px-3 py-2">{r.patient_name || '—'}</td>
                  <td className="px-3 py-2">{r.case_id || '—'}</td>
                  <td className="px-3 py-2">{r.tpa_name || '—'}</td>
                  <td className="px-3 py-2">{r.age ?? '—'}</td>
                  <td className="px-3 py-2">{r.gender || '—'}</td>
                  <td className="px-3 py-2">{r.mobile_number || '—'}</td>
                  <td className="px-3 py-2">{r.antenatal}</td>
                  <td className="px-3 py-2">{r.discharged}</td>
                  <td className="px-3 py-2 text-right">{Number(r.net_amount || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.paid_amount || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{Number(r.balance_amount || 0).toFixed(2)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function OpdDischargedReport() {
  const [f, setF] = useState({ time: '', doctor: '', from_age: '', to_age: '', gender: '', discharge_status: '' })
  const [submitted, setS] = useState(false)
  const { data: doctors } = useQuery({ queryKey: ['mr-doctors'], queryFn: () => modReportsApi.doctors().then(r => r.data) })

  const { data } = useQuery({
    queryKey: ['mr-opd-disch', f, submitted],
    queryFn: () => modReportsApi.opdDischarged({
      time_duration: f.time || undefined,
      doctor_id: f.doctor || undefined,
      from_age:  f.from_age || undefined,
      to_age:    f.to_age || undefined,
      gender:    f.gender || undefined,
      discharge_status: f.discharge_status || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="OPD Discharged Patient Report"
      filters={(
        <>
          <div className="grid grid-cols-12 gap-3 items-end">
            <Field className="col-span-3" label="Time Duration" required>
              <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
                {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Doctor">
              <select value={f.doctor} onChange={e => setF({ ...f, doctor: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {(doctors?.data ?? []).map((d: any) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="From Age">
              <input type="number" value={f.from_age} onChange={e => setF({ ...f, from_age: e.target.value })} className="input w-full"/>
            </Field>
            <Field className="col-span-3" label="To Age">
              <input type="number" value={f.to_age} onChange={e => setF({ ...f, to_age: e.target.value })} className="input w-full"/>
            </Field>
          </div>
          <div className="grid grid-cols-12 gap-3 items-end mt-3">
            <Field className="col-span-3" label="Gender">
              <select value={f.gender} onChange={e => setF({ ...f, gender: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Discharge Status">
              <select value={f.discharge_status} onChange={e => setF({ ...f, discharge_status: e.target.value })} className="input w-full">
                <option value="">Select</option>
                <option value="Discharged">Discharged</option>
                <option value="Pending">Pending</option>
              </select>
            </Field>
            <div className="col-span-6 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
          </div>
        </>
      )}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">Patient Name</th>
              <th className="px-3 py-2">OPD No</th>
              <th className="px-3 py-2">Case ID</th>
              <th className="px-3 py-2">Gender</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Antenatal</th>
              <th className="px-3 py-2">Consultant</th>
              <th className="px-3 py-2">Appointment Date</th>
              <th className="px-3 py-2">Discharged Date</th>
              <th className="px-3 py-2">Discharge Status</th>
              <th className="px-3 py-2 text-right">Total Admit Days</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={11} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-brand-700">{r.patient_name || '—'}</td>
                  <td className="px-3 py-2">{r.opd_no}</td>
                  <td className="px-3 py-2">{r.case_id || '—'}</td>
                  <td className="px-3 py-2">{r.gender || '—'}</td>
                  <td className="px-3 py-2">{r.phone || '—'}</td>
                  <td className="px-3 py-2">{r.antenatal}</td>
                  <td className="px-3 py-2">{r.consultant || '—'}</td>
                  <td className="px-3 py-2">{(r.appointment_date || '').slice(0, 10)}</td>
                  <td className="px-3 py-2">{r.discharged_date ? r.discharged_date.slice(0, 10) : '—'}</td>
                  <td className="px-3 py-2">{r.discharge_status}</td>
                  <td className="px-3 py-2 text-right">{r.total_admit_days}</td>
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
//  IPD REPORTS
// ════════════════════════════════════════════════════════════════
type IpdTab = 'ipd' | 'ipd-balance' | 'ipd-discharged'

export function IpdReports() {
  const [tab, setTab] = useState<IpdTab>('ipd')
  const REPORTS = [
    { key: 'ipd',            label: 'IPD Report' },
    { key: 'ipd-balance',    label: 'IPD Balance Report' },
    { key: 'ipd-discharged', label: 'IPD Discharged Patient' },
  ]
  return (
    <>
      <CardGrid title="IPD" reports={REPORTS as any} active={tab} onChange={(k) => setTab(k as IpdTab)} />
      {tab === 'ipd' && <IpdMainReport />}
      {tab === 'ipd-balance' && <IpdBalanceReport />}
      {tab === 'ipd-discharged' && <IpdDischargedReport />}
    </>
  )
}

function IpdMainReport() {
  const [f, setF] = useState({ time: '', doctor: '', from_age: '', to_age: '', gender: '', symptoms: '', findings: '' })
  const [submitted, setS] = useState(false)
  const { data: doctors } = useQuery({ queryKey: ['mr-doctors'], queryFn: () => modReportsApi.doctors().then(r => r.data) })

  const { data } = useQuery({
    queryKey: ['mr-ipd', f, submitted],
    queryFn: () => modReportsApi.ipd({
      time_duration: f.time || undefined,
      doctor_id: f.doctor || undefined,
      from_age:  f.from_age || undefined,
      to_age:    f.to_age || undefined,
      gender:    f.gender || undefined,
      symptoms:  f.symptoms || undefined,
      findings:  f.findings || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="IPD Report"
      filters={(
        <>
          <div className="grid grid-cols-12 gap-3 items-end">
            <Field className="col-span-3" label="Time Duration" required>
              <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
                {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Doctor">
              <select value={f.doctor} onChange={e => setF({ ...f, doctor: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {(doctors?.data ?? []).map((d: any) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="From Age">
              <input type="number" value={f.from_age} onChange={e => setF({ ...f, from_age: e.target.value })} className="input w-full"/>
            </Field>
            <Field className="col-span-3" label="To Age">
              <input type="number" value={f.to_age} onChange={e => setF({ ...f, to_age: e.target.value })} className="input w-full"/>
            </Field>
          </div>
          <div className="grid grid-cols-12 gap-3 items-end mt-3">
            <Field className="col-span-3" label="Gender">
              <select value={f.gender} onChange={e => setF({ ...f, gender: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Symptoms">
              <input value={f.symptoms} onChange={e => setF({ ...f, symptoms: e.target.value })} className="input w-full" placeholder="Symptoms Type"/>
            </Field>
            <Field className="col-span-3" label="Findings">
              <input value={f.findings} onChange={e => setF({ ...f, findings: e.target.value })} className="input w-full"/>
            </Field>
            <div className="col-span-3 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
          </div>
        </>
      )}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">IPD No</th>
              <th className="px-3 py-2">Patient Name</th>
              <th className="px-3 py-2">Age</th>
              <th className="px-3 py-2">Gender</th>
              <th className="px-3 py-2">Mobile</th>
              <th className="px-3 py-2">Guardian Name</th>
              <th className="px-3 py-2">Doctor Name</th>
              <th className="px-3 py-2">Symptoms</th>
              <th className="px-3 py-2">Findings</th>
              <th className="px-3 py-2">Antenatal</th>
              <th className="px-3 py-2">Previous Medical Issue</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={12} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">{(r.date || '').slice(0, 10)}</td>
                  <td className="px-3 py-2 text-brand-700">{r.ipd_no}</td>
                  <td className="px-3 py-2">{r.patient_name || '—'}</td>
                  <td className="px-3 py-2">{r.age ?? '—'}</td>
                  <td className="px-3 py-2">{r.gender || '—'}</td>
                  <td className="px-3 py-2">{r.mobile_number || '—'}</td>
                  <td className="px-3 py-2">{r.guardian_name || '—'}</td>
                  <td className="px-3 py-2">{r.doctor_name || '—'}</td>
                  <td className="px-3 py-2">{r.symptoms || '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{r.findings || ''}</td>
                  <td className="px-3 py-2">{r.antenatal}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{r.previous_medical_issue || ''}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function IpdBalanceReport() {
  const [f, setF] = useState({ time: '', patient_status: 'all', from_age: '', to_age: '', gender: '' })
  const [submitted, setS] = useState(false)
  const { data } = useQuery({
    queryKey: ['mr-ipd-bal', f, submitted],
    queryFn: () => modReportsApi.ipdBalance({
      time_duration: f.time || undefined,
      patient_status: f.patient_status,
      from_age: f.from_age || undefined,
      to_age:   f.to_age || undefined,
      gender:   f.gender || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="IPD Balance Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Time Duration" required>
            <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-2" label="Patient Status">
            <select value={f.patient_status} onChange={e => setF({ ...f, patient_status: e.target.value })} className="input w-full">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="discharged">Discharged</option>
            </select>
          </Field>
          <Field className="col-span-2" label="From Age">
            <input type="number" value={f.from_age} onChange={e => setF({ ...f, from_age: e.target.value })} className="input w-full"/>
          </Field>
          <Field className="col-span-2" label="To Age">
            <input type="number" value={f.to_age} onChange={e => setF({ ...f, to_age: e.target.value })} className="input w-full"/>
          </Field>
          <Field className="col-span-2" label="Gender">
            <select value={f.gender} onChange={e => setF({ ...f, gender: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <div className="col-span-1 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">IPD No</th>
              <th className="px-3 py-2">Case ID</th>
              <th className="px-3 py-2">Patient Name</th>
              <th className="px-3 py-2">TPA Name</th>
              <th className="px-3 py-2">Age</th>
              <th className="px-3 py-2">Gender</th>
              <th className="px-3 py-2">Antenatal</th>
              <th className="px-3 py-2">Mobile</th>
              <th className="px-3 py-2">Guardian Name</th>
              <th className="px-3 py-2">Discharged</th>
              <th className="px-3 py-2">Patient Active</th>
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
                  <td className="px-3 py-2 text-brand-700">{r.ipd_no}</td>
                  <td className="px-3 py-2">{r.case_id || '—'}</td>
                  <td className="px-3 py-2">{r.patient_name || '—'}</td>
                  <td className="px-3 py-2">{r.tpa_name || '—'}</td>
                  <td className="px-3 py-2">{r.age ?? '—'}</td>
                  <td className="px-3 py-2">{r.gender || '—'}</td>
                  <td className="px-3 py-2">{r.antenatal}</td>
                  <td className="px-3 py-2">{r.mobile_number || '—'}</td>
                  <td className="px-3 py-2">{r.guardian_name || '—'}</td>
                  <td className="px-3 py-2">{r.discharged}</td>
                  <td className="px-3 py-2">{r.patient_active}</td>
                  <td className="px-3 py-2 text-right">{Number(r.net_amount || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.paid_amount || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{Number(r.balance_amount || 0).toFixed(2)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function IpdDischargedReport() {
  const [f, setF] = useState({ time: '', doctor: '', from_age: '', to_age: '', gender: '', discharge_status: '' })
  const [submitted, setS] = useState(false)
  const { data: doctors } = useQuery({ queryKey: ['mr-doctors'], queryFn: () => modReportsApi.doctors().then(r => r.data) })

  const { data } = useQuery({
    queryKey: ['mr-ipd-disch', f, submitted],
    queryFn: () => modReportsApi.ipdDischarged({
      time_duration: f.time || undefined,
      doctor_id: f.doctor || undefined,
      from_age:  f.from_age || undefined,
      to_age:    f.to_age || undefined,
      gender:    f.gender || undefined,
      discharge_status: f.discharge_status || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="IPD Discharged Patient Report"
      filters={(
        <>
          <div className="grid grid-cols-12 gap-3 items-end">
            <Field className="col-span-3" label="Time Duration" required>
              <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
                {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Doctor">
              <select value={f.doctor} onChange={e => setF({ ...f, doctor: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {(doctors?.data ?? []).map((d: any) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="From Age">
              <input type="number" value={f.from_age} onChange={e => setF({ ...f, from_age: e.target.value })} className="input w-full"/>
            </Field>
            <Field className="col-span-3" label="To Age">
              <input type="number" value={f.to_age} onChange={e => setF({ ...f, to_age: e.target.value })} className="input w-full"/>
            </Field>
          </div>
          <div className="grid grid-cols-12 gap-3 items-end mt-3">
            <Field className="col-span-3" label="Gender">
              <select value={f.gender} onChange={e => setF({ ...f, gender: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Discharge Status">
              <select value={f.discharge_status} onChange={e => setF({ ...f, discharge_status: e.target.value })} className="input w-full">
                <option value="">Select</option>
                <option value="discharged">Discharged</option>
                <option value="active">Active</option>
              </select>
            </Field>
            <div className="col-span-6 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
          </div>
        </>
      )}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">Patient Name</th>
              <th className="px-3 py-2">IPD No</th>
              <th className="px-3 py-2">Case ID</th>
              <th className="px-3 py-2">Gender</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Antenatal</th>
              <th className="px-3 py-2">Consultant Doctor</th>
              <th className="px-3 py-2">Bed</th>
              <th className="px-3 py-2">Admission Date</th>
              <th className="px-3 py-2">Discharged Date</th>
              <th className="px-3 py-2">Discharge Status</th>
              <th className="px-3 py-2 text-right">Total Admit Days</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={12} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-brand-700">{r.patient_name || '—'}</td>
                  <td className="px-3 py-2">{r.ipd_no}</td>
                  <td className="px-3 py-2">{r.case_id || '—'}</td>
                  <td className="px-3 py-2">{r.gender || '—'}</td>
                  <td className="px-3 py-2">{r.phone || '—'}</td>
                  <td className="px-3 py-2">{r.antenatal}</td>
                  <td className="px-3 py-2">{r.consultant_doctor || '—'}</td>
                  <td className="px-3 py-2">{r.bed || '—'}</td>
                  <td className="px-3 py-2">{(r.admission_date || '').slice(0, 10)}</td>
                  <td className="px-3 py-2">{r.discharged_date ? r.discharged_date.slice(0, 10) : '—'}</td>
                  <td className="px-3 py-2">{r.discharge_status}</td>
                  <td className="px-3 py-2 text-right">{r.total_admit_days ?? '—'}</td>
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
//  PHARMACY REPORTS
// ════════════════════════════════════════════════════════════════
type PharmTab = 'pharmacy-bill' | 'pharmacy-expiry' | 'pharmacy-stock'

export function PharmacyReports() {
  const [tab, setTab] = useState<PharmTab>('pharmacy-bill')
  const REPORTS = [
    { key: 'pharmacy-bill',   label: 'Pharmacy Bill Report' },
    { key: 'pharmacy-expiry', label: 'Expiry Medicine Report' },
    { key: 'pharmacy-stock',  label: 'Stock Report' },
  ]
  return (
    <>
      <CardGrid title="Pharmacy" reports={REPORTS as any} active={tab} onChange={(k) => setTab(k as PharmTab)} />
      {tab === 'pharmacy-bill'   && <PharmacyBillReport />}
      {tab === 'pharmacy-expiry' && <PharmacyExpiryReport />}
      {tab === 'pharmacy-stock'  && <PharmacyStockReport />}
    </>
  )
}

function PharmacyBillReport() {
  const [f, setF] = useState({ time: '', collected_by: '', doctor: '', gender: '', from_age: '', to_age: '', payment_mode: '' })
  const [submitted, setS] = useState(false)
  const { data: doctors } = useQuery({ queryKey: ['mr-doctors'], queryFn: () => modReportsApi.doctors().then(r => r.data) })
  const { data: staff }   = useQuery({ queryKey: ['mr-staff'],   queryFn: () => modReportsApi.staff().then(r => r.data) })

  const { data } = useQuery({
    queryKey: ['mr-pharm-bill', f, submitted],
    queryFn: () => modReportsApi.pharmacyBill({
      time_duration: f.time || undefined,
      collected_by: f.collected_by || undefined,
      doctor_id:    f.doctor || undefined,
      gender:       f.gender || undefined,
      from_age:     f.from_age || undefined,
      to_age:       f.to_age || undefined,
      payment_mode: f.payment_mode || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Pharmacy Bill Report"
      filters={(
        <>
          <div className="grid grid-cols-12 gap-3 items-end">
            <Field className="col-span-3" label="Time Duration" required>
              <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
                {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Collected By">
              <select value={f.collected_by} onChange={e => setF({ ...f, collected_by: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {(staff?.data ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Doctor Name">
              <select value={f.doctor} onChange={e => setF({ ...f, doctor: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {(doctors?.data ?? []).map((d: any) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Gender">
              <select value={f.gender} onChange={e => setF({ ...f, gender: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-12 gap-3 items-end mt-3">
            <Field className="col-span-3" label="From Age">
              <input type="number" value={f.from_age} onChange={e => setF({ ...f, from_age: e.target.value })} className="input w-full"/>
            </Field>
            <Field className="col-span-3" label="To Age">
              <input type="number" value={f.to_age} onChange={e => setF({ ...f, to_age: e.target.value })} className="input w-full"/>
            </Field>
            <Field className="col-span-3" label="Payment Mode">
              <select value={f.payment_mode} onChange={e => setF({ ...f, payment_mode: e.target.value })} className="input w-full">
                <option value="">Select</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Online">Online</option>
              </select>
            </Field>
            <div className="col-span-3 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
          </div>
        </>
      )}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">Bill No</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Patient Name</th>
              <th className="px-3 py-2">Age</th>
              <th className="px-3 py-2">Gender</th>
              <th className="px-3 py-2">Prescription No</th>
              <th className="px-3 py-2">Doctor Name</th>
              <th className="px-3 py-2">Collected By</th>
              <th className="px-3 py-2 text-right">Amount (₹)</th>
              <th className="px-3 py-2 text-right">Discount</th>
              <th className="px-3 py-2 text-right">Tax</th>
              <th className="px-3 py-2 text-right">Net (₹)</th>
              <th className="px-3 py-2 text-right">Paid (₹)</th>
              <th className="px-3 py-2 text-right">Refund (₹)</th>
              <th className="px-3 py-2 text-right">Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={15} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-brand-700">{r.bill_no}</td>
                  <td className="px-3 py-2">{r.date}</td>
                  <td className="px-3 py-2">{r.patient_name || '—'}</td>
                  <td className="px-3 py-2">{r.age ?? '—'}</td>
                  <td className="px-3 py-2">{r.gender || '—'}</td>
                  <td className="px-3 py-2">{r.prescription_no || '—'}</td>
                  <td className="px-3 py-2">{r.doctor_name || '—'}</td>
                  <td className="px-3 py-2">{r.collected_by || '—'}</td>
                  <td className="px-3 py-2 text-right">{Number(r.amount || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.discount || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.tax || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.net_amount || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.paid || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.refund_amount || 0).toFixed(2)}</td>
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

function PharmacyExpiryReport() {
  const [f, setF] = useState({ time: '', cat: '', supplier: '' })
  const [submitted, setS] = useState(false)
  const { data: cats }    = useQuery({ queryKey: ['mr-med-cats'],    queryFn: () => modReportsApi.medCategories().then(r => r.data) })
  const { data: suppliers}= useQuery({ queryKey: ['mr-med-suppliers'], queryFn: () => modReportsApi.medSuppliers().then(r => r.data) })

  const { data } = useQuery({
    queryKey: ['mr-pharm-expiry', f, submitted],
    queryFn: () => modReportsApi.pharmacyExpiry({
      time_duration: f.time || undefined,
      medicine_category_id: f.cat || undefined,
      supplier_id: f.supplier || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Expiry Medicine Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Time Duration" required>
            <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-4" label="Medicine Category">
            <select value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(cats?.data ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Supplier">
            <select value={f.supplier} onChange={e => setF({ ...f, supplier: e.target.value })} className="input w-full">
              <option value="">Select Supplier</option>
              {(suppliers?.data ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <div className="col-span-2 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Medicine Name</th>
            <th className="px-3 py-2">Batch No</th>
            <th className="px-3 py-2">Company Name</th>
            <th className="px-3 py-2">Medicine Category</th>
            <th className="px-3 py-2">Medicine Group</th>
            <th className="px-3 py-2">Supplier</th>
            <th className="px-3 py-2">Expire Date</th>
            <th className="px-3 py-2 text-right">Qty</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={8} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-brand-700">{r.medicine_name}</td>
                <td className="px-3 py-2">{r.batch_no}</td>
                <td className="px-3 py-2">{r.company_name || '—'}</td>
                <td className="px-3 py-2">{r.medicine_category || '—'}</td>
                <td className="px-3 py-2">{r.medicine_group || '—'}</td>
                <td className="px-3 py-2">{r.supplier || '—'}</td>
                <td className="px-3 py-2 text-rose-600">{r.expire_date}</td>
                <td className="px-3 py-2 text-right">{r.qty}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}

function PharmacyStockReport() {
  const [f, setF] = useState({ cat: '', stock_type: 'all' })
  const [search, setSearch] = useState('')
  const { data: cats }    = useQuery({ queryKey: ['mr-med-cats'], queryFn: () => modReportsApi.medCategories().then(r => r.data) })
  const { data } = useQuery({
    queryKey: ['mr-pharm-stock', f],
    queryFn: () => modReportsApi.pharmacyStock({
      medicine_category_id: f.cat || undefined,
      stock_type: f.stock_type,
    }).then(r => r.data),
  })
  const items: any[] = data?.data?.items ?? []
  const filtered = search ? items.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase())) : items
  return (
    <Panel title="Stock Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-4" label="Medicine Category">
            <select value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(cats?.data ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Stock Type">
            <select value={f.stock_type} onChange={e => setF({ ...f, stock_type: e.target.value })} className="input w-full">
              <option value="all">All</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="reorder">Reorder Level</option>
            </select>
          </Field>
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
            <th className="px-3 py-2">Medicine Name</th>
            <th className="px-3 py-2">Medicine Company</th>
            <th className="px-3 py-2">Medicine Composition</th>
            <th className="px-3 py-2">Medicine Category</th>
            <th className="px-3 py-2">Medicine Group</th>
            <th className="px-3 py-2">Unit</th>
            <th className="px-3 py-2 text-right">Available Qty</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0
            ? <tr><td colSpan={7} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : filtered.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-brand-700">{r.medicine_name}</td>
                <td className="px-3 py-2">{r.medicine_company || '—'}</td>
                <td className="px-3 py-2">{r.medicine_composition || '—'}</td>
                <td className="px-3 py-2">{r.medicine_category || '—'}</td>
                <td className="px-3 py-2">{r.medicine_group || '—'}</td>
                <td className="px-3 py-2">{r.unit || '—'}</td>
                <td className="px-3 py-2 text-right">
                  {r.available_qty}
                  {r.stock_flag === 'out_of_stock' && <span className="ml-2 text-rose-600 text-xs">(Out of Stock)</span>}
                  {r.stock_flag === 'reorder' && <span className="ml-2 text-amber-600 text-xs">(Reorder)</span>}
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
      {filtered.length > 0 && <p className="text-xs text-gray-400 px-5 py-2">Records: 1 to {filtered.length} of {items.length}</p>}
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
