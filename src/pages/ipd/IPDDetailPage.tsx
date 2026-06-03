// src/pages/ipd/IPDDetailPage.tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, LayoutGrid, FileText, Pill, ClipboardList, Stethoscope,
  FlaskConical, Scissors, Receipt, Wallet, Video, BedDouble,
  CalendarCheck2, History, Users2, Plus, Edit2, Lock, Trash2,
  Menu as MenuIcon, Phone, HeartPulse, Baby, Activity,
} from 'lucide-react'
import { toast } from 'sonner'
import { ipdApi } from '@/api/ipd'
import { patientsApi } from '@/api/patients'
import { hrApi } from '@/api/hr'
import { cn } from '@/lib/utils'

type TabKey =
  | 'overview' | 'nurse' | 'medication' | 'prescription'
  | 'consultant' | 'lab' | 'operations' | 'charges'
  | 'payments' | 'live' | 'bed' | 'timeline' | 'treatment'
  | 'vitals' | 'obstetric' | 'postnatal' | 'antenatal'

const TABS: { id: TabKey; label: string; icon: any }[] = [
  { id: 'overview',     label: 'Overview',           icon: LayoutGrid     },
  { id: 'nurse',        label: 'Nurse Notes',        icon: FileText       },
  { id: 'medication',   label: 'Medication',         icon: Pill           },
  { id: 'prescription', label: 'Prescription',       icon: ClipboardList  },
  { id: 'consultant',   label: 'Consultant Register', icon: Stethoscope   },
  { id: 'lab',          label: 'Lab Investigation',  icon: FlaskConical   },
  { id: 'operations',   label: 'Operations',         icon: Scissors       },
  { id: 'charges',      label: 'Charges',            icon: Receipt        },
  { id: 'payments',     label: 'Payments',           icon: Wallet         },
  { id: 'live',         label: 'Live Consultation',  icon: Video          },
  { id: 'bed',          label: 'Bed History',        icon: BedDouble      },
  { id: 'timeline',     label: 'Timeline',           icon: CalendarCheck2 },
  { id: 'treatment',    label: 'Treatment History',  icon: History        },
  { id: 'vitals',       label: 'Vitals',             icon: HeartPulse     },
  { id: 'obstetric',    label: 'Previous Obstetric History', icon: Users2 },
  { id: 'postnatal',    label: 'Postnatal History',  icon: Baby           },
  { id: 'antenatal',    label: 'Antenatal',          icon: Activity       },
]

