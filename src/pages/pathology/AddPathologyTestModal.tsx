// src/pages/pathology/AddPathologyTestModal.tsx
import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { pathologyApi } from '@/api/pathology'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  test?: any
  onClose: () => void
  onSuccess: () => void
}

const CHARGE_CATEGORIES = ['General', 'TPA', 'Doctor', 'Insurance']
const CHARGE_NAMES      = ['Standard', 'Discounted', 'Premium']

export default function AddPathologyTestModal({ open, test, onClose, onSuccess }: Props) {
  const { register, handleSubmit, control, reset, watch, setValue } = useForm({
    defaultValues: {
      name: '', short_name: '', test_type: '', category: '',
      sub_category: '', method: '', report_days: 1,
      charge_category: '', charge_name: '',
      tax_percent: 0, standard_charge: 0, amount: 0,
      parameters: [{ parameter_name: '', reference_range: '', unit: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'parameters' })

  useEffect(() => {
    if (!open) return
    reset({
      name            : test?.name            ?? '',
      short_name      : test?.short_name      ?? '',
      test_type       : test?.test_type       ?? '',
      category        : test?.category        ?? '',
      sub_category    : test?.sub_category    ?? '',
      method          : test?.method          ?? '',
      report_days     : test?.report_days     ?? 1,
      charge_category : test?.charge_category ?? '',
      charge_name     : test?.charge_name     ?? '',
      tax_percent     : test?.tax_percent     ?? 0,
      standard_charge : test?.standard_charge ?? 0,
      amount          : test?.amount          ?? 0,
      parameters: (test?.parameters?.length ? test.parameters : [{ parameter_name: '', reference_range: '', unit: '' }])
        .map((p: any) => ({
          parameter_name : p.parameter_name  ?? '',
          reference_range: p.reference_range ?? '',
          unit           : p.unit            ?? '',
        })),
    })
  }, [open, test, reset])

  // Auto-compute Amount from standard_charge + tax_percent
  const stdCharge  = watch('standard_charge')
  const taxPercent = watch('tax_percent')
  useEffect(() => {
    const sc = Number(stdCharge) || 0
    const tp = Number(taxPercent) || 0
    setValue('amount', Number((sc * (1 + tp / 100)).toFixed(2)))
  }, [stdCharge, taxPercent, setValue])

  const mut = useMutation({
    mutationFn: (d: any) => test ? pathologyApi.updateTest(test.id, d) : pathologyApi.addTest(d),
    onSuccess,
  })

  const onSubmit = (raw: any) => {
    // Strip empty parameter rows
    const params = (raw.parameters || []).filter((p: any) => p.parameter_name?.trim())
    mut.mutate({ ...raw, parameters: params })
  }

  return (
    <Modal open={open} onClose={onClose} size="xl"
      title={test ? 'Edit Test Details' : 'Add Test Details'}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="pathtest-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="pathtest-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <FormField label="Test Name" required>
            <input className="input" {...register('name', { required: true })} />
          </FormField>
          <FormField label="Short Name" required>
            <input className="input" {...register('short_name', { required: true })} />
          </FormField>
          <FormField label="Test Type">
            <input className="input" {...register('test_type')} />
          </FormField>
          <FormField label="Category Name" required>
            <input className="input" {...register('category', { required: true })} />
          </FormField>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <FormField label="Sub Category">
            <input className="input" {...register('sub_category')} />
          </FormField>
          <FormField label="Method">
            <input className="input" {...register('method')} />
          </FormField>
          <FormField label="Report Days" required>
            <input type="number" min={0} className="input" {...register('report_days', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Charge Category" required>
            <select className="input" {...register('charge_category', { required: true })}>
              <option value="">Select</option>
              {CHARGE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <FormField label="Charge Name" required>
            <select className="input" {...register('charge_name', { required: true })}>
              <option value="">Select</option>
              {CHARGE_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Tax (%)">
            <input type="number" step="0.01" className="input" {...register('tax_percent', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Standard Charge ($)" required>
            <input type="number" step="0.01" className="input" {...register('standard_charge', { required: true, valueAsNumber: true })} />
          </FormField>
          <FormField label="Amount ($)" required>
            <input type="number" step="0.01" className="input bg-gray-50" {...register('amount', { valueAsNumber: true })} readOnly />
          </FormField>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Test Parameters</h3>
            <button type="button" onClick={() => append({ parameter_name: '', reference_range: '', unit: '' })}
                    className="btn btn-outline text-xs flex items-center gap-1">
              <Plus size={12}/> Add
            </button>
          </div>

          <div className="space-y-2">
            {fields.map((f, idx) => (
              <div key={f.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                <FormField label={idx === 0 ? 'Test Parameter Name' : ''} required={idx === 0}>
                  <input className="input" placeholder="e.g. Hemoglobin" {...register(`parameters.${idx}.parameter_name` as const)} />
                </FormField>
                <FormField label={idx === 0 ? 'Reference Range' : ''} required={idx === 0}>
                  <input className="input" placeholder="e.g. 12-17" {...register(`parameters.${idx}.reference_range` as const)} />
                </FormField>
                <FormField label={idx === 0 ? 'Unit' : ''} required={idx === 0}>
                  <input className="input" placeholder="e.g. g/dL" {...register(`parameters.${idx}.unit` as const)} />
                </FormField>
                <button type="button" onClick={() => remove(idx)} className="icon-btn text-red-400 mb-1.5" title="Remove">
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}
