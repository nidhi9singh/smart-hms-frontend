// src/pages/front_office/AddComplaintModal.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { frontOfficeApi } from '@/api/front_office'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  complaint?: any
  onClose: () => void
  onSuccess: () => void
}

const COMPLAIN_TYPES = ['Food quality', 'Service', 'Cleanliness', 'Behaviour', 'Other']
const SOURCES        = ['From visitors', 'From patients', 'From staff', 'Phone', 'Online']

export default function AddComplaintModal({ open, complaint, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      complain_type: '', source: '',
      complainant: '', phone: '',
      description: '', action_taken: '', assigned: '', note: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      complain_type : complaint?.complain_type ?? '',
      source        : complaint?.source        ?? '',
      complainant   : complaint?.complainant   ?? '',
      phone         : complaint?.phone         ?? '',
      description   : complaint?.description   ?? '',
      action_taken  : complaint?.action_taken  ?? '',
      assigned      : complaint?.assigned      ?? '',
      note          : complaint?.note          ?? '',
    })
  }, [open, complaint, reset])

  const mut = useMutation({
    mutationFn: (d: any) => complaint
      ? frontOfficeApi.updateComplaint(complaint.id, d)
      : frontOfficeApi.addComplaint(d),
    onSuccess,
  })

  return (
    <Modal open={open} onClose={onClose} size="lg" title={complaint ? 'Edit Complain' : 'Add Complain'}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="fo-complaint-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="fo-complaint-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Complain Type">
            <select className="input" {...register('complain_type')}>
              <option value="">Select</option>
              {COMPLAIN_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Source">
            <select className="input" {...register('source')}>
              <option value="">Select</option>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Complain By" required>
            <input className="input" {...register('complainant', { required: true })} />
          </FormField>
          <FormField label="Phone">
            <input className="input" {...register('phone')} />
          </FormField>
        </div>
        <FormField label="Description">
          <textarea className="input min-h-[60px]" {...register('description')} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Action Taken">
            <input className="input" {...register('action_taken')} />
          </FormField>
          <FormField label="Assigned">
            <input className="input" {...register('assigned')} />
          </FormField>
        </div>
        <FormField label="Note">
          <textarea className="input min-h-[60px]" {...register('note')} />
        </FormField>
      </form>
    </Modal>
  )
}
