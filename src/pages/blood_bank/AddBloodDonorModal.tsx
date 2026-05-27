// src/pages/blood_bank/AddBloodDonorModal.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { bloodBankApi } from '@/api/blood_bank'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function AddBloodDonorModal({ open, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '', date_of_birth: '', blood_group: '', gender: '',
      father_name: '', phone: '', address: '',
    },
  })
  useEffect(() => { if (open) reset() }, [open, reset])

  const mut = useMutation({
    mutationFn: (d: any) => bloodBankApi.addDonor(d),
    onSuccess,
  })

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Add Donor Details"
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="bb-donor-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="bb-donor-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <FormField label="Donor Name" required>
            <input className="input" {...register('name', { required: true })} />
          </FormField>
          <FormField label="Date Of Birth" required>
            <input type="date" className="input" {...register('date_of_birth', { required: true })} />
          </FormField>
          <FormField label="Blood Group" required>
            <select className="input" {...register('blood_group', { required: true })}>
              <option value="">Select</option>
              {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
          </FormField>
          <FormField label="Gender" required>
            <select className="input" {...register('gender', { required: true })}>
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Father Name">
            <input className="input" {...register('father_name')} />
          </FormField>
          <FormField label="Contact No">
            <input className="input" {...register('phone')} />
          </FormField>
        </div>
        <FormField label="Address">
          <textarea className="input min-h-[60px]" {...register('address')} />
        </FormField>
      </form>
    </Modal>
  )
}
