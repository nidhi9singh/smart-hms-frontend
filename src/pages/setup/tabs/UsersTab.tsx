// src/pages/setup/tabs/UsersTab.tsx
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { setupApi } from '@/api/setup'
import { cn } from '@/lib/utils'

export default function UsersTab() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'Patient' | 'Staff'>('Patient')

  const { data } = useQuery({
    queryKey: ['setup-users'],
    queryFn: () => setupApi.listUsers().then(r => r.data),
  })
  const users: any[] = data?.data ?? []

  const filtered = users.filter(u => {
    if (tab === 'Patient') return u.role === 'patient'
    return u.role !== 'patient'
  })

  const toggle = useMutation({
    mutationFn: (u: any) => setupApi.updateUser(u.id, { is_active: !u.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['setup-users'] }),
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-base font-semibold text-gray-800">Users</h2>
        <div className="flex">
          {(['Patient', 'Staff'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-4 py-1.5 text-sm border-b-2',
                tab === t ? 'border-brand-600 text-brand-700 font-medium' : 'border-transparent text-gray-500')}
            >{t}</button>
          ))}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">ID</th>
            <th className="px-3 py-2">Username</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Staff Code</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0
            ? <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No users</td></tr>
            : filtered.map(u => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2">{u.id}</td>
                <td className="px-3 py-2 font-medium">{u.username}</td>
                <td className="px-3 py-2 text-gray-600">{u.email || '—'}</td>
                <td className="px-3 py-2 text-gray-600 capitalize">{u.role}</td>
                <td className="px-3 py-2 text-gray-600">{u.staff_code ?? '—'}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => toggle.mutate(u)}
                    className={'inline-flex items-center w-10 h-5 rounded-full transition-colors ' +
                      (u.is_active ? 'bg-brand-600' : 'bg-gray-300')}>
                    <span className={'w-4 h-4 bg-white rounded-full transition-transform ' +
                      (u.is_active ? 'translate-x-5' : 'translate-x-0.5')}/>
                  </button>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  )
}
