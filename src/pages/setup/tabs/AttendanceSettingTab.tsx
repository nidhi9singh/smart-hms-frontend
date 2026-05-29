// src/pages/setup/tabs/AttendanceSettingTab.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { setupApi } from '@/api/setup'

type Row = {
  id?: number; role: string; attendance_type: string;
  entry_from: string; entry_upto: string; total_hour: string;
}


export default function AttendanceSettingTab() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['setup-attendance'],
    queryFn: () => setupApi.listAttendance().then(r => r.data),
  })
  const rows: Row[] = data?.data ?? []
  const [edits, setEdits] = useState<Record<string, Partial<Row>>>({})

  useEffect(() => { setEdits({}) }, [data])

  const save = useMutation({
    mutationFn: (items: Row[]) => setupApi.saveAttendance(items),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['setup-attendance'] }),
  })

  const byRole = rows.reduce<Record<string, Row[]>>((acc, r) => {
    (acc[r.role] ||= []).push(r); return acc
  }, {})

  const getRow = (r: Row): Row => ({ ...r, ...(edits[`${r.role}|${r.attendance_type}`] ?? {}) })
  const setRow = (r: Row, patch: Partial<Row>) =>
    setEdits(e => ({ ...e, [`${r.role}|${r.attendance_type}`]: { ...(e[`${r.role}|${r.attendance_type}`] ?? {}), ...patch } }))

  const updateRole = (role: string) => {
    const items = byRole[role].map(getRow)
    save.mutate(items)
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Attendance Setting</h2>
      {Object.keys(byRole).length === 0 && <div className="text-gray-400">Loading…</div>}
      {Object.entries(byRole).map(([role, items]) => (
        <div key={role} className="border rounded">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
            <span className="font-medium text-sm">Role: {role}</span>
            <button
              onClick={() => updateRole(role)}
              disabled={save.isPending}
              className="btn btn-primary text-xs"
            >
              Update
            </button>
          </div>
          <div className="p-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-600">
                <tr>
                  <th className="text-left px-2 py-1">Attendance Type</th>
                  <th className="text-left px-2 py-1">Entry From (hh:mm:ss)</th>
                  <th className="text-left px-2 py-1">Entry Upto (hh:mm:ss)</th>
                  <th className="text-left px-2 py-1">Total Hour</th>
                </tr>
              </thead>
              <tbody>
                {items.map(r => {
                  const cur = getRow(r)
                  return (
                    <tr key={r.attendance_type} className="border-t">
                      <td className="px-2 py-1">{r.attendance_type}</td>
                      <td className="px-2 py-1">
                        <input value={cur.entry_from ?? ''} onChange={e => setRow(r, { entry_from: e.target.value })} className="input w-32"/>
                      </td>
                      <td className="px-2 py-1">
                        <input value={cur.entry_upto ?? ''} onChange={e => setRow(r, { entry_upto: e.target.value })} className="input w-32"/>
                      </td>
                      <td className="px-2 py-1">
                        <input value={cur.total_hour ?? ''} onChange={e => setRow(r, { total_hour: e.target.value })} className="input w-32"/>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
