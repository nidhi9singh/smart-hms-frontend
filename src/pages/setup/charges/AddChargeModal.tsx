// src/pages/setup/charges/AddChargeModal.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { chargesApi } from '@/api/hospitalCharges'

type Props = {
  open: boolean
  onClose: () => void
  charge?: any
}


export default function AddChargeModal({ open, onClose, charge }: Props) {
  const qc = useQueryClient()
  const editing = !!charge?.id

  const [form, setForm] = useState({
    charge_type_id    : '',
    charge_category_id: '',
    unit_type_id      : '',
    tax_category_id   : '',
    name              : '',
    standard_charge   : '',
    description       : '',
    tpa_rates         : {} as Record<number, string>,
  })
  const [applyAllValue, setApplyAllValue] = useState('')

  const { data: typesData }  = useQuery({ queryKey: ['ch-types'],  queryFn: () => chargesApi.listTypes().then(r => r.data),  enabled: open })
  const { data: catsData }   = useQuery({
    queryKey: ['ch-cats', form.charge_type_id],
    queryFn:  () => chargesApi.listCategories(form.charge_type_id ? { charge_type_id: form.charge_type_id } : undefined).then(r => r.data),
    enabled:  open,
  })
  const { data: unitsData }  = useQuery({ queryKey: ['ch-units'],  queryFn: () => chargesApi.listUnitTypes().then(r => r.data),  enabled: open })
  const { data: taxesData }  = useQuery({ queryKey: ['ch-taxes'],  queryFn: () => chargesApi.listTaxCategories().then(r => r.data), enabled: open })
  const { data: tpasData }   = useQuery({ queryKey: ['ch-tpas'],   queryFn: () => chargesApi.listTPA().then(r => r.data),  enabled: open })

  const types: any[] = typesData?.data ?? []
  const cats : any[] = catsData?.data ?? []
  const units: any[] = unitsData?.data ?? []
  const taxes: any[] = taxesData?.data ?? []
  const tpas : any[] = tpasData?.data ?? []

  useEffect(() => {
    if (!open) return
    if (editing && charge) {
      const initialRates: Record<number, string> = {}
      Object.entries(charge.tpa_rates ?? {}).forEach(([k, v]) => {
        initialRates[Number(k)] = String(v)
      })
      setForm({
        charge_type_id    : String(charge.charge_type_id ?? ''),
        charge_category_id: String(charge.charge_category_id ?? ''),
        unit_type_id      : String(charge.unit_type_id ?? ''),
        tax_category_id   : String(charge.tax_category_id ?? ''),
        name              : charge.name ?? '',
        standard_charge   : String(charge.standard_charge ?? ''),
        description       : charge.description ?? '',
        tpa_rates         : initialRates,
      })
    } else {
      setForm({
        charge_type_id: '', charge_category_id: '', unit_type_id: '',
        tax_category_id: '', name: '', standard_charge: '',
        description: '', tpa_rates: {},
      })
    }
    setApplyAllValue('')
  }, [open, editing, charge])

  const selectedTax = taxes.find(t => String(t.id) === form.tax_category_id)
  const taxPercent  = selectedTax ? selectedTax.percentage : 0

  const save = useMutation({
    mutationFn: (payload: any) =>
      editing
        ? chargesApi.updateCharge(charge.id, payload)
        : chargesApi.addCharge(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ch-charges'] })
      onClose()
    },
  })

  if (!open) return null

  const setRate = (tpaId: number, v: string) =>
    setForm(f => ({ ...f, tpa_rates: { ...f.tpa_rates, [tpaId]: v } }))

  const applyAll = () => {
    if (!applyAllValue) return
    const next: Record<number, string> = {}
    tpas.forEach(t => { next[t.id] = applyAllValue })
    setForm(f => ({ ...f, tpa_rates: next }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.charge_type_id || !form.charge_category_id || !form.name.trim() || !form.standard_charge) return
    const ratesNum: Record<number, number> = {}
    Object.entries(form.tpa_rates).forEach(([k, v]) => {
      const n = Number(v)
      if (!isNaN(n) && v !== '') ratesNum[Number(k)] = n
    })
    save.mutate({
      name              : form.name.trim(),
      charge_type_id    : Number(form.charge_type_id),
      charge_category_id: Number(form.charge_category_id),
      unit_type_id      : form.unit_type_id ? Number(form.unit_type_id) : null,
      tax_category_id   : form.tax_category_id ? Number(form.tax_category_id) : null,
      standard_charge   : Number(form.standard_charge),
      description       : form.description || null,
      tpa_rates         : ratesNum,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-[1080px] max-w-[96vw]">
        <div className="flex items-center justify-between px-5 py-3 bg-brand-600 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">{editing ? 'Edit Charges' : 'Add Charges'}</h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <Field label="Charge Type" required>
              <select required value={form.charge_type_id}
                onChange={e => setForm({ ...form, charge_type_id: e.target.value, charge_category_id: '' })}
                className="input w-full">
                <option value="">Select</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Charge Category" required>
              <select required value={form.charge_category_id}
                onChange={e => setForm({ ...form, charge_category_id: e.target.value })}
                className="input w-full" disabled={!form.charge_type_id}>
                <option value="">Select</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Unit Type" required>
              <select value={form.unit_type_id}
                onChange={e => setForm({ ...form, unit_type_id: e.target.value })}
                className="input w-full">
                <option value="">Select</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
            <Field label="Charge Name" required>
              <input required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="input w-full"/>
            </Field>
          </div>

          <div className="grid grid-cols-12 gap-3 items-start">
            <div className="col-span-3">
              <Field label="Tax Category" required>
                <select value={form.tax_category_id}
                  onChange={e => setForm({ ...form, tax_category_id: e.target.value })}
                  className="input w-full">
                  <option value="">Select</option>
                  {taxes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Tax">
                <div className="relative">
                  <input value={taxPercent}
                    readOnly disabled
                    className="input w-full bg-gray-100 pr-8"/>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                </div>
              </Field>
            </div>

            {/* Scheduled Charges For TPA */}
            <div className="col-span-7">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-600">Scheduled Charges For TPA</label>
                <div className="flex items-center gap-2">
                  <input type="number" step="0.01" value={applyAllValue}
                    onChange={e => setApplyAllValue(e.target.value)}
                    placeholder="value"
                    className="input h-7 w-20 text-xs"/>
                  <button type="button" onClick={applyAll}
                    className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-800 text-white rounded">
                    Apply To All
                  </button>
                </div>
              </div>
              <div className="border rounded max-h-44 overflow-y-auto">
                {tpas.length === 0
                  ? <p className="text-xs text-gray-400 px-3 py-3">No TPA configured</p>
                  : tpas.map(t => (
                    <div key={t.id} className="flex items-center gap-3 px-3 py-1.5 border-b last:border-b-0">
                      <span className="text-sm flex-1 truncate">{t.name}</span>
                      <input type="number" step="0.01"
                        value={form.tpa_rates[t.id] ?? ''}
                        onChange={e => setRate(t.id, e.target.value)}
                        className="input h-7 w-28 text-xs text-right"/>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Standard Charge (₹)`} required>
              <input type="number" step="0.01" required
                value={form.standard_charge}
                onChange={e => setForm({ ...form, standard_charge: e.target.value })}
                className="input w-full"/>
            </Field>
          </div>

          <Field label="Description">
            <textarea value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input w-full" rows={2}/>
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
