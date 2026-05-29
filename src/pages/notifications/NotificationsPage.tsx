// src/pages/notifications/NotificationsPage.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2, Mail, MessageSquare, Bell as BellIcon } from 'lucide-react'
import { topnavApi } from '@/api/topnav'

function typeIcon(t: string) {
  if (t === 'email')  return <Mail          size={16} className="text-emerald-500"/>
  if (t === 'sms')    return <MessageSquare size={16} className="text-emerald-500"/>
  return <BellIcon size={16} className="text-amber-500"/>
}


export default function NotificationsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['notifications-feed'],
    queryFn:  () => topnavApi.listFeed(100).then(r => r.data),
  })
  const items: any[] = data?.data ?? []

  const clear = useMutation({
    mutationFn: () => topnavApi.clearFeed(),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications-feed'] }),
  })

  return (
    <div className="p-6">
      <div className="card">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h1 className="text-base font-semibold text-gray-800">Notifications</h1>
          <button
            onClick={() => { if (confirm('Delete all SMS / Email notifications?')) clear.mutate() }}
            disabled={clear.isPending || items.length === 0}
            className="btn btn-primary flex items-center gap-1.5"
          >
            <Trash2 size={14}/> Delete All
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2 w-16">Type</th>
              <th className="px-3 py-2">Subject</th>
              <th className="px-3 py-2 text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={3} className="px-3 py-8 text-center text-gray-400">Loading…</td></tr>
              : items.length === 0
                ? <tr><td colSpan={3} className="px-3 py-8 text-center text-gray-400">No notifications</td></tr>
                : items.map((r, i) => (
                  <tr key={`${r.type}-${r.ref_id}-${i}`} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
                        {typeIcon(r.type)}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-emerald-600 truncate max-w-3xl">
                      {r.subject || '—'}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-500 whitespace-nowrap">
                      {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
