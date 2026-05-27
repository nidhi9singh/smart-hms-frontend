// src/pages/patients/PatientFormModal.tsx
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { patientsApi, type PatientCreate } from '@/api/patients'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  patient?: any
  onClose: () => void
  onSuccess: () => void
}

export default function PatientFormModal({ open, patient, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<PatientCreate>()
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile]       = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (patient) { reset(patient); setPhotoPreview(patient.photo_path ?? null) }
    else { reset({}); setPhotoPreview(null); setPhotoFile(null) }
  }, [patient, open])

  // Auto-calculate age from DOB
  const watchDOB = watch('date_of_birth')
  useEffect(() => {
    if (!watchDOB) return
    const dob   = new Date(watchDOB)
    const today = new Date()
    let y = today.getFullYear() - dob.getFullYear()
    let m = today.getMonth()   - dob.getMonth()
    let d = today.getDate()    - dob.getDate()
    if (d < 0) { m--; d += new Date(today.getFullYear(), today.getMonth(), 0).getDate() }
    if (m < 0) { y--; m += 12 }
    if (y >= 0) {
      setValue('age_years',  y)
      setValue('age_months', m)
      setValue('age_days',   d)
    }
  }, [watchDOB])

  const mut = useMutation({
    mutationFn: async (d: PatientCreate) => {
      const res = patient
        ? await patientsApi.update(patient.id, d)
        : await patientsApi.create(d)
      const savedId = res.data?.data?.id ?? patient?.id
      if (photoFile && savedId) {
        try { await patientsApi.photo(savedId, photoFile) }
        catch { /* photo upload failed — patient still saved */ }
      }
      return res
    },
    onSuccess,
  })

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  return (
    <Modal open={open} onClose={onClose} title={patient ? 'Edit Patient' : 'Add Patient'} size="xl"
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="patient-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving...' : 'Save Patient'}
          </button>
        </div>
      }
    >
      <form id="patient-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-4">

        {/* Name | Guardian Name */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name *" error={errors.name?.message}>
            <input className="input" {...register('name', { required: 'Required' })} placeholder="Full name" />
          </FormField>
          <FormField label="Guardian Name">
            <input className="input" {...register('guardian_name')} placeholder="Guardian name" />
          </FormField>
        </div>

        {/* Gender | DOB | Age | Blood Group | Marital Status | Photo */}
        <div className="grid grid-cols-6 gap-3 items-end">
          <FormField label="Gender">
            <select className="input" {...register('gender')}>
              <option value="">Select</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </FormField>

          <FormField label="Date Of Birth">
            <input type="date" className="input" {...register('date_of_birth')} />
          </FormField>

          <FormField label="Age (yy-mm-dd)">
            <div className="flex gap-1">
              <input className="input text-center px-1" placeholder="Yr" type="number" min={0}
                {...register('age_years', { setValueAs: v => v === '' || v === null ? null : Number(v) })} />
              <input className="input text-center px-1" placeholder="Mo" type="number" min={0}
                {...register('age_months', { setValueAs: v => v === '' || v === null ? null : Number(v) })} />
              <input className="input text-center px-1" placeholder="Dy" type="number" min={0}
                {...register('age_days', { setValueAs: v => v === '' || v === null ? null : Number(v) })} />
            </div>
          </FormField>

          <FormField label="Blood Group">
            <select className="input" {...register('blood_group')}>
              <option value="">Select</option>
              {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <option key={b}>{b}</option>)}
            </select>
          </FormField>

          <FormField label="Marital Status">
            <select className="input" {...register('marital_status')}>
              <option value="">Select</option>
              <option>Single</option><option>Married</option>
              <option>Divorced</option><option>Widowed</option>
            </select>
          </FormField>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Patient Photo</label>
            <div onClick={() => fileRef.current?.click()}
              className="input flex items-center gap-1.5 cursor-pointer hover:border-teal-400 hover:bg-teal-50 h-9 px-2 overflow-hidden">
              {photoPreview
                ? <img src={photoPreview} alt="" className="h-7 w-7 rounded object-cover flex-shrink-0"/>
                : <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 flex-shrink-0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              }
              <span className="text-xs text-gray-400 truncate">
                {photoPreview ? 'Change photo' : 'Drop a file here or click'}
              </span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto}/>
          </div>
        </div>

        {/* Phone | Email | Address */}
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Phone">
            <input className="input" {...register('phone')} placeholder="Phone number" />
          </FormField>
          <FormField label="Email">
            <input type="email" className="input" {...register('email')} placeholder="Email address" />
          </FormField>
          <FormField label="Address">
            <input className="input" {...register('address')} placeholder="Current address" />
          </FormField>
        </div>

        {/* Remarks | Known Allergies */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Remarks">
            <textarea className="input resize-none" rows={2} {...register('remarks')} />
          </FormField>
          <FormField label="Any Known Allergies">
            <textarea className="input resize-none" rows={2} {...register('known_allergies')} />
          </FormField>
        </div>

        {/* TPA | TPA ID | TPA Validity */}
        <div className="grid grid-cols-3 gap-4">
          <FormField label="TPA">
            <select className="input" {...register('tpa_id', { setValueAs: v => v === '' ? null : Number(v) })}>
              <option value="">Select</option>
            </select>
          </FormField>
          <FormField label="TPA ID">
            <input className="input" {...register('tpa_member_id')} />
          </FormField>
          <FormField label="TPA Validity">
            <input type="date" className="input" {...register('tpa_validity')} />
          </FormField>
        </div>

        {/* National ID | Alternate Number */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="National Identification Number">
            <input className="input" {...register('national_id')} placeholder="ID number" />
          </FormField>
          <FormField label="Alternate Number">
            <input className="input" {...register('alternate_phone')} placeholder="Alternate number" />
          </FormField>
        </div>

        {mut.isError && (
          <p className="text-red-500 text-sm">Failed to save patient. Please try again.</p>
        )}
      </form>
    </Modal>
  )
}
