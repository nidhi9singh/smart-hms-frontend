// src/pages/referral/AddReferralPersonModal.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { referralApi } from '@/api/referral'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  person?: any
  onClose: () => void
  onSuccess: () => void
}

const CATEGORIES = [
  'OPD Department', 'IPD Department', 'Pharmacy Department',
  'Pathology Department', 'Radiology Department', 'Blood Bank Department',
  'Ambulance', 'Other',
]

const MODULES = [
  { key: 'commission_opd',        label: 'OPD'        },
  { key: 'commission_ipd',        label: 'IPD'        },
  { key: 'commission_pharmacy',   label: 'Pharmacy'   },
  { key: 'commission_pathology',  label: 'Pathology'  },
  { key: 'commission_radiology',  label: 'Radiology'  },
  { key: 'commission_blood_bank', label: 'Blood Bank' },
  { key: 'commission_ambulance',  label: 'Ambulance'  },
] as const

export default function AddReferralPersonModal({ open, person, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset, getValues, setValue } = useForm({
    defaultValues: {
      name: '', phone: '', contact_person_name: '', contact_person_phone: '',
      category: '', standard_commission: 0, address: '',
      commission_opd: 0, commission_ipd: 0, commission_pharmacy: 0,
      commission_pathology: 0, commission_radiology: 0, commission_blood_bank: 0,
      commission_ambulance: 0,
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      name                 : person?.name                 ?? '',
      phone                : person?.phone                ?? '',
      contact_person_name  : person?.contact_person_name  ?? '',
      contact_person_phone : person?.contact_person_phone ?? '',
      category             : person?.category             ?? '',
      standard_commission  : person?.standard_commission  ?? 0,
      address              : person?.address              ?? '',
      commission_opd        : person?.commissions?.OPD        ?? 0,
      commission_ipd        : person?.commissions?.IPD        ?? 0,
      commission_pharmacy   : person?.commissions?.Pharmacy   ?? 0,
      commission_pathology  : person?.commissions?.Pathology  ?? 0,
      commission_radiology  : person?.commissions?.Radiology  ?? 0,
      commission_blood_bank : person?.commissions?.['Blood Bank'] ?? 0,
      commission_ambulance  : person?.commissions?.Ambulance  ?? 0,
    })
  }, [open, person, reset])

  const applyToAll = () => {
    const std = Number(getValues('standard_commission')) || 0
    MODULES.forEach(m => setValue(m.key as any, std))
  }

  const mut = useMutation({
    mutationFn: (d: any) => person
      ? referralApi.updatePerson(person.id, d)
      : referralApi.addPerson(d),
    onSuccess,
  })

  return (
    <Modal open={open} onClose={onClose} size="xl" title={person ? 'Edit Person' : 'Add Person'}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="ref-person-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="ref-person-form" onSubmit={handleSubmit(d => mut.mutate(d))}
            className="grid grid-cols-[2fr_1fr] gap-4">
        {/* Left side */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Referrer Name" required>
              <input className="input" {...register('name', { required: true })} />
            </FormField>
            <FormField label="Referrer Contact">
              <input className="input" {...register('phone')} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Contact Person Name">
              <input className="input" {...register('contact_person_name')} />
            </FormField>
            <FormField label="Contact Person Phone">
              <input className="input" {...register('contact_person_phone')} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category" required>
              <select className="input" {...register('category', { required: true })}>
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </FormField>
            <FormField label="Standard Commission (%)">
              <input type="number" step="0.01" min={0} max={100} className="input"
                     {...register('standard_commission', { valueAsNumber: true })} />
            </FormField>
          </div>
          <FormField label="Address">
            <input className="input" {...register('address')} />
          </FormField>
        </div>

        {/* Right side — per-module commissions */}
        <div className="border-l border-gray-100 pl-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium text-gray-600">
              Commission for Modules (%)<span className="text-red-500 ml-0.5">*</span>
            </div>
            <button type="button" onClick={applyToAll}
                    className="btn btn-outline text-xs">Apply To All</button>
          </div>
          <div className="space-y-2">
            {MODULES.map(m => (
              <div key={m.key} className="grid grid-cols-[100px_1fr] items-center gap-2">
                <span className="text-sm text-gray-700">{m.label}</span>
                <input type="number" step="0.01" min={0} max={100}
                       className="input h-9 text-sm"
                       {...register(m.key as any, { valueAsNumber: true })} />
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}
