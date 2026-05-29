// src/pages/live_consultation/AddMeetingModal.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { liveApi } from '@/api/liveConsultation'

type Props = {
  open: boolean
  onClose: () => void
}


export default function AddMeetingModal({ open, onClose }: Props) {
  const qc = useQueryClient()

  const [form, setForm] = useState({
    title           : '',
    meeting_date    : '',
    duration_minutes: 45,
    host_video      : true,
    client_video    : true,
    description     : '',
    staff_ids       : [] as number[],
  })

  const { data: staffData } = useQuery({
    queryKey: ['live-staff-all'],
    queryFn:  () => liveApi.listStaff().then(r => r.data),
    enabled:  open,
  })
  const staff: any[] = staffData?.data ?? []

  useEffect(() => {
    if (open) {
      setForm({
        title: '', meeting_date: '', duration_minutes: 45,
        host_video: true, client_video: true, description: '', staff_ids: [],
      })
    }
  }, [open])

  const save = useMutation({
    mutationFn: (payload: any) => liveApi.addMeeting(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['live-meetings'] })
      onClose()
    },
  })

  if (!open) return null

  const toggleStaff = (id: number) =>
    setForm(f => ({
      ...f,
      staff_ids: f.staff_ids.includes(id) ? f.staff_ids.filter(s => s !== id) : [...f.staff_ids, id],
    }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.meeting_date || !form.duration_minutes) return
    save.mutate({
      title           : form.title.trim(),
      description     : form.description || null,
      meeting_date    : new Date(form.meeting_date).toISOString(),
      duration_minutes: Number(form.duration_minutes),
      host_video      : form.host_video,
      client_video    : form.client_video,
      staff_ids       : form.staff_ids,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-[1000px] max-w-[96vw]">
        <div className="flex items-center justify-between px-5 py-3 bg-emerald-600 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">Add Live Meeting</h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Meeting Title <span className="text-red-500">*</span>
              </label>
              <input required value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="input w-full"/>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Meeting Date <span className="text-red-500">*</span>
                </label>
                <input type="datetime-local" required
                  value={form.meeting_date}
                  onChange={e => setForm({ ...form, meeting_date: e.target.value })}
                  className="input w-full"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Meeting Duration Minutes <span className="text-red-500">*</span>
                </label>
                <input type="number" required min={1}
                  value={form.duration_minutes}
                  onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                  className="input w-full"/>
              </div>
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
                className="input w-full" rows={3}/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Staff List <span className="text-red-500">*</span>
            </label>
            <div className="border rounded p-2 max-h-[260px] overflow-y-auto space-y-1 bg-white">
              {staff.length === 0 ? (
                <p className="text-xs text-gray-400 px-2 py-2">No staff</p>
              ) : staff.map(s => (
                <label key={s.id}
                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm">
                  <input type="checkbox"
                    checked={form.staff_ids.includes(s.id)}
                    onChange={() => toggleStaff(s.id)}
                    className="rounded"/>
                  <span className="truncate">
                    {s.name} <span className="text-xs text-gray-500">
                      ({(s.role || 'Staff')[0].toUpperCase() + (s.role || 'Staff').slice(1)} : {s.staff_code})
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="col-span-3 flex justify-end gap-2 pt-2 border-t">
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
