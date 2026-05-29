// src/pages/radiology/GenerateRadiologyBillModal.tsx
import { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, UserPlus, Search } from 'lucide-react'
import { radiologyApi } from '@/api/radiology'
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

const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Insurance', 'Online']

interface FormShape {
  patient_id            : number | ''
  prescription_no       : string
  apply_tpa             : boolean
  reference_doctor_id   : number | ''
  doctor_name           : string
  note                  : string
  previous_report_value : string
  discount              : number
  paid                  : number
  payment_mode          : string
  items: Array<{
    test_id     : number | ''
    test_name   : string
    report_days : number
    report_date : string
    tax_percent : number
    price       : number
    amount      : number
  }>
}

export default function GenerateRadiologyBillModal({ open, onClose, onSuccess }: Props) {
  const qc = useQueryClient()
  const [patientModal, setPatientModal] = useState(false)

  const { register, handleSubmit, control, reset, watch, setValue } = useForm<FormShape>({
    defaultValues: {
      patient_id: '', prescription_no: '', apply_tpa: false,
      reference_doctor_id: '', doctor_name: '', note: '', previous_report_value: '',
      discount: 0, paid: 0, payment_mode: 'Cash',
      items: [{ test_id: '', test_name: '', report_days: 1, report_date: '', tax_percent: 0, price: 0, amount: 0 }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => { if (open) reset() }, [open, reset])

  const { data: patientsData } = useQuery({
    queryKey: ['radio-patients'], queryFn: () => patientsApi.list().then(r => r.data), enabled: open,
  })
  const patients = patientsData?.data ?? []

  const { data: staffData } = useQuery({
    queryKey: ['radio-staff'], queryFn: () => hrApi.listStaff().then(r => r.data), enabled: open,
  })
  const staff: any[] = staffData?.data ?? []

  const { data: testsData } = useQuery({
    queryKey: ['radio-tests-lookup'],
    queryFn: () => radiologyApi.listTests({ per_page: 500 }).then(r => r.data),
    enabled: open,
  })
  const tests: any[] = testsData?.data ?? []

  const watchedItems = watch('items')
  const watchedDiscount = watch('discount')

  const summary = useMemo(() => {
    const subTotal = watchedItems.reduce((s, it) => s + (Number(it.price) || 0), 0)
    const taxTotal = watchedItems.reduce((s, it) => {
      const p = Number(it.price) || 0
      const t = Number(it.tax_percent) || 0
      return s + p * t / 100
    }, 0)
    const discount = Number(watchedDiscount) || 0
    const net = subTotal - discount + taxTotal
    return { total: subTotal, tax: taxTotal, net: Math.max(0, net) }
  }, [watchedItems, watchedDiscount])

  const onPickTest = (idx: number, testId: number) => {
    const t = tests.find(x => x.id === testId)
    if (!t) return
    setValue(`items.${idx}.test_name`,   t.name)
    setValue(`items.${idx}.report_days`, t.report_days ?? 1)
    setValue(`items.${idx}.tax_percent`, t.tax_percent ?? 0)
    setValue(`items.${idx}.price`,       t.standard_charge ?? t.amount ?? 0)
    const stdCharge = Number(t.standard_charge ?? t.amount ?? 0)
    const tp        = Number(t.tax_percent ?? 0)
    setValue(`items.${idx}.amount`, Number((stdCharge * (1 + tp / 100)).toFixed(2)))
  }

  const mut = useMutation({
    mutationFn: (d: any) => radiologyApi.generateBill(d),
    onSuccess,
  })

  const onSubmit = (raw: FormShape) => {
    const items = raw.items
      .filter(i => i.test_id && Number(i.price) > 0)
      .map(i => ({
        test_id    : Number(i.test_id),
        test_name  : i.test_name,
        report_days: Number(i.report_days) || 1,
        report_date: i.report_date || undefined,
        tax_percent: Number(i.tax_percent) || 0,
        price      : Number(i.price),
        amount     : Number(i.amount) || undefined,
      }))
    mut.mutate({
      patient_id            : raw.patient_id ? Number(raw.patient_id) : undefined,
      prescription_no       : raw.prescription_no || undefined,
      apply_tpa             : !!raw.apply_tpa,
      reference_doctor_id   : raw.reference_doctor_id ? Number(raw.reference_doctor_id) : undefined,
      doctor_name           : raw.doctor_name || undefined,
      note                  : raw.note || undefined,
      previous_report_value : raw.previous_report_value || undefined,
      discount              : Number(raw.discount) || 0,
      paid                  : Number(raw.paid) || 0,
      payment_mode          : raw.payment_mode || 'Cash',
      items,
    })
  }

  return (
    <>
    <Modal open={open} onClose={onClose} size="xl" title="Generate Radiology Bill"
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="radio-bill-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Generating…' : 'Save'}
          </button>
        </div>
      }>
      <form id="radio-bill-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-5">
            <FormField label="Patient">
              <select className="input" {...register('patient_id')}>
                <option value="">Select patient</option>
                {patients.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} {p.phone ? `· ${p.phone}` : ''}</option>
                ))}
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
            <FormField label="Prescription No">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400"/>
                <input className="input pl-8" {...register('prescription_no')} />
              </div>
            </FormField>
          </div>
          <div className="col-span-2 flex items-center pb-2 gap-2">
            <input id="radio_apply_tpa" type="checkbox" {...register('apply_tpa')} />
            <label htmlFor="radio_apply_tpa" className="text-sm text-gray-700">Apply TPA</label>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Tests</h3>
            <button type="button" onClick={() => append({
              test_id: '', test_name: '', report_days: 1, report_date: '', tax_percent: 0, price: 0, amount: 0,
            })} className="btn btn-outline text-xs flex items-center gap-1">
              <Plus size={12}/> Add
            </button>
          </div>

          <div className="space-y-2">
            {fields.map((f, idx) => (
              <div key={f.id} className="grid grid-cols-[2fr_0.8fr_1.2fr_0.7fr_1fr_auto] gap-2 items-end">
                <FormField label={idx === 0 ? 'Test Name' : ''} required={idx === 0}>
                  <select className="input"
                          {...register(`items.${idx}.test_id` as const, {
                            onChange: e => onPickTest(idx, Number(e.target.value)),
                          })}>
                    <option value="">Select</option>
                    {tests.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </FormField>
                <FormField label={idx === 0 ? 'Days' : ''}>
                  <input type="number" min={0} className="input bg-gray-50" readOnly {...register(`items.${idx}.report_days` as const, { valueAsNumber: true })} />
                </FormField>
                <FormField label={idx === 0 ? 'Report Date' : ''}>
                  <input type="date" className="input" {...register(`items.${idx}.report_date` as const)} />
                </FormField>
                <FormField label={idx === 0 ? 'Tax %' : ''}>
                  <input type="number" step="0.01" className="input bg-gray-50" readOnly {...register(`items.${idx}.tax_percent` as const, { valueAsNumber: true })} />
                </FormField>
                <FormField label={idx === 0 ? 'Amount (₹)' : ''}>
                  <input type="number" step="0.01" className="input bg-gray-50" readOnly {...register(`items.${idx}.amount` as const, { valueAsNumber: true })} />
                </FormField>
                <button type="button" onClick={() => remove(idx)} className="icon-btn text-red-400 mb-1.5">
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
          <div className="space-y-3">
            <FormField label="Referral Doctor">
              <select className="input" {...register('reference_doctor_id')}>
                <option value="">Select</option>
                {staff.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {[s.first_name, s.last_name].filter(Boolean).join(' ')} {s.designation ? `· ${s.designation}` : ''}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Doctor Name">
              <input className="input" {...register('doctor_name')} />
            </FormField>
            <FormField label="Note">
              <textarea className="input min-h-[60px]" {...register('note')} />
            </FormField>
            <FormField label="Previous Report Value">
              <input className="input" {...register('previous_report_value')} />
            </FormField>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>Total (₹)</span><span className="font-medium">${summary.total.toFixed(2)}</span></div>
            <div className="flex items-center justify-between text-sm">
              <span>Discount (₹)</span>
              <input type="number" step="0.01" className="input h-8 w-32 text-right" {...register('discount', { valueAsNumber: true })} />
            </div>
            <div className="flex justify-between text-sm"><span>Tax (₹)</span><span>${summary.tax.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm border-t border-gray-100 pt-1.5 font-semibold">
              <span>Net Amount (₹)</span><span>${summary.net.toFixed(2)}</span>
            </div>
            <div className="pt-2 grid grid-cols-2 gap-3">
              <FormField label="Payment Mode">
                <select className="input" {...register('payment_mode')}>
                  {PAYMENT_MODES.map(p => <option key={p}>{p}</option>)}
                </select>
              </FormField>
              <FormField label="Amount (₹)" required>
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
      onSuccess={() => { setPatientModal(false); qc.invalidateQueries({ queryKey: ['radio-patients'] }) }}
    />
    </>
  )
}
