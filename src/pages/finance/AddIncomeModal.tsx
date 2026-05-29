// src/pages/finance/AddIncomeModal.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { financeApi } from '@/api/finance'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  income?: any
  onClose: () => void
  onSuccess: () => void
}

export default function AddIncomeModal({ open, income, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      income_head_id: '', name: '', invoice_number: '',
      date: new Date().toISOString().slice(0, 10),
      amount: 0, description: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      income_head_id : income?.income_head_id ?? '',
      name           : income?.name           ?? '',
      invoice_number : income?.invoice_number ?? '',
      date           : income?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      amount         : income?.amount         ?? 0,
      description    : income?.description    ?? '',
    })
  }, [open, income, reset])

  const { data: headsData } = useQuery({
    queryKey: ['income-heads'],
    queryFn:  () => financeApi.listIncomeHeads().then(r => r.data),
    enabled:  open,
  })
  const heads: any[] = headsData?.data ?? []

  const mut = useMutation({
    mutationFn: (raw: any) => {
      const payload = {
        ...raw,
        income_head_id: raw.income_head_id ? Number(raw.income_head_id) : undefined,
        amount        : Number(raw.amount) || 0,
      }
      return income
        ? financeApi.updateIncome(income.id, payload)
        : financeApi.addIncome(payload)
    },
    onSuccess,
  })

  return (
    <Modal open={open} onClose={onClose} size="lg" title={income ? 'Edit Income' : 'Add Income'}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="fin-income-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="fin-income-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Income Head" required>
            <select className="input" {...register('income_head_id', { required: true })}>
              <option value="">Select</option>
              {heads.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </FormField>
          <FormField label="Name" required>
            <input className="input" {...register('name', { required: true })} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Invoice Number">
            <input className="input" {...register('invoice_number')} />
          </FormField>
          <FormField label="Date" required>
            <input type="date" className="input bg-gray-50" {...register('date', { required: true })} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Amount (₹)" required>
            <input type="number" step="0.01" className="input" {...register('amount', { required: true, valueAsNumber: true })} />
          </FormField>
          <FormField label="Attach Document">
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer text-sm text-gray-500 hover:border-emerald-400">
              <Upload size={14}/>
              <span>Drop a file here or click</span>
              <input type="file" hidden />
            </label>
          </FormField>
        </div>
        <FormField label="Description">
          <textarea className="input min-h-[80px]" {...register('description')} />
        </FormField>
      </form>
    </Modal>
  )
}
