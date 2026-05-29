// src/pages/ambulance/AddAmbulanceCallModal.tsx
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Search } from 'lucide-react'
import { ambulanceApi } from '@/api/ambulance'
import { patientsApi } from '@/api/patients'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'
import PatientFormModal from '@/pages/patients/PatientFormModal'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Insurance', 'Online']
const CHARGE_CATEGORIES = ['General', 'TPA', 'Doctor', 'Insurance']
const CHARGE_NAMES      = ['Standard', 'Discounted', 'Premium']

interface FormShape {
  patient_id       : number | ''
  case_id          : string
  apply_tpa        : boolean
  vehicle_id       : number | ''
  driver_name      : string
  call_date        : string
  charge_category  : string
  charge_name      : string
  standard_charge  : number
  note             : string
  discount         : number
  discount_percent : number
  tax_percent      : number
  payment_mode     : string
  paid             : number
}

export default function AddAmbulanceCallModal({ open, onClose, onSuccess }: Props) {
  const qc = useQueryClient()
  const [patientModal, setPatientModal] = useState(false)

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormShape>({
    defaultValues: {
      patient_id: '', case_id: '', apply_tpa: false,
      vehicle_id: '', driver_name: '',
      call_date: new Date().toISOString().slice(0, 10),
      charge_category: '', charge_name: '', standard_charge: 0,
      note: '',
      discount: 0, discount_percent: 0, tax_percent: 0,
      payment_mode: 'Cash', paid: 0,
    },
  })

  useEffect(() => { if (open) reset() }, [open, reset])

  const { data: patientsData } = useQuery({
    queryKey: ['amb-patients'], queryFn: () => patientsApi.list().then(r => r.data), enabled: open,
  })
  const patients: any[] = patientsData?.data ?? []

  const { data: vehiclesData } = useQuery({
    queryKey: ['amb-vehicles-lookup'],
    queryFn: () => ambulanceApi.listVehicles({ per_page: 200 }).then(r => r.data),
    enabled: open,
  })
  const vehicles: any[] = vehiclesData?.data ?? []

  const vehicleId = watch('vehicle_id')

  // Auto-fill driver name when vehicle is picked
  useEffect(() => {
    if (!vehicleId) return
    const v = vehicles.find((x: any) => x.id === Number(vehicleId))
    if (v?.driver_name) setValue('driver_name', v.driver_name)
  }, [vehicleId, vehicles, setValue])

  const standardCharge = Number(watch('standard_charge')) || 0
  const discount       = Number(watch('discount')) || 0
  const discPct        = Number(watch('discount_percent')) || 0
  const taxPct         = Number(watch('tax_percent')) || 0

  const totals = useMemo(() => {
    const total = standardCharge
    const disc  = discount + total * discPct / 100
    const tax   = (total - disc) * taxPct / 100
    const net   = Math.max(0, total - disc + tax)
    return { total, disc, tax, net }
  }, [standardCharge, discount, discPct, taxPct])

  const mut = useMutation({
    mutationFn: (raw: FormShape) => ambulanceApi.createBill({
      patient_id      : raw.patient_id ? Number(raw.patient_id) : undefined,
      case_id         : raw.case_id || undefined,
      vehicle_id      : raw.vehicle_id ? Number(raw.vehicle_id) : undefined,
      driver_name     : raw.driver_name || undefined,
      call_date       : raw.call_date || undefined,
      charge_category : raw.charge_category || undefined,
      charge_name     : raw.charge_name || undefined,
      standard_charge : Number(raw.standard_charge) || 0,
      note            : raw.note || undefined,
      apply_tpa       : !!raw.apply_tpa,
      amount          : Number(raw.standard_charge) || 0,
      discount        : totals.disc,
      discount_percent: Number(raw.discount_percent) || 0,
      tax_percent     : Number(raw.tax_percent) || 0,
      paid            : Number(raw.paid) || 0,
      payment_mode    : raw.payment_mode || 'Cash',
    }),
    onSuccess,
  })

  return (
    <>
    <Modal open={open} onClose={onClose} size="xl" title="Add Ambulance Call"
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="amb-call-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="amb-call-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-5">
            <FormField label="Patient">
              <select className="input" {...register('patient_id')}>
                <option value="">Select Patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} {p.phone ? `· ${p.phone}` : ''}</option>)}
              </select>
            </FormField>
          </div>
          <div className="col-span-2">
            <button type="button" onClick={() => setPatientModal(true)}
                    className="btn btn-outline w-full flex items-center justify-center gap-1.5">
              <UserPlus size={13}/> New Patient
            </button>
          </div>
          <div className="col-span-3">
            <FormField label="Case ID">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400"/>
                <input className="input pl-8" {...register('case_id')} />
              </div>
            </FormField>
          </div>
          <div className="col-span-2 flex items-center pb-2 gap-2">
            <input id="amb_apply_tpa" type="checkbox" {...register('apply_tpa')} />
            <label htmlFor="amb_apply_tpa" className="text-sm text-gray-700">Apply TPA</label>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <FormField label="Vehicle Model" required>
            <select className="input" {...register('vehicle_id', { required: true })}>
              <option value="">Select</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.vehicle_no} · {v.model}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Driver Name">
            <input className="input bg-gray-50" readOnly {...register('driver_name')} />
          </FormField>
          <FormField label="Date" required>
            <input type="date" className="input" {...register('call_date', { required: true })} />
          </FormField>
          <FormField label="Charge Category" required>
            <select className="input" {...register('charge_category', { required: true })}>
              <option value="">Select</option>
              {CHARGE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <FormField label="Charge Name" required>
            <select className="input" {...register('charge_name', { required: true })}>
              <option value="">Select</option>
              {CHARGE_NAMES.map(c => <option key={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Standard Charge (₹)" required>
            <input type="number" step="0.01" className="input" {...register('standard_charge', { required: true, valueAsNumber: true })} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
          <FormField label="Note">
            <textarea className="input min-h-[100px]" {...register('note')} />
          </FormField>

          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>Total (₹)</span><span className="font-medium">${totals.total.toFixed(2)}</span></div>
            <div className="flex items-center justify-between text-sm">
              <span>Discount (₹)</span>
              <div className="flex items-center gap-1">
                <input type="number" step="0.01" className="input h-8 w-20 text-right" {...register('discount', { valueAsNumber: true })} />
                <input type="number" step="0.01" placeholder="%" className="input h-8 w-14 text-right" {...register('discount_percent', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Tax (₹)</span>
              <div className="flex items-center gap-1">
                <span>${totals.tax.toFixed(2)}</span>
                <input type="number" step="0.01" placeholder="%" className="input h-8 w-14 text-right" {...register('tax_percent', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-100 pt-1.5 font-semibold">
              <span>Net Amount (₹)</span><span>${totals.net.toFixed(2)}</span>
            </div>
            <div className="pt-2 grid grid-cols-2 gap-3">
              <FormField label="Payment Mode">
                <select className="input" {...register('payment_mode')}>
                  {PAYMENT_MODES.map(p => <option key={p}>{p}</option>)}
                </select>
              </FormField>
              <FormField label="Payment Amount (₹)" required>
                <input type="number" step="0.01" className="input" {...register('paid', { valueAsNumber: true })} />
              </FormField>
            </div>
          </div>
        </div>
      </form>
    </Modal>

    <PatientFormModal
      open={patientModal}
      onClose={() => setPatientModal(false)}
      onSuccess={() => { setPatientModal(false); qc.invalidateQueries({ queryKey: ['amb-patients'] }) }}
    />
    </>
  )
}