export default function IPDDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav     = useNavigate()
  const aid     = Number(id)
  const [tab, setTab] = useState<TabKey>('overview')

  const { data: admData, isLoading } = useQuery({
    queryKey: ['ipd', aid],
    queryFn:  () => ipdApi.get(aid).then(r => r.data),
    enabled:  !!aid,
  })
  const a = admData?.data ?? null

  const { data: patData } = useQuery({
    queryKey: ['patient', a?.patient_id],
    queryFn:  () => patientsApi.get(a!.patient_id).then(r => r.data),
    enabled:  !!a?.patient_id,
  })
  const p = patData?.data ?? null

  const { data: staffData } = useQuery({
    queryKey: ['staff-all'],
    queryFn:  () => hrApi.listStaff({ per_page: 500 }).then(r => r.data),
  })
  const staffMap = new Map(((staffData?.data ?? []) as any[]).map((s: any) => [s.id, s]))

  // Section queries — load in parallel for the Overview tab and made
  // available to dedicated tabs too.
  const sections = useQueries({
    queries: [
      { queryKey: ['ipd-nurse',        aid], queryFn: () => ipdApi.nurseNotes(aid).then(r => r.data),         enabled: !!aid },
      { queryKey: ['ipd-medications',  aid], queryFn: () => ipdApi.medications(aid).then(r => r.data),        enabled: !!aid },
      { queryKey: ['ipd-prescriptions',aid], queryFn: () => ipdApi.prescriptions(aid).then(r => r.data),      enabled: !!aid },
      { queryKey: ['ipd-consultant',   aid], queryFn: () => ipdApi.consultantRegister(aid).then(r => r.data), enabled: !!aid },
      { queryKey: ['ipd-lab',          aid], queryFn: () => ipdApi.labInvestigations(aid).then(r => r.data),  enabled: !!aid },
      { queryKey: ['ipd-operations',   aid], queryFn: () => ipdApi.operations(aid).then(r => r.data),         enabled: !!aid },
      { queryKey: ['ipd-charges',      aid], queryFn: () => ipdApi.charges(aid).then(r => r.data),            enabled: !!aid },
      { queryKey: ['ipd-payments',     aid], queryFn: () => ipdApi.payments(aid).then(r => r.data),           enabled: !!aid },
      { queryKey: ['ipd-live',         aid], queryFn: () => ipdApi.liveConsultations(aid).then(r => r.data),  enabled: !!aid },
      { queryKey: ['ipd-bed',          aid], queryFn: () => ipdApi.bedHistory(aid).then(r => r.data),         enabled: !!aid },
      { queryKey: ['ipd-timeline',     aid], queryFn: () => ipdApi.timeline(aid).then(r => r.data),           enabled: !!aid },
      { queryKey: ['ipd-vitals',       aid], queryFn: () => ipdApi.vitals(aid).then(r => r.data),             enabled: !!aid },
    ],
  })
  const [
    nurseQ, medQ, presQ, consQ, labQ, opsQ,
    chargesQ, payQ, liveQ, bedQ, tlQ, vitQ,
  ] = sections
  const get = (q: any) => (q?.data?.data ?? []) as any[]

  // Treatment history is patient-scoped
  const { data: trtData } = useQuery({
    queryKey: ['ipd-treatment-history', a?.patient_id],
    queryFn:  () => ipdApi.treatmentHistory(a!.patient_id).then(r => r.data),
    enabled:  !!a?.patient_id,
  })
  const treatmentRows = (trtData?.data ?? []) as any[]

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading admission…</div>
  if (!a) return (
    <div className="p-8 text-center">
      <p className="text-rose-500 mb-3">Admission not found</p>
      <button onClick={() => nav(-1)} className="btn btn-outline">Back</button>
    </div>
  )

  const caseId = a.case_id ?? a.patient_id
  const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${a.patient_id}&code=Code128&dpi=96&imagetype=Png`
  const qrUrl      = `https://api.qrserver.com/v1/create-qr-code/?data=${a.patient_id}&size=96x96&margin=0`

  const credit = a.credit ?? {}
  const limit  = Number(credit.limit ?? a.credit_limit ?? 0)
  const used   = Number(credit.used  ?? 0)
  const balance = limit - used

  const age = p ? [
    p.age_years  ? `${p.age_years} Year`   : null,
    p.age_months ? `${p.age_months} Month` : null,
    p.age_days   ? `${p.age_days} Day`     : null,
  ].filter(Boolean).join(', ') : ''

  // Billing tiles — IPD comes from charges/payments; the others come from
  // patient-scope module reports (kept zero unless we can derive cheap numbers).
  const ipdTotal = (chargesQ?.data?.data ?? []).reduce((s: number, c: any) => s + Number(c.amount || 0), 0)
  const ipdPaid  = (payQ?.data?.data     ?? []).reduce((s: number, p: any) => s + Number(p.paid_amount || 0), 0)

  // Build consultant doctor list from admission + consultant register
  const consultants: any[] = []
  if (a.consultant_id) consultants.push(staffMap.get(a.consultant_id))
  for (const r of get(consQ)) {
    if (r.consultant_id && !consultants.find(c => c?.id === r.consultant_id)) {
      consultants.push(staffMap.get(r.consultant_id))
    }
  }

  const staffName = (sid?: number) => {
    const s = sid ? staffMap.get(sid) : null
    if (!s) return sid ? `Staff #${sid}` : '—'
    const n = s.full_name || [s.first_name, s.last_name].filter(Boolean).join(' ') || s.name || `Staff #${s.id}`
    return s.staff_code ? `${n} (${s.staff_code})` : n
  }

  return (
    <div className="p-6 space-y-4">
      {/* Title bar */}
      <div className="bg-emerald-600 text-white rounded-lg px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => nav(-1)} className="hover:bg-white/20 rounded p-1">
            <ArrowLeft size={16}/>
          </button>
          <h1 className="text-lg font-semibold">IPD — {a.ipd_no}</h1>
        </div>
        <span className="text-xs text-emerald-50">
          {a.is_discharged ? 'Discharged' : 'Admitted'} · Case #{caseId}
        </span>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex border-b border-gray-200 overflow-x-auto px-2">
          {TABS.map(t => {
            const Icon = t.icon
            const active = t.id === tab
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px',
                  active
                    ? 'border-[#00a8e8] text-[#00a8e8]'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                )}>
                <Icon size={13}/> {t.label}
              </button>
            )
          })}
        </div>

        <div className="p-5">
          {tab === 'overview' && (
            <OverviewTab
              a={a} p={p} caseId={caseId} age={age}
              barcodeUrl={barcodeUrl} qrUrl={qrUrl}
              limit={limit} used={used} balance={balance}
              vitals={get(vitQ)}
              consultants={consultants}
              nurseNotes={get(nurseQ)}
              medications={get(medQ)}
              prescriptions={get(presQ)}
              consRegisters={get(consQ)}
              labs={get(labQ)}
              operations={get(opsQ)}
              charges={get(chargesQ)}
              payments={get(payQ)}
              live={get(liveQ)}
              treatment={treatmentRows}
              bedHistory={get(bedQ)}
              timeline={get(tlQ)}
              ipdTotal={ipdTotal} ipdPaid={ipdPaid}
              staffName={staffName}
            />
          )}
          {tab === 'nurse'        && <SectionWrapper title="Nurse Notes"          rows={get(nurseQ)}    head={['Date','Nurse','Note','Comment']}                                getRow={(n: any) => [fmtDate(n.date), staffName(n.nurse_id), n.note, n.comment]}/>}
          {tab === 'medication'   && <SectionWrapper title="Medication"           rows={get(medQ)}      head={['Date','Medicine','Dose','Time','Remark']}                       getRow={(m: any) => [fmtDate(m.date), m.medicine_name, m.dose, m.time, m.remark]}/>}
          {tab === 'prescription' && <SectionWrapper title="Prescription"         rows={get(presQ)}     head={['Prescription No','Date','Prescribed By','Generated By','Notes']} getRow={(r: any) => [r.prescription_no, fmtDate(r.date), staffName(r.prescribed_by), staffName(r.generated_by), r.notes]}/>}
          {tab === 'consultant'   && <SectionWrapper title="Consultant Register"  rows={get(consQ)}     head={['Applied Date','Consultant Doctor','Instruction','Instruction Date']} getRow={(r: any) => [fmtDate(r.applied_date), staffName(r.consultant_id), r.instruction, fmtDate(r.instruction_date)]}/>}
          {tab === 'lab'          && <SectionWrapper title="Lab Investigation"    rows={get(labQ)}      head={['Test','Lab','Sample Collected','Expected Date','Approved By','Result']} getRow={(l: any) => [l.test_name, l.lab, fmtDate(l.sample_collected), fmtDate(l.expected_date), staffName(l.approved_by), l.result]}/>}
          {tab === 'operations'   && <SectionWrapper title="Operations"           rows={get(opsQ)}      head={['Reference No','Operation Date','Operation Name','Operation Category','OT Technician']} getRow={(o: any) => [o.reference_no, fmtDate(o.operation_date), o.operation_name, o.operation_category, o.ot_technician]}/>}
          {tab === 'charges'      && <SectionWrapper title="Charges"              rows={get(chargesQ)}  head={['Date','Name','Charge Type','Charge Category','Qty','Amount (₹)']} getRow={(c: any) => [fmtDate(c.date), c.name, c.charge_type, c.charge_category, c.qty, money(c.amount)]} align={[,,,,,'text-right']}/>}
          {tab === 'payments'     && <SectionWrapper title="Payments"             rows={get(payQ)}      head={['Transaction ID','Date','Note','Payment Mode','Paid Amount (₹)']} getRow={(p: any) => [p.transaction_id, fmtDate(p.date), p.note, p.payment_mode, money(p.paid_amount)]} align={[,,,,'text-right']}/>}
          {tab === 'live'         && <SectionWrapper title="Live Consultation"    rows={get(liveQ)}     head={['Title','Date','Created By','Created For','Patient']} getRow={(c: any) => [c.consultation_title, fmtDate(c.date), staffName(c.created_by), c.created_for, c.patient_name]}/>}
          {tab === 'bed'          && <SectionWrapper title="Bed History"          rows={get(bedQ)}      head={['Bed Group','Bed','From Date','To Date','Active']} getRow={(b: any) => [b.bed_group, b.bed, fmtDateTime(b.from_date), fmtDateTime(b.to_date), b.is_active ? 'Yes' : 'No']}/>}
          {tab === 'timeline'     && <SectionWrapper title="Timeline"             rows={get(tlQ)}       head={['Date','Title','Description']} getRow={(t: any) => [fmtDate(t.event_date), t.title, t.description]}/>}
          {tab === 'treatment'    && <SectionWrapper title="Treatment History"    rows={treatmentRows}  head={['IPD No','Symptoms','Consultant','Bed','Admission Date']} getRow={(t: any) => [t.ipd_no, t.symptoms_title, staffName(t.consultant_id), t.bed_number, fmtDate(t.admission_date)]}/>}
          {tab === 'vitals'       && <SectionWrapper title="Vitals"               rows={get(vitQ)}      head={['Date','BP','Temp','Pulse','Weight','Height','SpO₂','Resp Rate','Status','Note']} getRow={(v: any) => [fmtDateTime(v.date), v.blood_pressure, v.temperature, v.pulse, v.weight, v.height, v.oxygen_saturation, v.respiratory_rate, v.status, v.note]}/>}
          {tab === 'obstetric'    && <ObstetricTab/>}
          {tab === 'postnatal'    && <PostnatalTab/>}
          {tab === 'antenatal'    && <AntenatalTab isAntenatal={a.is_antenatal}/>}
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Obstetric / Postnatal / Antenatal tabs ─────────────── */
function ObstetricTab() {
  return (
    <PlaceholderTab
      title="Previous Obstetric History"
      addLabel="Add Record"
      head={['Pregnancy No', 'Year', 'Outcome', 'Sex', 'Birth Weight', 'Complications', 'Notes']}/>
  )
}

