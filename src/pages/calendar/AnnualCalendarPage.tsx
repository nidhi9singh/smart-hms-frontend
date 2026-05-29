// src/pages/calendar/AnnualCalendarPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import { calendarApi } from '@/api/calendar'
import AddHolidayModal from './AddHolidayModal'
import { cn } from '@/lib/utils'

const TYPE_BADGE: Record<string, string> = {
  Holiday : 'bg-rose-50 text-rose-700',
  Activity: 'bg-emerald-50 text-emerald-700',
  Vacation: 'bg-amber-50 text-amber-700',
}

function fmt(d?: string | null) {
  if (!d) return ''
  // Backend returns YYYY-MM-DD — render as MM/DD/YYYY to match screenshot
  const [y, m, day] = d.split('-')
  return `${m}/${day}/${y}`
}

export default function AnnualCalendarPage() {
  const qc = useQueryClient()
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ open: boolean; event?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', typeFilter, search],
    queryFn:  () => calendarApi.listEvents({
      event_type: typeFilter || undefined,
      search    : search || undefined,
      per_page  : 500,
    }).then(r => r.data),
  })
  const events: any[] = data?.data ?? []

  const delMut = useMutation({
    mutationFn: (id: number) => calendarApi.deleteEvent(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['calendar'] }),
  })

  return (
    <div className="p-6 space-y-5">
      {/* Header card */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Annual Calendar</h2>
          <button onClick={() => setModal({ open: true })} className="btn btn-primary flex items-center gap-1.5">
            <Plus size={14}/> Add
          </button>
        </div>
        <div className="grid grid-cols-12 gap-4 p-4 items-end">
          <div className="col-span-6">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Type<span className="text-red-500 ml-0.5">*</span>
            </label>
            <select className="input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">Select</option>
              <option value="Holiday">Holiday</option>
              <option value="Activity">Activity</option>
              <option value="Vacation">Vacation</option>
            </select>
          </div>
          <div className="col-span-6 flex justify-end">
            <button onClick={() => qc.invalidateQueries({ queryKey: ['calendar'] })}
                    className="btn btn-primary flex items-center gap-1.5">
              <Search size={13}/> Search
            </button>
          </div>
        </div>
      </div>

      {/* Holiday List */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Holiday List</h2>
        </div>
        <div className="flex items-center gap-3 p-3 border-b border-gray-100">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input className="input pl-8 h-9 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Date','Type','Description','Created By','Front Site','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              : events.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No events</td></tr>
              : events.map(e => (
                <tr key={e.id} className="hover:bg-gray-50/50 align-top">
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {e.date_to && e.date_to !== e.date_from
                      ? <>{fmt(e.date_from)} To {fmt(e.date_to)}</>
                      : fmt(e.date_from)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', TYPE_BADGE[e.event_type] ?? 'bg-gray-100 text-gray-600')}>
                      {e.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{e.description || '—'}</td>
                  <td className="px-4 py-3 text-emerald-600 whitespace-nowrap">{e.created_by_name || '—'}</td>
                  <td className="px-4 py-3">
                    {e.front_site
                      ? <span className="text-emerald-600 text-xs font-medium">Yes</span>
                      : <span className="text-gray-400 text-xs">No</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="icon-btn" onClick={() => setModal({ open: true, event: e })}><Edit2 size={12}/></button>
                      <button className="icon-btn text-red-400" onClick={() => confirm('Delete event?') && delMut.mutate(e.id)}><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddHolidayModal
        open={modal.open}
        event={modal.event}
        onClose={() => setModal({ open: false })}
        onSuccess={() => { setModal({ open: false }); qc.invalidateQueries({ queryKey: ['calendar'] }) }}
      />
    </div>
  )
}
