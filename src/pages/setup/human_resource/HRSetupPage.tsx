// src/pages/setup/human_resource/HRSetupPage.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'
import { hrSetupApi, type HRKey } from '@/api/hrSetup'
import { cn } from '@/lib/utils'

type Tab = HRKey

const TABS: Array<{ id: Tab; sidebar: string; title: string; singular: string; columnHeader: string }> = [
  { id: 'leave-types',  sidebar: 'Leave Type',  title: 'Leave Type List',  singular: 'Leave Type',  columnHeader: 'Name' },
  { id: 'departments',  sidebar: 'Department',  title: 'Department List',  singular: 'Department',  columnHeader: 'Department' },
  { id: 'designations', sidebar: 'Designation', title: 'Designation List', singular: 'Designation', columnHeader: 'Designation' },
  { id: 'specialists',  sidebar: 'Specialist',  title: 'Specialist List',  singular: 'Specialist',  columnHeader: 'Specialist' },
]


export default function HRSetupPage() {
  const [tab, setTab] = useState<Tab>('leave-types')
  const active = TABS.find(t => t.id === tab)!

  return (
    <div className="p-6">
      <div className="grid grid-cols-12 gap-5">
        <aside className="col-span-2 card overflow-hidden">
          <nav className="text-sm">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  'w-full text-left px-4 py-2.5 border-b',
                  tab === t.id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                )}>
                {t.sidebar}
              </button>
            ))}
          </nav>
        </aside>
        <section className="col-span-10">
          <LookupTab
            tab={tab}
            listTitle={active.title}
            singular={active.singular}
            columnHeader={active.columnHeader}
          />
        </section>
      </div>
    </div>
  )
}


function LookupTab({
  tab, listTitle, singular, columnHeader,
}: {
  tab: HRKey
  listTitle: string
  singular: string
  columnHeader: string
}) {
  const qc = useQueryClient()
  const queryKey = ['hr-setup', tab]
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn:  () => hrSetupApi.list(tab).then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()))
    : items

  const del = useMutation({
    mutationFn: (id: number) => hrSetupApi.delete(tab, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">{listTitle}</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add {singular}
        </button>
      </div>
      <div className="px-5 py-3 border-b">
        <div className="relative max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search…" className="input pl-8 w-full"/>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">{columnHeader}</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? <tr><td colSpan={2} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
            : filtered.length === 0
              ? <tr><td colSpan={2} className="px-3 py-6 text-center text-gray-400">No records</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-emerald-700">{r.name}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal({ open: true, item: r })}
                        className="p-1 hover:bg-emerald-50 rounded text-emerald-600"><Edit2 size={14}/></button>
                      <button onClick={() => { if (confirm('Delete?')) del.mutate(r.id) }}
                        className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))
          }
        </tbody>
      </table>
      <p className="text-xs text-gray-400 px-5 py-2">Records: 1 to {filtered.length} of {items.length}</p>

      <NameModal
        open={modal.open}
        item={modal.item}
        tab={tab}
        singular={singular}
        invalidateKey={queryKey}
        onClose={() => setModal({ open: false })}
      />
    </div>
  )
}


function NameModal({
  open, onClose, item, tab, singular, invalidateKey,
}: {
  open: boolean; onClose: () => void
  item?: any
  tab: HRKey
  singular: string
  invalidateKey: any[]
}) {
  const qc = useQueryClient()
  const editing = !!item?.id
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) setName(item?.name ?? '')
  }, [open, item])

  const save = useMutation({
    mutationFn: (n: string) => editing
      ? hrSetupApi.update(tab, item.id, { name: n })
      : hrSetupApi.add(tab, { name: n }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey })
      onClose()
    },
  })

  if (!open) return null

  return (
    <Modal title={editing ? `Edit ${singular}` : `Add ${singular}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) save.mutate(name.trim()) }}
            className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input required value={name}
            onChange={e => setName(e.target.value)}
            className="input w-full"/>
        </div>
        <div className="flex justify-end pt-2 border-t">
          <button type="submit" disabled={save.isPending} className="btn btn-primary">
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}


function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-xl w-[520px] max-w-[92vw]">
        <div className="flex items-center justify-between px-5 py-3 bg-emerald-600 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
