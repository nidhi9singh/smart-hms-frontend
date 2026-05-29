// src/pages/setup/tabs/NotificationSettingTab.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { setupApi } from '@/api/setup'

type Row = {
  id: number; event_key: string; event_label: string;
  email: boolean; sms: boolean; mobile_app: boolean; template: string;
}


export default function NotificationSettingTab() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['setup-notifications'],
    queryFn: () => setupApi.listNotifications().then(r => r.data),
  })
  const rows: Row[] = data?.data ?? []
  const [edits, setEdits] = useState<Record<string, Partial<Row>>>({})

  useEffect(() => { setEdits({}) }, [data])

  const save = useMutation({
    mutationFn: ({ key, payload }: { key: string; payload: any }) =>
      setupApi.updateNotification(key, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['setup-notifications'] }),
  })

  const get = (r: Row): Row => ({ ...r, ...(edits[r.event_key] ?? {}) })
  const set = (r: Row, patch: Partial<Row>) =>
    setEdits(e => ({ ...e, [r.event_key]: { ...(e[r.event_key] ?? {}), ...patch } }))

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Notification Setting</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2">Event</th>
              <th className="px-3 py-2 w-72">Option</th>
              <th className="px-3 py-2">Sample Message</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0
              ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              : rows.map(r => {
                const cur = get(r)
                return (
                  <tr key={r.event_key} className="border-t align-top">
                    <td className="px-3 py-2 font-medium">{r.event_label}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1 text-xs">
                        <label className="flex items-center gap-1.5">
                          <input type="checkbox" checked={!!cur.email}
                            onChange={e => set(r, { email: e.target.checked })}/>
                          Email
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input type="checkbox" checked={!!cur.sms}
                            onChange={e => set(r, { sms: e.target.checked })}/>
                          SMS
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input type="checkbox" checked={!!cur.mobile_app}
                            onChange={e => set(r, { mobile_app: e.target.checked })}/>
                          Mobile App
                        </label>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <textarea value={cur.template ?? ''}
                        onChange={e => set(r, { template: e.target.value })}
                        rows={3} className="input w-full text-xs font-mono"/>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => save.mutate({ key: r.event_key, payload: {
                          email: cur.email, sms: cur.sms, mobile_app: cur.mobile_app, template: cur.template,
                        }})}
                        disabled={save.isPending}
                        className="btn btn-primary text-xs inline-flex items-center gap-1"
                      >
                        <Save size={12}/> Save
                      </button>
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
