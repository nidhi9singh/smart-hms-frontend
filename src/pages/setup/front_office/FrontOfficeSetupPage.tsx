// src/pages/setup/front_office/FrontOfficeSetupPage.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'
import { foSetupApi, type FOLookupKey } from '@/api/frontOfficeSetup'
import { cn } from '@/lib/utils'

type Tab = 'purpose' | 'complaint_type' | 'source'

const TABS: Array<{ id: Tab; label: string; key: FOLookupKey; singular: string; listTitle: string; nameLabel: string }> = [
  { id: 'purpose',        label: 'Purpose',        key: 'purposes',        singular: 'Purpose',       listTitle: 'Purpose List',         nameLabel: 'Purpose' },
  { id: 'complaint_type', label: 'Complain Type',  key: 'complaint-types', singular: 'Complain Type', listTitle: 'Complain Type List',   nameLabel: 'Complain Type' },
  { id: 'source',         label: 'Source',         key: 'sources',         singular: 'Source',        listTitle: 'Source List',          nameLabel: 'Source' },
]


export default function FrontOfficeSetupPage() {
  const [tab, setTab] = useState<Tab>('purpose')

  return (
    <div className="p-6">
      <div className="grid grid-cols-12 gap-5">
        <aside className="col-span-2 card overflow-hidden">
          <nav className="text-sm">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  'w-full text-left px-4 py-2.5 border-b',
                  tab === t.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                )}>
                {t.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="col-span-10">
          <LookupTab meta={TABS.find(t => t.id === tab)!} />
        </section>
      </div>
    </div>
  )
}


function LookupTab({ meta }: { meta: (typeof TABS)[number] }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['fo-setup', meta.key],
    queryFn:  () => foSetupApi.list(meta.key).then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r =>
        (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(search.toLowerCase()))
    : items

  const del = useMutation({
    mutationFn: (id: number) => foSetupApi.delete(meta.key, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['fo-setup', meta.key] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">{meta.listTitle}</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add {meta.singular}
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
            <th className="px-3 py-2 w-1/4">{meta.nameLabel}</th>
            <th className="px-3 py-2">Description</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
            : filtered.length === 0
              ? <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">No records</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50 align-top">
                  <td className="px-3 py-2 text-brand-700">{r.name}</td>
                  <td className="px-3 py-2 text-gray-600">{r.description || ''}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal({ open: true, item: r })}
                        className="p-1 hover:bg-brand-50 rounded text-brand-600"><Edit2 size={14}/></button>
                      <button onClick={() => { if (confirm(`Delete this ${meta.singular.toLowerCase()}?`)) del.mutate(r.id) }}
                        className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))
          }
        </tbody>
      </table>
      <p className="text-xs text-gray-400 px-5 py-2">
        Records: 1 to {filtered.length} of {items.length}
      </p>

      <AddLookupModal
        open={modal.open}
        item={modal.item}
        meta={meta}
        onClose={() => setModal({ open: false })}
      />
    </div>
  )
}


function AddLookupModal({
  open, onClose, item, meta,
}: {
  open: boolean; onClose: () => void
  item?: any
  meta: (typeof TABS)[number]
}) {
  const qc = useQueryClient()
  const editing = !!item?.id

  // editing → single row; adding → multi-row batch (matches screenshot's '+ Add' button)
  const [rows, setRows] = useState<Array<{ name: string; description: string }>>([
    { name: '', description: '' },
  ])

  useEffect(() => {
    if (!open) return
    if (editing) {
      setRows([{ name: item.name ?? '', description: item.description ?? '' }])
    } else {
      setRows([{ name: '', description: '' }])
    }
  }, [open, editing, item])

  const save = useMutation({
    mutationFn: () => {
      const cleaned = rows
        .map(r => ({ name: r.name.trim(), description: r.description.trim() || undefined }))
        .filter(r => r.name)
      if (editing) {
        return foSetupApi.update(meta.key, item.id, cleaned[0] ?? {})
      }
      return foSetupApi.add(meta.key, cleaned)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fo-setup', meta.key] })
      onClose()
    },
  })

  if (!open) return null

  const setRow = (i: number, patch: Partial<{ name: string; description: string }>) =>
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  const addRow = () => setRows(rs => [...rs, { name: '', description: '' }])
  const removeRow = (i: number) => setRows(rs => rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rows.some(r => r.name.trim())) return
    save.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-xl w-[680px] max-w-[94vw]">
        <div className="flex items-center justify-between px-5 py-3 bg-brand-600 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">
            {editing ? `Edit ${meta.singular}` : `Add ${meta.singular}`}
          </h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-[1fr_2fr_auto] gap-3 text-xs font-medium text-gray-600">
            <div>{meta.nameLabel} <span className="text-red-500">*</span></div>
            <div>Description</div>
            <div></div>
          </div>

          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-3 items-start">
              <input required={i === 0} value={r.name}
                onChange={e => setRow(i, { name: e.target.value })}
                className="input"/>
              <input value={r.description}
                onChange={e => setRow(i, { description: e.target.value })}
                className="input"/>
              <button type="button"
                onClick={() => removeRow(i)}
                disabled={rows.length === 1 || editing}
                className={cn(
                  'p-1.5 rounded',
                  (rows.length === 1 || editing)
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-red-500 hover:bg-red-50'
                )}
                title="Remove"
              ><X size={16}/></button>
            </div>
          ))}

          {!editing && (
            <button type="button" onClick={addRow}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded text-sm flex items-center gap-1.5">
              <Plus size={14}/> Add
            </button>
          )}

          <div className="flex justify-end pt-2 border-t">
            <button type="submit" disabled={save.isPending} className="btn btn-primary">
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
