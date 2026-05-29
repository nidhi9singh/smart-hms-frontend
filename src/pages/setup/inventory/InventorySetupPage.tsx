// src/pages/setup/inventory/InventorySetupPage.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, X, User, Phone, Mail, MapPin } from 'lucide-react'
import { invSetupApi } from '@/api/inventorySetup'
import { cn } from '@/lib/utils'

type Tab = 'category' | 'store' | 'supplier'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'category', label: 'Item Category' },
  { id: 'store',    label: 'Item Store' },
  { id: 'supplier', label: 'Item Supplier' },
]


export default function InventorySetupPage() {
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
                  tab === t.id ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                )}>
                {t.label}
              </button>
            ))}
          </nav>
        </aside>
        <section className="col-span-10">
          {tab === 'category' && <CategoryTab />}
          {tab === 'store'    && <StoreTab />}
          {tab === 'supplier' && <SupplierTab />}
        </section>
      </div>
    </div>
  )
}


// ── Item Category (batch-add) ────────────────────────────
function CategoryTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['inv-cats'],
    queryFn:  () => invSetupApi.listCategories().then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()))
    : items

  const del = useMutation({
    mutationFn: (id: number) => invSetupApi.deleteCategory(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['inv-cats'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Item Category List</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Item Category
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
            <th className="px-3 py-2">Item Category</th>
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

      <CategoryModal open={modal.open} item={modal.item} onClose={() => setModal({ open: false })} />
    </div>
  )
}


function CategoryModal({ open, onClose, item }: { open: boolean; onClose: () => void; item?: any }) {
  const qc = useQueryClient()
  const editing = !!item?.id
  const [rows, setRows] = useState<Array<{ name: string; description: string }>>([{ name: '', description: '' }])

  useEffect(() => {
    if (!open) return
    if (editing) setRows([{ name: item.name ?? '', description: item.description ?? '' }])
    else         setRows([{ name: '', description: '' }])
  }, [open, editing, item])

  const save = useMutation({
    mutationFn: () => {
      const cleaned = rows
        .map(r => ({ name: r.name.trim(), description: r.description.trim() || null }))
        .filter(r => r.name)
      if (editing) return invSetupApi.updateCategory(item.id, cleaned[0] ?? {})
      return invSetupApi.addCategories(cleaned)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv-cats'] })
      onClose()
    },
  })

  if (!open) return null

  const setRow = (i: number, patch: Partial<{ name: string; description: string }>) =>
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  const addRow = () => setRows(rs => [...rs, { name: '', description: '' }])
  const removeRow = (i: number) => setRows(rs => rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs)
  const showBatch = !editing

  return (
    <Modal title={editing ? 'Edit Item Category' : 'Add Item Category'} onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!rows.some(r => r.name.trim())) return
        save.mutate()
      }} className="space-y-3">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-xs font-medium text-gray-600">
          <div>Item Category <span className="text-red-500">*</span></div>
          <div>Description</div>
          <div/>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-start">
            <input required={i === 0} value={r.name}
              onChange={e => setRow(i, { name: e.target.value })}
              className="input"/>
            <input value={r.description}
              onChange={e => setRow(i, { description: e.target.value })}
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
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm flex items-center gap-1.5">
            <Plus size={14}/> Add
          </button>
        )}
        <SaveRow pending={save.isPending} />
      </form>
    </Modal>
  )
}


