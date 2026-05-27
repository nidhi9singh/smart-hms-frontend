// src/pages/appointments/AppointmentFormModal.tsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { appointmentsApi } from '@/api/appointments'
import { hrApi } from '@/api/hr'
import { patientsApi } from '@/api/patients'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const SHIFTS    = ['Morning', 'Evening', 'Night']
const SLOTS     = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM']
const PRIORITIES = ['Normal', 'Urgent', 'Low', 'Emergency']
const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Cheque', 'Online']
const STATUSES  = ['Pending', 'Approved', 'Cancelled']
const SOURCES   = ['Offline', 'Online']

export default function AppointmentFormModal({ open, onClose, onSuccess }: Props) {
  const qc = useQueryClient()

  // Lookups
  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsApi.list({ per_page: 500 }).then(r => r.data),
    enabled: open,
  })
  const patients = (patientsData?.data ?? []) as any[]
  const patientList = Array.isArray(patients) ? patients : []

  const { data: staffData } = useQuery({
    queryKey: ['staff-all'],
    queryFn: () => hrApi.listStaff({ per_page: 500 }).then(r => r.data),
    enabled: open,
  })
  const allStaff = (staffData?.data ?? []) as any[]
  const doctors = allStaff.filter((s: any) => /doctor/i.test(s.role ?? ''))

  // Form state
  const [form, setForm] = useState({
    patient_id:        '',
    doctor_id:         '',
    doctor_fees:       '',
    shift:             '',
    appointment_date:  '',
    slot:              '',
    priority:          'Normal',
    payment_mode:      'Cash',
    status:            'Pending',
    discount:          '0',
    live_consultant:   'false',
    source:            'Offline',
    message:           '',
    alternate_address: '',
    phone:             '',
    gender:            '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset on open
  useEffect(() => {
    if (open) {
      setForm(f => ({
        ...f,
        patient_id: '', doctor_id: '', doctor_fees: '', shift: '',
        appointment_date: '', slot: '', priority: 'Normal', payment_mode: 'Cash',
        status: 'Pending', discount: '0', live_consultant: 'false', source: 'Offline',
        message: '', alternate_address: '', phone: '', gender: '',
      }))
      setErrors({})
    }
  }, [open])

  // Auto-fill patient info when selected
  useEffect(() => {
    if (form.patient_id) {
      const p = patientList.find((pt: any) => String(pt.id) === form.patient_id)
      if (p) {
        setForm(f => ({ ...f, phone: p.phone ?? '', gender: p.gender ?? '' }))
      }
    }
  }, [form.patient_id, patientList])

  const setField = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  // Validate
  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.patient_id)       e.patient_id       = 'Required'
    if (!form.doctor_id)        e.doctor_id        = 'Required'
    if (!form.appointment_date) e.appointment_date  = 'Required'
    if (!form.shift)            e.shift             = 'Required'
    if (!form.status)           e.status            = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const createMut = useMutation({
    mutationFn: (d: any) => appointmentsApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      onSuccess()
    },
  })

  const handleSubmit = async () => {
    if (!validate()) return
    const fees = Number(form.doctor_fees) || 0
    const discountPct = Number(form.discount) || 0
    const paid = fees - (fees * discountPct / 100)

    createMut.mutate({
      patient_id:        Number(form.patient_id),
      doctor_id:         Number(form.doctor_id),
      appointment_date:  form.appointment_date,
      shift:             form.shift || undefined,
      slot:              form.slot || undefined,
      phone:             form.phone || undefined,
      gender:            form.gender || undefined,
      source:            form.source,
      priority:          form.priority,
      live_consultant:   form.live_consultant === 'true',
      message:           form.message || undefined,
      alternate_address: form.alternate_address || undefined,
      doctor_fees:       fees,
      fees:              fees,
      discount:          discountPct,
      paid:              paid,
      payment_mode:      form.payment_mode,
      status:            form.status,
    })
  }

  const isBusy = createMut.isPending

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Appointment"
      size="xl"
      headerClassName="bg-[#34ace0] text-white"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={isBusy}
            className="flex items-center gap-2 px-5 py-2 bg-[#00a8e8] hover:bg-[#0090c7] text-white text-sm font-medium rounded transition-colors">
            {isBusy && <Loader2 className="w-4 h-4 animate-spin" />} Save
          </button>
        </div>
      }
    >
      {/* Patient selector */}
      <div className="mb-4">
        <FormField label="Patient" required error={errors.patient_id}>
          <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white"
            value={form.patient_id} onChange={e => setField('patient_id', e.target.value)}>
            <option value="">Select Patient</option>
            {patientList.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
          </select>
        </FormField>
      </div>

      {/* Row 1: Doctor + Doctor Fees + Shift + Appointment Date */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <FormField label="Doctor" required error={errors.doctor_id}>
          <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white"
            value={form.doctor_id} onChange={e => setField('doctor_id', e.target.value)}>
            <option value="">Select</option>
            {doctors.map((d: any) => <option key={d.id} value={d.id}>{d.name} ({d.staff_code})</option>)}
          </select>
        </FormField>
        <FormField label="Doctor Fees ($)" required>
          <input type="number" className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-gray-50"
            value={form.doctor_fees} onChange={e => setField('doctor_fees', e.target.value)} />
        </FormField>
        <FormField label="Shift" required error={errors.shift}>
          <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white"
            value={form.shift} onChange={e => setField('shift', e.target.value)}>
            <option value="">Select</option>
            {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Appointment Date" required error={errors.appointment_date}>
          <input type="datetime-local" className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
            value={form.appointment_date} onChange={e => setField('appointment_date', e.target.value)} />
        </FormField>
      </div>

      {/* Row 2: Slot + Priority + Payment Mode + Status */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <FormField label="Slot">
          <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white"
            value={form.slot} onChange={e => setField('slot', e.target.value)}>
            <option value="">Select</option>
            {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Appointment Priority">
          <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white"
            value={form.priority} onChange={e => setField('priority', e.target.value)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </FormField>
        <FormField label="Payment Mode">
          <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white"
            value={form.payment_mode} onChange={e => setField('payment_mode', e.target.value)}>
            {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </FormField>
        <FormField label="Status" required error={errors.status}>
          <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white"
            value={form.status} onChange={e => setField('status', e.target.value)}>
            <option value="">Select</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
      </div>

      {/* Row 3: Discount + Live Consultant + Message */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <FormField label="Discount Percentage">
          <input type="number" className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
            value={form.discount} onChange={e => setField('discount', e.target.value)} />
        </FormField>
        <FormField label="Live Consultant (On Video Conference)" required>
          <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white"
            value={form.live_consultant} onChange={e => setField('live_consultant', e.target.value)}>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </FormField>
        <FormField label="Message">
          <input className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
            value={form.message} onChange={e => setField('message', e.target.value)} />
        </FormField>
      </div>

      {/* Row 4: Alternate Address */}
      <div className="mb-4">
        <FormField label="Alternate Address">
          <input className="w-full h-10 px-3 border border-gray-300 rounded text-sm"
            value={form.alternate_address} onChange={e => setField('alternate_address', e.target.value)} />
        </FormField>
      </div>
    </Modal>
  )
}
