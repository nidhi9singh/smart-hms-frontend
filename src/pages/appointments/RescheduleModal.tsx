// src/pages/appointments/RescheduleModal.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { appointmentsApi } from '@/api/appointments'
import { hrApi } from '@/api/hr'

const SHIFTS     = ['Morning', 'Afternoon', 'Evening', 'Night']
const PRIORITIES = ['Normal', 'Urgent', 'Very Urgent', 'Low', 'Emergency']
const STATUSES   = ['Pending', 'Approved', 'Cancelled']
const SLOTS = [
  '09:00 AM - 12:00 PM',
  '12:00 PM - 03:00 PM',
  '03:00 PM - 06:00 PM',
  '04:00 PM - 07:00 PM',
  '06:00 PM - 09:00 PM',
]

export default function RescheduleModal({ open, onClose, appointment }: {
  open: boolean; onClose: () => void; appointment: any
}) {
  const qc = useQueryClient()
  // Doctor + Doctor Fees are locked for every role on reschedule — both are
  // tied to the original booking and can't be retroactively changed.
  const lockDoctorFields = true
  const [form, setForm] = useState({
    doctor_id          : '',
    doctor_fees        : '',
    shift              : '',
    appointment_date   : '',
    slot               : '',
    priority           : 'Normal',
    discount_percent   : '0',
    status             : 'Pending',
    live_consultant    : 'No',
    message            : '',
    alternate_address  : '',
  })

  const { data: staffData } = useQuery({
    queryKey: ['staff-all'],
    queryFn:  () => hrApi.listStaff({ per_page: '500' }).then(r => r.data),
    enabled:  open,
  })
  const doctors = ((staffData?.data ?? []) as any[]).filter(s => /doctor/i.test(s.role ?? ''))

  useEffect(() => {
    if (!open || !appointment) return
    const a = appointment
    setForm({
      doctor_id          : a.doctor_id ? String(a.doctor_id) : '',
      doctor_fees        : a.fees != null ? String(a.fees) : '',
      shift              : a.shift ?? '',
      appointment_date   : a.appointment_date ? a.appointment_date.slice(0, 16) : '',
      slot               : a.slot ?? '',
      priority           : a.priority ?? 'Normal',
      discount_percent   : String(a.discount_percent ?? 0),
      status             : a.status ?? 'Pending',
      live_consultant    : a.live_consultant ? 'Yes' : 'No',
      message            : a.message ?? '',
      alternate_address  : a.alternate_address ?? '',
    })
  }, [open, appointment])

  const save = useMutation({
    mutationFn: () => appointmentsApi.update(appointment.id, {
      doctor_id          : Number(form.doctor_id) || null,
      doctor_fees        : Number(form.doctor_fees) || 0,
      fees               : Number(form.doctor_fees) || 0,
      shift              : form.shift || null,
      appointment_date   : form.appointment_date || null,
      slot               : form.slot || null,
      priority           : form.priority,
      discount_percent   : Number(form.discount_percent) || 0,
      status             : form.status,
      live_consultant    : form.live_consultant === 'Yes',
      message            : form.message || null,
      alternate_address  : form.alternate_address || null,
    }),
    onSuccess: () => {
      toast.success('Appointment rescheduled')
      qc.invalidateQueries({ queryKey: ['appointments'] })
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Failed to reschedule'),
  })

  if (!open || !appointment) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-10">
      <div className="bg-white rounded-lg shadow-xl w-[920px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 bg-brand-600 text-white rounded-t-lg sticky top-0">
          <h2 className="text-base font-semibold">Reschedule</h2>
          <button onClick={onClose}><X size={18}/></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="p-5 space-y-4">
          {/* Row 1: Doctor / Fees / Shift / Date */}
          <div className="grid grid-cols-4 gap-3">
            <Field label="Doctor" required>
              <select required value={form.doctor_id}
                onChange={e => setForm({ ...form, doctor_id: e.target.value })}
                disabled={lockDoctorFields}
                className={`input w-full ${lockDoctorFields ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}>
                <option value="">Select</option>
                {doctors.map((d: any) => {
                  const name = d.full_name || [d.first_name, d.last_name].filter(Boolean).join(' ') || d.name || `Staff #${d.id}`
                  return <option key={d.id} value={d.id}>{name} ({d.staff_code})</option>
                })}
              </select>
            </Field>
            <Field label="Doctor Fees (₹)" required>
              <input type="number" step="0.01" min="0" required value={form.doctor_fees}
                onChange={e => setForm({ ...form, doctor_fees: e.target.value })}
                readOnly={lockDoctorFields}
                className={`input w-full ${lockDoctorFields ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}/>
            </Field>
            <Field label="Shift" required>
              <select required value={form.shift}
                onChange={e => setForm({ ...form, shift: e.target.value })}
                className="input w-full">
                <option value="">Select</option>
                {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Appointment Date" required>
              <input type="datetime-local" required value={form.appointment_date}
                onChange={e => setForm({ ...form, appointment_date: e.target.value })}
                className="input w-full"/>
            </Field>
          </div>

          {/* Row 2: Slot / Priority / Discount / Status */}
          <div className="grid grid-cols-4 gap-3">
            <Field label="Slot" required>
              <select required value={form.slot}
                onChange={e => setForm({ ...form, slot: e.target.value })}
                className="input w-full">
                <option value="">Select</option>
                {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Appointment Priority">
              <select value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                className="input w-full">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Discount Percentage">
              <input type="number" step="0.01" min="0" max="100" value={form.discount_percent}
                onChange={e => setForm({ ...form, discount_percent: e.target.value })}
                className="input w-full"/>
            </Field>
            <Field label="Status" required>
              <select required value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="input w-full">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          {/* Row 3: Live Consultant */}
          <div className="grid grid-cols-4 gap-3">
            <Field label="Live Consultant (On Video Conference)" required>
              <select required value={form.live_consultant}
                onChange={e => setForm({ ...form, live_consultant: e.target.value })}
                className="input w-full">
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>
          </div>

          {/* Message + Alt Address */}
          <Field label="Message">
            <input value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              className="input w-full"/>
          </Field>
          <Field label="Alternate Address">
            <input value={form.alternate_address}
              onChange={e => setForm({ ...form, alternate_address: e.target.value })}
              className="input w-full"/>
          </Field>

          <div className="flex justify-end pt-2 border-t">
            <button type="submit" disabled={save.isPending} className="btn btn-primary">
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
