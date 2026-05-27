// src/pages/front_office/AddPostalModal.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { frontOfficeApi } from '@/api/front_office'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  kind: 'receive' | 'dispatch'
  item?: any
  onClose: () => void
  onSuccess: () => void
}

export default function AddPostalModal({ open, kind, item, onClose, onSuccess }: Props) {
  const dateField = kind === 'receive' ? 'receive_date' : 'dispatch_date'
  const titleField = kind === 'receive' ? 'Receive' : 'Dispatch'

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      from_title: '', to_title: '', reference_no: '',
      address: '', note: '',
      [dateField]: new Date().toISOString().slice(0, 10),
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      from_title   : item?.from_title   ?? '',
      to_title     : item?.to_title     ?? '',
      reference_no : item?.reference_no ?? '',
      address      : item?.address      ?? '',
      note         : item?.note         ?? '',
      [dateField]  : item?.date         ?? new Date().toISOString().slice(0, 10),
    })
  }, [open, item, reset, dateField])

  const mut = useMutation({
    mutationFn: (d: any) => {
      if (kind === 'receive') {
        return item ? frontOfficeApi.updateReceive(item.id, d) : frontOfficeApi.addReceive(d)
      }
      return item ? frontOfficeApi.updateDispatch(item.id, d) : frontOfficeApi.addDispatch(d)
    },
    onSuccess,
  })

  // Field order in the screenshots:
  // Receive: From Title*, Reference No, Address, Note, To Title, Date
  // Dispatch: To Title*, Reference No, Address, Note, From Title, Date
  const primaryLabel = kind === 'receive' ? 'From Title' : 'To Title'
  const primaryField = kind === 'receive' ? 'from_title' : 'to_title'
  const secondaryLabel = kind === 'receive' ? 'To Title' : 'From Title'
  const secondaryField = kind === 'receive' ? 'to_title' : 'from_title'

  return (
    <Modal open={open} onClose={onClose} size="md" title={item ? `Edit ${titleField}` : `Add ${titleField}`}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="fo-postal-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="fo-postal-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label={primaryLabel} required>
            <input className="input" {...register(primaryField as any, { required: true })} />
          </FormField>
          <FormField label="Reference No">
            <input className="input" {...register('reference_no')} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Address">
            <textarea className="input min-h-[60px]" {...register('address')} />
          </FormField>
          <FormField label="Note">
            <textarea className="input min-h-[60px]" {...register('note')} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={secondaryLabel}>
            <input className="input" {...register(secondaryField as any)} />
          </FormField>
          <FormField label="Date">
            <input type="date" className="input bg-gray-50" {...register(dateField as any)} />
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
