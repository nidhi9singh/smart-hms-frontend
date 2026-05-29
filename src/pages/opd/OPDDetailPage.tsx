// src/pages/opd/OPDDetailPage.tsx
// OPD Patient Detail — matches Image 3 exactly (10 sub-tabs)
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Edit2, Trash2, Printer,
  LayoutDashboard, Calendar, Pill, FlaskConical, Scissors,
  DollarSign, CreditCard, Video, Clock, BookOpen, Heart,
} from 'lucide-react'
import { opdApi, type OPDRecord, type OPDCharge, type OPDPayment } from '@/api/opd'
function PageLoader() {
  return <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-gray-300 border-t-[#00a8e8] rounded-full animate-spin" /></div>
}
import { cn, fmtDate } from '@/lib/utils'

interface Props {
  opdId: number
  onBack: () => void
}

type SubTab = 'overview' | 'visits' | 'medication' | 'lab' | 'operations' | 'charges' | 'payments' | 'consultation' | 'timeline' | 'treatment' | 'vitals'

const SUB_TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',     label: 'Overview',           icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { id: 'visits',       label: 'Visits',             icon: <Calendar className="w-3.5 h-3.5" /> },
  { id: 'medication',   label: 'Medication',         icon: <Pill className="w-3.5 h-3.5" /> },
  { id: 'lab',          label: 'Lab Investigation',  icon: <FlaskConical className="w-3.5 h-3.5" /> },
  { id: 'operations',   label: 'Operations',         icon: <Scissors className="w-3.5 h-3.5" /> },
  { id: 'charges',      label: 'Charges',            icon: <DollarSign className="w-3.5 h-3.5" /> },
  { id: 'payments',     label: 'Payments',           icon: <CreditCard className="w-3.5 h-3.5" /> },
  { id: 'consultation', label: 'Live Consultation',  icon: <Video className="w-3.5 h-3.5" /> },
  { id: 'timeline',     label: 'Timeline',           icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'treatment',    label: 'Treatment History',  icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: 'vitals',       label: 'Vitals',             icon: <Heart className="w-3.5 h-3.5" /> },
]

function BillingSummaryCard({ label, percent, paid, total }: { label: string; percent: number; paid: number; total: number }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase">{label}</p>
        <p className="text-xs text-gray-400">{percent}%</p>
      </div>
      <p className="text-xs text-gray-600">₹{paid.toFixed(2)}/{total > 0 ? `₹${total.toFixed(2)}` : '₹0'}</p>
    </div>
  )
}

