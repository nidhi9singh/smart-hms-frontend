// src/pages/billing/CaseBillDetail.tsx
// Full-screen case-bill detail: patient header + module tabs + per-tab charge lines.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Receipt, CreditCard, FileText, Printer, Menu,
  CalendarCheck, Stethoscope, FlaskConical, RadioTower, Droplets, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import AddPaymentModal from './AddPaymentModal'
import ViewPaymentsModal from './ViewPaymentsModal'
import GenerateBillModal from './GenerateBillModal'

const SINGLE_MODULE_OPTIONS = [
  { key: 'appointment',     label: 'Appointment',          icon: CalendarCheck, to: '/appointments' },
  { key: 'opd',             label: 'OPD',                  icon: Stethoscope,   to: '/opd'          },
  { key: 'pathology',       label: 'Pathology',            icon: FlaskConical,  to: '/pathology'    },
  { key: 'radiology',       label: 'Radiology',            icon: RadioTower,    to: '/radiology'    },
  { key: 'blood_issue',     label: 'Blood Issue',          icon: Droplets,      to: '/blood-bank'   },
  { key: 'component_issue', label: 'Blood Component Issue',icon: Layers,        to: '/blood-bank'   },
]

interface ModuleLine { [key: string]: any }
interface CaseDetail {
  case_id: string
  patient: any
  primary_opd_no?: string | null
  appointment_date?: string | null
  total_amount: number
  total_net: number
  total_paid: number
  total_balance: number
  by_module: Record<string, number>
  lines: {
    opd: ModuleLine[]; ipd: ModuleLine[]; pharmacy: ModuleLine[];
    pathology: ModuleLine[]; radiology: ModuleLine[];
    blood_issue: ModuleLine[]; component_issue: ModuleLine[]; ambulance: ModuleLine[];
  }
}

type Tab = 'opd' | 'ipd' | 'pharmacy' | 'pathology' | 'radiology' | 'blood_issue' | 'component_issue' | 'ambulance'

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'opd',             label: 'OPD' },
  { key: 'ipd',             label: 'IPD' },
  { key: 'pharmacy',        label: 'Pharmacy' },
  { key: 'pathology',       label: 'Pathology' },
  { key: 'radiology',       label: 'Radiology' },
  { key: 'blood_issue',     label: 'Blood Issue' },
  { key: 'component_issue', label: 'Component Issue' },
  { key: 'ambulance',       label: 'Ambulance' },
]


