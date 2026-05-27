// src/pages/tpa/AddTPAModal.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { tpaApi } from '@/api/tpa'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  tpa?: any
  onClose: () => void
  onSuccess: () => void
}

export default function AddTPAModal({ open, tpa, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '', code: '', phone: '',
      address: '', contact_person_name: '', contact_person_phone: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      name                : tpa?.name                 ?? '',
      code                : tpa?.code                 ?? '',
      phone               : tpa?.phone                ?? '',
      address             : tpa?.address              ?? '',
      contact_person_name : tpa?.contact_person_name  ?? '',
      contact_person_phone: tpa?.contact_person_phone ?? '',
    })
  }, [open, tpa, reset])

  const mut = useMutation({
    mutationFn: (d: any) => tpa ? tpaApi.update(tpa.id, d) : tpaApi.add(d),
    onSuccess,
  })

  return (
    <Modal open={open} onClose={onClose} size="md" title={tpa ? 'Edit TPA' : 'Add TPA'}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="tpa-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="tpa-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Name" required>
            <input className="input" {...register('name', { required: true })} />
          </FormField>
          <FormField label="Code" required>
            <input className="input" {...register('code', { required: true })} />
          </FormField>
          <FormField label="Contact No" required>
            <input className="input" {...register('phone', { required: true })} />
          </FormField>
        </div>
        <FormField label="Address">
          <textarea className="input min-h-[60px]" {...register('address')} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Contact Person Name">
            <input className="input" {...register('contact_person_name')} />
          </FormField>
          <FormField label="Contact Person Phone">
            <input className="input" {...register('contact_person_phone')} />
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
