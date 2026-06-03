// src/pages/appointments/AppointmentDetailsModal.tsx
import { X, Printer, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AppointmentDetailsModal({ open, onClose, appointment, onDelete }: {
  open: boolean
  onClose: () => void
  appointment: any
  onDelete?: (id: number) => void
}) {
  if (!open || !appointment) return null
  const a = appointment

  const age = [
    a.patient_age_years   ? `${a.patient_age_years} Year`   : null,
    a.patient_age_months  ? `${a.patient_age_months} Month` : null,
    a.patient_age_days    ? `${a.patient_age_days} Day`     : null,
  ].filter(Boolean).join(', ') || '—'

  const statusColor = ({
    Approved   : 'bg-emerald-100 text-emerald-700',
    Confirmed  : 'bg-emerald-100 text-emerald-700',
    Completed  : 'bg-emerald-100 text-emerald-700',
    Pending    : 'bg-amber-100 text-amber-700',
    Cancelled  : 'bg-rose-100 text-rose-700',
  } as Record<string, string>)[a.status] ?? 'bg-gray-100 text-gray-700'

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-10">
      <div className="bg-white rounded-lg shadow-xl w-[920px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 bg-emerald-600 text-white rounded-t-lg sticky top-0">
          <h2 className="text-base font-semibold">Appointment Details</h2>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} title="Print" className="hover:opacity-80"><Printer size={16}/></button>
            {onDelete && (
              <button onClick={() => { if (confirm('Delete appointment?')) onDelete(a.id) }}
                title="Delete" className="hover:opacity-80"><Trash2 size={16}/></button>
            )}
            <button onClick={onClose}><X size={18}/></button>
          </div>
        </div>

        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {/* Left column — patient + clinical */}
          <Row label="Patient Name"      value={a.patient_name ? `${a.patient_name} (${a.patient_id})` : `Patient #${a.patient_id}`}/>
          <Row label="Appointment No"    value={a.appointment_no}/>
          <Row label="Age"               value={age}/>
          <Row label="Appointment S.No." value={a.appointment_sno || (a.id ? `#${a.id}` : '—')}/>
          <Row label="Email"             value={a.email}/>
          <Row label="Appointment Date"  value={a.appointment_date ? new Date(a.appointment_date).toLocaleString() : '—'}/>
          <Row label="Phone"             value={a.phone}/>
          <Row label="Appointment Priority" value={a.priority}/>
          <Row label="Gender"            value={a.gender}/>
          <Row label="Shift"             value={a.shift}/>
          <Row label="Doctor"            value={a.doctor_name ? `${a.doctor_name} (${a.doctor_code ?? a.doctor_id})` : a.doctor_id}/>
          <Row label="Slot"              value={a.slot}/>
          <Row label="Department"        value={a.department}/>
          <Row label="Amount"            value={a.fees != null ? Number(a.fees).toFixed(2) : '—'}/>
          <Row label="Live Consultation" value={a.live_consultant ? 'Yes' : 'No'}/>
          <Row label="Status"            value={<span className={`px-2 py-0.5 rounded text-xs ${statusColor}`}>{a.status || 'Pending'}</span>}/>
          <Row label="Payment Note"      value={a.payment_note}/>
          <Row label="Payment Mode"      value={a.payment_mode}/>
          <span/>
          <Row label="Transaction ID"    value={a.transaction_id}/>
          <Row label="Message"           value={a.message}/>
          <Row label="Source"            value={a.source ?? 'Offline'}/>
          <span/>
          <Row label="Collected By"      value={a.created_by_name ? `${a.created_by_name} (${a.created_by ?? '—'})` : (a.created_by ? `User #${a.created_by}` : '—')}/>
          <Row label="Alternate Address" value={a.alternate_address}/>
          <span/>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 py-1 border-b border-gray-50">
      <span className="text-gray-500 text-xs w-44 flex-shrink-0 font-medium">{label}</span>
      <span className="text-gray-800 break-words flex-1">
        {value != null && value !== '' ? value : <span className="text-gray-300">—</span>}
      </span>
    </div>
  )
}
