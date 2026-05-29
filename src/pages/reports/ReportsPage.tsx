// src/pages/reports/ReportsPage.tsx
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import FinanceReports from './FinanceReports'
import { AppointmentReports, OpdReports, IpdReports, PharmacyReports } from './ModuleReports'
import { PathologyReports, RadiologyReports, BloodBankReports } from './ModuleReportsExt'
import {
  AmbulanceReports, BirthDeathReports, HRReports, TPAReports,
  InventoryReports, LiveConsultationReports, LogReports,
} from './ModuleReportsExt2'
import { OTReports, PatientReports } from './ModuleReportsExt3'

const CATEGORIES = [
  { key: 'finance',          label: 'Finance' },
  { key: 'appointment',      label: 'Appointment' },
  { key: 'opd',              label: 'OPD' },
  { key: 'ipd',              label: 'IPD' },
  { key: 'pharmacy',         label: 'Pharmacy' },
  { key: 'pathology',        label: 'Pathology' },
  { key: 'radiology',        label: 'Radiology' },
  { key: 'blood_bank',       label: 'Blood Bank' },
  { key: 'ambulance',        label: 'Ambulance' },
  { key: 'birth_death',      label: 'Birth Death' },
  { key: 'human_resource',   label: 'Human Resource' },
  { key: 'tpa',              label: 'TPA' },
  { key: 'inventory',        label: 'Inventory' },
  { key: 'live_consultation',label: 'Live Consultation' },
  { key: 'log',              label: 'Log' },
  { key: 'ot',               label: 'OT' },
  { key: 'patient',          label: 'Patient' },
]


export default function ReportsPage() {
  const [active, setActive] = useState('finance')
  const [open, setOpen]     = useState(true)

  return (
    <div className="p-6">
      <div className="grid grid-cols-12 gap-5">
        <aside className="col-span-12 lg:col-span-2 card overflow-hidden h-fit">
          <button onClick={() => setOpen(o => !o)}
            className="w-full flex items-center gap-2 px-4 py-2.5 border-b text-sm font-semibold text-emerald-700 hover:bg-gray-50">
            {open ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
            Reports
          </button>
          {open && (
            <nav className="text-sm">
              {CATEGORIES.map(c => (
                <button key={c.key} onClick={() => setActive(c.key)}
                  className={cn(
                    'w-full text-left px-4 py-2 border-b text-gray-700 flex items-center gap-2',
                    active === c.key ? 'bg-emerald-50 text-emerald-700 font-medium' : 'hover:bg-gray-50'
                  )}>
                  <ChevronRight size={12} className="opacity-50"/>
                  {c.label}
                </button>
              ))}
            </nav>
          )}
        </aside>
        <section className="col-span-12 lg:col-span-10 space-y-4">
          {active === 'finance'     && <FinanceReports />}
          {active === 'appointment' && <AppointmentReports />}
          {active === 'opd'         && <OpdReports />}
          {active === 'ipd'         && <IpdReports />}
          {active === 'pharmacy'    && <PharmacyReports />}
          {active === 'pathology'         && <PathologyReports />}
          {active === 'radiology'         && <RadiologyReports />}
          {active === 'blood_bank'        && <BloodBankReports />}
          {active === 'ambulance'         && <AmbulanceReports />}
          {active === 'birth_death'       && <BirthDeathReports />}
          {active === 'human_resource'    && <HRReports />}
          {active === 'tpa'               && <TPAReports />}
          {active === 'inventory'         && <InventoryReports />}
          {active === 'live_consultation' && <LiveConsultationReports />}
          {active === 'log'               && <LogReports />}
          {active === 'ot'                && <OTReports />}
          {active === 'patient'           && <PatientReports />}
        </section>
      </div>
    </div>
  )
}


function Stub({ label }: { label: string }) {
  return (
    <div className="card">
      <div className="px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">{label}</h2>
      </div>
      <div className="p-12 text-center text-gray-400 text-sm">
        {label} reports — coming soon.
      </div>
    </div>
  )
}
