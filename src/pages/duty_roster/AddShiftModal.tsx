// src/pages/duty_roster/AddShiftModal.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { dutyRosterApi } from '@/api/duty_roster'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  shift?: any
  onClose: () => void
  onSuccess: () => void
}

export default function AddShiftModal({ open, shift, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: '', start_time: '', end_time: '' },
  })

  useEffect(() => {
    if (!open) return
    reset({
      name      : shift?.name       ?? '',
      start_time: shift?.start_time ?? '',
      end_time  : shift?.end_time   ?? '',
    })
  }, [open, shift, reset])

  const mut = useMutation({
    mutationFn: (d: any) => shift
      ? dutyRosterApi.updateShift(shift.id, d)
      : dutyRosterApi.addShift(d),
    onSuccess,
  })

  return (
    <Modal open={open} onClose={onClose} size="md" title={shift ? 'Edit Shift' : 'Add Shift'}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="dr-shift-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="dr-shift-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-3">
        <FormField label="Shift Name" required>
          <input className="input" {...register('name', { required: true })} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Shift Start" required>
            <input type="time" className="input" {...register('start_time', { required: true })} />
          </FormField>
          <FormField label="Shift End" required>
            <input type="time" className="input" {...register('end_time', { required: true })} />
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
