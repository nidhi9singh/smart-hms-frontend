// src/pages/setup/symptoms/SymptomsSetupPage.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'
import { symptomsSetupApi } from '@/api/symptomsSetup'
import { cn } from '@/lib/utils'

type Tab = 'head' | 'type'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'head', label: 'Symptoms Head' },
  { id: 'type', label: 'Symptoms Type' },
]


export default function SymptomsSetupPage() {
  const [tab, setTab] = useState<Tab>('head')

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
          {tab === 'head' && <HeadTab />}
          {tab === 'type' && <TypeTab />}
        </section>
      </div>
    </div>
  )
}


// ── Symptoms Type (batch-add) ────────────────────────────
function TypeTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['sym-types'],
    queryFn:  () => symptomsSetupApi.listTypes().then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()))
    : items

  const del = useMutation({
    mutationFn: (id: number) => symptomsSetupApi.deleteType(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['sym-types'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Symptoms Type List</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Symptoms Type
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
            <th className="px-3 py-2">Symptoms Type</th>
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
                  <td className="px-3 py-2 text-brand-700">{r.name}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal({ open: true, item: r })}
                        className="p-1 hover:bg-brand-50 rounded text-brand-600"><Edit2 size={14}/></button>
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

      <BatchNameModal
        open={modal.open}
        item={modal.item}
        singular="Symptoms Type"
        fieldLabel="Symptoms Type"
        addFn={(items) => symptomsSetupApi.addTypes(items)}
        updateFn={(id, d) => symptomsSetupApi.updateType(id, d)}
        invalidateKey={['sym-types']}
        onClose={() => setModal({ open: false })}
      />
    </div>
  )
}


// ── Symptoms Head (single add with FK + description) ─────
function HeadTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['sym-heads'],
    queryFn:  () => symptomsSetupApi.listHeads().then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r =>
        ['name','type','description'].some(k => (r[k] || '').toLowerCase().includes(search.toLowerCase())))
    : items

  const del = useMutation({
    mutationFn: (id: number) => symptomsSetupApi.deleteHead(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['sym-heads'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Symptoms Head List</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Symptoms Head
        </button>
      </div>
      <div className="px-5 py-3 border-b">
        <div className="relative max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search…" className="input pl-8 w-full"/>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2 w-1/6">Symptoms Head</th>
              <th className="px-3 py-2 w-1/6">Symptoms Type</th>
              <th className="px-3 py-2">Symptoms Description</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              : filtered.length === 0
                ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">No records</td></tr>
                : filtered.map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 text-brand-700 align-top">{r.name}</td>
                    <td className="px-3 py-2 text-brand-700 align-top">{r.type || '—'}</td>
                    <td className="px-3 py-2 text-gray-600 align-top">{r.description || ''}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap align-top">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal({ open: true, item: r })}
                          className="p-1 hover:bg-brand-50 rounded text-brand-600"><Edit2 size={14}/></button>
                        <button onClick={() => { if (confirm('Delete?')) del.mutate(r.id) }}
                          className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 px-5 py-2">Records: 1 to {filtered.length} of {items.length}</p>

      <HeadModal open={modal.open} item={modal.item} onClose={() => setModal({ open: false })} />
    </div>
  )
}


function HeadModal({ open, onClose, item }: { open: boolean; onClose: () => void; item?: any }) {
  const qc = useQueryClient()
  const editing = !!item?.id

  const [form, setForm] = useState({ name: '', type_id: '', description: '' })

  const { data: typesData } = useQuery({
    queryKey: ['sym-types'],
    queryFn:  () => symptomsSetupApi.listTypes().then(r => r.data),
    enabled:  open,
  })
  const types: any[] = typesData?.data ?? []

  useEffect(() => {
    if (!open) return
    setForm({
      name        : item?.name ?? '',
      type_id     : item?.type_id ? String(item.type_id) : '',
      description : item?.description ?? '',
    })
  }, [open, item])

  const save = useMutation({
    mutationFn: (payload: any) => editing
      ? symptomsSetupApi.updateHead(item.id, payload)
      : symptomsSetupApi.addHead(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sym-heads'] })
      onClose()
    },
  })

  if (!open) return null

  return (
    <Modal title={editing ? 'Edit Symptoms Head' : 'Add Symptoms Head'} onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!form.name.trim() || !form.type_id) return
        save.mutate({
          name        : form.name.trim(),
          type_id     : Number(form.type_id),
          description : form.description || null,
        })
      }} className="space-y-4">
        <Field label="Symptoms Head" required>
          <input required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="input w-full"/>
        </Field>
        <Field label="Symptoms Type" required>
          <select required value={form.type_id}
            onChange={e => setForm({ ...form, type_id: e.target.value })}
            className="input w-full">
            <option value="">Select</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Description">
          <textarea rows={3} value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="input w-full"/>
        </Field>
        <SaveRow pending={save.isPending} />
      </form>
    </Modal>
  )
}


// ── Generic batch-add name-only modal ─────────────────────
function BatchNameModal({
  open, onClose, item, singular, fieldLabel, addFn, updateFn, invalidateKey,
}: {
  open: boolean; onClose: () => void
  item?: any
  singular: string
  fieldLabel: string
  addFn: (items: Array<{ name: string }>) => Promise<any>
  updateFn: (id: number, d: any) => Promise<any>
  invalidateKey: string[]
}) {
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
      if (editing) return updateFn(item.id, cleaned[0] ?? {})
      return addFn(cleaned)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey })
      onClose()
    },
  })

  if (!open) return null

  const setRow = (i: number, name: string) =>
    setRows(rs => rs.map((r, idx) => idx === i ? { name } : r))
  const addRow = () => setRows(rs => [...rs, { name: '' }])
  const removeRow = (i: number) => setRows(rs => rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs)
  const showBatch = !editing

  return (
    <Modal title={editing ? `Edit ${singular}` : `Add ${singular}`} onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!rows.some(r => r.name.trim())) return
        save.mutate()
      }} className="space-y-3">
        <div className="text-xs font-medium text-gray-600">
          {fieldLabel} <span className="text-red-500">*</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] gap-3 items-start">
            <input required={i === 0} value={r.name}
              onChange={e => setRow(i, e.target.value)}
              className="input"/>
            {showBatch ? (
              <button type="button"
                onClick={() => removeRow(i)}
                disabled={rows.length === 1}
                className={
                  'p-1.5 rounded ' +
                  (rows.length === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50')
                }
                title="Remove">
                <X size={16}/>
              </button>
            ) : <span/>}
          </div>
        ))}
        {showBatch && (
          <button type="button" onClick={addRow}
            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded text-sm flex items-center gap-1.5">
            <Plus size={14}/> Add
          </button>
        )}
        <SaveRow pending={save.isPending} />
      </form>
    </Modal>
  )
}


// ── Shared ────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-xl w-[520px] max-w-[92vw]">
        <div className="flex items-center justify-between px-5 py-3 bg-brand-600 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
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
