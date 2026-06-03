// src/pages/ipd/AdmitPatientModal.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ipdApi } from '@/api/ipd'
import { hrApi } from '@/api/hr'
import { patientsApi } from '@/api/patients'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

export default function AdmitPatientModal({ open, onClose, onSuccess }: any) {
  const qc = useQueryClient()
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: { credit_limit: 20000, payment_mode: 'Cash' },
  })

  const [selectedGroup, setSelectedGroup] = useState('')

  // ── Lookups ──────────────────────────
  const { data: staffData } = useQuery({
    queryKey: ['staff-all'],
    queryFn: () => hrApi.listStaff({ per_page: 500 }).then(r => r.data),
    enabled: open,
  })
  const allStaff = (staffData?.data ?? []) as any[]
  const doctors = allStaff.filter((s: any) => /doctor/i.test(s.role ?? ''))

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsApi.list({ per_page: 500 }).then(r => r.data),
    enabled: open,
  })
  const patients = (patientsData?.data ?? []) as any[]
  const patientList = Array.isArray(patients) ? patients : []

  const { data: bedsData } = useQuery({
    queryKey: ['ipd-beds'],
    queryFn: () => ipdApi.listBeds().then(r => r.data),
    enabled: open,
  })
  const beds = (bedsData?.data ?? []) as any[]

  // Filter beds by selected ward type
  const filteredBeds = selectedGroup
    ? beds.filter((b: any) => b.ward_type === selectedGroup)
    : beds

  // Unique ward types from actual beds data
  const wardTypes = [...new Set(beds.map((b: any) => b.ward_type))] as string[]

  const mut = useMutation({
    mutationFn: (d: any) => ipdApi.admit({
      ...d,
      patient_id:        Number(d.patient_id) || undefined,
      consultant_id:     d.consultant_id ? Number(d.consultant_id) : undefined,
      is_casualty:       d.is_casualty === 'true' || d.is_casualty === true,
      is_old_patient:    d.is_old_patient === 'true' || d.is_old_patient === true,
      live_consultation: d.live_consultation === 'true' || d.live_consultation === true,
      credit_limit:      Number(d.credit_limit) || 0,
    }).then(r => r.data),
    onSuccess: () => {
      toast.success('Patient admitted')
      qc.invalidateQueries({ queryKey: ['ipd'] })
      qc.invalidateQueries({ queryKey: ['ipd-beds'] })
      onSuccess?.()
    },
    onError: (e: any) => {
      const detail = e?.response?.data?.detail ?? e?.response?.data?.message ?? e?.message ?? 'Failed to admit patient'
      toast.error(typeof detail === 'string' ? detail : JSON.stringify(detail))
    },
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Admit Patient — IPD"
      size="xl"
      headerClassName="bg-[#34ace0] text-white"
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
            Cancel
          </button>
          <button form="ipd-form" type="submit" disabled={mut.isPending}
            className="px-5 py-2 bg-[#00a8e8] hover:bg-[#0090c7] text-white text-sm font-medium rounded transition-colors">
            {mut.isPending ? 'Admitting...' : 'Admit Patient'}
          </button>
        </div>
      }
    >
      <form id="ipd-form" onSubmit={handleSubmit(d => mut.mutate(d))}>

        {/* Patient selector at top */}
        <div className="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FormField label="Patient *">
            <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white" {...register('patient_id', { required: true })}>
              <option value="">Select Patient</option>
              {patientList.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0">

          {/* ═══ LEFT — Clinical ═══ */}
          <div className="space-y-4 border-r border-gray-100 pr-6">
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Symptoms Type">
                <input className="w-full h-10 px-3 border border-gray-300 rounded text-sm" {...register('symptoms_type')} />
              </FormField>
              <FormField label="Symptoms Title">
                <input className="w-full h-10 px-3 border border-gray-300 rounded text-sm" {...register('symptoms_title')} />
              </FormField>
              <FormField label="Symptoms Description">
                <textarea className="w-full px-3 py-2 border border-gray-300 rounded text-sm" rows={2} {...register('symptoms_description')} />
              </FormField>
            </div>

            <FormField label="Note">
              <textarea className="w-full px-3 py-2 border border-gray-300 rounded text-sm" rows={3} {...register('note')} />
            </FormField>

            <FormField label="Previous Medical Issue">
              <textarea className="w-full px-3 py-2 border border-gray-300 rounded text-sm" rows={2} {...register('previous_medical_issue')} />
            </FormField>
          </div>

          {/* ═══ RIGHT — Administrative ═══ */}
          <div className="space-y-4 pl-2">

            {/* Admission Date */}
            <FormField label="Admission Date *">
              <input type="datetime-local" className="w-full h-10 px-3 border border-gray-300 rounded text-sm" {...register('admission_date', { required: true })} />
            </FormField>

            {/* Case + TPA */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Case">
                <input className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-gray-50" placeholder="Auto-generated" readOnly {...register('case_id')} />
              </FormField>
              <FormField label="TPA">
                <input className="w-full h-10 px-3 border border-gray-300 rounded text-sm" {...register('tpa')} />
              </FormField>
            </div>

            {/* Casualty + Old Patient */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Casualty">
                <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white" {...register('is_casualty')}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </FormField>
              <FormField label="Old Patient">
                <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white" {...register('is_old_patient')}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </FormField>
            </div>

            {/* Credit Limit + Reference */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Credit Limit (₹) *">
                <input type="number" className="w-full h-10 px-3 border border-gray-300 rounded text-sm" {...register('credit_limit', { required: true, valueAsNumber: true })} />
              </FormField>
              <FormField label="Reference">
                <input className="w-full h-10 px-3 border border-gray-300 rounded text-sm" {...register('reference')} />
              </FormField>
            </div>

            {/* Consultant Doctor */}
            <FormField label="Consultant Doctor *">
              <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white" {...register('consultant_id', { required: true })}>
                <option value="">Select</option>
                {doctors.map((d: any) => {
                  const n = d.full_name || [d.first_name, d.last_name].filter(Boolean).join(' ') || d.name || `Staff #${d.id}`
                  return <option key={d.id} value={d.id}>{n} ({d.staff_code})</option>
                })}
              </select>
            </FormField>

            {/* Bed Group + Bed Number */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Bed Group">
                <select
                  className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white"
                  {...register('bed_group')}
                  onChange={e => {
                    register('bed_group').onChange(e)
                    setSelectedGroup(e.target.value)
                    setValue('bed_number', '')
                  }}
                >
                  <option value="">Select</option>
                  {wardTypes.map(wt => (
                    <option key={wt} value={wt}>{wt}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Bed Number *">
                <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white" {...register('bed_number', { required: true })}>
                  <option value="">Select</option>
                  {filteredBeds.filter((b: any) => b.is_available).map((b: any) => (
                    <option key={b.id} value={b.bed_no}>
                      {b.bed_no} - {b.ward_type} ({b.floor})
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* Live Consultation */}
            <FormField label="Live Consultation">
              <select className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white" {...register('live_consultation')}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </FormField>

          </div>
        </div>
      </form>
    </Modal>
  )
}
