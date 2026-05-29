// src/pages/setup/tabs/RolesPermissionsTab.tsx
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { setupApi } from '@/api/setup'

export default function RolesPermissionsTab() {
  const qc = useQueryClient()
  const [name, setName] = useState('')

  const { data } = useQuery({
    queryKey: ['setup-roles'],
    queryFn: () => setupApi.listRoles().then(r => r.data),
  })
  const roles: any[] = data?.data ?? []

  const add = useMutation({
    mutationFn: (n: string) => setupApi.addRole({ name: n, display_name: n }),
    onSuccess: () => { setName(''); qc.invalidateQueries({ queryKey: ['setup-roles'] }) },
  })
  const del = useMutation({
    mutationFn: (id: number) => setupApi.deleteRole(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['setup-roles'] }),
  })

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="card p-4">
        <h3 className="text-sm font-semibold mb-3">Role</h3>
        <form onSubmit={e => { e.preventDefault(); if (name.trim()) add.mutate(name.trim()) }}>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input value={name} onChange={e => setName(e.target.value)} className="input w-full mb-3" required/>
          <button type="submit" disabled={add.isPending} className="btn btn-primary w-full">
            {add.isPending ? 'Saving…' : 'Save'}
          </button>
        </form>
      </div>

      <div className="card p-4 col-span-2">
        <h3 className="text-sm font-semibold border-b pb-2 mb-2">Role List</h3>
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-600">
            <tr>
              <th className="text-left px-2 py-1">Role</th>
              <th className="text-left px-2 py-1">Type</th>
              <th className="text-right px-2 py-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {roles.length === 0
              ? <tr><td colSpan={3} className="px-2 py-6 text-center text-gray-400">No roles</td></tr>
              : roles.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-2 py-1">{r.display_name}</td>
                  <td className="px-2 py-1 text-gray-500">System</td>
                  <td className="px-2 py-1 text-right">
                    <button onClick={() => { if (confirm('Delete role?')) del.mutate(r.id) }}
                      className="p-1 hover:bg-red-50 rounded text-red-600">
                      <Trash2 size={14}/>
                    </button>
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
