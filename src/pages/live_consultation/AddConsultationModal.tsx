// src/pages/live_consultation/AddConsultationModal.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { liveApi } from '@/api/liveConsultation'

type Props = {
  open: boolean
  onClose: () => void
}


export default function AddConsultationModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const nav = useNavigate()

  const [form, setForm] = useState({
    patient_id        : '',
    title             : '',
    consultation_date : '',
    duration_minutes  : 30,
    module            : '' as '' | 'OPD' | 'IPD',
    ref_no            : '',
    doctor_id         : '',
    host_video        : true,
    client_video      : true,
    description       : '',
  })

  const { data: patientsData } = useQuery({
    queryKey: ['live-patients', form.module],
    queryFn:  () => liveApi.listPatients(form.module ? { module: form.module } : undefined).then(r => r.data),
    enabled:  open,
  })
  const patients: any[] = patientsData?.data ?? []

  const { data: doctorsData } = useQuery({
    queryKey: ['live-doctors'],
    queryFn:  () => liveApi.listStaff({ role: 'doctor' }).then(r => r.data),
    enabled:  open,
  })
  const doctors: any[] = doctorsData?.data ?? []

  // Auto-build title from OPD/IPD ref + checkup id
  useEffect(() => {
    if (!form.module || !form.ref_no) return
    const checkupId = form.ref_no.replace(/^OPDN|^IPDN/, '').replace(/^0+/, '')
    const t = `Online consult for ${form.ref_no} Checkup ID CHKID${checkupId}`
    setForm(f => ({ ...f, title: f.title || t }))
  }, [form.module, form.ref_no])

  useEffect(() => {
    if (open) {
      setForm({
        patient_id: '', title: '', consultation_date: '', duration_minutes: 30,
        module: '', ref_no: '', doctor_id: '', host_video: true, client_video: true,
        description: '',
      })
    }
  }, [open])

  // Available ref_no list (OPD or IPD numbers for the chosen patient + module)
  const refOptions = patients
    .filter(p => String(p.id) === form.patient_id)
    .map(p => p.ref_no)
    .filter(Boolean)

  const save = useMutation({
    mutationFn: (payload: any) => liveApi.addConsultation(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['live-consultations'] })
      onClose()
    },
  })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.consultation_date || !form.duration_minutes || !form.doctor_id) return
    save.mutate({
      title             : form.title.trim() || null,
      description       : form.description || null,
      consultation_date : new Date(form.consultation_date).toISOString(),
      duration_minutes  : Number(form.duration_minutes),
      doctor_id         : Number(form.doctor_id),
      patient_id        : form.patient_id ? Number(form.patient_id) : null,
      ref_no            : form.ref_no || null,
      host_video        : form.host_video,
      client_video      : form.client_video,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-[860px] max-w-[94vw]">
        <div className="flex items-center justify-between px-5 py-3 bg-emerald-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2 flex-1 max-w-2xl">
            <select
              value={form.patient_id}
              onChange={e => setForm({ ...form, patient_id: e.target.value, ref_no: '' })}
              className="input flex-1 text-gray-700"
            >
              <option value="">Select Patient</option>
              {patients.map(p => (
                <option key={`${p.id}-${p.ref_no || ''}`} value={p.id}>
                  {p.name} ({p.id}){p.ref_no ? ` — ${p.ref_no}` : ''}
                </option>
              ))}
            </select>
            <button type="button"
              onClick={() => nav('/patients')}
              className="px-3 py-1.5 bg-white text-emerald-700 rounded text-sm flex items-center gap-1 hover:bg-emerald-50">
              <Plus size={14}/> New Patient
            </button>
          </div>
          <button onClick={onClose} className="text-white ml-3"><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="bg-gray-50 rounded p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Consultation Title</label>
              <input value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="input w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Consultation Date <span className="text-red-500">*</span>
                </label>
                <input type="datetime-local" required
                  value={form.consultation_date}
                  onChange={e => setForm({ ...form, consultation_date: e.target.value })}
                  className="input w-full"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Consultation Duration Minutes <span className="text-red-500">*</span>
                </label>
                <input type="number" required min={1}
                  value={form.duration_minutes}
                  onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                  className="input w-full"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">OPD / IPD</label>
                <select value={form.module}
                  onChange={e => setForm({ ...form, module: e.target.value as any, ref_no: '' })}
                  className="input w-full">
                  <option value="">Select</option>
                  <option>OPD</option>
                  <option>IPD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">OPD/IPD No</label>
                <select value={form.ref_no}
                  onChange={e => setForm({ ...form, ref_no: e.target.value })}
                  className="input w-full"
                  disabled={!form.module}>
                  <option value="">Select</option>
                  {refOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Consultant Doctor <span className="text-red-500">*</span>
              </label>
              <select required value={form.doctor_id}
                onChange={e => setForm({ ...form, doctor_id: e.target.value })}
                className="input w-full">
                <option value="">Select</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.staff_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Host Video <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-1.5">
                    <input type="radio" checked={form.host_video}
                      onChange={() => setForm({ ...form, host_video: true })}/>
                    Enabled
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="radio" checked={!form.host_video}
                      onChange={() => setForm({ ...form, host_video: false })}/>
                    Disabled
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Client Video <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-1.5">
                    <input type="radio" checked={form.client_video}
                      onChange={() => setForm({ ...form, client_video: true })}/>
                    Enabled
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="radio" checked={!form.client_video}
                      onChange={() => setForm({ ...form, client_video: false })}/>
                    Disabled
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="input w-full" rows={2}/>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" disabled={save.isPending} className="btn btn-primary">
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
