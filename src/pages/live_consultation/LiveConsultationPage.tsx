// src/pages/live_consultation/LiveConsultationPage.tsx
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Video, X } from 'lucide-react'
import { liveApi } from '@/api/liveConsultation'
import AddConsultationModal from './AddConsultationModal'
import LiveSessionModal      from './LiveSessionModal'
import AddCredentialModal    from './AddCredentialModal'

const STATUSES = ['Awaited', 'Started', 'Finished', 'Cancelled']


export default function LiveConsultationPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [credOpen, setCredOpen] = useState(false)
  const [session, setSession] = useState<any | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['live-consultations', search],
    queryFn:  () => liveApi.listConsultations({ search, per_page: 200 }).then(r => r.data),
  })
  const items: any[] = data?.data ?? []

  const updStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      liveApi.updateConsultation(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['live-consultations'] }),
  })
  const del = useMutation({
    mutationFn: (id: number) => liveApi.deleteConsultation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['live-consultations'] }),
  })

  return (
    <div className="p-6 space-y-5">
      <div className="card">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h1 className="text-base font-semibold text-gray-800">Live Consultation</h1>
          <div className="flex gap-2">
            <button onClick={() => setAddOpen(true)} className="btn btn-primary flex items-center gap-1.5">
              <Plus size={14}/> Add
            </button>
            <button onClick={() => setCredOpen(true)} className="btn btn-primary flex items-center gap-1.5">
              <Plus size={14}/> Add Credential
            </button>
          </div>
        </div>

        <div className="px-5 py-3 border-b">
          <div className="relative max-w-xs">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="input pl-8 w-full"/>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-600">
              <tr>
                <th className="px-3 py-2">Consultation Title</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Api Used</th>
                <th className="px-3 py-2">Created By</th>
                <th className="px-3 py-2">Created For</th>
                <th className="px-3 py-2">Patient</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
                : items.length === 0
                  ? <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">No consultations</td></tr>
                  : items.map(c => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-800 max-w-md truncate" title={c.title}>{c.title || '—'}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-xs truncate" title={c.description}>{c.description || '—'}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {c.consultation_date ? new Date(c.consultation_date).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{c.api_used}</td>
                      <td className="px-3 py-2 text-gray-600">{c.created_by}</td>
                      <td className="px-3 py-2 text-gray-600">{c.doctor_display || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">
                        {c.patient_name ? `${c.patient_name} (${c.patient_id})` : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <select value={c.status}
                          onChange={e => updStatus.mutate({ id: c.id, status: e.target.value })}
                          className="input h-8 text-xs">
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSession(c)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-brand-500 hover:bg-brand-600 text-white text-xs rounded"
                          >
                            <Video size={12}/> Start
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this consultation?')) del.mutate(c.id) }}
                            className="p-1 hover:bg-red-50 rounded text-red-500" title="Delete"
                          >
                            <X size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <AddConsultationModal open={addOpen} onClose={() => setAddOpen(false)} />
      <AddCredentialModal   open={credOpen} onClose={() => setCredOpen(false)} />
      <LiveSessionModal open={!!session} onClose={() => setSession(null)} kind="consultation" item={session} />
    </div>
  )
}
