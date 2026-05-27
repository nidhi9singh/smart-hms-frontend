// src/pages/multi_branch/AddBranchModal.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { multiBranchApi } from '@/api/multi_branch'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  branch?: any
  onClose: () => void
  onSuccess: () => void
}

export default function AddBranchModal({ open, branch, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '', url: '', envato_purchase_code: '',
      host_name: '', database_name: '',
      db_username: '', db_password: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      name                 : branch?.name                 ?? '',
      url                  : branch?.url                  ?? '',
      envato_purchase_code : branch?.envato_purchase_code ?? '',
      host_name            : branch?.host_name            ?? '',
      database_name        : branch?.database_name        ?? '',
      db_username          : branch?.db_username          ?? '',
      db_password          : '',
    })
  }, [open, branch, reset])

  const mut = useMutation({
    mutationFn: (d: any) => {
      // If editing, drop empty password so we don't overwrite with blank
      const payload = { ...d }
      if (branch && !payload.db_password) delete payload.db_password
      return branch
        ? multiBranchApi.updateBranch(branch.id, payload)
        : multiBranchApi.addBranch(payload)
    },
    onSuccess,
  })

  return (
    <Modal open={open} onClose={onClose} size="lg" title={branch ? 'Edit Branch' : 'Add New Branch'}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="mb-branch-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : (branch ? 'Save' : 'Verify & Save')}
          </button>
        </div>
      }>
      <form id="mb-branch-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-4">
        <FormField label="Branch Name" required>
          <input className="input" {...register('name', { required: true })} />
        </FormField>
        <FormField label="Branch URL">
          <input className="input" placeholder="https://demo.smart-hospital.in/branch1/" {...register('url')} />
        </FormField>
        <FormField label="Envato Purchase Code" required>
          <input className="input" {...register('envato_purchase_code', { required: true })} />
        </FormField>

        <div className="border-t border-gray-100 pt-3">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Branch Database Detail</h3>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Host Name" required>
              <input className="input" {...register('host_name', { required: true })} />
            </FormField>
            <FormField label="Database Name" required>
              <input className="input" {...register('database_name', { required: true })} />
            </FormField>
            <FormField label="Username" required>
              <input className="input" {...register('db_username', { required: true })} />
            </FormField>
            <FormField label="Password" required={!branch}>
              <input type="password" className="input"
                placeholder={branch ? '(leave blank to keep existing)' : ''}
                {...register('db_password', { required: !branch })} />
            </FormField>
          </div>
        </div>
      </form>
    </Modal>
  )
}
