// src/pages/duty_roster/AddRosterModal.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { dutyRosterApi } from '@/api/duty_roster'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  roster?: any
  onClose: () => void
  onSuccess: () => void
}

export default function AddRosterModal({ open, roster, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { shift_id: '', start_date: '', end_date: '' },
  })

  useEffect(() => {
    if (!open) return
    reset({
      shift_id  : roster?.shift_id   ?? '',
      start_date: roster?.start_date ?? '',
      end_date  : roster?.end_date   ?? '',
    })
  }, [open, roster, reset])

  const { data: shiftsData } = useQuery({
    queryKey: ['dr-shifts'], queryFn: () => dutyRosterApi.listShifts().then(r => r.data), enabled: open,
  })
  const shifts: any[] = shiftsData?.data ?? []

  const mut = useMutation({
    mutationFn: (d: any) => {
      const payload = { ...d, shift_id: Number(d.shift_id) }
      return roster
        ? dutyRosterApi.updateRoster(roster.id, payload)
        : dutyRosterApi.addRoster(payload)
    },
    onSuccess,
  })

  return (
    <Modal open={open} onClose={onClose} size="md" title={roster ? 'Edit Roster' : 'Add Roster'}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="dr-roster-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="dr-roster-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-3">
        <FormField label="Shift Name" required>
          <select className="input" {...register('shift_id', { required: true })}>
            <option value="">Select</option>
            {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time} - {s.end_time})</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start Date" required>
            <input type="date" className="input" {...register('start_date', { required: true })} />
          </FormField>
          <FormField label="End Date" required>
            <input type="date" className="input" {...register('end_date', { required: true })} />
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
