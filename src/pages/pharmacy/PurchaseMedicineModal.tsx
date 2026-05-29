// src/pages/pharmacy/PurchaseMedicineModal.tsx
import { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Plus, Trash2, Upload } from 'lucide-react'
import { pharmacyApi } from '@/api/pharmacy'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Online']

interface ItemRow {
  category_id    : number | ''
  medicine_id    : number | ''
  batch_no       : string
  expiry_month   : string
  mrp            : number
  batch_amount   : number
  sale_price     : number
  packing_qty    : number
  quantity       : number
  purchase_price : number
  tax_percent    : number
  amount         : number
}

interface FormShape {
  supplier_id      : number | ''
  bill_no          : string
  note             : string
  payment_mode     : string
  payment_amount   : number
  payment_note     : string
  discount         : number
  discount_percent : number
  items: ItemRow[]
}

const blankRow = (): ItemRow => ({
  category_id: '', medicine_id: '', batch_no: '', expiry_month: '',
  mrp: 0, batch_amount: 0, sale_price: 0, packing_qty: 0,
  quantity: 1, purchase_price: 0, tax_percent: 0, amount: 0,
})

export default function PurchaseMedicineModal({ open, onClose, onSuccess }: Props) {
  const [docFile, setDocFile] = useState<File | null>(null)

  const { register, handleSubmit, control, reset, watch, setValue } = useForm<FormShape>({
    defaultValues: {
      supplier_id: '', bill_no: '', note: '',
      payment_mode: 'Cash', payment_amount: 0, payment_note: '',
      discount: 0, discount_percent: 0,
      items: [blankRow()],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  useEffect(() => { if (open) { reset(); setDocFile(null) } }, [open, reset])

  const { data: supData } = useQuery({
    queryKey: ['purchase-suppliers'], queryFn: () => pharmacyApi.suppliers().then(r => r.data), enabled: open,
  })
  const suppliers: any[] = supData?.data ?? []

  const { data: catData } = useQuery({
    queryKey: ['purchase-categories'], queryFn: () => pharmacyApi.categories().then(r => r.data), enabled: open,
  })
  const categories: any[] = catData?.data ?? []

  const { data: medsData } = useQuery({
    queryKey: ['purchase-medicines'], queryFn: () => pharmacyApi.listMedicines({ per_page: 500 }).then(r => r.data), enabled: open,
  })
  const medicines: any[] = medsData?.data ?? []

  const onPickCategory = (idx: number) => {
    setValue(`items.${idx}.medicine_id`, '')
  }

  const onPickMedicine = (idx: number, medId: number) => {
    if (!medId) return
    const m = medicines.find(x => x.id === medId)
    if (m) setValue(`items.${idx}.tax_percent`, Number(m.tax) || 0)
  }

  const filteredMedsForRow = (catId: number | ''): any[] => {
    if (!catId) return medicines
    return medicines.filter(m => m.category_id === Number(catId))
  }

  // Recompute per-row amount = qty * purchase_price + tax
  const watchedItems = watch('items')
  useEffect(() => {
    watchedItems.forEach((it, idx) => {
      const qty   = Number(it.quantity) || 0
      const price = Number(it.purchase_price) || 0
      const tax   = Number(it.tax_percent) || 0
      const gross = qty * price
      const tax$  = gross * tax / 100
      const amt   = gross + tax$
      if (Number(it.amount) !== Number(amt.toFixed(2))) {
        setValue(`items.${idx}.amount`, Number(amt.toFixed(2)))
      }
    })
  }, [JSON.stringify(watchedItems.map(i => [i.quantity, i.purchase_price, i.tax_percent]))])  // eslint-disable-line

  const totals = useMemo(() => {
    let gross = 0, tax = 0
    for (const it of watchedItems) {
      const qty   = Number(it.quantity) || 0
      const price = Number(it.purchase_price) || 0
      const t     = Number(it.tax_percent) || 0
      const g     = qty * price
      gross += g
      tax   += g * t / 100
    }
    const discount = Number(watch('discount')) || 0
    const net = Math.max(0, gross - discount + tax)
    return { gross, tax, discount, net }
  }, [watchedItems, watch('discount')])

  const mut = useMutation({
    mutationFn: async (raw: FormShape) => {
      const items = raw.items
        .filter(i => i.medicine_id && i.batch_no && Number(i.quantity) > 0)
        .map(i => ({
          medicine_id    : Number(i.medicine_id),
          batch_no       : i.batch_no,
          expiry_month   : i.expiry_month || undefined,
          mrp            : Number(i.mrp) || 0,
          batch_amount   : Number(i.batch_amount) || 0,
          sale_price     : Number(i.sale_price) || 0,
          packing_qty    : Number(i.packing_qty) || 0,
          quantity       : Number(i.quantity),
          purchase_price : Number(i.purchase_price) || 0,
          tax_percent    : Number(i.tax_percent) || 0,
        }))
      const res = await pharmacyApi.createPurchase({
        supplier_id      : raw.supplier_id ? Number(raw.supplier_id) : undefined,
        bill_no          : raw.bill_no || undefined,
        note             : raw.note || undefined,
        payment_mode     : raw.payment_mode || 'Cash',
        payment_amount   : Number(raw.payment_amount) || 0,
        payment_note     : raw.payment_note || undefined,
        discount         : Number(raw.discount) || 0,
        discount_percent : Number(raw.discount_percent) || 0,
        items,
      })
      const purchaseId = res.data?.data?.id
      if (purchaseId && docFile) {
        await pharmacyApi.uploadPurchaseDoc(purchaseId, docFile)
      }
      return res
    },
    onSuccess,
  })

  return (
    <Modal open={open} onClose={onClose} size="xl" title="Purchase Medicine"
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="pharm-purchase-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="pharm-purchase-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <FormField label="Supplier">
              <select className="input" {...register('supplier_id')}>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Bill No">
            <input className="input" {...register('bill_no')} />
          </FormField>
        </div>

        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Items</h3>
            <button type="button" onClick={() => append(blankRow())}
                    className="btn btn-outline text-xs flex items-center gap-1">
              <Plus size={12}/> Add
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="space-y-2 min-w-[1300px]">
              {fields.map((f, idx) => {
                const catVal = watch(`items.${idx}.category_id`)
                const medsForRow = filteredMedsForRow(catVal)
                return (
                  <div key={f.id} className="grid grid-cols-[1fr_1.3fr_0.8fr_0.8fr_0.8fr_0.9fr_0.9fr_0.7fr_0.7fr_1fr_0.7fr_1fr_auto] gap-2 items-end">
                    <FormField label={idx === 0 ? 'Medicine Category' : ''} required={idx === 0}>
                      <select className="input text-xs h-8"
                              {...register(`items.${idx}.category_id` as const, {
                                onChange: () => onPickCategory(idx),
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
                      <input className="input text-xs h-8" {...register(`items.${idx}.batch_no` as const)} />
                    </FormField>
                    <FormField label={idx === 0 ? 'Expiry Month' : ''} required={idx === 0}>
                      <input className="input text-xs h-8" placeholder="YYYY-MM" {...register(`items.${idx}.expiry_month` as const)} />
                    </FormField>
                    <FormField label={idx === 0 ? 'MRP (₹)' : ''} required={idx === 0}>
                      <input type="number" step="0.01" className="input text-xs h-8" {...register(`items.${idx}.mrp` as const, { valueAsNumber: true })} />
                    </FormField>
                    <FormField label={idx === 0 ? 'Batch Amt (₹)' : ''}>
                      <input type="number" step="0.01" className="input text-xs h-8" {...register(`items.${idx}.batch_amount` as const, { valueAsNumber: true })} />
                    </FormField>
                    <FormField label={idx === 0 ? 'Sale Price (₹)' : ''} required={idx === 0}>
                      <input type="number" step="0.01" className="input text-xs h-8" {...register(`items.${idx}.sale_price` as const, { valueAsNumber: true })} />
                    </FormField>
                    <FormField label={idx === 0 ? 'Pack Qty' : ''}>
                      <input type="number" className="input text-xs h-8" {...register(`items.${idx}.packing_qty` as const, { valueAsNumber: true })} />
                    </FormField>
                    <FormField label={idx === 0 ? 'Qty' : ''} required={idx === 0}>
                      <input type="number" min={1} className="input text-xs h-8" {...register(`items.${idx}.quantity` as const, { valueAsNumber: true })} />
                    </FormField>
                    <FormField label={idx === 0 ? 'Purchase Price (₹)' : ''} required={idx === 0}>
                      <input type="number" step="0.01" className="input text-xs h-8" {...register(`items.${idx}.purchase_price` as const, { valueAsNumber: true })} />
                    </FormField>
                    <FormField label={idx === 0 ? 'Tax %' : ''}>
                      <input type="number" step="0.01" className="input text-xs h-8" {...register(`items.${idx}.tax_percent` as const, { valueAsNumber: true })} />
                    </FormField>
                    <FormField label={idx === 0 ? 'Amount (₹)' : ''}>
                      <input type="number" step="0.01" className="input text-xs h-8 bg-gray-50" readOnly {...register(`items.${idx}.amount` as const, { valueAsNumber: true })} />
                    </FormField>
                    <button type="button" onClick={() => fields.length > 1 && remove(idx)}
                            className="icon-btn text-red-400 mb-1.5"><Trash2 size={13}/></button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
          <div className="space-y-3">
            <FormField label="Note">
              <textarea className="input min-h-[60px]" {...register('note')} />
            </FormField>
            <FormField label="Attach Document">
              <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer text-sm text-gray-500 hover:border-emerald-400">
                <Upload size={14}/>
                <span>{docFile?.name || 'Drop a file here or click'}</span>
                <input type="file" hidden onChange={e => setDocFile(e.target.files?.[0] ?? null)} />
              </label>
            </FormField>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>Total (₹)</span><span className="font-medium">${totals.gross.toFixed(2)}</span></div>
            <div className="flex items-center justify-between text-sm">
              <span>Discount (₹)</span>
              <div className="flex items-center gap-1">
                <input type="number" step="0.01" className="input h-8 w-24 text-right" {...register('discount', { valueAsNumber: true })} />
                <span className="text-xs text-gray-500">/</span>
                <input type="number" step="0.01" placeholder="%" className="input h-8 w-16 text-right" {...register('discount_percent', { valueAsNumber: true })} />
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
              <FormField label="Payment Amount (₹)">
                <input type="number" step="0.01" className="input" {...register('payment_amount', { valueAsNumber: true })} />
              </FormField>
            </div>
            <FormField label="Payment Note">
              <input className="input" {...register('payment_note')} />
            </FormField>
          </div>
        </div>
      </form>
    </Modal>
  )
}
