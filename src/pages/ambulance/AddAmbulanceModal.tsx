// src/pages/ambulance/AddAmbulanceModal.tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { ambulanceApi } from '@/api/ambulance'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  vehicle?: any
  onClose: () => void
  onSuccess: () => void
}

const VEHICLE_TYPES = ['Contractual', 'Owned']

export default function AddAmbulanceModal({ open, vehicle, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      vehicle_no: '', model: '', year_made: 0, vehicle_type: '',
      driver_name: '', driver_license: '', driver_contact: '', note: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      vehicle_no    : vehicle?.vehicle_no     ?? '',
      model         : vehicle?.model          ?? '',
      year_made     : vehicle?.year_made      ?? 0,
      vehicle_type  : vehicle?.vehicle_type   ?? '',
      driver_name   : vehicle?.driver_name    ?? '',
      driver_license: vehicle?.driver_license ?? '',
      driver_contact: vehicle?.driver_contact ?? '',
      note          : vehicle?.note           ?? '',
    })
  }, [open, vehicle, reset])

  const mut = useMutation({
    mutationFn: (d: any) => vehicle ? ambulanceApi.updateVehicle(vehicle.id, d) : ambulanceApi.addVehicle(d),
    onSuccess,
  })

  return (
    <Modal open={open} onClose={onClose} size="lg" title={vehicle ? 'Edit Ambulance' : 'Add Ambulance'}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="amb-vehicle-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="amb-vehicle-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Vehicle Number" required>
            <input className="input" {...register('vehicle_no', { required: true })} />
          </FormField>
          <FormField label="Vehicle Model" required>
            <input className="input" {...register('model', { required: true })} />
          </FormField>
          <FormField label="Year Made">
            <input type="number" className="input" {...register('year_made', { valueAsNumber: true })} />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Driver Name">
            <input className="input" {...register('driver_name')} />
          </FormField>
          <FormField label="Driver License">
            <input className="input" {...register('driver_license')} />
          </FormField>
          <FormField label="Driver Contact">
            <input className="input" {...register('driver_contact')} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Vehicle Type" required>
            <select className="input" {...register('vehicle_type', { required: true })}>
              <option value="">Select</option>
              {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Note">
            <input className="input" {...register('note')} />
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