export default function CaseBillDetail({ data }: { data: CaseDetail }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('opd')
  const [showAddPayment,   setShowAddPayment]   = useState(false)
  const [showViewPayments, setShowViewPayments] = useState(false)
  const [showGenerateBill, setShowGenerateBill] = useState(false)
  const [showModuleMenu,   setShowModuleMenu]   = useState(false)
  const p = data.patient

  const age = [
    p?.age_years  ? `${p.age_years} Year`   : null,
    p?.age_months ? `${p.age_months} Month` : null,
    p?.age_days   ? `${p.age_days} Day`     : null,
  ].filter(Boolean).join(', ') || '0 Year, 0 Month, 0 Day'

  const caseId = data.case_id
  const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(String(caseId))}&code=Code128&translate-esc=true&dpi=96`
  const qrUrl      = `https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(String(caseId))}`

  return (
    <div className="card relative">
      {/* Single Module Billing dropdown (top-right) */}
      <div className="absolute top-3 right-3 z-10">
        <button
          type="button"
          onClick={() => setShowModuleMenu(v => !v)}
          title="Single Module Billing"
          className="w-9 h-9 rounded bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700"
        >
          <Menu size={16}/>
        </button>
        {showModuleMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowModuleMenu(false)}/>
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border z-20">
              <div className="px-3 py-2 border-b text-xs font-semibold text-gray-700">Single Module Billing</div>
              <ul className="py-1 text-sm">
                {SINGLE_MODULE_OPTIONS.map(o => (
                  <li key={o.key}>
                    <button
                      type="button"
                      onClick={() => { setShowModuleMenu(false); navigate(o.to) }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-brand-50 text-gray-700 hover:text-brand-700"
                    >
                      <o.icon size={13} className="text-gray-400 flex-shrink-0"/>
                      {o.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Patient header */}
      <div className="px-5 py-5 border-b">
        <div className="flex gap-5">
          {/* Photo + Bill Summary */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            {p?.photo_path
              ? <img src={p.photo_path} alt={p.name} className="w-28 h-28 object-cover rounded border"/>
              : <div className="w-28 h-28 rounded border bg-gray-50 flex items-center justify-center text-xs text-gray-400">No Image<br/>Available</div>
            }
            <button type="button" onClick={() => toast.info('Bill summary print not yet wired')}
              className="btn btn-primary text-xs px-3 py-1.5">Bill Summary</button>
          </div>

          {/* 2-column patient info grid */}
          <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <Row label="Case ID"          value={<span className="font-semibold text-gray-900">{caseId}</span>}/>
            <Row label="Appointment Date" value={data.appointment_date ? new Date(data.appointment_date).toLocaleString() : '—'}/>
            <Row label="Name"             value={<span className="text-brand-700 font-medium">{p?.name} {p?.case_id ? <span className="text-gray-500 font-normal">({p.case_id})</span> : null}</span>}/>
            <Row label="Guardian Name"    value={p?.guardian_name || '—'}/>
            <Row label="Gender"           value={p?.gender || '—'}/>
            <Row label="Age"              value={age}/>
            <Row label="Phone"            value={p?.phone || '—'}/>
            <Row label="Credit Limit (₹)" value="0.00"/>
            <Row label="OPD No"           value={data.primary_opd_no || '—'}/>
            <span/>
            <Row label="Barcode"          value={<img src={barcodeUrl} alt="" className="h-12"/>}/>
            <Row label="QR Code"          value={<img src={qrUrl} alt="" className="w-16 h-16"/>}/>
          </div>
        </div>
      </div>

      {/* Tab nav + action buttons */}
      <div className="px-5 py-2 border-b flex items-center justify-between">
        <nav className="flex items-center gap-1 -mb-[9px]">
          {TABS.map(t => {
            const count = data.by_module?.[t.key] ?? 0
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn(
                  'px-3 py-2 text-xs border-b-2 transition',
                  tab === t.key
                    ? 'text-brand-700 font-semibold border-brand-600'
                    : 'text-gray-600 border-transparent hover:text-brand-700'
                )}>
                {t.label}{count > 0 && <span className="ml-1 text-[10px] text-gray-400">({count})</span>}
              </button>
            )
          })}
        </nav>
        <div className="flex gap-2">
          <button onClick={() => setShowAddPayment(true)}
            className="btn btn-primary text-xs flex items-center gap-1"><CreditCard size={12}/> Add Payment</button>
          <button onClick={() => setShowViewPayments(true)}
            className="btn btn-primary text-xs flex items-center gap-1"><Receipt size={12}/> View Payments</button>
          <button onClick={() => setShowGenerateBill(true)}
            className="btn btn-primary text-xs flex items-center gap-1"><FileText size={12}/> Generate Bill</button>
        </div>
      </div>

      <AddPaymentModal     caseId={data.case_id} open={showAddPayment}   onClose={() => setShowAddPayment(false)}/>
      <ViewPaymentsModal   caseId={data.case_id} open={showViewPayments} onClose={() => setShowViewPayments(false)}/>
      <GenerateBillModal   caseId={data.case_id} open={showGenerateBill} onClose={() => setShowGenerateBill(false)}/>

      {/* Tab content */}
      <div className="overflow-x-auto">
        {tab === 'opd'             && <OpdTable rows={data.lines.opd}/>}
        {tab === 'ipd'             && <IpdTable rows={data.lines.ipd}/>}
        {tab === 'pharmacy'        && <PharmacyTable rows={data.lines.pharmacy}/>}
        {tab === 'pathology'       && <TestTable    rows={data.lines.pathology}/>}
        {tab === 'radiology'       && <TestTable    rows={data.lines.radiology}/>}
        {tab === 'blood_issue'     && <BloodTable   rows={data.lines.blood_issue}/>}
        {tab === 'component_issue' && <ComponentTable rows={data.lines.component_issue}/>}
        {tab === 'ambulance'       && <AmbulanceTable rows={data.lines.ambulance}/>}
      </div>
    </div>
  )
}


// ─── Helpers ─────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-gray-500 text-xs w-32 flex-shrink-0">{label}</span>
      <span className="text-gray-800 break-words">{value}</span>
    </div>
  )
}

function MoneyTotalRow({ total, colSpan }: { total: number; colSpan: number }) {
  return (
    <tr className="border-t bg-gray-50">
      <td colSpan={colSpan} className="px-3 py-2 text-right font-semibold text-gray-700">
        Total : ₹{Number(total || 0).toFixed(2)}
      </td>
    </tr>
  )
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return <tr><td colSpan={colSpan} className="px-3 py-6 text-center text-gray-400 text-xs">No records</td></tr>
}


// ─── Per-module tables ──────────────────────────────────────
function OpdTable({ rows }: { rows: any[] }) {
  const total = rows.reduce((a, r) => a + (Number(r.amount) || 0), 0)
  return (
    <table className="w-full text-xs">
      <thead className="bg-gray-50 text-left text-gray-600">
        <tr>
          <th className="px-3 py-2">Date</th>
          <th className="px-3 py-2">Charge Name / Charge Note</th>
          <th className="px-3 py-2">Charge Type</th>
          <th className="px-3 py-2">Charge Category</th>
          <th className="px-3 py-2">Qty</th>
          <th className="px-3 py-2 text-right">Standard Charge (₹)</th>
          <th className="px-3 py-2 text-right">Applied Charge (₹)</th>
          <th className="px-3 py-2 text-right">TPA Charge (₹)</th>
          <th className="px-3 py-2 text-right">Discount</th>
          <th className="px-3 py-2 text-right">Tax</th>
          <th className="px-3 py-2 text-right">Amount (₹)</th>
          <th className="px-3 py-2 text-right">Action</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? <EmptyRow colSpan={12}/> : rows.map((r, i) => (
          <tr key={i} className="border-t hover:bg-gray-50">
            <td className="px-3 py-2">{r.date ? new Date(r.date).toLocaleString() : '—'}</td>
            <td className="px-3 py-2">{r.charge_name}</td>
            <td className="px-3 py-2">{r.charge_type || '—'}</td>
            <td className="px-3 py-2">{r.charge_category || '—'}</td>
            <td className="px-3 py-2">{r.qty}</td>
            <td className="px-3 py-2 text-right">{Number(r.standard_charge || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">{Number(r.applied_charge || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">{Number(r.tpa_charge || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">{Number(r.discount || 0).toFixed(2)} ({Number(r.discount_pct || 0).toFixed(2)}%)</td>
            <td className="px-3 py-2 text-right">{Number(r.tax || 0).toFixed(2)} ({Number(r.tax_pct || 0).toFixed(2)}%)</td>
            <td className="px-3 py-2 text-right font-semibold">{Number(r.amount || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">
              <button title="Print" className="icon-btn"><Printer size={11}/></button>
            </td>
          </tr>
        ))}
        {rows.length > 0 && <MoneyTotalRow total={total} colSpan={12}/>}
      </tbody>
    </table>
  )
}

function IpdTable({ rows }: { rows: any[] }) {
  const total = rows.reduce((a, r) => a + (Number(r.amount) || 0), 0)
  return (
    <table className="w-full text-xs">
      <thead className="bg-gray-50 text-left text-gray-600">
        <tr>
          <th className="px-3 py-2">Date</th>
          <th className="px-3 py-2">Charge Name</th>
          <th className="px-3 py-2">Charge Type</th>
          <th className="px-3 py-2">Charge Category</th>
          <th className="px-3 py-2">Qty</th>
          <th className="px-3 py-2 text-right">Standard (₹)</th>
          <th className="px-3 py-2 text-right">Applied (₹)</th>
          <th className="px-3 py-2 text-right">Discount</th>
          <th className="px-3 py-2 text-right">Tax</th>
          <th className="px-3 py-2 text-right">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? <EmptyRow colSpan={10}/> : rows.map((r, i) => (
          <tr key={i} className="border-t hover:bg-gray-50">
            <td className="px-3 py-2">{r.date ? r.date.slice(0, 16).replace('T', ' ') : '—'}</td>
            <td className="px-3 py-2">{r.charge_name}</td>
            <td className="px-3 py-2">{r.charge_type || '—'}</td>
            <td className="px-3 py-2">{r.charge_category || '—'}</td>
            <td className="px-3 py-2">{r.qty}</td>
            <td className="px-3 py-2 text-right">{Number(r.standard_charge || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">{Number(r.applied_charge || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">{Number(r.discount || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">{Number(r.tax || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right font-semibold">{Number(r.amount || 0).toFixed(2)}</td>
          </tr>
        ))}
        {rows.length > 0 && <MoneyTotalRow total={total} colSpan={10}/>}
      </tbody>
    </table>
  )
}

function PharmacyTable({ rows }: { rows: any[] }) {
  const total = rows.reduce((a, r) => a + (Number(r.amount) || 0), 0)
  return (
    <table className="w-full text-xs">
      <thead className="bg-gray-50 text-left text-gray-600">
        <tr>
          <th className="px-3 py-2">Bill No</th>
          <th className="px-3 py-2">Date</th>
          <th className="px-3 py-2">Medicine</th>
          <th className="px-3 py-2">Batch No</th>
          <th className="px-3 py-2 text-right">Qty</th>
          <th className="px-3 py-2 text-right">Sale Price</th>
          <th className="px-3 py-2 text-right">Discount</th>
          <th className="px-3 py-2 text-right">Tax</th>
          <th className="px-3 py-2 text-right">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? <EmptyRow colSpan={9}/> : rows.map((r, i) => (
          <tr key={i} className="border-t hover:bg-gray-50">
            <td className="px-3 py-2 font-mono text-brand-700">{r.bill_no}</td>
            <td className="px-3 py-2">{r.date}</td>
            <td className="px-3 py-2">{r.medicine || '—'}</td>
            <td className="px-3 py-2">{r.batch_no || '—'}</td>
            <td className="px-3 py-2 text-right">{r.qty}</td>
            <td className="px-3 py-2 text-right">{Number(r.sale_price || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">{Number(r.discount || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">{Number(r.tax || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right font-semibold">{Number(r.amount || 0).toFixed(2)}</td>
          </tr>
        ))}
        {rows.length > 0 && <MoneyTotalRow total={total} colSpan={9}/>}
      </tbody>
    </table>
  )
}

function TestTable({ rows }: { rows: any[] }) {
  const total = rows.reduce((a, r) => a + (Number(r.amount) || 0), 0)
  return (
    <table className="w-full text-xs">
      <thead className="bg-gray-50 text-left text-gray-600">
        <tr>
          <th className="px-3 py-2">Bill No</th>
          <th className="px-3 py-2">Date</th>
          <th className="px-3 py-2">Test Name</th>
          <th className="px-3 py-2 text-right">Price</th>
          <th className="px-3 py-2 text-right">Tax</th>
          <th className="px-3 py-2 text-right">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? <EmptyRow colSpan={6}/> : rows.map((r, i) => (
          <tr key={i} className="border-t hover:bg-gray-50">
            <td className="px-3 py-2 font-mono text-brand-700">{r.bill_no}</td>
            <td className="px-3 py-2">{r.date}</td>
            <td className="px-3 py-2">{r.test_name}</td>
            <td className="px-3 py-2 text-right">{Number(r.price || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">{Number(r.tax || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right font-semibold">{Number(r.amount || 0).toFixed(2)}</td>
          </tr>
        ))}
        {rows.length > 0 && <MoneyTotalRow total={total} colSpan={6}/>}
      </tbody>
    </table>
  )
}

function BloodTable({ rows }: { rows: any[] }) {
  const total = rows.reduce((a, r) => a + (Number(r.net_amount) || 0), 0)
  return (
    <table className="w-full text-xs">
      <thead className="bg-gray-50 text-left text-gray-600">
        <tr>
          <th className="px-3 py-2">Bill No</th>
          <th className="px-3 py-2">Date</th>
          <th className="px-3 py-2">Blood Group</th>
          <th className="px-3 py-2">Bag No</th>
          <th className="px-3 py-2">Donor</th>
          <th className="px-3 py-2 text-right">Qty</th>
          <th className="px-3 py-2 text-right">Amount</th>
          <th className="px-3 py-2 text-right">Discount</th>
          <th className="px-3 py-2 text-right">Tax</th>
          <th className="px-3 py-2 text-right">Net (₹)</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? <EmptyRow colSpan={10}/> : rows.map((r, i) => (
          <tr key={i} className="border-t hover:bg-gray-50">
            <td className="px-3 py-2 font-mono text-brand-700">{r.bill_no}</td>
            <td className="px-3 py-2">{r.date}</td>
            <td className="px-3 py-2">{r.blood_group || '—'}</td>
            <td className="px-3 py-2">{r.bag_no || '—'}</td>
            <td className="px-3 py-2">{r.donor_name || '—'}</td>
            <td className="px-3 py-2 text-right">{r.blood_qty ?? '—'}</td>
            <td className="px-3 py-2 text-right">{Number(r.amount || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">{Number(r.discount || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">{Number(r.tax || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right font-semibold">{Number(r.net_amount || 0).toFixed(2)}</td>
          </tr>
        ))}
        {rows.length > 0 && <MoneyTotalRow total={total} colSpan={10}/>}
      </tbody>
    </table>
  )
}

function ComponentTable({ rows }: { rows: any[] }) {
  const total = rows.reduce((a, r) => a + (Number(r.net_amount) || 0), 0)
  return (
    <table className="w-full text-xs">
      <thead className="bg-gray-50 text-left text-gray-600">
        <tr>
          <th className="px-3 py-2">Bill No</th>
          <th className="px-3 py-2">Date</th>
          <th className="px-3 py-2">Blood Group</th>
          <th className="px-3 py-2">Component</th>
          <th className="px-3 py-2">Bag No</th>
          <th className="px-3 py-2">Donor</th>
          <th className="px-3 py-2 text-right">Amount</th>
          <th className="px-3 py-2 text-right">Discount</th>
          <th className="px-3 py-2 text-right">Tax</th>
          <th className="px-3 py-2 text-right">Net (₹)</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? <EmptyRow colSpan={10}/> : rows.map((r, i) => (
          <tr key={i} className="border-t hover:bg-gray-50">
            <td className="px-3 py-2 font-mono text-brand-700">{r.bill_no}</td>
            <td className="px-3 py-2">{r.date}</td>
            <td className="px-3 py-2">{r.blood_group || '—'}</td>
            <td className="px-3 py-2">{r.component || '—'}</td>
            <td className="px-3 py-2">{r.bag_no || '—'}</td>
            <td className="px-3 py-2">{r.donor_name || '—'}</td>
            <td className="px-3 py-2 text-right">{Number(r.amount || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">{Number(r.discount || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">{Number(r.tax || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right font-semibold">{Number(r.net_amount || 0).toFixed(2)}</td>
          </tr>
        ))}
        {rows.length > 0 && <MoneyTotalRow total={total} colSpan={10}/>}
      </tbody>
    </table>
  )
}

function AmbulanceTable({ rows }: { rows: any[] }) {
  const total = rows.reduce((a, r) => a + (Number(r.net_amount) || 0), 0)
  return (
    <table className="w-full text-xs">
      <thead className="bg-gray-50 text-left text-gray-600">
        <tr>
          <th className="px-3 py-2">Bill No</th>
          <th className="px-3 py-2">Date</th>
          <th className="px-3 py-2">Vehicle No</th>
          <th className="px-3 py-2">Vehicle Model</th>
          <th className="px-3 py-2">Driver</th>
          <th className="px-3 py-2 text-right">Distance (km)</th>
          <th className="px-3 py-2 text-right">Amount</th>
          <th className="px-3 py-2 text-right">Discount</th>
          <th className="px-3 py-2 text-right">Tax</th>
          <th className="px-3 py-2 text-right">Net (₹)</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? <EmptyRow colSpan={10}/> : rows.map((r, i) => (
          <tr key={i} className="border-t hover:bg-gray-50">
            <td className="px-3 py-2 font-mono text-brand-700">{r.bill_no}</td>
            <td className="px-3 py-2">{r.date}</td>
            <td className="px-3 py-2">{r.vehicle_no || '—'}</td>
            <td className="px-3 py-2">{r.vehicle_model || '—'}</td>
            <td className="px-3 py-2">{r.driver_name || '—'}</td>
            <td className="px-3 py-2 text-right">{r.distance_km ?? '—'}</td>
            <td className="px-3 py-2 text-right">{Number(r.amount || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">{Number(r.discount || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right">{Number(r.tax || 0).toFixed(2)}</td>
            <td className="px-3 py-2 text-right font-semibold">{Number(r.net_amount || 0).toFixed(2)}</td>
          </tr>
        ))}
        {rows.length > 0 && <MoneyTotalRow total={total} colSpan={10}/>}
      </tbody>
    </table>
  )
}