function PostnatalTab() {
  return (
    <PlaceholderTab
      title="Postnatal History"
      addLabel="Add Postnatal Visit"
      head={['Visit Date', 'Days Postpartum', 'BP', 'Temperature', 'Lochia', 'Breastfeeding', 'Notes']}/>
  )
}

function AntenatalTab({ isAntenatal }: { isAntenatal: boolean }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-800">Antenatal</h3>
          <span className={cn(
            'px-2 py-0.5 rounded text-xs font-medium',
            isAntenatal ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
          )}>
            {isAntenatal ? 'Yes' : 'No'}
          </span>
        </div>
        <button onClick={() => toast.info('Antenatal visit editor coming soon')}
          className="flex items-center gap-1 px-3 py-2 bg-[#00a8e8] hover:bg-[#0090c7] text-white text-sm font-medium rounded">
          <Plus size={14}/> Add Antenatal Visit
        </button>
      </div>
      <DataTable
        head={['Visit Date', 'Gestational Age', 'BP', 'Weight', 'Fundal Height', 'Fetal Heart Rate', 'Investigations', 'Notes']}
        rows={[]}/>
    </div>
  )
}

function PlaceholderTab({ title, addLabel, head }: { title: string; addLabel: string; head: string[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        <button onClick={() => toast.info(`${title} editor coming soon`)}
          className="flex items-center gap-1 px-3 py-2 bg-[#00a8e8] hover:bg-[#0090c7] text-white text-sm font-medium rounded">
          <Plus size={14}/> {addLabel}
        </button>
      </div>
      <DataTable head={head} rows={[]}/>
    </div>
  )
}

/* ─────────────── Overview ─────────────── */
function OverviewTab(props: any) {
  const {
    a, p, caseId, age, barcodeUrl, qrUrl,
    limit, used, balance,
    vitals, consultants, nurseNotes, medications, prescriptions,
    consRegisters, labs, operations, charges, payments, live,
    treatment, bedHistory, timeline,
    ipdTotal, ipdPaid, staffName,
  } = props

  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const ipdPct = ipdTotal > 0 ? Math.min(100, Math.round((ipdPaid / ipdTotal) * 100)) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ═══════════ LEFT ═══════════ */}
      <div className="space-y-5">
        {/* Patient identity */}
        <div>
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
              {p?.name ?? `Patient #${a.patient_id}`} <span className="text-gray-500 font-normal">({a.patient_id})</span>
            </h2>
            <div className="flex gap-1 text-gray-400">
              <button className="p-1 hover:text-gray-700"><MenuIcon size={14}/></button>
              <button className="p-1 hover:text-gray-700"><Edit2 size={14}/></button>
              <button className="p-1 hover:text-gray-700"><Lock size={14}/></button>
              <button className="p-1 hover:text-rose-600"><Trash2 size={14}/></button>
            </div>
          </div>
          <div className="flex gap-5">
            {p?.photo_path
              ? <img src={p.photo_path} alt={p.name} className="w-28 h-28 rounded object-cover border"/>
              : <div className="w-28 h-28 rounded bg-gray-100 border flex flex-col items-center justify-center text-gray-400 text-[10px]">
                  <Users2 size={28}/>
                  <span className="mt-1">NO IMAGE</span>
                  <span>AVAILABLE</span>
                </div>}
            <div className="flex-1 space-y-1.5 text-sm">
              <Row label="Gender"        v={p?.gender}/>
              <Row label="Age"           v={age}/>
              <Row label="Guardian Name" v={p?.guardian_name}/>
              <Row label="Phone"         v={p?.phone} icon={<Phone size={11}/>}/>
              <Row label="TPA"           v={p?.tpa?.name || a.tpa}/>
              <Row label="TPA ID"        v={p?.tpa_member_id}/>
              <Row label="TPA Validity"  v={p?.tpa_validity}/>
              <div className="flex items-center gap-2 py-0.5">
                <span className="text-gray-500 text-xs w-28 flex-shrink-0">Barcode</span>
                <img src={barcodeUrl} alt="barcode" className="h-9"/>
              </div>
              <div className="flex items-center gap-2 py-0.5">
                <span className="text-gray-500 text-xs w-28 flex-shrink-0">QR Code</span>
                <img src={qrUrl} alt="qr" className="h-16 w-16"/>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-200"/>

        {/* IPD specifics + credit donut */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
          <div className="space-y-1.5 text-sm">
            <Row label="Case ID"        v={caseId}/>
            <Row label="IPD No"         v={a.ipd_no}/>
            <Row label="Admission Date" v={fmtDateTime(a.admission_date)}/>
            <Row label="Bed"            v={[a.bed_number, a.bed_group].filter(Boolean).join(' — ')}/>
          </div>
          <Donut percent={pct} limit={limit} used={used} balance={balance}/>
        </div>

        {/* Current Vitals */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">🏷 Current Vitals:</h3>
          {vitals.length === 0
            ? <p className="text-xs text-gray-400 italic">No vitals recorded</p>
            : (
              <div className="space-y-1.5">
                {vitals.slice(0, 2).map((v: any) => (
                  <div key={v.id} className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      {v.weight    && <span><span className="font-medium">Weight</span> {v.weight} Kilograms</span>}
                      {v.blood_pressure  && <span><span className="font-medium">BP</span> {v.blood_pressure}</span>}
                      {v.pulse     && <span><span className="font-medium">Pulse</span> {v.pulse}</span>}
                      {v.temperature && <span><span className="font-medium">Temp</span> {v.temperature}</span>}
                    </div>
                    {v.status && <span className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      v.status === 'Normal'   ? 'bg-emerald-500 text-white' :
                      v.status === 'High'     ? 'bg-amber-500 text-white' :
                      v.status === 'Critical' ? 'bg-rose-500 text-white' :
                                                'bg-gray-400 text-white'
                    )}>{v.status}</span>}
                    <span className="text-xs text-gray-500 ml-auto">{fmtDateTime(v.date)}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        {/* Known Allergies / Finding / Symptoms */}
        <LabelBlock label="Known Allergies" value={a.known_allergies}/>
        <LabelBlock label="Finding" value={a.findings} bullets/>
        <LabelBlock label="Symptoms" value={a.symptoms_title || a.symptoms_description}/>

        {/* Consultant Doctor */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Consultant Doctor</h3>
            <button title="Add" className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Plus size={14}/></button>
          </div>
          {consultants.filter(Boolean).length === 0
            ? <p className="text-xs text-gray-400 italic">No consultant on record</p>
            : (
              <ul className="space-y-2">
                {consultants.filter(Boolean).map((c: any) => {
                  const n = c.full_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || c.name || `Staff #${c.id}`
                  return (
                    <li key={c.id} className="flex items-center gap-3 text-sm text-gray-700">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
                        {String(n).split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2)}
                      </div>
                      <span className="text-[#00a8e8]">{n} ({c.staff_code ?? c.id})</span>
                    </li>
                  )
                })}
              </ul>
            )
          }
        </div>

        {/* Nurse Notes timeline */}
        <SectionHeader title="Nurse Notes"/>
        <TimelineList
          items={nurseNotes}
          renderTime={(n: any) => fmtDateTime(n.date)}
          renderCard={(n: any) => (
            <>
              <div className="text-sm text-[#00a8e8] font-medium mb-1">{staffName(n.nurse_id)}</div>
              {n.note && <div className="text-sm"><div className="text-xs text-gray-500">Note</div>{n.note}</div>}
              {n.comment && <div className="text-sm mt-2"><div className="text-xs text-gray-500">Comment</div>{n.comment}</div>}
            </>
          )}
        />

        {/* Timeline */}
        <SectionHeader title="Timeline"/>
        <TimelineList
          items={timeline}
          renderTime={(t: any) => fmtDate(t.event_date)}
          renderCard={(t: any) => (
            <>
              <div className="text-sm font-medium">{t.title}</div>
              {t.description && <div className="text-sm text-gray-700 mt-1">{t.description}</div>}
            </>
          )}
        />
      </div>

      {/* ═══════════ RIGHT ═══════════ */}
      <div className="space-y-5">
        {/* Billing bars */}
        <BillBar  title="IPD Payment/Billing"        icon={BedDouble}    pct={ipdPct} value={`₹${ipdPaid.toFixed(2)}/₹${ipdTotal.toFixed(2)}`}/>
        <BillBar  title="Pharmacy Payment/Billing"   icon={Pill}         pct={0}/>
        <BillBar  title="Pathology Payment/Billing"  icon={FlaskConical} pct={0}/>
        <BillBar  title="Radiology Payment/Billing"  icon={Scissors}     pct={0}/>
        <BillBar  title="Blood Bank Payment/Billing" icon={Users2}       pct={0}/>
        <BillBar  title="Ambulance Payment/Billing"  icon={Receipt}      pct={0}/>

        {/* Medication */}
        <SectionHeader title="Medication"/>
        <DataTable
          head={['Date', 'Medicine Name', 'Dose', 'Time', 'Remark']}
          rows={medications.map((m: any) => [fmtDate(m.date), m.medicine_name, m.dose, m.time, m.remark])}/>

        {/* Prescription */}
        <SectionHeader title="Prescription"/>
        <DataTable
          head={['Prescription No', 'Date', 'Prescribe By', 'Generated By']}
          rows={prescriptions.map((r: any) => [
            <span className="text-[#00a8e8]">{r.prescription_no}</span>,
            fmtDate(r.date),
            staffName(r.prescribed_by),
            staffName(r.generated_by),
          ])}/>

        {/* Consultant Register */}
        <SectionHeader title="Consultant Register"/>
        <DataTable
          head={['Applied Date', 'Consultant Doctor', 'Instruction', 'Instruction Date']}
          rows={consRegisters.map((r: any) => [
            fmtDateTime(r.applied_date), staffName(r.consultant_id), r.instruction, fmtDate(r.instruction_date),
          ])}/>

        {/* Lab Investigation */}
        <SectionHeader title="Lab Investigation"/>
        <DataTable
          head={['Test Name', 'Lab', 'Sample Collected', 'Expected Date']}
          rows={labs.map((l: any) => [l.test_name, l.lab, fmtDate(l.sample_collected), fmtDate(l.expected_date)])}/>

        {/* Operation */}
        <SectionHeader title="Operation"/>
        <DataTable
          head={['Reference No', 'Operation Date', 'Operation Name', 'Operation Category', 'OT Technician']}
          rows={operations.map((o: any) => [
            <span className="text-[#00a8e8]">{o.reference_no}</span>,
            fmtDateTime(o.operation_date), o.operation_name, o.operation_category, o.ot_technician,
          ])}/>

        {/* Charges */}
        <SectionHeader title="Charges"/>
        <DataTable
          head={['Date', 'Name', 'Charge Type', 'Charge Category', 'Qty', 'Amount (₹)']}
          align={[,,,,,'text-right']}
          rows={charges.map((c: any) => [
            fmtDateTime(c.date), c.name, c.charge_type, c.charge_category, c.qty, money(c.amount),
          ])}/>

        {/* Payment */}
        <SectionHeader title="Payment"/>
        <DataTable
          head={['Transaction ID', 'Date', 'Note', 'Payment Mode', 'Paid Amount (₹)']}
          align={[,,,,'text-right']}
          rows={payments.map((p: any) => [
            p.transaction_id, fmtDateTime(p.date), p.note, p.payment_mode, money(p.paid_amount),
          ])}/>

        {/* Live Consultation */}
        <SectionHeader title="Live Consultation"/>
        <DataTable
          head={['Title', 'Date', 'Created By', 'Patient']}
          rows={live.map((c: any) => [c.consultation_title, fmtDateTime(c.date), staffName(c.created_by), c.patient_name])}/>

        {/* Treatment History */}
        <SectionHeader title="Treatment History"/>
        <DataTable
          head={['IPD No', 'Symptoms', 'Consultant', 'Bed']}
          rows={treatment.map((t: any) => [
            <span className="text-[#00a8e8]">{t.ipd_no}</span>,
            t.symptoms_title || '', staffName(t.consultant_id), t.bed_number,
          ])}/>

        {/* Bed History */}
        <SectionHeader title="Bed History"/>
        <DataTable
          head={['Bed Group', 'Bed', 'From Date', 'To Date', 'Active Bed']}
          rows={bedHistory.map((b: any) => [
            b.bed_group, b.bed, fmtDateTime(b.from_date), fmtDateTime(b.to_date), b.is_active ? 'Yes' : '',
          ])}/>
      </div>
    </div>
  )
}

/* ─────────────── Section tab wrapper ─────────────── */
function SectionWrapper({ title, rows, head, getRow, align }: {
  title: string; rows: any[]; head: string[]; getRow: (r: any) => any[]; align?: (string | undefined)[]
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      <DataTable head={head} rows={rows.map(getRow)} align={align}/>
    </div>
  )
}

/* ─────────────── helpers ─────────────── */
function Row({ label, v, icon }: { label: string; v?: any; icon?: any }) {
  return (
    <div className="flex items-baseline gap-2 py-0.5 border-b border-gray-50">
      <span className="text-gray-500 text-xs w-28 flex-shrink-0 flex items-center gap-1">{icon}{label}</span>
      <span className="text-gray-800 break-words flex-1">{v || ''}</span>
    </div>
  )
}

function LabelBlock({ label, value, bullets }: { label: string; value?: string; bullets?: boolean }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-1">🏷 {label}</h3>
      {value
        ? bullets
          ? <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {value.split('\n').filter(Boolean).map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          : <p className="text-sm text-gray-700 whitespace-pre-wrap">{value}</p>
        : <p className="text-xs text-gray-400 italic">—</p>
      }
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide pt-2">{title}</h3>
}

function DataTable({ head, rows, align }: { head: string[]; rows: any[][]; align?: (string | undefined)[] }) {
  return (
    <div className="border border-gray-200 rounded overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 text-left">
          <tr>{head.map((h, i) => <th key={h} className={cn('px-3 py-2 font-semibold text-gray-700', align?.[i])}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={head.length} className="px-3 py-3 text-center text-gray-400 italic">No records</td></tr>
            : rows.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  {r.map((c, j) => <td key={j} className={cn('px-3 py-2 text-gray-700', align?.[j])}>{c != null && c !== '' ? c : '—'}</td>)}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}

function TimelineList({ items, renderTime, renderCard }: {
  items: any[]; renderTime: (i: any) => string; renderCard: (i: any) => React.ReactNode
}) {
  if (items.length === 0)
    return <div className="bg-sky-50 border border-sky-100 rounded text-center text-sky-700 text-sm py-3">No Record Found</div>
  return (
    <ul className="relative border-l-2 border-sky-200 ml-2 space-y-3 pt-2 pl-5">
      {items.map((it: any) => (
        <li key={it.id} className="relative">
          <span className="absolute -left-[28px] top-0 px-2 py-0.5 rounded bg-[#1a2332] text-white text-[10px]">
            {renderTime(it)}
          </span>
          <span className="absolute -left-[19px] top-7 w-3 h-3 rounded-full bg-sky-200 border-2 border-white"/>
          <div className="bg-white border border-gray-200 rounded p-3 shadow-sm mt-6">
            {renderCard(it)}
          </div>
        </li>
      ))}
    </ul>
  )
}

function BillBar({ title, icon: Icon, pct, value }: { title: string; icon: any; pct: number; value?: string }) {
  const filled = pct > 0
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
        <span>{title}</span>
        <Icon size={14} className="text-gray-400"/>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 bg-gray-100 rounded overflow-hidden">
          <div className={cn('h-full', filled ? 'bg-emerald-500' : 'bg-gray-300')} style={{ width: `${pct}%` }}/>
        </div>
        <span className="text-xs text-gray-600 whitespace-nowrap">{pct}%</span>
        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{value ?? '₹0/₹0'}</span>
      </div>
    </div>
  )
}

function Donut({ percent, limit, used, balance }: {
  percent: number; limit: number; used: number; balance: number
}) {
  const radius = 36
  const circ = 2 * Math.PI * radius
  const dash = (percent / 100) * circ
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 100" className="w-32 h-32">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10"/>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#10b981" strokeWidth="10"
                strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4} transform="rotate(-90 50 50)"/>
        <text x="50" y="55" textAnchor="middle" fontSize="14" fill="#10b981" fontWeight="600">{percent}%</text>
      </svg>
      <div className="text-xs space-y-0.5 mt-2 text-center">
        <div><span className="text-emerald-700">Credit Limit:</span> ₹{limit.toFixed(2)}</div>
        <div><span className="text-rose-600">Used Credit:</span> ₹{used.toFixed(2)}</div>
        <div><span className="text-emerald-700">Balance:</span> ₹{balance.toFixed(2)}</div>
      </div>
    </div>
  )
}

function fmtDate(s?: string)     { if (!s) return ''; try { return new Date(s).toLocaleDateString('en-GB') } catch { return s } }
function fmtDateTime(s?: string) { if (!s) return ''; try { return new Date(s).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) } catch { return s } }
function money(n: any)           { return Number(n || 0).toFixed(2) }
