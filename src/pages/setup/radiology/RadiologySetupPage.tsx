// src/pages/setup/radiology/RadiologySetupPage.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'
import { radSetupApi } from '@/api/radiologySetup'
import { cn } from '@/lib/utils'

type Tab = 'category' | 'unit' | 'parameter'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'category',  label: 'Radiology Category' },
  { id: 'unit',      label: 'Unit' },
  { id: 'parameter', label: 'Radiology Parameter' },
]


export default function RadiologySetupPage() {
  const [tab, setTab] = useState<Tab>('category')

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
          {tab === 'category'  && <CategoryTab />}
          {tab === 'unit'      && <UnitTab />}
          {tab === 'parameter' && <ParameterTab />}
        </section>
      </div>
    </div>
  )
}


// ── Category ─────────────────────────────────────────────
function CategoryTab() {
  return <SimpleTab
    listTitle="Radiology Category List"
    singular="Radiology Category"
    columnHeader="Category Name"
    listFn={() => radSetupApi.listCategories().then(r => r.data)}
    addFn={(d) => radSetupApi.addCategory(d)}
    updateFn={(id, d) => radSetupApi.updateCategory(id, d)}
    deleteFn={(id) => radSetupApi.deleteCategory(id)}
    queryKey={['rad-cats']}
  />
}


// ── Unit ─────────────────────────────────────────────────
function UnitTab() {
  return <SimpleTab
    listTitle="Unit List"
    singular="Unit"
    columnHeader="Unit Name"
    listFn={() => radSetupApi.listUnits().then(r => r.data)}
    addFn={(d) => radSetupApi.addUnit(d)}
    updateFn={(id, d) => radSetupApi.updateUnit(id, d)}
    deleteFn={(id) => radSetupApi.deleteUnit(id)}
    queryKey={['rad-units']}
  />
}


// ── Generic name-only tab ────────────────────────────────
function SimpleTab({
  listTitle, singular, columnHeader, listFn, addFn, updateFn, deleteFn, queryKey,
}: {
  listTitle: string; singular: string; columnHeader: string
  listFn: () => Promise<any>
  addFn: (d: any) => Promise<any>
  updateFn: (id: number, d: any) => Promise<any>
  deleteFn: (id: number) => Promise<any>
  queryKey: string[]
}) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({ queryKey, queryFn: listFn })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()))
    : items

  const del = useMutation({
    mutationFn: (id: number) => deleteFn(id),
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

      <SimpleAddModal
        open={modal.open}
        item={modal.item}
        singular={singular}
        fieldLabel={columnHeader}
        addFn={addFn}
        updateFn={updateFn}
        invalidateKey={queryKey}
        onClose={() => setModal({ open: false })}
      />
    </div>
  )
}


function SimpleAddModal({
  open, onClose, item, singular, fieldLabel, addFn, updateFn, invalidateKey,
}: {
  open: boolean; onClose: () => void
  item?: any
  singular: string
  fieldLabel: string
  addFn: (d: any) => Promise<any>
  updateFn: (id: number, d: any) => Promise<any>
  invalidateKey: string[]
}) {
  const qc = useQueryClient()
  const editing = !!item?.id
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) setName(item?.name ?? '')
  }, [open, item])

  const save = useMutation({
    mutationFn: (n: string) => editing ? updateFn(item.id, { name: n }) : addFn({ name: n }),
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
            {fieldLabel} <span className="text-red-500">*</span>
          </label>
          <input required value={name}
            onChange={e => setName(e.target.value)}
            className="input w-full"/>
        </div>
        <SaveRow pending={save.isPending} />
      </form>
    </Modal>
  )
}


// ── Parameter ────────────────────────────────────────────
function ParameterTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['rad-params'],
    queryFn:  () => radSetupApi.listParameters().then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r =>
        ['name','reference_range','unit','description']
          .some(k => (r[k] || '').toLowerCase().includes(search.toLowerCase())))
    : items

  const del = useMutation({
    mutationFn: (id: number) => radSetupApi.deleteParameter(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['rad-params'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Radiology Parameter List</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Radiology Parameter
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
              <th className="px-3 py-2 w-1/6">Parameter Name</th>
              <th className="px-3 py-2 w-1/6">Reference Range</th>
              <th className="px-3 py-2 w-1/6">Unit</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              : filtered.length === 0
                ? <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No parameters</td></tr>
                : filtered.map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 text-brand-700">{r.name}</td>
                    <td className="px-3 py-2 text-brand-700">{r.reference_range}</td>
                    <td className="px-3 py-2 text-gray-700">{r.unit || '—'}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-2xl">{r.description || ''}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
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

      <ParameterModal open={modal.open} item={modal.item} onClose={() => setModal({ open: false })} />
    </div>
  )
}


function ParameterModal({ open, onClose, item }: { open: boolean; onClose: () => void; item?: any }) {
  const qc = useQueryClient()
  const editing = !!item?.id

  const [form, setForm] = useState({
    name: '', reference_range_from: '', reference_range_to: '', unit_id: '', description: '',
  })

  const { data: unitsData } = useQuery({
    queryKey: ['rad-units'],
    queryFn:  () => radSetupApi.listUnits().then(r => r.data),
    enabled:  open,
  })
  const units: any[] = unitsData?.data ?? []

  useEffect(() => {
    if (!open) return
    setForm({
      name                 : item?.name ?? '',
      reference_range_from : item?.reference_range_from ?? '',
      reference_range_to   : item?.reference_range_to ?? '',
      unit_id              : item?.unit_id ? String(item.unit_id) : '',
      description          : item?.description ?? '',
    })
  }, [open, item])

  const save = useMutation({
    mutationFn: (payload: any) => editing
      ? radSetupApi.updateParameter(item.id, payload)
      : radSetupApi.addParameter(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rad-params'] })
      onClose()
    },
  })

  if (!open) return null

  return (
    <Modal title={editing ? 'Edit Radiology Parameter' : 'Add Radiology Parameter'} onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!form.name.trim() || !form.reference_range_from || !form.reference_range_to || !form.unit_id) return
        save.mutate({
          name                 : form.name.trim(),
          reference_range_from : form.reference_range_from.trim(),
          reference_range_to   : form.reference_range_to.trim(),
          unit_id              : Number(form.unit_id),
          description          : form.description || null,
        })
      }} className="space-y-4">
        <Field label="Parameter Name" required>
          <input required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="input w-full"/>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Reference Range" required>
            <input required placeholder="From" value={form.reference_range_from}
              onChange={e => setForm({ ...form, reference_range_from: e.target.value })}
              className="input w-full"/>
          </Field>
          <Field label="Reference Range" required>
            <input required placeholder="To" value={form.reference_range_to}
              onChange={e => setForm({ ...form, reference_range_to: e.target.value })}
              className="input w-full"/>
          </Field>
        </div>
        <Field label="Unit" required>
          <select required value={form.unit_id}
            onChange={e => setForm({ ...form, unit_id: e.target.value })}
            className="input w-full">
            <option value="">Select</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
        <Field label="Description">
          <input value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="input w-full"/>
        </Field>
        <SaveRow pending={save.isPending} />
      </form>
    </Modal>
  )
}


// ── Shared ───────────────────────────────────────────────
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
