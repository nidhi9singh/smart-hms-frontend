// src/pages/tpa/TPAPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import { tpaApi } from '@/api/tpa'
import AddTPAModal from './AddTPAModal'
import { useAuthStore } from '@/store/authStore'

export default function TPAPage() {
  const qc = useQueryClient()
  const role = useAuthStore(s => s.user?.role)
  // Doctors / nurses get read-only TPA Management — no add / edit / delete actions.
  const canManageTPA = !['doctor', 'nurse'].includes(role ?? '')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ open: boolean; tpa?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['tpa', search],
    queryFn:  () => tpaApi.list({ search }).then(r => r.data),
  })
  const tpas: any[] = data?.data ?? []

  const delMut = useMutation({
    mutationFn: (id: number) => tpaApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['tpa'] }),
  })

  return (
    <div className="p-6 space-y-5">
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">TPA Management</h2>
          {canManageTPA && (
            <button onClick={() => setModal({ open: true })} className="btn btn-primary flex items-center gap-1.5">
              <Plus size={14}/> Add TPA
            </button>
          )}
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
                {['Name','Code','Phone','Address','Contact Person Name','Contact Person Phone','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              : tpas.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No TPAs</td></tr>
              : tpas.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-brand-600 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-brand-600">{t.code || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{t.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{t.address || '—'}</td>
                  <td className="px-4 py-3 text-brand-600">{t.contact_person_name || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{t.contact_person_phone || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {canManageTPA && (
                        <>
                          <button className="icon-btn" onClick={() => setModal({ open: true, tpa: t })}><Edit2 size={12}/></button>
                          <button className="icon-btn text-red-400" onClick={() => confirm(`Delete ${t.name}?`) && delMut.mutate(t.id)}><Trash2 size={12}/></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
          Records: {tpas.length === 0 ? 0 : `1 to ${tpas.length}`} of {tpas.length}
        </div>
      </div>

      <AddTPAModal
        open={modal.open}
        tpa={modal.tpa}
        onClose={() => setModal({ open: false })}
        onSuccess={() => { setModal({ open: false }); qc.invalidateQueries({ queryKey: ['tpa'] }) }}
      />
    </div>
  )
}
