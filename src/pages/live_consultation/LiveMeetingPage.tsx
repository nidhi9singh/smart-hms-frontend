// src/pages/live_consultation/LiveMeetingPage.tsx
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Video, X } from 'lucide-react'
import { liveApi } from '@/api/liveConsultation'
import AddMeetingModal  from './AddMeetingModal'
import LiveSessionModal from './LiveSessionModal'

const STATUSES = ['Awaited', 'Started', 'Finished', 'Cancelled']


export default function LiveMeetingPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [session, setSession] = useState<any | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['live-meetings', search],
    queryFn:  () => liveApi.listMeetings({ search, per_page: 200 }).then(r => r.data),
  })
  const items: any[] = data?.data ?? []

  const updStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      liveApi.updateMeeting(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['live-meetings'] }),
  })
  const del = useMutation({
    mutationFn: (id: number) => liveApi.deleteMeeting(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['live-meetings'] }),
  })

  return (
    <div className="p-6 space-y-5">
      <div className="card">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h1 className="text-base font-semibold text-gray-800">Live Meeting</h1>
          <button onClick={() => setAddOpen(true)} className="btn btn-primary flex items-center gap-1.5">
            <Plus size={14}/> Add
          </button>
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
                <th className="px-3 py-2">Meeting Title</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Meeting Duration Minutes</th>
                <th className="px-3 py-2">Api Used</th>
                <th className="px-3 py-2">Created By</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
                : items.length === 0
                  ? <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">No meetings</td></tr>
                  : items.map(m => (
                    <tr key={m.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-800 max-w-md truncate" title={m.title}>{m.title}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-xs truncate" title={m.description}>{m.description || '—'}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                        {m.meeting_date ? new Date(m.meeting_date).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{m.duration_minutes}</td>
                      <td className="px-3 py-2 text-gray-600">{m.api_used}</td>
                      <td className="px-3 py-2 text-gray-600">{m.created_by}</td>
                      <td className="px-3 py-2">
                        <select value={m.status}
                          onChange={e => updStatus.mutate({ id: m.id, status: e.target.value })}
                          className="input h-8 text-xs">
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSession(m)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-brand-500 hover:bg-brand-600 text-white text-xs rounded"
                          >
                            <Video size={12}/> Start
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this meeting?')) del.mutate(m.id) }}
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

      <AddMeetingModal open={addOpen} onClose={() => setAddOpen(false)} />
      <LiveSessionModal open={!!session} onClose={() => setSession(null)} kind="meeting" item={session} />
    </div>
  )
}
