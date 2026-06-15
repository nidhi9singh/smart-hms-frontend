// src/pages/birth_death/AddBirthRecordModal.tsx
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

const GENDERS = ['Male', 'Female', 'Other']

interface FilePick { name: string; file: File | null }

export default function AddBirthRecordModal({ open, record, onClose, onSuccess }: Props) {
  const [childPhoto,  setChildPhoto]  = useState<FilePick>({ name: '', file: null })
  const [motherPhoto, setMotherPhoto] = useState<FilePick>({ name: '', file: null })
  const [fatherPhoto, setFatherPhoto] = useState<FilePick>({ name: '', file: null })
  const [docPhoto,    setDocPhoto]    = useState<FilePick>({ name: '', file: null })

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      child_name: '', gender: '', weight: 0,
      birth_date: new Date().toISOString().slice(0, 16),
      phone: '', address: '',
      case_id: '', mother_id: '', mother_name: '', father_name: '',
      report: '',
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      child_name : record?.child_name  ?? '',
      gender     : record?.gender      ?? '',
      weight     : record?.weight      ?? 0,
      birth_date : record?.birth_date?.slice(0, 16) ?? new Date().toISOString().slice(0, 16),
      phone      : record?.phone       ?? '',
      address    : record?.address     ?? '',
      case_id    : record?.case_id     ?? '',
      mother_id  : record?.mother_id   ?? '',
      mother_name: record?.mother_name ?? '',
      father_name: record?.father_name ?? '',
      report     : record?.report      ?? '',
    })
    setChildPhoto({ name: '', file: null })
    setMotherPhoto({ name: '', file: null })
    setFatherPhoto({ name: '', file: null })
    setDocPhoto({ name: '', file: null })
  }, [open, record, reset])

  const { data: patientsData } = useQuery({
    queryKey: ['bd-patients'], queryFn: () => patientsApi.list().then(r => r.data), enabled: open,
  })
  const patients: any[] = patientsData?.data ?? []

  // Auto-fill mother_name when picking from dropdown
  const motherId = watch('mother_id')
  useEffect(() => {
    if (!motherId) return
    const p = patients.find((x: any) => x.id === Number(motherId))
    if (p) setValue('mother_name', p.name)
  }, [motherId, patients, setValue])

  const mut = useMutation({
    mutationFn: (raw: any) => {
      const payload = {
        ...raw,
        case_id   : raw.case_id   ? Number(raw.case_id)   : undefined,
        mother_id : raw.mother_id ? Number(raw.mother_id) : undefined,
        weight    : raw.weight    ? Number(raw.weight)    : undefined,
        birth_date: raw.birth_date,
      }
      return record
        ? birthDeathApi.updateBirth(record.id, payload)
        : birthDeathApi.addBirth(payload)
    },
    onSuccess,
  })

  const FileBox = ({ label, pick, setPick }: { label: string; pick: FilePick; setPick: (p: FilePick) => void }) => (
    <FormField label={label}>
      <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer text-sm text-gray-500 hover:border-brand-400">
        <Upload size={14}/>
        <span className="truncate">{pick.name || 'Drop a file here or click'}</span>
        <input type="file" hidden accept="image/*"
          onChange={e => {
            const f = e.target.files?.[0] ?? null
            setPick({ name: f?.name ?? '', file: f })
          }}
        />
      </label>
    </FormField>
  )

  return (
    <Modal open={open} onClose={onClose} size="xl" title={record ? 'Edit Birth Record' : 'Add Birth Record'}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="bd-birth-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="bd-birth-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <FormField label="Child Name" required>
            <input className="input" {...register('child_name', { required: true })} />
          </FormField>
          <FormField label="Gender" required>
            <select className="input" {...register('gender', { required: true })}>
              <option value="">Select</option>
              {GENDERS.map(g => <option key={g}>{g}</option>)}
            </select>
          </FormField>
          <FormField label="Weight (kg)" required>
            <input type="number" step="0.01" className="input" {...register('weight', { valueAsNumber: true })} />
          </FormField>
          <FileBox label="Child Photo" pick={childPhoto} setPick={setChildPhoto} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FormField label="Birth Date" required>
            <input type="datetime-local" className="input" {...register('birth_date', { required: true })} />
          </FormField>
          <FormField label="Phone">
            <input className="input" {...register('phone')} />
          </FormField>
          <FormField label="Address">
            <input className="input" {...register('address')} />
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FormField label="Case ID">
            <input type="number" className="input" {...register('case_id')} />
          </FormField>
          <FormField label="Mother Name" required>
            <select className="input" {...register('mother_id')}>
              <option value="">Select Patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FormField>
          <FileBox label="Mother Photo" pick={motherPhoto} setPick={setMotherPhoto} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Father Name">
            <input className="input" {...register('father_name')} />
          </FormField>
          <FileBox label="Father Photo" pick={fatherPhoto} setPick={setFatherPhoto} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Report">
            <textarea className="input min-h-[60px]" placeholder="e.g. Normal Delivery" {...register('report')} />
          </FormField>
          <FileBox label="Attach Document Photo" pick={docPhoto} setPick={setDocPhoto} />
        </div>
      </form>
    </Modal>
  )
}
