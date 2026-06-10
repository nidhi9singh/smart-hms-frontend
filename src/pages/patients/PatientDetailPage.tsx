// src/pages/patients/PatientDetailPage.tsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, LayoutGrid, ArrowLeftRight, FlaskConical, Users2,
  CalendarCheck2, HeartPulse, Plus, FileText, FileSpreadsheet,
  Printer, Copy,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { patientsApi } from '@/api/patients'
import { opdApi } from '@/api/opd'
import { modReportsApi } from '@/api/moduleReports'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import AddVisitModal from './AddVisitModal'
import AddTimelineModal from './AddTimelineModal'
import AddVitalModal from './AddVitalModal'

type TabKey = 'overview' | 'visits' | 'lab' | 'treatment' | 'timeline' | 'vitals'

const TABS: { id: TabKey; label: string; icon: any }[] = [
  { id: 'overview',  label: 'Overview',         icon: LayoutGrid       },
  { id: 'visits',    label: 'Visits',           icon: ArrowLeftRight   },
  { id: 'lab',       label: 'Lab Investigation', icon: FlaskConical    },
  { id: 'treatment', label: 'Treatment History', icon: Users2          },
  { id: 'timeline',  label: 'Timeline',         icon: CalendarCheck2   },
  { id: 'vitals',    label: 'Vitals',           icon: HeartPulse       },
]

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav    = useNavigate()
  const pid    = Number(id)
  const [tab, setTab] = useState<TabKey>('overview')
  const [addVisit,    setAddVisit]    = useState(false)
  const [addTimeline, setAddTimeline] = useState(false)
  const [addVital,    setAddVital]    = useState(false)

  const { data: patientData, isLoading } = useQuery({
    queryKey: ['patient', pid],
    queryFn:  () => patientsApi.get(pid).then(r => r.data),
    enabled:  !!pid,
  })
  const p = patientData?.data ?? null

  const { data: visitData } = useQuery({
    queryKey: ['patient-visit', pid],
    queryFn:  () => modReportsApi.patientVisit(pid).then(r => r.data),
    enabled:  !!pid,
  })
  const sections: any = visitData?.data?.sections ?? {}

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading patient…</div>
  if (!p) return (
    <div className="p-8 text-center">
      <p className="text-rose-500 mb-3">Patient not found</p>
      <button onClick={() => nav(-1)} className="btn btn-outline">Back</button>
    </div>
  )

  const age = [
    p.age_years   ? `${p.age_years} Year`   : null,
    p.age_months  ? `${p.age_months} Month` : null,
    p.age_days    ? `${p.age_days} Day`     : null,
  ].filter(Boolean).join(', ') || '—'

  const caseId      = p.case_id ?? p.id
  const barcodeUrl  = `https://barcode.tec-it.com/barcode.ashx?data=${caseId}&code=Code128&dpi=96&imagetype=Png`
  const qrUrl       = `https://api.qrserver.com/v1/create-qr-code/?data=${caseId}&size=96x96&margin=0`

  return (
    <div className="p-6 space-y-4">
      {/* Title bar */}
      <div className="bg-emerald-600 text-white rounded-lg px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => nav(-1)} className="hover:bg-white/20 rounded p-1">
            <ArrowLeft size={16}/>
          </button>
          <h1 className="text-lg font-semibold">Patient Details</h1>
        </div>
        <span className="text-xs text-emerald-50">Patient Visit Report</span>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex border-b border-gray-200 px-4 overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon
            const active = t.id === tab
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px',
                  active
                    ? 'border-[#059669] text-[#059669]'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                )}>
                <Icon size={14}/> {t.label}
              </button>
            )
          })}
        </div>

        <div className="p-5">
          {tab === 'overview'  && <OverviewTab  p={p} caseId={caseId} age={age} sections={sections} barcodeUrl={barcodeUrl} qrUrl={qrUrl}/>}
          {tab === 'visits'    && <VisitsTab    sections={sections} onAddVisit={() => setAddVisit(true)}/>}
          {tab === 'lab'       && <LabTab       sections={sections}/>}
          {tab === 'treatment' && <TreatmentTab sections={sections}/>}
          {tab === 'timeline'  && <TimelineTab  pid={pid} onAdd={() => setAddTimeline(true)}/>}
          {tab === 'vitals'    && <VitalsTab    pid={pid} onAdd={() => setAddVital(true)}/>}
        </div>
      </div>

      <AddVisitModal    open={addVisit}    onClose={() => setAddVisit(false)}    patient={p}/>
      <AddTimelineModal open={addTimeline} onClose={() => setAddTimeline(false)} patientId={pid}/>
      <AddVitalModal    open={addVital}    onClose={() => setAddVital(false)}    patientId={pid}/>
    </div>
  )
}

