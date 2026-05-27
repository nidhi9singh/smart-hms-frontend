// src/pages/pharmacy/AddMedicineModal.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { pharmacyApi } from '@/api/pharmacy'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

export default function AddMedicineModal({ open, medicine, onClose, onSuccess }: any) {
  const { register, handleSubmit, reset } = useForm()
  useEffect(() => { if (open) reset(medicine || {}) }, [open, medicine])
  const { data: catData  } = useQuery({ queryKey: ['med-categories'],  queryFn: () => pharmacyApi.categories().then(r => r.data)  })
  const { data: compData } = useQuery({ queryKey: ['med-companies'],   queryFn: () => pharmacyApi.companies().then(r => r.data)   })
  const { data: grpData  } = useQuery({ queryKey: ['med-groups'],      queryFn: () => pharmacyApi.groups().then(r => r.data)      })
  const { data: unitData } = useQuery({ queryKey: ['med-units'],       queryFn: () => pharmacyApi.units().then(r => r.data)       })
  const cats  = catData?.data  ?? []; const comps = compData?.data ?? []
  const grps  = grpData?.data  ?? []; const units = unitData?.data ?? []
  const mut = useMutation({ mutationFn: (d: any) => medicine ? pharmacyApi.updateMedicine(medicine.id, d) : pharmacyApi.addMedicine(d), onSuccess })

  return (
    <Modal open={open} onClose={onClose} title={medicine ? 'Edit Medicine' : 'Add Medicine Details'} size="lg"
      footer={<div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
        <button form="med-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>Save</button>
      </div>}>
      <form id="med-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Medicine Name *">
            <input className="input" {...register('name', { required: true })} />
          </FormField>
          <FormField label="Medicine Category *">
            <select className="input" {...register('category_id', { required: true, valueAsNumber: true })}>
              <option value="">Select</option>
              {cats.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Medicine Company">
            <select className="input" {...register('company_id', { valueAsNumber: true })}>
              <option value="">Select</option>
              {comps.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Medicine Composition">
            <input className="input" {...register('composition')} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Medicine Group">
            <select className="input" {...register('group_id', { valueAsNumber: true })}>
              <option value="">Select</option>
              {grps.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </FormField>
          <FormField label="Unit *">
            <select className="input" {...register('unit_id', { required: true, valueAsNumber: true })}>
              <option value="">Select</option>
              {units.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Min Level"><input type="number" className="input" {...register('min_level', { valueAsNumber: true })} /></FormField>
          <FormField label="Re-Order Level"><input type="number" className="input" {...register('reorder_level', { valueAsNumber: true })} /></FormField>
          <FormField label="Tax (%)"><input type="number" step="0.01" className="input" {...register('tax', { valueAsNumber: true })} /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Box/Packing *"><input className="input" {...register('box_packing', { required: true })} /></FormField>
          <FormField label="VAT A/C"><input className="input" {...register('vat_ac')} /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Rack Number"><input className="input" {...register('rack_number')} /></FormField>
          <FormField label="Note"><input className="input" {...register('note')} /></FormField>
        </div>
      </form>
    </Modal>
  )
}
