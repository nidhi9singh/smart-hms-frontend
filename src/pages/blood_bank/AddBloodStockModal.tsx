// src/pages/blood_bank/AddBloodStockModal.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { bloodBankApi } from '@/api/blood_bank'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  defaultBloodGroup?: string
  onClose: () => void
  onSuccess: () => void
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const UNITS        = ['ML', 'g/dl', 'Litter', 'per day', 'Hour']

export default function AddBloodStockModal({ open, defaultBloodGroup, onClose, onSuccess }: Props) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      bag_no: '', blood_group: defaultBloodGroup || '', volume_ml: 0, volume_unit: 'ML',
      lot_no: '', institution: '', donor_id: '' as number | '',
      collection_date: '', expiry_date: '',
    },
  })
  useEffect(() => {
    if (open) reset({ bag_no: '', blood_group: defaultBloodGroup || '', volume_ml: 0, volume_unit: 'ML',
      lot_no: '', institution: '', donor_id: '', collection_date: '', expiry_date: '' })
  }, [open, defaultBloodGroup, reset])

  const { data: donorsData } = useQuery({
    queryKey: ['bb-donors-lookup', defaultBloodGroup],
    queryFn: () => bloodBankApi.listDonors({ blood_group: defaultBloodGroup, per_page: 500 }).then(r => r.data),
    enabled: open,
  })
  const donors: any[] = donorsData?.data ?? []

  const mut = useMutation({
    mutationFn: (d: any) => bloodBankApi.addStock({
      bag_no          : d.bag_no,
      blood_group     : d.blood_group,
      volume_ml       : Number(d.volume_ml) || 0,
      volume_unit     : d.volume_unit || 'ML',
      lot_no          : d.lot_no || undefined,
      institution     : d.institution || undefined,
      donor_id        : d.donor_id ? Number(d.donor_id) : undefined,
      collection_date : d.collection_date || undefined,
      expiry_date     : d.expiry_date || undefined,
    }).then(r => r.data),
    onSuccess: () => {
      toast.success('Blood bag added')
      qc.invalidateQueries({ queryKey: ['bb-stock'] })
      onSuccess()
    },
    onError: (e: any) => {
      const d = e?.response?.data?.detail ?? e?.response?.data?.message ?? e?.message ?? 'Failed to add stock'
      toast.error(typeof d === 'string' ? d : JSON.stringify(d))
    },
  })

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Add Blood Bag"
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="bb-stock-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="bb-stock-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Bag No" required>
            <input className="input" {...register('bag_no', { required: true })} />
          </FormField>
          <FormField label="Blood Group" required>
            <select className="input" {...register('blood_group', { required: true })}>
              <option value="">Select</option>
              {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
            </select>
          </FormField>
          <FormField label="Donor">
            <select className="input" {...register('donor_id')}>
              <option value="">— optional —</option>
              {donors.map(d => <option key={d.id} value={d.id}>{d.name} · {d.blood_group}</option>)}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Volume" required>
            <input type="text" inputMode="decimal" className="input" {...register('volume_ml')} />
          </FormField>
          <FormField label="Unit">
            <select className="input" {...register('volume_unit')}>
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </FormField>
          <FormField label="Lot No">
            <input className="input" {...register('lot_no')} />
          </FormField>
        </div>
        <FormField label="Institution">
          <input className="input" {...register('institution')} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Collection Date">
            <input type="date" className="input" {...register('collection_date')} />
          </FormField>
          <FormField label="Expiry Date">
            <input type="date" className="input" {...register('expiry_date')} />
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
