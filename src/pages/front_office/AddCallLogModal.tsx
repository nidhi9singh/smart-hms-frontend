// src/pages/front_office/AddCallLogModal.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { frontOfficeApi } from '@/api/front_office'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  log?: any
  onClose: () => void
  onSuccess: () => void
}

const CALL_TYPES = ['Incoming', 'Outgoing']

export default function AddCallLogModal({ open, log, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      caller_name: '', phone: '',
      call_date: new Date().toISOString().slice(0, 10),
      next_follow_up_date: '', call_type: '', purpose: '', note: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      caller_name         : log?.caller_name ?? '',
      phone               : log?.phone       ?? '',
      call_date           : log?.call_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      next_follow_up_date : log?.next_follow_up_date ?? '',
      call_type           : log?.call_type   ?? '',
      purpose             : log?.purpose     ?? '',
      note                : log?.note        ?? '',
    })
  }, [open, log, reset])

  const mut = useMutation({
    mutationFn: (d: any) => log
      ? frontOfficeApi.updateCallLog(log.id, d)
      : frontOfficeApi.addCallLog(d),
    onSuccess,
  })

  return (
    <Modal open={open} onClose={onClose} size="md" title={log ? 'Edit Call Log' : 'Add Call Log'}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="fo-call-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="fo-call-form" onSubmit={handleSubmit(d => mut.mutate({
        ...d,
        next_follow_up_date: d.next_follow_up_date || undefined,
      }))} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Name" required>
            <input className="input" {...register('caller_name', { required: true })} />
          </FormField>
          <FormField label="Phone">
            <input className="input" {...register('phone')} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date">
            <input type="date" className="input" {...register('call_date')} />
          </FormField>
          <FormField label="Next Follow Up Date">
            <input type="date" className="input" {...register('next_follow_up_date')} />
          </FormField>
        </div>
        <FormField label="Call Type">
          <select className="input" {...register('call_type')}>
            <option value="">Select</option>
            {CALL_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </FormField>
        <FormField label="Purpose">
          <input className="input" {...register('purpose')} />
        </FormField>
        <FormField label="Note">
          <textarea className="input min-h-[60px]" {...register('note')} />
        </FormField>
      </form>
    </Modal>
  )
}