// ── Item Store ───────────────────────────────────────────
function StoreTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['inv-stores'],
    queryFn:  () => invSetupApi.listStores().then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r => ['name','stock_code'].some(k => (r[k] || '').toString().toLowerCase().includes(search.toLowerCase())))
    : items

  const del = useMutation({
    mutationFn: (id: number) => invSetupApi.deleteStore(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['inv-stores'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Item Store List</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Item Store
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
            <th className="px-3 py-2">Item Store Name</th>
            <th className="px-3 py-2">Item Stock Code</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
            : filtered.length === 0
              ? <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">No records</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-emerald-700">{r.name}</td>
                  <td className="px-3 py-2 text-gray-700">{r.stock_code || '—'}</td>
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

      <StoreModal open={modal.open} item={modal.item} onClose={() => setModal({ open: false })} />
    </div>
  )
}


function StoreModal({ open, onClose, item }: { open: boolean; onClose: () => void; item?: any }) {
  const qc = useQueryClient()
  const editing = !!item?.id
  const [form, setForm] = useState({ name: '', stock_code: '', description: '' })

  useEffect(() => {
    if (!open) return
    setForm({
      name        : item?.name ?? '',
      stock_code  : item?.stock_code ?? '',
      description : item?.description ?? '',
    })
  }, [open, item])

  const save = useMutation({
    mutationFn: (payload: any) => editing
      ? invSetupApi.updateStore(item.id, payload)
      : invSetupApi.addStore(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv-stores'] })
      onClose()
    },
  })

  if (!open) return null

  return (
    <Modal title={editing ? 'Edit Item Store' : 'Add Item Store'} onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!form.name.trim()) return
        save.mutate({
          name        : form.name.trim(),
          stock_code  : form.stock_code.trim() || null,
          description : form.description.trim() || null,
        })
      }} className="space-y-4">
        <Field label="Item Store Name" required>
          <input required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="input w-full"/>
        </Field>
        <Field label="Item Stock Code">
          <input value={form.stock_code}
            onChange={e => setForm({ ...form, stock_code: e.target.value })}
            className="input w-full"/>
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


// ── Item Supplier ────────────────────────────────────────
function SupplierTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['inv-suppliers'],
    queryFn:  () => invSetupApi.listSuppliers().then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r =>
        ['name','phone','email','contact_person_name','address']
          .some(k => (r[k] || '').toLowerCase().includes(search.toLowerCase())))
    : items

  const del = useMutation({
    mutationFn: (id: number) => invSetupApi.deleteSupplier(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['inv-suppliers'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Item Supplier List</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Item Supplier
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
            <th className="px-3 py-2 w-1/3">Item Supplier</th>
            <th className="px-3 py-2 w-1/3">Contact Person</th>
            <th className="px-3 py-2">Address</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
            : filtered.length === 0
              ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">No suppliers</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-3 align-top">
                    <div className="text-emerald-700 font-medium">{r.name}</div>
                    {r.phone && <div className="text-xs text-gray-600 flex items-center gap-1 mt-0.5"><Phone size={11}/> {r.phone}</div>}
                    {r.email && <div className="text-xs text-gray-600 flex items-center gap-1"><Mail size={11}/> {r.email}</div>}
                  </td>
                  <td className="px-3 py-3 align-top">
                    {r.contact_person_name && <div className="text-gray-800 flex items-center gap-1"><User size={12}/> {r.contact_person_name}</div>}
                    {r.contact_person_phone && <div className="text-xs text-gray-600 flex items-center gap-1 mt-0.5"><Phone size={11}/> {r.contact_person_phone}</div>}
                    {r.contact_person_email && <div className="text-xs text-gray-600 flex items-center gap-1"><Mail size={11}/> {r.contact_person_email}</div>}
                  </td>
                  <td className="px-3 py-3 align-top text-gray-700">
                    {r.address && <div className="flex items-center gap-1"><MapPin size={12}/> {r.address}</div>}
                  </td>
                  <td className="px-3 py-3 text-right align-top">
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

      <SupplierModal open={modal.open} item={modal.item} onClose={() => setModal({ open: false })} />
    </div>
  )
}


function SupplierModal({ open, onClose, item }: { open: boolean; onClose: () => void; item?: any }) {
  const qc = useQueryClient()
  const editing = !!item?.id
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    contact_person_name: '', contact_person_phone: '', contact_person_email: '',
    address: '', description: '',
  })

  useEffect(() => {
    if (!open) return
    setForm({
      name                 : item?.name ?? '',
      phone                : item?.phone ?? '',
      email                : item?.email ?? '',
      contact_person_name  : item?.contact_person_name ?? '',
      contact_person_phone : item?.contact_person_phone ?? '',
      contact_person_email : item?.contact_person_email ?? '',
      address              : item?.address ?? '',
      description          : item?.description ?? '',
    })
  }, [open, item])

  const save = useMutation({
    mutationFn: (payload: any) => editing
      ? invSetupApi.updateSupplier(item.id, payload)
      : invSetupApi.addSupplier(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv-suppliers'] })
      onClose()
    },
  })

  if (!open) return null

  const clean = (s: string) => s.trim() || null

  return (
    <Modal title={editing ? 'Edit Item Supplier' : 'Add Item Supplier'} onClose={onClose} wide>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!form.name.trim()) return
        save.mutate({
          name                 : form.name.trim(),
          phone                : clean(form.phone),
          email                : clean(form.email),
          contact_person_name  : clean(form.contact_person_name),
          contact_person_phone : clean(form.contact_person_phone),
          contact_person_email : clean(form.contact_person_email),
          address              : clean(form.address),
          description          : clean(form.description),
        })
      }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" required>
            <input required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="input w-full"/>
          </Field>
          <Field label="Phone">
            <input value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="input w-full"/>
          </Field>
          <Field label="Email">
            <input type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="input w-full"/>
          </Field>
          <Field label="Contact Person Name">
            <input value={form.contact_person_name}
              onChange={e => setForm({ ...form, contact_person_name: e.target.value })}
              className="input w-full"/>
          </Field>
        </div>
        <Field label="Address">
          <textarea rows={2} value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            className="input w-full"/>
        </Field>
        <Field label="Contact Person Phone">
          <input value={form.contact_person_phone}
            onChange={e => setForm({ ...form, contact_person_phone: e.target.value })}
            className="input w-full"/>
        </Field>
        <Field label="Contact Person Email">
          <input type="email" value={form.contact_person_email}
            onChange={e => setForm({ ...form, contact_person_email: e.target.value })}
            className="input w-full"/>
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


// ── Shared ──────────────────────────────────────────────
function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-12">
      <div className={cn(
        'bg-white rounded-lg shadow-xl max-w-[92vw] max-h-[88vh] overflow-y-auto',
        wide ? 'w-[640px]' : 'w-[520px]'
      )}>
        <div className="flex items-center justify-between px-5 py-3 bg-emerald-600 text-white rounded-t-lg sticky top-0">
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
