// src/pages/finance/AddExpenseModal.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { financeApi } from '@/api/finance'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  expense?: any
  onClose: () => void
  onSuccess: () => void
}

export default function AddExpenseModal({ open, expense, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      expense_head_id: '', name: '', invoice_number: '',
      date: new Date().toISOString().slice(0, 10),
      amount: 0, description: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      expense_head_id : expense?.expense_head_id ?? '',
      name            : expense?.name            ?? '',
      invoice_number  : expense?.invoice_number  ?? '',
      date            : expense?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      amount          : expense?.amount          ?? 0,
      description     : expense?.description     ?? '',
    })
  }, [open, expense, reset])

  const { data: headsData } = useQuery({
    queryKey: ['expense-heads'],
    queryFn:  () => financeApi.listExpenseHeads().then(r => r.data),
    enabled:  open,
  })
  const heads: any[] = headsData?.data ?? []

  const mut = useMutation({
    mutationFn: (raw: any) => {
      const payload = {
        ...raw,
        expense_head_id: raw.expense_head_id ? Number(raw.expense_head_id) : undefined,
        amount         : Number(raw.amount) || 0,
      }
      return expense
        ? financeApi.updateExpense(expense.id, payload)
        : financeApi.addExpense(payload)
    },
    onSuccess,
  })

  return (
    <Modal open={open} onClose={onClose} size="lg" title={expense ? 'Edit Expense' : 'Add Expense'}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="fin-expense-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="fin-expense-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Expense Head" required>
            <select className="input" {...register('expense_head_id', { required: true })}>
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
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer text-sm text-gray-500 hover:border-brand-400">
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
