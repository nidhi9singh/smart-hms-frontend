// src/pages/hr/StaffFormModal.tsx
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { hrApi } from '@/api/hr'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props { open: boolean; staff?: any; onClose: () => void; onSuccess: () => void }

const EMPTY_STAFF = {
  staff_code: '', role: '', first_name: '', last_name: '', gender: '',
  designation: '', department: '', specialist: '', date_of_birth: '',
  email: '', phone: '', emergency_contact: '', date_of_joining: '',
  blood_group: '', marital_status: '', father_name: '', mother_name: '',
  qualification: '', work_experience: '', specialization: '',
  pan_number: '', national_id: '', local_id: '', current_address: '', note: ''
}

export default function StaffFormModal({ open, staff, onClose, onSuccess }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile]       = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      const normalized = staff ? {
        ...EMPTY_STAFF,
        ...staff,
        // Normalize dates for HTML date input (needs YYYY-MM-DD)
        date_of_birth:  staff.date_of_birth  ? staff.date_of_birth.split('T')[0]  : '',
        date_of_joining: staff.date_of_joining ? staff.date_of_joining.split('T')[0] : '',
        // Normalize gender casing (Male/Female not male/female)
        gender: staff.gender
          ? staff.gender.charAt(0).toUpperCase() + staff.gender.slice(1).toLowerCase()
          : '',
      } : EMPTY_STAFF
      reset(normalized)
      setPhotoPreview(staff?.photo_path ?? null)
      setPhotoFile(null)
    }
}, [open, staff])

  const mut = useMutation({
    mutationFn: async (d: any) => {
      const res = staff ? await hrApi.updateStaff(staff.id, d) : await hrApi.createStaff(d)
      const savedId = res.data?.data?.id ?? staff?.id
      if (photoFile && savedId) {
        try { await hrApi.uploadPhoto(savedId, photoFile) }
        catch { /* photo failed — staff still saved */ }
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
    <Modal open={open} onClose={onClose} title={staff ? 'Edit Staff Member' : 'Add Staff Member'} size="lg"
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="staff-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving...' : 'Save Staff'}
          </button>
        </div>
      }
    >
      <form id="staff-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-4">

        {/* Photo upload */}
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition overflow-hidden flex-shrink-0"
          >
            {photoPreview
              ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover"/>
              : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto}/>
          <div>
            <p className="text-sm font-medium text-gray-700">Staff Photo</p>
            <p className="text-xs text-gray-400 mt-0.5">Click to upload JPG, JPEG or PNG</p>
            {photoFile && <p className="text-xs text-brand-600 mt-0.5">✓ {photoFile.name}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Staff ID *" error={errors.staff_code?.message as string}>
            <input className="input" type="number" {...register('staff_code', { required: 'Required', valueAsNumber: true })} placeholder="e.g. 9012" />
          </FormField>
          <FormField label="Role *" error={errors.role?.message as string}>
            <select className="input" {...register('role', { required: 'Required' })}>
              <option value="">Select Role</option>
              {['doctor','nurse','admin','pharmacist','pathologist','radiologist','accountant','receptionist'].map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="First Name *" error={errors.first_name?.message as string}>
            <input className="input" {...register('first_name', { required: 'Required' })} placeholder="First name" />
          </FormField>
          <FormField label="Last Name">
            <input className="input" {...register('last_name')} placeholder="Last name" />
          </FormField>
          <FormField label="Gender *">
            <select className="input" {...register('gender', { required: 'Required' })}>
              <option value="">Select</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Designation">
            <select className="input" {...register('designation')}>
              <option value="">Select</option>
              {['Consultant','Senior Doctor','Junior Doctor','Head Nurse','Staff Nurse','Pharmacist','Lab Technician','Radiologist','Admin Officer','Receptionist'].map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Department">
            <select className="input" {...register('department')}>
              <option value="">Select</option>
              <option>OPD</option><option>IPD</option><option>ICU</option>
              <option>Pharmacy</option><option>Pathology</option><option>Radiology</option>
              <option>Emergency</option><option>Administration</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Specialist">
            <input className="input" {...register('specialist')} placeholder="e.g. Cardiologist" />
          </FormField>
          <FormField label="Date of Birth *">
            <input type="date" className="input" {...register('date_of_birth', { required: 'Required' })} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email *">
            <input type="email" className="input" {...register('email', { required: 'Required' })} />
          </FormField>
          <FormField label="Phone">
            <input className="input" {...register('phone')} placeholder="Phone number" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Emergency Contact">
            <input className="input" {...register('emergency_contact')} />
          </FormField>
          <FormField label="Date of Joining">
            <input type="date" className="input" {...register('date_of_joining')} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Blood Group">
            <select className="input" {...register('blood_group')}>
              <option value="">Select</option>
              {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <option key={b}>{b}</option>)}
            </select>
          </FormField>
          <FormField label="Marital Status">
            <select className="input" {...register('marital_status')}>
              <option value="">Select</option>
              <option>Single</option><option>Married</option><option>Divorced</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Father Name">
            <input className="input" {...register('father_name')} />
          </FormField>
          <FormField label="Mother Name">
            <input className="input" {...register('mother_name')} />
          </FormField>
        </div>

        <FormField label="Qualification">
          <input className="input" {...register('qualification')} placeholder="MBBS, BPharm, etc." />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Work Experience">
            <input className="input" {...register('work_experience')} placeholder="e.g. 5 years" />
          </FormField>
          <FormField label="Specialization">
            <input className="input" {...register('specialization')} />
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="PAN Number">
            <input className="input" {...register('pan_number')} />
          </FormField>
          <FormField label="National ID">
            <input className="input" {...register('national_id')} />
          </FormField>
          <FormField label="Local ID">
            <input className="input" {...register('local_id')} />
          </FormField>
        </div>

        <FormField label="Current Address">
          <textarea className="input resize-none" rows={2} {...register('current_address')} />
        </FormField>

        <FormField label="Note">
          <textarea className="input resize-none" rows={2} {...register('note')} />
        </FormField>

        {mut.isError && <p className="text-red-500 text-sm">Failed to save. Please try again.</p>}
      </form>
    </Modal>
  )
}
