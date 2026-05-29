// src/pages/reports/ModuleReportsExt.tsx
// Pathology / Radiology / Blood Bank report tabs
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

const GENDER_OPTIONS = ['Male', 'Female', 'Other']
const COMPONENT_TYPES = ['Red Cells', 'White Cells & Granulocytes', 'Cryo', 'Cryo.', 'Platelets', 'Plasma']


// ════════════════════════════════════════════════════════════════
//  PATHOLOGY REPORTS
// ════════════════════════════════════════════════════════════════
type PathTab = 'pathology-patient' | 'pathology-balance'

export function PathologyReports() {
  const [tab, setTab] = useState<PathTab>('pathology-patient')
  const REPORTS = [
    { key: 'pathology-patient', label: 'Pathology Patient Report' },
    { key: 'pathology-balance', label: 'Pathology Balance Report' },
  ]
  return (
    <>
      <CardGrid title="Pathology" reports={REPORTS as any} active={tab} onChange={(k) => setTab(k as PathTab)} />
      {tab === 'pathology-patient' && <PathologyPatientReport />}
      {tab === 'pathology-balance' && <PathologyBalanceReport />}
    </>
  )
}

function PathologyPatientReport() {
  const [f, setF] = useState({ time: '', sample_collector: '', category: '', test_id: '' })
  const [submitted, setS] = useState(false)
  const { data: users } = useQuery({ queryKey: ['mr-users'],     queryFn: () => modReportsApi.users().then(r => r.data) })
  const { data: cats }  = useQuery({ queryKey: ['mr-path-cats'], queryFn: () => modReportsApi.pathologyCats().then(r => r.data) })
  const { data: tests } = useQuery({ queryKey: ['mr-path-tests'], queryFn: () => modReportsApi.pathologyTests().then(r => r.data) })

  const { data } = useQuery({
    queryKey: ['mr-path-pat', f, submitted],
    queryFn: () => modReportsApi.pathologyPatient({
      time_duration:    f.time || undefined,
      sample_collector: f.sample_collector || undefined,
      category:         f.category || undefined,
      test_id:          f.test_id || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Pathology Patient Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Time Duration" required>
            <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Sample Collected Person Name">
            <select value={f.sample_collector} onChange={e => setF({ ...f, sample_collector: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(users?.data ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field className="col-span-2" label="Category Name">
            <select value={f.category} onChange={e => setF({ ...f, category: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(cats?.data ?? []).map((c: any) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-2" label="Test Name">
            <select value={f.test_id} onChange={e => setF({ ...f, test_id: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(tests?.data ?? []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <div className="col-span-2 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">Bill No</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Patient Name</th>
              <th className="px-3 py-2">Category Name</th>
              <th className="px-3 py-2">Test Name</th>
              <th className="px-3 py-2">Consultant Doctor</th>
              <th className="px-3 py-2">Sample Collected Person Name</th>
              <th className="px-3 py-2">Previous Report Value</th>
              <th className="px-3 py-2 text-right">Net Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={9} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-emerald-700">{r.bill_no}</td>
                  <td className="px-3 py-2">{r.date}</td>
                  <td className="px-3 py-2">{r.patient_name || '—'}</td>
                  <td className="px-3 py-2">{r.category_name || '—'}</td>
                  <td className="px-3 py-2">{r.test_name || '—'}</td>
                  <td className="px-3 py-2">{r.consultant_doctor || '—'}</td>
                  <td className="px-3 py-2">{r.sample_collected_person_name || '—'}</td>
                  <td className="px-3 py-2">{r.previous_report_value || '—'}</td>
                  <td className="px-3 py-2 text-right">{Number(r.net_amount || 0).toFixed(2)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function PathologyBalanceReport() {
  const [f, setF] = useState({ time: '', from_age: '', to_age: '', gender: '' })
  const [submitted, setS] = useState(false)
  const { data } = useQuery({
    queryKey: ['mr-path-bal', f, submitted],
    queryFn: () => modReportsApi.pathologyBalance({
      time_duration: f.time || undefined,
      from_age: f.from_age || undefined,
      to_age:   f.to_age || undefined,
      gender:   f.gender || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Pathology Balance Report"
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
              <th className="px-3 py-2">Bill No</th>
              <th className="px-3 py-2">Bill Date</th>
              <th className="px-3 py-2">Patient Name</th>
              <th className="px-3 py-2">TPA Name</th>
              <th className="px-3 py-2">Consultant Doctor</th>
              <th className="px-3 py-2">Sample Collected Person Name</th>
              <th className="px-3 py-2">Antenatal</th>
              <th className="px-3 py-2">Previous Report Value</th>
              <th className="px-3 py-2 text-right">Total (₹)</th>
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
                  <td className="px-3 py-2 text-emerald-700">{r.bill_no}</td>
                  <td className="px-3 py-2">{r.bill_date}</td>
                  <td className="px-3 py-2">{r.patient_name || '—'}</td>
                  <td className="px-3 py-2">{r.tpa_name || '—'}</td>
                  <td className="px-3 py-2">{r.consultant_doctor || '—'}</td>
                  <td className="px-3 py-2">{r.sample_collected_person_name || '—'}</td>
                  <td className="px-3 py-2">{r.antenatal}</td>
                  <td className="px-3 py-2">{r.previous_report_value || '—'}</td>
                  <td className="px-3 py-2 text-right">{Number(r.total || 0).toFixed(2)}</td>
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
//  RADIOLOGY REPORTS
// ════════════════════════════════════════════════════════════════
type RadTab = 'radiology-patient' | 'radiology-balance'

export function RadiologyReports() {
  const [tab, setTab] = useState<RadTab>('radiology-patient')
  const REPORTS = [
    { key: 'radiology-patient', label: 'Radiology Patient Report' },
    { key: 'radiology-balance', label: 'Radiology Balance Report' },
  ]
  return (
    <>
      <CardGrid title="Radiology" reports={REPORTS as any} active={tab} onChange={(k) => setTab(k as RadTab)} />
      {tab === 'radiology-patient' && <RadiologyPatientReport />}
      {tab === 'radiology-balance' && <RadiologyBalanceReport />}
    </>
  )
}

function RadiologyPatientReport() {
  const [f, setF] = useState({ time: '', sample_collector: '', category: '', test_id: '' })
  const [submitted, setS] = useState(false)
  const { data: users } = useQuery({ queryKey: ['mr-users'],     queryFn: () => modReportsApi.users().then(r => r.data) })
  const { data: cats }  = useQuery({ queryKey: ['mr-rad-cats'],  queryFn: () => modReportsApi.radiologyCats().then(r => r.data) })
  const { data: tests } = useQuery({ queryKey: ['mr-rad-tests'], queryFn: () => modReportsApi.radiologyTests().then(r => r.data) })

  const { data } = useQuery({
    queryKey: ['mr-rad-pat', f, submitted],
    queryFn: () => modReportsApi.radiologyPatient({
      time_duration:    f.time || undefined,
      sample_collector: f.sample_collector || undefined,
      category:         f.category || undefined,
      test_id:          f.test_id || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Radiology Patient Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Time Duration" required>
            <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Sample Collected Person Name">
            <select value={f.sample_collector} onChange={e => setF({ ...f, sample_collector: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(users?.data ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field className="col-span-2" label="Category Name">
            <select value={f.category} onChange={e => setF({ ...f, category: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(cats?.data ?? []).map((c: any) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-2" label="Test Name">
            <select value={f.test_id} onChange={e => setF({ ...f, test_id: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(tests?.data ?? []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <div className="col-span-2 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">Bill No</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Patient Name</th>
              <th className="px-3 py-2">Category Name</th>
              <th className="px-3 py-2">Test Name</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Consultant Doctor</th>
              <th className="px-3 py-2">Sample Collected Person Name</th>
              <th className="px-3 py-2">Previous Report Value</th>
              <th className="px-3 py-2 text-right">Net Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={10} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-emerald-700">{r.bill_no}</td>
                  <td className="px-3 py-2">{r.date}</td>
                  <td className="px-3 py-2">{r.patient_name || '—'}</td>
                  <td className="px-3 py-2">{r.category_name || '—'}</td>
                  <td className="px-3 py-2">{r.test_name || '—'}</td>
                  <td className="px-3 py-2 text-xs text-gray-600">{r.description || ''}</td>
                  <td className="px-3 py-2">{r.consultant_doctor || '—'}</td>
                  <td className="px-3 py-2">{r.sample_collected_person_name || '—'}</td>
                  <td className="px-3 py-2">{r.previous_report_value || '—'}</td>
                  <td className="px-3 py-2 text-right">{Number(r.net_amount || 0).toFixed(2)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function RadiologyBalanceReport() {
  const [f, setF] = useState({ time: '', from_age: '', to_age: '', gender: '' })
  const [submitted, setS] = useState(false)
  const { data } = useQuery({
    queryKey: ['mr-rad-bal', f, submitted],
    queryFn: () => modReportsApi.radiologyBalance({
      time_duration: f.time || undefined,
      from_age: f.from_age || undefined,
      to_age:   f.to_age || undefined,
      gender:   f.gender || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Radiology Balance Report"
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
              <th className="px-3 py-2">Bill No</th>
              <th className="px-3 py-2">Bill Date</th>
              <th className="px-3 py-2">Patient Name</th>
              <th className="px-3 py-2">TPA Name</th>
              <th className="px-3 py-2">Antenatal</th>
              <th className="px-3 py-2">Previous Report Value</th>
              <th className="px-3 py-2 text-right">Total (₹)</th>
              <th className="px-3 py-2 text-right">Discount</th>
              <th className="px-3 py-2 text-right">Tax</th>
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
                  <td className="px-3 py-2 text-emerald-700">{r.bill_no}</td>
                  <td className="px-3 py-2">{r.bill_date}</td>
                  <td className="px-3 py-2">{r.patient_name || '—'}</td>
                  <td className="px-3 py-2">{r.tpa_name || '—'}</td>
                  <td className="px-3 py-2">{r.antenatal}</td>
                  <td className="px-3 py-2">{r.previous_report_value || '—'}</td>
                  <td className="px-3 py-2 text-right">{Number(r.total || 0).toFixed(2)}</td>
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
//  BLOOD BANK REPORTS
// ════════════════════════════════════════════════════════════════
type BloodTab = 'blood-issue' | 'component-issue' | 'blood-donor'

export function BloodBankReports() {
  const [tab, setTab] = useState<BloodTab>('blood-issue')
  const REPORTS = [
    { key: 'blood-issue',     label: 'Blood Issue Report' },
    { key: 'component-issue', label: 'Component Issue Report' },
    { key: 'blood-donor',     label: 'Blood Donor Report' },
  ]
  return (
    <>
      <CardGrid title="Blood Bank" reports={REPORTS as any} active={tab} onChange={(k) => setTab(k as BloodTab)} />
      {tab === 'blood-issue'     && <BloodIssueReport />}
      {tab === 'component-issue' && <ComponentIssueReport />}
      {tab === 'blood-donor'     && <BloodDonorReport />}
    </>
  )
}

function BloodIssueReport() {
  const [f, setF] = useState({ time: '', blood_collector: '', amount_collector: '', blood_group: '', donor: '' })
  const [submitted, setS] = useState(false)
  const { data: groups } = useQuery({ queryKey: ['mr-blood-groups'], queryFn: () => modReportsApi.bloodGroups().then(r => r.data) })
  const { data: donors } = useQuery({ queryKey: ['mr-blood-donors'], queryFn: () => modReportsApi.bloodDonors().then(r => r.data) })
  const { data: users }  = useQuery({ queryKey: ['mr-users'],        queryFn: () => modReportsApi.users().then(r => r.data) })

  const { data } = useQuery({
    queryKey: ['mr-blood-issue', f, submitted],
    queryFn: () => modReportsApi.bloodIssue({
      time_duration:    f.time || undefined,
      blood_collector:  f.blood_collector || undefined,
      amount_collector: f.amount_collector || undefined,
      blood_group:      f.blood_group || undefined,
      donor_id:         f.donor || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Blood Issue Report"
      filters={(
        <>
          <div className="grid grid-cols-12 gap-3 items-end">
            <Field className="col-span-3" label="Time Duration" required>
              <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
                {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Blood Collect By">
              <input value={f.blood_collector} onChange={e => setF({ ...f, blood_collector: e.target.value })}
                placeholder="Technician name" className="input w-full"/>
            </Field>
            <Field className="col-span-3" label="Amount Collect By">
              <select value={f.amount_collector} onChange={e => setF({ ...f, amount_collector: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {(users?.data ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Blood Group">
              <select value={f.blood_group} onChange={e => setF({ ...f, blood_group: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {(groups?.data ?? []).map((g: any) => <option key={g.key} value={g.key}>{g.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-12 gap-3 items-end mt-3">
            <Field className="col-span-3" label="Blood Donor">
              <select value={f.donor} onChange={e => setF({ ...f, donor: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {(donors?.data ?? []).map((d: any) => <option key={d.id} value={d.id}>{d.name} ({d.blood_group})</option>)}
              </select>
            </Field>
            <div className="col-span-9 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
          </div>
        </>
      )}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">Bill No</th>
              <th className="px-3 py-2">Issue Date</th>
              <th className="px-3 py-2">Received To</th>
              <th className="px-3 py-2">Blood Group</th>
              <th className="px-3 py-2">Gender</th>
              <th className="px-3 py-2">Donor Name</th>
              <th className="px-3 py-2">Bags</th>
              <th className="px-3 py-2">Amount Collect By</th>
              <th className="px-3 py-2">Blood Collect By</th>
              <th className="px-3 py-2 text-right">Blood Qty</th>
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
              ? <tr><td colSpan={16} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-emerald-700">{r.bill_no}</td>
                  <td className="px-3 py-2">{r.issue_date}</td>
                  <td className="px-3 py-2">{r.received_to || '—'}</td>
                  <td className="px-3 py-2">{r.blood_group || '—'}</td>
                  <td className="px-3 py-2">{r.gender || '—'}</td>
                  <td className="px-3 py-2">{r.donor_name || '—'}</td>
                  <td className="px-3 py-2">{r.bags}</td>
                  <td className="px-3 py-2">{r.amount_collect_by || '—'}</td>
                  <td className="px-3 py-2">{r.blood_collect_by || '—'}</td>
                  <td className="px-3 py-2 text-right">{r.blood_qty ?? '—'}</td>
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

function ComponentIssueReport() {
  const [f, setF] = useState({ time: '', component_collector: '', amount_collector: '', blood_group: '', component_type: '' })
  const [submitted, setS] = useState(false)
  const { data: groups } = useQuery({ queryKey: ['mr-blood-groups'], queryFn: () => modReportsApi.bloodGroups().then(r => r.data) })
  const { data: users }  = useQuery({ queryKey: ['mr-users'],        queryFn: () => modReportsApi.users().then(r => r.data) })

  const { data } = useQuery({
    queryKey: ['mr-comp-issue', f, submitted],
    queryFn: () => modReportsApi.componentIssue({
      time_duration:        f.time || undefined,
      component_collector:  f.component_collector || undefined,
      amount_collector:     f.amount_collector || undefined,
      blood_group:          f.blood_group || undefined,
      component_type:       f.component_type || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Component Issue Report"
      filters={(
        <>
          <div className="grid grid-cols-12 gap-3 items-end">
            <Field className="col-span-3" label="Time Duration" required>
              <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
                {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Component Collect By">
              <input value={f.component_collector} onChange={e => setF({ ...f, component_collector: e.target.value })}
                placeholder="Technician name" className="input w-full"/>
            </Field>
            <Field className="col-span-3" label="Amount Collect By">
              <select value={f.amount_collector} onChange={e => setF({ ...f, amount_collector: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {(users?.data ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
            <Field className="col-span-3" label="Blood Group">
              <select value={f.blood_group} onChange={e => setF({ ...f, blood_group: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {(groups?.data ?? []).map((g: any) => <option key={g.key} value={g.key}>{g.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-12 gap-3 items-end mt-3">
            <Field className="col-span-3" label="Components">
              <select value={f.component_type} onChange={e => setF({ ...f, component_type: e.target.value })} className="input w-full">
                <option value="">Select</option>
                {COMPONENT_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <div className="col-span-9 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
          </div>
        </>
      )}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">Bill No</th>
              <th className="px-3 py-2">Issue Date</th>
              <th className="px-3 py-2">Received To</th>
              <th className="px-3 py-2">Blood Group</th>
              <th className="px-3 py-2">Component</th>
              <th className="px-3 py-2">Gender</th>
              <th className="px-3 py-2">Donor Name</th>
              <th className="px-3 py-2">Bags</th>
              <th className="px-3 py-2">Component Collect By</th>
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
              ? <tr><td colSpan={15} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-emerald-700">{r.bill_no}</td>
                  <td className="px-3 py-2">{r.issue_date}</td>
                  <td className="px-3 py-2">{r.received_to || '—'}</td>
                  <td className="px-3 py-2">{r.blood_group || '—'}</td>
                  <td className="px-3 py-2">{r.component || '—'}</td>
                  <td className="px-3 py-2">{r.gender || '—'}</td>
                  <td className="px-3 py-2">{r.donor_name || '—'}</td>
                  <td className="px-3 py-2">{r.bags}</td>
                  <td className="px-3 py-2">{r.component_collect_by || '—'}</td>
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

function BloodDonorReport() {
  const [f, setF] = useState({ time: '', blood_group: '', donor: '' })
  const [submitted, setS] = useState(false)
  const { data: groups } = useQuery({ queryKey: ['mr-blood-groups'], queryFn: () => modReportsApi.bloodGroups().then(r => r.data) })
  const { data: donors } = useQuery({ queryKey: ['mr-blood-donors'], queryFn: () => modReportsApi.bloodDonors().then(r => r.data) })

  const { data } = useQuery({
    queryKey: ['mr-blood-donor', f, submitted],
    queryFn: () => modReportsApi.bloodDonor({
      time_duration: f.time || undefined,
      blood_group:   f.blood_group || undefined,
      donor_id:      f.donor || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Blood Donor Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Time Duration" required>
            <select required value={f.time} onChange={e => setF({ ...f, time: e.target.value })} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Blood Group">
            <select value={f.blood_group} onChange={e => setF({ ...f, blood_group: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(groups?.data ?? []).map((g: any) => <option key={g.key} value={g.key}>{g.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Blood Donor">
            <select value={f.donor} onChange={e => setF({ ...f, donor: e.target.value })} className="input w-full">
              <option value="">Select</option>
              {(donors?.data ?? []).map((d: any) => <option key={d.id} value={d.id}>{d.name} ({d.blood_group})</option>)}
            </select>
          </Field>
          <div className="col-span-3 flex justify-end"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Blood Group</th>
            <th className="px-3 py-2">Bags</th>
            <th className="px-3 py-2">Donor Name</th>
            <th className="px-3 py-2">Age</th>
            <th className="px-3 py-2">Donate Date</th>
            <th className="px-3 py-2 text-right">Amount (₹)</th>
            <th className="px-3 py-2 text-right">Discount</th>
            <th className="px-3 py-2 text-right">Tax</th>
            <th className="px-3 py-2 text-right">Net (₹)</th>
            <th className="px-3 py-2 text-right">Paid (₹)</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={10} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-emerald-700">{r.blood_group || '—'}</td>
                <td className="px-3 py-2">{r.bags}</td>
                <td className="px-3 py-2">{r.donor_name || '—'}</td>
                <td className="px-3 py-2">{r.age ?? '—'}</td>
                <td className="px-3 py-2">{r.donate_date || '—'}</td>
                <td className="px-3 py-2 text-right">{Number(r.amount || 0).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{Number(r.discount || 0).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{Number(r.tax || 0).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{Number(r.net_amount || 0).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{Number(r.paid || 0).toFixed(2)}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}


// ════════════════════════════════════════════════════════════════
//  Shared primitives (duplicated from ModuleReports.tsx to keep this file standalone)
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
