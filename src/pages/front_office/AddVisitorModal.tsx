// src/pages/front_office/AddVisitorModal.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { frontOfficeApi } from '@/api/front_office'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  visitor?: any
  onClose: () => void
  onSuccess: () => void
}

const PURPOSES = ['Visit', 'Inquiry', 'Seminar', 'Patient Visit', 'Vendor Meeting', 'Doctor Meeting']
const VISIT_TYPES = ['IPD Patient', 'OPD Patient', 'Staff']

export default function AddVisitorModal({ open, visitor, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      purpose: '', name: '', phone: '', id_card: '', visit_to: '', visit_type: '',
      ipd_opd_ref: '', related_to: '', number_of_persons: 0,
      visit_date: new Date().toISOString().slice(0, 10),
      in_time: '', out_time: '', note: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      purpose            : visitor?.purpose            ?? '',
      name               : visitor?.name               ?? '',
      phone              : visitor?.phone              ?? '',
      id_card            : visitor?.id_card            ?? '',
      visit_to           : visitor?.visit_to           ?? '',
      visit_type         : visitor?.visit_type         ?? '',
      ipd_opd_ref        : visitor?.ipd_opd_ref        ?? '',
      related_to         : visitor?.related_to         ?? '',
      number_of_persons  : visitor?.number_of_persons  ?? 0,
      visit_date         : visitor?.visit_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      in_time            : visitor?.in_time            ?? '',
      out_time           : visitor?.out_time           ?? '',
      note               : visitor?.note               ?? '',
    })
  }, [open, visitor, reset])

  const mut = useMutation({
    mutationFn: (d: any) => visitor
      ? frontOfficeApi.updateVisitor(visitor.id, d)
      : frontOfficeApi.addVisitor(d),
    onSuccess,
  })

  return (
    <Modal open={open} onClose={onClose} size="lg" title={visitor ? 'Edit Visitor' : 'Add Visitor'}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="fo-visitor-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="fo-visitor-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Purpose" required>
            <select className="input" {...register('purpose', { required: true })}>
              <option value="">Select</option>
              {PURPOSES.map(p => <option key={p}>{p}</option>)}
            </select>
          </FormField>
          <FormField label="Name" required>
            <input className="input" {...register('name', { required: true })} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Phone">
            <input className="input" {...register('phone')} />
          </FormField>
          <FormField label="ID Card">
            <input className="input" {...register('id_card')} />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Visit To">
            <input className="input" {...register('visit_to')} />
          </FormField>
          <FormField label="IPD/OPD/Staff">
            <select className="input" {...register('visit_type')}>
              <option value="">Select</option>
              {VISIT_TYPES.map(v => <option key={v}>{v}</option>)}
            </select>
          </FormField>
          <FormField label="Related To">
            <input className="input bg-gray-50" {...register('related_to')} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Number Of Person">
            <input type="number" className="input" {...register('number_of_persons', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Date" required>
            <input type="date" className="input" {...register('visit_date', { required: true })} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="In Time">
            <input type="time" className="input" {...register('in_time')} />
          </FormField>
          <FormField label="Out Time">
            <input type="time" className="input" {...register('out_time')} />
          </FormField>
        </div>
        <FormField label="Note">
          <textarea className="input min-h-[80px]" {...register('note')} />
        </FormField>
      </form>
    </Modal>
  )
}
