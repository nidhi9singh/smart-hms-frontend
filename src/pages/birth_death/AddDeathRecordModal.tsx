// src/pages/birth_death/AddDeathRecordModal.tsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { birthDeathApi } from '@/api/birth_death'
import { patientsApi } from '@/api/patients'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  record?: any
  onClose: () => void
  onSuccess: () => void
}

export default function AddDeathRecordModal({ open, record, onClose, onSuccess }: Props) {
  const [attachment, setAttachment] = useState<{ name: string; file: File | null }>({ name: '', file: null })

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      case_id: '', patient_id: '', patient_name: '',
      death_date: new Date().toISOString().slice(0, 16),
      guardian_name: '', report: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      case_id      : record?.case_id      ?? '',
      patient_id   : record?.patient_id   ?? '',
      patient_name : record?.patient_name ?? '',
      death_date   : record?.death_date?.slice(0, 16) ?? new Date().toISOString().slice(0, 16),
      guardian_name: record?.guardian_name ?? '',
      report       : record?.report        ?? '',
    })
    setAttachment({ name: '', file: null })
  }, [open, record, reset])

  const { data: patientsData } = useQuery({
    queryKey: ['bd-patients-death'], queryFn: () => patientsApi.list().then(r => r.data), enabled: open,
  })
  const patients: any[] = patientsData?.data ?? []

  const patientId = watch('patient_id')
  useEffect(() => {
    if (!patientId) return
    const p = patients.find((x: any) => x.id === Number(patientId))
    if (p) setValue('patient_name', p.name)
  }, [patientId, patients, setValue])

  const mut = useMutation({
    mutationFn: (raw: any) => {
      const payload = {
        ...raw,
        case_id   : raw.case_id    ? Number(raw.case_id)    : undefined,
        patient_id: raw.patient_id ? Number(raw.patient_id) : undefined,
      }
      return record
        ? birthDeathApi.updateDeath(record.id, payload)
        : birthDeathApi.addDeath(payload)
    },
    onSuccess,
  })

  return (
    <Modal open={open} onClose={onClose} size="lg" title={record ? 'Edit Death Record' : 'Add Death Record'}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="bd-death-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="bd-death-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <FormField label="Case ID" required>
            <input type="number" className="input" {...register('case_id', { required: true })} />
          </FormField>
          <FormField label="Patient Name" required>
            <select className="input" {...register('patient_id', { required: true })}>
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FormField>
          <FormField label="Death Date" required>
            <input type="datetime-local" className="input" {...register('death_date', { required: true })} />
          </FormField>
          <FormField label="Guardian Name" required>
            <input className="input" {...register('guardian_name', { required: true })} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Attachment">
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer text-sm text-gray-500 hover:border-brand-400">
              <Upload size={14}/>
              <span className="truncate">{attachment.name || 'Drop a file here or click'}</span>
              <input type="file" hidden
                onChange={e => {
                  const f = e.target.files?.[0] ?? null
                  setAttachment({ name: f?.name ?? '', file: f })
                }}
              />
            </label>
          </FormField>
          <FormField label="Report">
            <textarea className="input min-h-[60px]" {...register('report')} />
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
