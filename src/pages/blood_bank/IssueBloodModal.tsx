// src/pages/blood_bank/IssueBloodModal.tsx
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Search } from 'lucide-react'
import { bloodBankApi } from '@/api/blood_bank'
import { patientsApi } from '@/api/patients'
import { hrApi } from '@/api/hr'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'
import PatientFormModal from '@/pages/patients/PatientFormModal'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Insurance', 'Online']
const CHARGE_CATEGORIES = ['General', 'TPA', 'Doctor', 'Insurance']
const CHARGE_NAMES      = ['Standard', 'Discounted', 'Premium']

interface FormShape {
  patient_id         : number | ''
  case_id            : string
  apply_tpa          : boolean
  issue_date         : string
  hospital_doctor_id : number | ''
  reference_name     : string
  technician         : string
  blood_group        : string
  bag_id             : number | ''
  charge_category    : string
  charge_name        : string
  standard_charge    : number
  note               : string
  blood_qty          : number
  discount           : number
  discount_percent   : number
  tax_percent        : number
  payment_mode       : string
  paid               : number
}

export default function IssueBloodModal({ open, onClose, onSuccess }: Props) {
  const qc = useQueryClient()
  const [patientModal, setPatientModal] = useState(false)

  const { register, handleSubmit, reset, watch } = useForm<FormShape>({
    defaultValues: {
      patient_id: '', case_id: '', apply_tpa: false,
      issue_date: new Date().toISOString().slice(0, 10),
      hospital_doctor_id: '', reference_name: '', technician: '',
      blood_group: '', bag_id: '',
      charge_category: '', charge_name: '', standard_charge: 0,
      note: '', blood_qty: 0,
      discount: 0, discount_percent: 0, tax_percent: 0,
      payment_mode: 'Cash', paid: 0,
    },
  })
  useEffect(() => { if (open) reset() }, [open, reset])

  const { data: patientsData } = useQuery({
    queryKey: ['bb-issue-patients'], queryFn: () => patientsApi.list().then(r => r.data), enabled: open,
  })
  const patients: any[] = patientsData?.data ?? []

  const { data: doctorsData } = useQuery({
    queryKey: ['bb-doctors'], queryFn: () => hrApi.listStaff({ role: 'Doctor' }).then(r => r.data), enabled: open,
  })
  const doctors: any[] = doctorsData?.data ?? []

  const bloodGroup = watch('blood_group')
  const { data: bagsData } = useQuery({
    queryKey: ['bb-bags-for-issue', bloodGroup],
    queryFn: () => bloodBankApi.listStock({ blood_group: bloodGroup, available_only: true }).then(r => r.data),
    enabled: open && !!bloodGroup,
  })
  const bags: any[] = bagsData?.data ?? []

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
    mutationFn: (raw: FormShape) => bloodBankApi.issueBlood({
      bag_id            : Number(raw.bag_id),
      patient_id        : raw.patient_id ? Number(raw.patient_id) : undefined,
      case_id           : raw.case_id || undefined,
      hospital_doctor_id: raw.hospital_doctor_id ? Number(raw.hospital_doctor_id) : undefined,
      reference_name    : raw.reference_name || undefined,
      technician        : raw.technician || undefined,
      blood_qty         : Number(raw.blood_qty) || undefined,
      charge_category   : raw.charge_category || undefined,
      charge_name       : raw.charge_name || undefined,
      standard_charge   : Number(raw.standard_charge) || 0,
      note              : raw.note || undefined,
      apply_tpa         : !!raw.apply_tpa,
      amount            : Number(raw.standard_charge) || 0,
      discount          : totals.disc,
      tax_percent       : Number(raw.tax_percent) || 0,
      paid              : Number(raw.paid) || 0,
      payment_mode      : raw.payment_mode || 'Cash',
    }),
    onSuccess,
  })

  return (
    <>
    <Modal open={open} onClose={onClose} size="xl" title="Issue Blood"
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="bb-issue-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="bb-issue-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-4">
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
            <input id="bb_apply_tpa" type="checkbox" {...register('apply_tpa')} />
            <label htmlFor="bb_apply_tpa" className="text-sm text-gray-700">Apply TPA</label>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <FormField label="Issue Date" required>
            <input type="date" className="input" {...register('issue_date', { required: true })} />
          </FormField>
          <FormField label="Hospital Doctor" required>
            <select className="input" {...register('hospital_doctor_id', { required: true })}>
              <option value="">Select</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{[d.first_name, d.last_name].filter(Boolean).join(' ')}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Reference Name" required>
            <input className="input" {...register('reference_name', { required: true })} />
          </FormField>
          <FormField label="Technician">
            <input className="input" {...register('technician')} />
          </FormField>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <FormField label="Blood Group" required>
            <select className="input" {...register('blood_group', { required: true })}>
              <option value="">Select</option>
              {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
          </FormField>
          <FormField label="Bag" required>
            <select className="input" {...register('bag_id', { required: true })}>
              <option value="">Select</option>
              {bags.map((b: any) => <option key={b.id} value={b.id}>{b.bag_no} ({b.volume_ml} {b.volume_unit})</option>)}
            </select>
          </FormField>
          <FormField label="Charge Category" required>
            <select className="input" {...register('charge_category', { required: true })}>
              <option value="">Select</option>
              {CHARGE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Charge Name" required>
            <select className="input" {...register('charge_name', { required: true })}>
              <option value="">Select</option>
              {CHARGE_NAMES.map(c => <option key={c}>{c}</option>)}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <FormField label="Standard Charge (₹)">
            <input type="number" step="0.01" className="input" {...register('standard_charge', { valueAsNumber: true })} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
          <div className="space-y-3">
            <FormField label="Note">
              <textarea className="input min-h-[60px]" {...register('note')} />
            </FormField>
            <FormField label="Blood Qty">
              <input type="number" step="0.01" className="input" {...register('blood_qty', { valueAsNumber: true })} />
            </FormField>
          </div>

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
      onSuccess={() => { setPatientModal(false); qc.invalidateQueries({ queryKey: ['bb-issue-patients'] }) }}
    />
    </>
  )
}