/* ─────────────── Overview Tab ─────────────── */
function OverviewTab({ p, caseId, age, sections, barcodeUrl, qrUrl }: any) {
  const opd: any[] = sections.opd ?? []

  // Build a year-axis chart of module activity counts
  const counts: Record<string, Record<string, number>> = {}
  const bump = (year: string, key: string) => {
    counts[year] = counts[year] ?? {}
    counts[year][key] = (counts[year][key] ?? 0) + 1
  }
  const addRows = (rows: any[], dateKey: string, k: string) => {
    rows.forEach(r => {
      const y = (r[dateKey] ?? '').slice(0, 4) || new Date().getFullYear().toString()
      bump(y, k)
    })
  }
  addRows(opd, 'date', 'OPD')
  addRows(sections.pharmacy ?? [], 'date', 'Pharmacy')
  addRows(sections.pathology ?? [], 'date', 'Pathology')
  addRows(sections.radiology ?? [], 'date', 'Radiology')
  addRows(sections.blood_issues ?? [], 'issue_date', 'Blood Bank')
  addRows(sections.ambulance ?? [], 'date', 'Ambulance')

  const years = Object.keys(counts).sort()
  if (years.length === 0) {
    const y = new Date().getFullYear().toString()
    years.push((Number(y) - 1).toString(), y)
  } else if (years.length === 1) {
    years.unshift((Number(years[0]) - 1).toString())
  }
  const keys = ['OPD','Pharmacy','Pathology','Radiology','Blood Bank','Ambulance']
  const chartData = years.map(y => {
    const row: any = { year: y }
    keys.forEach(k => row[k] = counts[y]?.[k] ?? 0)
    return row
  })
  const colors: Record<string, string> = {
    OPD: '#7dd3fc', Pharmacy: '#34d399', Pathology: '#f87171',
    Radiology: '#60a5fa', 'Blood Bank': '#fb7185', Ambulance: '#fbbf24',
  }

  const consultantList = Array.from(
    new Map(opd.filter((v: any) => v.doctor_name).map((v: any) => [v.doctor_name, v.doctor_name])).keys()
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT column */}
      <div className="space-y-5">
        {/* Patient identity */}
        <div>
          <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">
            {p.name} <span className="text-gray-500 font-normal">({caseId})</span>
          </h2>
          <div className="flex gap-5">
            {p.photo_path
              ? <img src={p.photo_path} alt={p.name} className="w-28 h-28 rounded object-cover border"/>
              : <div className="w-28 h-28 rounded bg-gray-100 border flex flex-col items-center justify-center text-gray-400 text-[10px]">
                  <Users2 size={28}/>
                  <span className="mt-1">NO IMAGE</span>
                  <span>AVAILABLE</span>
                </div>}
            <div className="flex-1 space-y-1.5 text-sm">
              <Field label="Gender"       value={p.gender}/>
              <Field label="Age"          value={age}/>
              <Field label="Guardian Name" value={p.guardian_name}/>
              <Field label="Phone"        value={p.phone}/>
              <Field label="TPA"          value={p.tpa?.name || (p.tpa_id ? `TPA #${p.tpa_id}` : '')}/>
              <Field label="TPA ID"       value={p.tpa_member_id}/>
              <Field label="TPA Validity" value={p.tpa_validity}/>
              <div className="flex items-center gap-2 py-0.5">
                <span className="text-gray-500 text-xs w-32 flex-shrink-0">Barcode</span>
                <img src={barcodeUrl} alt="barcode" className="h-10"/>
              </div>
              <div className="flex items-center gap-2 py-0.5">
                <span className="text-gray-500 text-xs w-32 flex-shrink-0">QR Code</span>
                <img src={qrUrl} alt="qr" className="h-20 w-20"/>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-200"/>

        <LabelRow label="Known Allergies" value={p.known_allergies}/>
        <LabelRow label="Findings"        value={p.findings}/>
        <LabelRow label="Symptoms"        value={p.symptoms}/>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Consultant Doctor</h3>
          {consultantList.length === 0
            ? <p className="text-xs text-gray-400 italic">No consultants on record</p>
            : <ul className="space-y-2">
                {consultantList.map((name: any) => (
                  <li key={name} className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
                      {String(name).split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2)}
                    </div>
                    {name}
                  </li>
                ))}
              </ul>}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Timeline</h3>
          <p className="text-xs text-gray-400 italic">No timeline entries</p>
        </div>
      </div>

      {/* RIGHT column */}
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Medical History</h3>
          <div className="border border-gray-200 rounded-lg p-3 bg-white">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                <XAxis dataKey="year" tick={{ fontSize: 11 }}/>
                <YAxis tick={{ fontSize: 11 }}/>
                <Tooltip/>
                <Legend wrapperStyle={{ fontSize: 11 }}/>
                {keys.map(k => (
                  <Line key={k} type="linear" dataKey={k} stroke={colors[k]} strokeWidth={2} dot={{ r: 3 }}/>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Visit Details</h3>
          <MiniTable
            head={['OPD No', 'Case ID', 'Appointment Date', 'Consultant', 'Reference', 'Symptoms']}
            rows={opd.map((v: any) => [
              <span className="text-[#059669]">{v.opd_no || '—'}</span>,
              v.case_id, v.date, v.doctor_name, '—', v.symptoms || '',
            ])}/>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Lab Investigation</h3>
          <p className="text-xs text-gray-400 italic">No lab investigations</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Treatment History</h3>
          <MiniTable
            head={['OPD No', 'Case ID', 'Appointment Date', 'Consultant', 'Symptoms']}
            rows={opd.map((v: any) => [
              <span className="text-[#059669]">{v.opd_no || '—'}</span>,
              v.case_id, v.date, v.doctor_name, v.symptoms || '',
            ])}/>
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Visits Tab ─────────────── */
function VisitsTab({ sections, onAddVisit }: { sections: any; onAddVisit: () => void }) {
  const rows: any[] = sections.opd ?? []
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">Visits</h3>
        <button onClick={onAddVisit}
          className="flex items-center gap-1 px-3 py-2 bg-[#059669] hover:bg-[#047857] text-white text-sm font-medium rounded">
          <ArrowLeftRight size={14}/> New Visit
        </button>
      </div>
      <TableToolbar/>
      <FullTable
        head={['OPD No', 'Case ID', 'Appointment Date', 'Consultant', 'Reference', 'Symptoms', 'Previous Medical Issue', 'Action']}
        rows={rows.map((v: any) => [
          <span className="text-[#059669] font-medium">{v.opd_no || '—'}</span>,
          v.case_id ?? '—',
          v.date || '—',
          v.doctor_name || '—',
          '—',
          v.symptoms || '—',
          v.findings || '—',
          <RowActions/>,
        ])}/>
      <Footer count={rows.length}/>
    </div>
  )
}

/* ─────────────── Lab Investigation Tab ─────────────── */
function LabTab({ sections }: any) {
  const rows: any[] = sections.pathology ?? []
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-gray-800">Lab Investigation</h3>
      <TableToolbar/>
      {rows.length === 0 ? (
        <EmptyTableState
          head={['Test Name', 'Case ID', 'Lab', 'Sample Collected', 'Expected Date', 'Approved By', 'Action']}/>
      ) : (
        <FullTable
          head={['Test Name', 'Case ID', 'Lab', 'Sample Collected', 'Expected Date', 'Approved By', 'Action']}
          rows={rows.map((b: any) => [
            <span className="text-[#059669]">{b.bill_no || '—'}</span>,
            b.case_id ?? '—',
            'Pathology',
            b.date || '—',
            b.date || '—',
            '—',
            <RowActions/>,
          ])}/>
      )}
      <Footer count={rows.length}/>
    </div>
  )
}

/* ─────────────── Treatment History Tab ─────────────── */
function TreatmentTab({ sections }: any) {
  const rows: any[] = sections.opd ?? []
  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-gray-800">Treatment History</h3>
      <TableToolbar/>
      <FullTable
        head={['OPD No', 'Case ID', 'Appointment Date', 'Symptoms', 'Consultant', 'Action']}
        rows={rows.map((v: any) => [
          <span className="text-[#059669] font-medium">{v.opd_no || '—'}</span>,
          v.case_id ?? '—',
          v.date || '—',
          v.symptoms || '—',
          v.doctor_name || '—',
          <button title="More" className="icon-btn"><FileText size={12}/></button>,
        ])}/>
      <Footer count={rows.length}/>
    </div>
  )
}

