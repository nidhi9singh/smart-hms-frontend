// src/pages/setup/operations/OperationsSetupPage.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'
import { opsSetupApi } from '@/api/operationsSetup'
import { cn } from '@/lib/utils'

type Tab = 'operation' | 'category'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'operation', label: 'Operation' },
  { id: 'category',  label: 'Operation Category' },
]


export default function OperationsSetupPage() {
  const [tab, setTab] = useState<Tab>('operation')

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
                {t.label}
              </button>
            ))}
          </nav>
        </aside>
        <section className="col-span-10">
          {tab === 'operation' && <OperationTab />}
          {tab === 'category'  && <CategoryTab />}
        </section>
      </div>
    </div>
  )
}


// ───────────────────────────────────────────────────────────────────
//  Operation tab
// ───────────────────────────────────────────────────────────────────
function OperationTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['ops-list'],
    queryFn:  () => opsSetupApi.listOperations().then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r =>
        (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.category || '').toLowerCase().includes(search.toLowerCase()))
    : items

  const del = useMutation({
    mutationFn: (id: number) => opsSetupApi.deleteOperation(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['ops-list'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Operation List</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Operation
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
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
            : filtered.length === 0
              ? <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">No operations</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-emerald-700">{r.name}</td>
                  <td className="px-3 py-2 text-gray-600">{r.category || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal({ open: true, item: r })}
                        className="p-1 hover:bg-emerald-50 rounded text-emerald-600"><Edit2 size={14}/></button>
                      <button onClick={() => { if (confirm('Delete this operation?')) del.mutate(r.id) }}
                        className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))
          }
        </tbody>
      </table>
      <p className="text-xs text-gray-400 px-5 py-2">Records: 1 to {filtered.length} of {items.length}</p>

      <AddOperationModal open={modal.open} item={modal.item} onClose={() => setModal({ open: false })} />
    </div>
  )
}


function AddOperationModal({
  open, onClose, item,
}: { open: boolean; onClose: () => void; item?: any }) {
  const qc = useQueryClient()
  const editing = !!item?.id

  const { data: catsData } = useQuery({
    queryKey: ['ops-cats'],
    queryFn:  () => opsSetupApi.listCategories().then(r => r.data),
    enabled:  open,
  })
  const cats: any[] = catsData?.data ?? []

  const [rows, setRows] = useState<Array<{ name: string; category_id: string }>>([
    { name: '', category_id: '' },
  ])

  useEffect(() => {
    if (!open) return
    if (editing) {
      setRows([{
        name: item.name ?? '',
        category_id: item.category_id ? String(item.category_id) : '',
      }])
    } else {
      setRows([{ name: '', category_id: '' }])
    }
  }, [open, editing, item])

  const save = useMutation({
    mutationFn: () => {
      const cleaned = rows
        .map(r => ({ name: r.name.trim(), category_id: r.category_id ? Number(r.category_id) : null }))
        .filter(r => r.name)
      if (editing) {
        return opsSetupApi.updateOperation(item.id, cleaned[0] ?? {})
      }
      return opsSetupApi.addOperations(cleaned)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ops-list'] })
      onClose()
    },
  })

  if (!open) return null

  const setRow = (i: number, patch: Partial<{ name: string; category_id: string }>) =>
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  const addRow = () => setRows(rs => [...rs, { name: '', category_id: '' }])
  const removeRow = (i: number) => setRows(rs => rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rows.some(r => r.name.trim() && r.category_id)) return
    save.mutate()
  }

  return (
    <Modal title={editing ? 'Edit Operation' : 'Add Operation'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-xs font-medium text-gray-600">
          <div>Operation Name <span className="text-red-500">*</span></div>
          <div>Category <span className="text-red-500">*</span></div>
          <div></div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-start">
            <input required={i === 0} value={r.name}
              onChange={e => setRow(i, { name: e.target.value })}
              className="input"/>
            <select required={i === 0} value={r.category_id}
              onChange={e => setRow(i, { category_id: e.target.value })}
              className="input">
              <option value="">Select</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
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
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm flex items-center gap-1.5">
            <Plus size={14}/> Add
          </button>
        )}
        <SaveRow pending={save.isPending} />
      </form>
    </Modal>
  )
}


// ───────────────────────────────────────────────────────────────────
//  Category tab
// ───────────────────────────────────────────────────────────────────
function CategoryTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['ops-cats'],
    queryFn:  () => opsSetupApi.listCategories().then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()))
    : items

  const del = useMutation({
    mutationFn: (id: number) => opsSetupApi.deleteCategory(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['ops-cats'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Operation Category List</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Category
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
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? <tr><td colSpan={2} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
            : filtered.length === 0
              ? <tr><td colSpan={2} className="px-3 py-6 text-center text-gray-400">No categories</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-emerald-700">{r.name}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal({ open: true, item: r })}
                        className="p-1 hover:bg-emerald-50 rounded text-emerald-600"><Edit2 size={14}/></button>
                      <button onClick={() => { if (confirm('Delete this category?')) del.mutate(r.id) }}
                        className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))
          }
        </tbody>
      </table>
      <p className="text-xs text-gray-400 px-5 py-2">Records: 1 to {filtered.length} of {items.length}</p>

      <AddCategoryModal open={modal.open} item={modal.item} onClose={() => setModal({ open: false })} />
    </div>
  )
}


function AddCategoryModal({
  open, onClose, item,
}: { open: boolean; onClose: () => void; item?: any }) {
  const qc = useQueryClient()
  const editing = !!item?.id

  const [rows, setRows] = useState<Array<{ name: string }>>([{ name: '' }])

  useEffect(() => {
    if (!open) return
    if (editing) setRows([{ name: item.name ?? '' }])
    else         setRows([{ name: '' }])
  }, [open, editing, item])

  const save = useMutation({
    mutationFn: () => {
      const cleaned = rows.map(r => ({ name: r.name.trim() })).filter(r => r.name)
      if (editing) {
        return opsSetupApi.updateCategory(item.id, cleaned[0] ?? {})
      }
      return opsSetupApi.addCategories(cleaned)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ops-cats'] })
      onClose()
    },
  })

  if (!open) return null

  const setRow = (i: number, name: string) =>
    setRows(rs => rs.map((r, idx) => idx === i ? { name } : r))
  const addRow = () => setRows(rs => [...rs, { name: '' }])
  const removeRow = (i: number) => setRows(rs => rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs)

  return (
    <Modal title={editing ? 'Edit Category' : 'Add Category'} onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!rows.some(r => r.name.trim())) return
        save.mutate()
      }} className="space-y-3">
        <div className="text-xs font-medium text-gray-600">
          Operation Category <span className="text-red-500">*</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] gap-3 items-start">
            <input required={i === 0} value={r.name}
              onChange={e => setRow(i, e.target.value)}
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
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm flex items-center gap-1.5">
            <Plus size={14}/> Add
          </button>
        )}
        <SaveRow pending={save.isPending} />
      </form>
    </Modal>
  )
}


// ───────────────────────────────────────────────────────────────────
//  Shared
// ───────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-xl w-[640px] max-w-[94vw]">
        <div className="flex items-center justify-between px-5 py-3 bg-emerald-600 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function SaveRow({ pending }: { pending: boolean }) {
  return (
    <div className="flex justify-end pt-2 border-t">
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}