function EmptyTable({ headers }: { headers: string[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          {headers.map(h => <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-600">{h}</th>)}
        </tr>
      </thead>
      <tbody>
        <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-gray-400 text-sm">No records found</td></tr>
      </tbody>
    </table>
  )
}

export default function OPDDetailPage({ opdId, onBack }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('overview')

  const { data, isLoading } = useQuery({
    queryKey: ['opd-detail', opdId],
    queryFn: () => opdApi.get(opdId).then(r => r.data),
  })

  const opd = data?.data as OPDRecord | undefined

  if (isLoading) return <PageLoader />
  if (!opd) return (
    <div className="p-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to list
      </button>
      <p className="text-gray-500">OPD record not found</p>
    </div>
  )

  const charges  = opd.charges ?? []
  const payments = opd.payments ?? []
  const meds     = opd.medications ?? []
  const labs     = opd.lab_investigations ?? []
  const ops      = opd.operations ?? []
  const consults = opd.live_consultations ?? []

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  return (
    <div className="animate-fade-in">

      {/* ── Back + Sub-tabs ────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-0">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 pt-3 pb-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {SUB_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
                subTab === t.id
                  ? 'border-[#00a8e8] text-[#00a8e8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Content ────────────────────── */}
      <div className="p-6">
        {subTab === 'overview' && <OverviewTab opd={opd} charges={charges} payments={payments} meds={meds} labs={labs} ops={ops} consults={consults} />}
        {subTab === 'visits'       && <EmptyTable headers={['Visit No', 'Date', 'Consultant', 'Symptoms', 'Status']} />}
        {subTab === 'medication'   && <MedicationTab meds={meds} />}
        {subTab === 'lab'          && <LabTab labs={labs} />}
        {subTab === 'operations'   && <OperationsTab ops={ops} />}
        {subTab === 'charges'      && <ChargesTab charges={charges} />}
        {subTab === 'payments'     && <PaymentsTab payments={payments} />}
        {subTab === 'consultation' && <ConsultationTab consults={consults} />}
        {subTab === 'timeline'     && <EmptyTable headers={['Date', 'Title', 'Description', 'Created By']} />}
        {subTab === 'treatment'    && <EmptyTable headers={['Date', 'Treatment', 'Doctor', 'Notes']} />}
        {subTab === 'vitals'       && <EmptyTable headers={['Date', 'Height', 'Weight', 'BP', 'Temperature', 'Pulse', 'SpO2']} />}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   OVERVIEW TAB
   ═══════════════════════════════════════════ */
function OverviewTab({ opd, charges, payments, meds, labs, ops, consults }: {
  opd: OPDRecord; charges: OPDCharge[]; payments: OPDPayment[]
  meds: any[]; labs: any[]; ops: any[]; consults: any[]
}) {
  const b = (key: string) => (opd as any)[key] ?? { percent: 0, paid: 0, total: 0 }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ═══ LEFT — Patient Info ═══ */}
      <div className="lg:col-span-1 space-y-5">

        {/* Patient card */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900 uppercase">
              {opd.patient_name ?? 'PATIENT'} ({opd.case_id})
            </h3>
            <div className="flex gap-1">
              <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-50"><Edit2 className="w-4 h-4" /></button>
              <button className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-50"><Printer className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex gap-4">
            {/* Photo */}
            <div className="w-24 h-28 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
              {opd.photo_path
                ? <img src={opd.photo_path} alt="" className="w-full h-full object-cover rounded" />
                : 'NO IMAGE\nAVAILABLE'}
            </div>

            {/* Info grid */}
            <div className="text-sm space-y-1.5 flex-1">
              <InfoRow label="Gender" value={opd.gender ?? '—'} />
              <InfoRow label="Age" value={opd.age ?? '—'} />
              <InfoRow label="Guardian Name" value={opd.guardian_name ?? ''} />
              <InfoRow label="Phone" value={opd.phone ?? '—'} />
              <InfoRow label="TPA" value={opd.tpa ?? ''} />
              <InfoRow label="TPA ID" value={opd.tpa_id_str ?? ''} />
              <InfoRow label="TPA Validity" value={opd.tpa_validity ?? ''} />
            </div>
          </div>

          {/* Case / OPD */}
          <div className="mt-4 pt-3 border-t border-gray-100 text-sm space-y-1">
            <InfoRow label="Case ID" value={opd.case_id} />
            <InfoRow label="OPD No" value={opd.opd_no} />
          </div>

          {/* Medical notes */}
          <div className="mt-4 pt-3 border-t border-gray-100 text-sm space-y-2">
            <div><span className="font-medium text-gray-700">🩺 Known Allergies:</span> <span className="text-gray-500">{opd.any_known_allergies || ''}</span></div>
            <div><span className="font-medium text-gray-700">🩺 Findings:</span> <span className="text-gray-500">{opd.note || ''}</span></div>
            <div><span className="font-medium text-gray-700">🩺 Symptoms:</span> <span className="text-gray-500">{opd.symptoms ?? opd.symptoms_description ?? ''}</span></div>
          </div>

          {/* Consultant Doctor */}
          {opd.consultant_name && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-700 uppercase mb-2">Consultant Doctor</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  {opd.consultant_name.charAt(0)}
                </div>
                <span className="text-sm text-gray-800">{opd.consultant_name} ({opd.consultant_code ?? opd.consultant_id})</span>
              </div>
            </div>
          )}

          {/* Timeline placeholder */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-base font-medium text-gray-700">Timeline</p>
            <p className="text-xs text-gray-400 mt-1">No timeline entries</p>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT — Billing + Data Tables ═══ */}
      <div className="lg:col-span-2 space-y-5">

        {/* Billing summary grid */}
        <div className="grid grid-cols-2 gap-4">
          <BillingSummaryCard label="OPD Payment/Billing" {...b('opd_billing')} />
          <BillingSummaryCard label="Pharmacy Payment/Billing" {...b('pharmacy_billing')} />
          <BillingSummaryCard label="Pathology Payment/Billing" {...b('pathology_billing')} />
          <BillingSummaryCard label="Radiology Payment/Billing" {...b('radiology_billing')} />
          <BillingSummaryCard label="Blood Bank Payment/Billing" {...b('blood_bank_billing')} />
          <BillingSummaryCard label="Ambulance Payment/Billing" {...b('ambulance_billing')} />
        </div>

        {/* Medication */}
        <SectionCard title="MEDICATION">
          <MedicationTab meds={meds} />
        </SectionCard>

        {/* Lab Investigation */}
        <SectionCard title="LAB INVESTIGATION">
          <LabTab labs={labs} />
        </SectionCard>

        {/* Operation */}
        <SectionCard title="OPERATION">
          <OperationsTab ops={ops} />
        </SectionCard>

        {/* Charges */}
        <SectionCard title="CHARGES">
          <ChargesTab charges={charges} />
        </SectionCard>

        {/* Payment */}
        <SectionCard title="PAYMENT">
          <PaymentsTab payments={payments} />
        </SectionCard>

        {/* Live Consultation */}
        <SectionCard title="LIVE CONSULTATION">
          <ConsultationTab consults={consults} />
        </SectionCard>
      </div>
    </div>
  )
}

/* ─── Shared sub-components ──────────── */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="w-32 text-gray-500 font-medium flex-shrink-0">{label}</span>
      <span className="text-gray-900">{value || '—'}</span>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-2.5 border-b border-gray-100">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{title}</h4>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

function MedicationTab({ meds }: { meds: any[] }) {
  return meds.length === 0
    ? <EmptyTable headers={['Date', 'Medicine Name', 'Dose', 'Time', 'Remark']} />
    : (
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-200">{['Date', 'Medicine Name', 'Dose', 'Time', 'Remark'].map(h => <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-600">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">
          {meds.map((m, i) => (
            <tr key={i}><td className="px-4 py-2">{fmtDate(m.date)}</td><td className="px-4 py-2">{m.medicine_name}</td><td className="px-4 py-2">{m.dose}</td><td className="px-4 py-2">{m.time}</td><td className="px-4 py-2 text-gray-400">{m.remark ?? ''}</td></tr>
          ))}
        </tbody>
      </table>
    )
}

function LabTab({ labs }: { labs: any[] }) {
  return labs.length === 0
    ? <EmptyTable headers={['Test Name', 'Lab', 'Sample Collected', 'Expected Date', 'Approved By']} />
    : (
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-200">{['Test Name', 'Lab', 'Sample Collected', 'Expected Date', 'Approved By'].map(h => <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-600">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">
          {labs.map((l, i) => (
            <tr key={i}><td className="px-4 py-2">{l.test_name}</td><td className="px-4 py-2">{l.lab}</td><td className="px-4 py-2">{l.sample_collected}</td><td className="px-4 py-2">{fmtDate(l.expected_date)}</td><td className="px-4 py-2">{l.approved_by ?? ''}</td></tr>
          ))}
        </tbody>
      </table>
    )
}

function OperationsTab({ ops }: { ops: any[] }) {
  return ops.length === 0
    ? <EmptyTable headers={['Reference No', 'Operation Date', 'Operation Name', 'Operation Category', 'OT Technician']} />
    : (
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-200">{['Reference No', 'Operation Date', 'Operation Name', 'Operation Category', 'OT Technician'].map(h => <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-600">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">
          {ops.map((o, i) => (
            <tr key={i}><td className="px-4 py-2">{o.reference_no}</td><td className="px-4 py-2">{fmtDate(o.operation_date)}</td><td className="px-4 py-2">{o.operation_name}</td><td className="px-4 py-2">{o.operation_category}</td><td className="px-4 py-2">{o.ot_technician ?? ''}</td></tr>
          ))}
        </tbody>
      </table>
    )
}

function ChargesTab({ charges }: { charges: OPDCharge[] }) {
  return charges.length === 0
    ? <EmptyTable headers={['Name', 'Charge Type', 'Standard Charge (₹)', 'Discount', 'Tax', 'Applied Charge (₹)', 'Amount (₹)']} />
    : (
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-200">{['Name', 'Charge Type', 'Standard Charge (₹)', 'Discount', 'Tax', 'Applied Charge (₹)', 'Amount (₹)'].map(h => <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-600">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">
          {charges.map((c, i) => (
            <tr key={i}>
              <td className="px-4 py-2">{c.name}</td>
              <td className="px-4 py-2">{c.charge_type}</td>
              <td className="px-4 py-2 text-right">{c.standard_charge.toFixed(2)}</td>
              <td className="px-4 py-2 text-right">{c.discount.toFixed(2)} ({((c.discount / (c.standard_charge || 1)) * 100).toFixed(2)}%)</td>
              <td className="px-4 py-2 text-right">{c.tax.toFixed(2)} ({((c.tax / (c.applied_charge || 1)) * 100).toFixed(2)}%)</td>
              <td className="px-4 py-2 text-right">{c.applied_charge.toFixed(2)}</td>
              <td className="px-4 py-2 text-right font-semibold">{c.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
}

function PaymentsTab({ payments }: { payments: OPDPayment[] }) {
  return payments.length === 0
    ? <EmptyTable headers={['Transaction ID', 'Date', 'Note', 'Payment Mode', 'Paid Amount (₹)']} />
    : (
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-200">{['Transaction ID', 'Date', 'Note', 'Payment Mode', 'Paid Amount (₹)'].map(h => <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-600">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">
          {payments.map((p, i) => (
            <tr key={i}>
              <td className="px-4 py-2 font-mono text-xs">{p.transaction_id}</td>
              <td className="px-4 py-2">{p.date}</td>
              <td className="px-4 py-2 text-gray-400">{p.note ?? ''}</td>
              <td className="px-4 py-2">{p.payment_mode}</td>
              <td className="px-4 py-2 text-right">{p.paid_amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
}

function ConsultationTab({ consults }: { consults: any[] }) {
  return consults.length === 0
    ? <EmptyTable headers={['Consultation Title', 'Date', 'Created By', 'Created For', 'Patient']} />
    : (
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-200">{['Consultation Title', 'Date', 'Created By', 'Created For', 'Patient'].map(h => <th key={h} className="px-4 py-2.5 text-left font-medium text-gray-600">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100">
          {consults.map((c, i) => (
            <tr key={i}><td className="px-4 py-2">{c.consultation_title}</td><td className="px-4 py-2">{fmtDate(c.date)}</td><td className="px-4 py-2">{c.created_by}</td><td className="px-4 py-2">{c.created_for}</td><td className="px-4 py-2">{c.patient}</td></tr>
          ))}
        </tbody>
      </table>
    )
}

