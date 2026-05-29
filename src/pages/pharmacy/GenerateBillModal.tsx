// src/pages/pharmacy/GenerateBillModal.tsx
import { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, UserPlus, Search } from 'lucide-react'
import { pharmacyApi } from '@/api/pharmacy'
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

interface ItemRow {
  category_id : number | ''
  medicine_id : number | ''
  batch_id    : number | ''
  batch_no    : string
  expiry_date : string
  quantity    : number
  available_qty: number
  sale_price  : number
  tax_percent : number
  discount_percent: number
  amount      : number
}

interface FormShape {
  patient_id      : number | ''
  prescription_no : string
  apply_tpa       : boolean
  doctor_id       : number | ''
  doctor_name     : string
  note            : string
  payment_mode    : string
  paid_amount     : number
  discount        : number
  items: ItemRow[]
}

const blankRow = (): ItemRow => ({
  category_id: '', medicine_id: '', batch_id: '', batch_no: '', expiry_date: '',
  quantity: 1, available_qty: 0, sale_price: 0, tax_percent: 0, discount_percent: 0, amount: 0,
})

export default function GenerateBillModal({ open, onClose, onSuccess }: Props) {
  const qc = useQueryClient()
  const [patientModal, setPatientModal] = useState(false)

  const { register, handleSubmit, control, reset, watch, setValue } = useForm<FormShape>({
    defaultValues: {
      patient_id: '', prescription_no: '', apply_tpa: false,
      doctor_id: '', doctor_name: '', note: '',
      payment_mode: 'Cash', paid_amount: 0, discount: 0,
      items: [blankRow()],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => { if (open) reset() }, [open, reset])

  const { data: patientsData } = useQuery({
    queryKey: ['pharmacy-patients'],
    queryFn:  () => patientsApi.list().then(r => r.data),
    enabled:  open,
  })
  const patients: any[] = patientsData?.data ?? []

  const { data: doctorsData } = useQuery({
    queryKey: ['pharmacy-doctors'],
    queryFn:  () => hrApi.listStaff({ role: 'Doctor' }).then(r => r.data),
    enabled:  open,
  })
  const doctors: any[] = doctorsData?.data ?? []

  const { data: catData } = useQuery({
    queryKey: ['pharmacy-categories'],
    queryFn:  () => pharmacyApi.categories().then(r => r.data),
    enabled:  open,
  })
  const categories: any[] = catData?.data ?? []

  const { data: medsData } = useQuery({
    queryKey: ['pharmacy-medicines-all'],
    queryFn:  () => pharmacyApi.listMedicines({ per_page: 500 }).then(r => r.data),
    enabled:  open,
  })
  const medicines: any[] = medsData?.data ?? []

  // When category changes on a row, clear the medicine choice.
  const onPickCategory = (idx: number, _: number) => {
    setValue(`items.${idx}.medicine_id`, '')
    setValue(`items.${idx}.batch_id`,    '')
    setValue(`items.${idx}.batch_no`,    '')
    setValue(`items.${idx}.expiry_date`, '')
    setValue(`items.${idx}.sale_price`,  0)
    setValue(`items.${idx}.tax_percent`, 0)
    setValue(`items.${idx}.available_qty`, 0)
    setValue(`items.${idx}.amount`,      0)
  }

  // When medicine changes, prefill snapshot fields + load batches.
  const onPickMedicine = async (idx: number, medId: number) => {
    if (!medId) return
    const m = medicines.find(x => x.id === medId)
    if (m) {
      setValue(`items.${idx}.available_qty`, m.available_qty ?? 0)
      setValue(`items.${idx}.tax_percent`,   Number(m.tax) || 0)
    }
    setValue(`items.${idx}.batch_id`, '')
    setValue(`items.${idx}.batch_no`, '')
    setValue(`items.${idx}.expiry_date`, '')
    try {
      const res = await pharmacyApi.batches(medId)
      const batches: any[] = res.data?.data ?? []
      // Cache batches on the medicine row via a side-channel query.
      qc.setQueryData(['pharmacy-batches', medId], batches)
      // Auto-pick first batch with stock
      const firstWithStock = batches.find(b => (b.available_qty ?? 0) > 0) || batches[0]
      if (firstWithStock) {
        setValue(`items.${idx}.batch_id`,   firstWithStock.id)
        setValue(`items.${idx}.batch_no`,   firstWithStock.batch_no || '')
        setValue(`items.${idx}.expiry_date`,firstWithStock.expiry_date || '')
        setValue(`items.${idx}.sale_price`, Number(firstWithStock.sale_price) || 0)
      }
    } catch {
      qc.setQueryData(['pharmacy-batches', medId], [])
    }
  }

  // Filter medicines by chosen category.
  const filteredMedsForRow = (catId: number | ''): any[] => {
    if (!catId) return medicines
    return medicines.filter(m => m.category_id === Number(catId))
  }

  // Recompute amount per row whenever inputs change.
  const watchedItems = watch('items')
  useEffect(() => {
    watchedItems.forEach((it, idx) => {
      const qty   = Number(it.quantity) || 0
      const price = Number(it.sale_price) || 0
      const tax   = Number(it.tax_percent) || 0
      const disc  = Number(it.discount_percent) || 0
      const gross = qty * price
      const disc$ = gross * disc / 100
      const tax$  = (gross - disc$) * tax / 100
      const amt   = gross - disc$ + tax$
      if (Number(it.amount) !== Number(amt.toFixed(2))) {
        setValue(`items.${idx}.amount`, Number(amt.toFixed(2)))
      }
    })
  }, [JSON.stringify(watchedItems.map(i => [i.quantity, i.sale_price, i.tax_percent, i.discount_percent]))])  // eslint-disable-line

  const totals = useMemo(() => {
    let total = 0, tax = 0, disc = 0
    for (const it of watchedItems) {
      const qty   = Number(it.quantity) || 0
      const price = Number(it.sale_price) || 0
      const t     = Number(it.tax_percent) || 0
      const d     = Number(it.discount_percent) || 0
      const gross = qty * price
      const d$    = gross * d / 100
      const t$    = (gross - d$) * t / 100
      total += gross
      disc  += d$
      tax   += t$
    }
    const overallDiscount = Number(watch('discount')) || 0
    const net = Math.max(0, total - disc - overallDiscount + tax)
    return { total, tax, disc, overallDiscount, net }
  }, [watchedItems, watch('discount')])

  const mut = useMutation({
    mutationFn: (d: any) => pharmacyApi.generateBill(d),
    onSuccess,
  })

  const onSubmit = (raw: FormShape) => {
    const items = raw.items
      .filter(i => i.medicine_id && Number(i.quantity) > 0)
      .map(i => ({
        medicine_id     : Number(i.medicine_id),
        batch_id        : i.batch_id ? Number(i.batch_id) : undefined,
        batch_no        : i.batch_no || undefined,
        expiry_date     : i.expiry_date || undefined,
        quantity        : Number(i.quantity),
        sale_price      : Number(i.sale_price) || 0,
        tax_percent     : Number(i.tax_percent) || 0,
        discount_percent: Number(i.discount_percent) || 0,
      }))
    mut.mutate({
      patient_id     : raw.patient_id ? Number(raw.patient_id) : undefined,
      prescription_no: raw.prescription_no || undefined,
      apply_tpa      : !!raw.apply_tpa,
      doctor_id      : raw.doctor_id ? Number(raw.doctor_id) : undefined,
      doctor_name    : raw.doctor_name || undefined,
      note           : raw.note || undefined,
      payment_mode   : raw.payment_mode || 'Cash',
      paid_amount    : Number(raw.paid_amount) || 0,
      items,
    })
  }

  return (
    <>
    <Modal open={open} onClose={onClose} size="xl" title="Generate Pharmacy Bill"
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="pharm-bill-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="pharm-bill-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-5">
            <FormField label="Patient">
              <select className="input" {...register('patient_id')}>
                <option value="">Select patient</option>
                {patients.map(p => (
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
            <input id="apply_tpa" type="checkbox" {...register('apply_tpa')} />
            <label htmlFor="apply_tpa" className="text-sm text-gray-700">Apply TPA</label>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Items</h3>
            <button type="button" onClick={() => append(blankRow())}
                    className="btn btn-outline text-xs flex items-center gap-1">
              <Plus size={12}/> Add
            </button>
          </div>

          <div className="space-y-2">
            {fields.map((f, idx) => {
              const catVal = watch(`items.${idx}.category_id`)
              const medsForRow = filteredMedsForRow(catVal)
              const medVal  = watch(`items.${idx}.medicine_id`)
              const batches: any[] = (qc.getQueryData(['pharmacy-batches', Number(medVal)]) as any[]) ?? []
              return (
                <div key={f.id} className="grid grid-cols-[1fr_1.5fr_1fr_1fr_0.8fr_1fr_0.6fr_0.7fr_1fr_auto] gap-2 items-end">
                  <FormField label={idx === 0 ? 'Medicine Category' : ''} required={idx === 0}>
                    <select className="input text-xs h-8"
                            {...register(`items.${idx}.category_id` as const, {
                              onChange: e => onPickCategory(idx, Number(e.target.value)),
                            })}>
                      <option value="">Select</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </FormField>
                  <FormField label={idx === 0 ? 'Medicine Name' : ''} required={idx === 0}>
                    <select className="input text-xs h-8"
                            {...register(`items.${idx}.medicine_id` as const, {
                              onChange: e => onPickMedicine(idx, Number(e.target.value)),
                            })}>
                      <option value="">Select</option>
                      {medsForRow.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </FormField>
                  <FormField label={idx === 0 ? 'Batch No' : ''} required={idx === 0}>
                    <select className="input text-xs h-8"
                            {...register(`items.${idx}.batch_id` as const, {
                              onChange: e => {
                                const b = batches.find((x: any) => x.id === Number(e.target.value))
                                if (b) {
                                  setValue(`items.${idx}.batch_no`,   b.batch_no || '')
                                  setValue(`items.${idx}.expiry_date`,b.expiry_date || '')
                                  setValue(`items.${idx}.sale_price`, Number(b.sale_price) || 0)
                                }
                              },
                            })}>
                      <option value="">Select</option>
                      {batches.map((b: any) => <option key={b.id} value={b.id}>{b.batch_no}</option>)}
                    </select>
                  </FormField>
                  <FormField label={idx === 0 ? 'Expiry Date' : ''}>
                    <input type="date" className="input text-xs h-8 bg-gray-50" readOnly
                           {...register(`items.${idx}.expiry_date` as const)} />
                  </FormField>
                  <FormField label={idx === 0 ? `Qty | Avail` : ''} required={idx === 0}>
                    <div className="flex items-center gap-1">
                      <input type="number" min={1} className="input text-xs h-8 w-16"
                             {...register(`items.${idx}.quantity` as const, { valueAsNumber: true })} />
                      <span className="text-[10px] text-gray-400">
                        ({watch(`items.${idx}.available_qty`) || 0})
                      </span>
                    </div>
                  </FormField>
                  <FormField label={idx === 0 ? 'Sale Price (₹)' : ''} required={idx === 0}>
                    <input type="number" step="0.01" className="input text-xs h-8"
                           {...register(`items.${idx}.sale_price` as const, { valueAsNumber: true })} />
                  </FormField>
                  <FormField label={idx === 0 ? 'Tax %' : ''}>
                    <input type="number" step="0.01" className="input text-xs h-8"
                           {...register(`items.${idx}.tax_percent` as const, { valueAsNumber: true })} />
                  </FormField>
                  <FormField label={idx === 0 ? 'Disc %' : ''}>
                    <input type="number" step="0.01" className="input text-xs h-8"
                           {...register(`items.${idx}.discount_percent` as const, { valueAsNumber: true })} />
                  </FormField>
                  <FormField label={idx === 0 ? 'Amount (₹)' : ''}>
                    <input type="number" step="0.01" className="input text-xs h-8 bg-gray-50" readOnly
                           {...register(`items.${idx}.amount` as const, { valueAsNumber: true })} />
                  </FormField>
                  <button type="button" onClick={() => fields.length > 1 && remove(idx)}
                          className="icon-btn text-red-400 mb-1.5"><Trash2 size={13}/></button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
          <div className="space-y-3">
            <FormField label="Hospital Doctor">
              <select className="input" {...register('doctor_id')}>
                <option value="">Select</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {[d.first_name, d.last_name].filter(Boolean).join(' ')} {d.designation ? `· ${d.designation}` : ''}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Doctor Name">
              <input className="input" {...register('doctor_name')} placeholder="External doctor"/>
            </FormField>
            <FormField label="Note">
              <textarea className="input min-h-[60px]" {...register('note')} />
            </FormField>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>Total (₹)</span><span className="font-medium">${totals.total.toFixed(2)}</span></div>
            <div className="flex items-center justify-between text-sm">
              <span>Discount (₹)</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">${totals.disc.toFixed(2)} + extra</span>
                <input type="number" step="0.01" className="input h-8 w-24 text-right" {...register('discount', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="flex justify-between text-sm"><span>Tax (₹)</span><span>${totals.tax.toFixed(2)}</span></div>
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
                <input type="number" step="0.01" className="input" {...register('paid_amount', { valueAsNumber: true })} />
              </FormField>
            </div>
          </div>
        </div>
      </form>
    </Modal>

    <PatientFormModal
      open={patientModal}
      onClose={() => setPatientModal(false)}
      onSuccess={() => { setPatientModal(false); qc.invalidateQueries({ queryKey: ['pharmacy-patients'] }) }}
    />
    </>
  )
}
