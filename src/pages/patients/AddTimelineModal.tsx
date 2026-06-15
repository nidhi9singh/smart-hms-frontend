// src/pages/patients/AddTimelineModal.tsx
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Save, Loader2, CloudUpload } from 'lucide-react'
import { toast } from 'sonner'
import { opdApi } from '@/api/opd'

function nowLocalISO() { return new Date().toISOString().slice(0, 16) }

export default function AddTimelineModal({ open, onClose, patientId }: {
  open: boolean
  onClose: () => void
  patientId: number
}) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    date: nowLocalISO(),
    description: '',
    visible: true,
  })
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!open) return
    setForm({ title: '', date: nowLocalISO(), description: '', visible: true })
    setFile(null)
  }, [open])

  const save = useMutation({
    mutationFn: () => opdApi.addPatientTimeline(patientId, {
      title:       form.title,
      description: form.description || undefined,
      event_date:  form.date ? form.date.slice(0, 10) : undefined,
    }).then(r => r.data),
    onSuccess: () => {
      toast.success('Timeline entry added')
      if (file) toast.info('Attached file noted (upload coming soon)')
      qc.invalidateQueries({ queryKey: ['patient-timeline', patientId] })
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Failed to add timeline'),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-w-[95vw]">
        <div className="flex items-center justify-between px-5 py-3 bg-[#47C0BD] text-white rounded-t-lg">
          <h2 className="text-base font-semibold">Add Timeline</h2>
          <button onClick={onClose}><X size={18}/></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (!form.title) return; save.mutate() }}
              className="p-5 space-y-4">
          <Field label="Title" required>
            <input required value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="input w-full"/>
          </Field>
          <Field label="Date" required>
            <input type="datetime-local" required value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              className="input w-full"/>
          </Field>
          <Field label="Description">
            <textarea rows={2} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input w-full"/>
          </Field>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attach Document</label>
            <div onClick={() => fileRef.current?.click()}
                 className="flex items-center justify-center gap-2 h-12 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500 cursor-pointer hover:bg-gray-50">
              <CloudUpload size={16}/>
              {file ? file.name : 'Drop a file here or click'}
            </div>
            <input ref={fileRef} type="file" hidden onChange={e => setFile(e.target.files?.[0] ?? null)}/>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.visible}
              onChange={e => setForm({ ...form, visible: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-[#47C0BD]"/>
            Visible to this person
          </label>

          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button type="submit" disabled={save.isPending}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#47C0BD] hover:bg-[#309C99] text-white text-sm font-medium rounded">
              {save.isPending ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