/* ─────────────── Timeline Tab ─────────────── */
function TimelineTab({ pid, onAdd }: { pid: number; onAdd: () => void }) {
  const { data } = useQuery({
    queryKey: ['patient-timeline', pid],
    queryFn:  () => opdApi.patientTimeline(pid).then(r => r.data),
    enabled:  !!pid,
  })
  const rows = (data?.data ?? []) as any[]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">Timeline</h3>
        <button onClick={onAdd}
          className="flex items-center gap-1 px-3 py-2 bg-[#059669] hover:bg-[#047857] text-white text-sm font-medium rounded">
          <Plus size={14}/> Add Timeline
        </button>
      </div>
      {rows.length === 0 ? (
        <div className="bg-sky-50 border border-sky-100 rounded text-center text-sky-700 text-sm py-6">
          No Record Found
        </div>
      ) : (
        <ul className="relative border-l-2 border-emerald-200 ml-2 space-y-4 pt-2 pl-5">
          {rows.map((t: any) => (
            <li key={t.id} className="relative">
              <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"/>
              <div className="bg-white border border-gray-200 rounded p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{t.title}</span>
                  <span className="text-xs text-gray-500">{t.event_date ?? t.created_at?.slice(0, 10)}</span>
                </div>
                {t.description && <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{t.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ─────────────── Vitals Tab ─────────────── */
function VitalsTab({ pid, onAdd }: { pid: number; onAdd: () => void }) {
  const { data } = useQuery({
    queryKey: ['patient-vitals', pid],
    queryFn:  () => opdApi.vitals(pid).then(r => r.data),
    enabled:  !!pid,
  })
  const rows = (data?.data ?? []) as any[]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">Vitals</h3>
        <button onClick={onAdd}
          className="flex items-center gap-1 px-3 py-2 bg-[#059669] hover:bg-[#047857] text-white text-sm font-medium rounded">
          <Plus size={14}/> Add Vital
        </button>
      </div>
      {rows.length === 0 ? (
        <div className="bg-sky-50 border border-sky-100 rounded text-center text-sky-700 text-sm py-6">
          No Record Found
        </div>
      ) : (
        <FullTable
          head={['Date', 'BP', 'Temp', 'Pulse', 'Weight', 'Height', 'SpO₂', 'Resp Rate', 'Note']}
          rows={rows.map((v: any) => [
            v.date ?? '—',
            v.blood_pressure ?? '—',
            v.temperature ?? '—',
            v.pulse ?? '—',
            v.weight ?? '—',
            v.height ?? '—',
            v.oxygen_saturation ?? '—',
            v.respiratory_rate ?? '—',
            v.note ?? '—',
          ])}/>
      )}
    </div>
  )
}

/* ─────────────── helpers ─────────────── */
function Field({ label, value }: { label: string; value?: any }) {
  return (
    <div className="flex items-baseline gap-2 py-0.5 border-b border-gray-50">
      <span className="text-gray-500 text-xs w-32 flex-shrink-0">{label}</span>
      <span className="text-gray-800 break-words flex-1">{value || ''}</span>
    </div>
  )
}

function LabelRow({ label, value }: { label: string; value?: any }) {
  return (
    <div className="flex items-baseline gap-2 py-1.5 border-b border-gray-100">
      <span className="text-gray-700 text-xs font-medium">🏷 {label}:</span>
      <span className="text-gray-700 flex-1">{value || ''}</span>
    </div>
  )
}

function MiniTable({ head, rows }: { head: string[]; rows: any[][] }) {
  return (
    <div className="border border-gray-200 rounded overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 text-left">
          <tr>{head.map(h => <th key={h} className="px-3 py-2 font-semibold text-gray-700">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={head.length} className="px-3 py-4 text-center text-gray-400">No records</td></tr>
            : rows.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  {r.map((c, j) => <td key={j} className="px-3 py-2 text-gray-700">{c ?? '—'}</td>)}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}

function FullTable({ head, rows }: { head: string[]; rows: any[][] }) {
  return (
    <div className="border border-gray-200 rounded overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {head.map(h => (
              <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                {h} <span className="text-gray-400 text-[10px]">▼</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={head.length} className="px-3 py-12 text-center text-rose-300 text-sm">No data available in table</td></tr>
            : rows.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  {r.map((c, j) => <td key={j} className="px-3 py-3 text-gray-700">{c ?? '—'}</td>)}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyTableState({ head }: { head: string[] }) {
  return (
    <div className="border border-gray-200 rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {head.map(h => (
              <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-700 whitespace-nowrap">
                {h} <span className="text-gray-400 text-[10px]">▼</span>
              </th>
            ))}
          </tr>
        </thead>
      </table>
      <div className="py-12 text-center bg-white">
        <p className="text-rose-300 text-sm mb-3">No data available in table</p>
        <div className="flex justify-center mb-2 text-gray-300">
          <FileText size={48}/>
        </div>
        <p className="text-xs text-emerald-700">← Add new record or search with different criteria.</p>
      </div>
    </div>
  )
}

function TableToolbar() {
  return (
    <div className="flex items-center justify-between">
      <input type="text" placeholder="Search..."
        className="w-48 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400" />
      <div className="flex items-center gap-2">
        <select className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-600" defaultValue={100}>
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
  )
}

function RowActions() {
  return (
    <div className="flex items-center gap-1">
      <button title="Print"      className="icon-btn"><Printer size={12}/></button>
      <button title="Export"     className="icon-btn"><FileSpreadsheet size={12}/></button>
      <button title="Show"       className="icon-btn"><FileText size={12}/></button>
      <button title="More"       className="icon-btn"><LayoutGrid size={12}/></button>
      <button title="Share"      className="icon-btn"><ArrowLeftRight size={12}/></button>
    </div>
  )
}

function Footer({ count }: { count: number }) {
  return (
    <div className="px-1 py-2 text-xs text-gray-500 flex items-center justify-between">
      <span>Records: {count === 0 ? '0 to 0 of 0' : `1 to ${count} of ${count}`}</span>
      <div className="flex gap-1">
        <button className="px-2 py-1 border border-gray-300 rounded text-gray-400">‹</button>
        <span className="px-3 py-1 border border-[#059669] bg-[#059669] text-white rounded text-xs">1</span>
        <button className="px-2 py-1 border border-gray-300 rounded text-gray-400">›</button>
      </div>
    </div>
  )
}
