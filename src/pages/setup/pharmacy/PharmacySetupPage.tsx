// src/pages/setup/pharmacy/PharmacySetupPage.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'
import { pharmSetupApi, type NameKey } from '@/api/pharmacySetup'
import { cn } from '@/lib/utils'

type Tab = 'category' | 'supplier' | 'dosage' | 'interval' | 'duration' | 'unit' | 'company' | 'group'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'category', label: 'Medicine Category' },
  { id: 'supplier', label: 'Supplier' },
  { id: 'dosage',   label: 'Medicine Dosage' },
  { id: 'interval', label: 'Dose Interval' },
  { id: 'duration', label: 'Dose Duration' },
  { id: 'unit',     label: 'Unit' },
  { id: 'company',  label: 'Company' },
  { id: 'group',    label: 'Medicine Group' },
]


export default function PharmacySetupPage() {
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
          {tab === 'category' && <NameOnlyTab apiKey="categories" listTitle="Medicine Category List" singular="Medicine Category" columnHeader="Category Name" batch={false} />}
          {tab === 'company'  && <NameOnlyTab apiKey="companies"  listTitle="Company List"           singular="Company"           columnHeader="Company Name"   batch={true}  showId />}
          {tab === 'group'    && <NameOnlyTab apiKey="groups"     listTitle="Medicine Group List"    singular="Medicine Group"    columnHeader="Medicine Group" batch={true}  showId />}
          {tab === 'unit'     && <NameOnlyTab apiKey="units"      listTitle="Unit List"              singular="Unit"              columnHeader="Unit Name"      batch={true}  showId />}
          {tab === 'interval' && <NameOnlyTab apiKey="intervals"  listTitle="Dosage Interval List"   singular="Dosage Interval"   columnHeader="Name"           batch={true}  fieldLabel="Interval" />}
          {tab === 'duration' && <NameOnlyTab apiKey="durations"  listTitle="Dosage Duration List"   singular="Dosage Duration"   columnHeader="Name"           batch={true}  fieldLabel="Duration" />}
          {tab === 'supplier' && <SupplierTab />}
          {tab === 'dosage'   && <DosageTab />}
        </section>
      </div>
    </div>
  )
}


// ───────────────────────────────────────────────────────────────────
//  Generic name-only tab (Category / Company / Group / Unit / Interval / Duration)
// ───────────────────────────────────────────────────────────────────
function NameOnlyTab({
  apiKey, listTitle, singular, columnHeader, batch, showId, fieldLabel,
}: {
  apiKey: NameKey
  listTitle: string
  singular: string
  columnHeader: string
  batch: boolean
  showId?: boolean
  fieldLabel?: string
}) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['ph-setup', apiKey],
    queryFn:  () => pharmSetupApi.list(apiKey).then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()))
    : items

  const del = useMutation({
    mutationFn: (id: number) => pharmSetupApi.delete(apiKey, id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['ph-setup', apiKey] }),
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
            {showId && <th className="px-3 py-2 w-32">Database ID</th>}
            <th className="px-3 py-2">{columnHeader}</th>
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
                  {showId && <td className="px-3 py-2 text-emerald-700">{r.id}</td>}
                  <td className="px-3 py-2 text-emerald-700">{r.name}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal({ open: true, item: r })}
                        className="p-1 hover:bg-emerald-50 rounded text-emerald-600"><Edit2 size={14}/></button>
                      <button onClick={() => { if (confirm('Delete this record?')) del.mutate(r.id) }}
                        className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))
          }
        </tbody>
      </table>
      <p className="text-xs text-gray-400 px-5 py-2">Records: 1 to {filtered.length} of {items.length}</p>

      <NameOnlyModal
        open={modal.open}
        item={modal.item}
        apiKey={apiKey}
        singular={singular}
        fieldLabel={fieldLabel || columnHeader}
        batch={batch}
        onClose={() => setModal({ open: false })}
      />
    </div>
  )
}


function NameOnlyModal({
  open, onClose, item, apiKey, singular, fieldLabel, batch,
}: {
  open: boolean; onClose: () => void
  item?: any
  apiKey: NameKey
  singular: string
  fieldLabel: string
  batch: boolean
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
      if (editing) {
        return pharmSetupApi.update(apiKey, item.id, cleaned[0] ?? {})
      }
      return pharmSetupApi.add(apiKey, cleaned)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ph-setup', apiKey] })
      onClose()
    },
  })

  if (!open) return null

  const setRow = (i: number, name: string) =>
    setRows(rs => rs.map((r, idx) => idx === i ? { name } : r))
  const addRow = () => setRows(rs => [...rs, { name: '' }])
  const removeRow = (i: number) => setRows(rs => rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs)
  const showBatch = batch && !editing

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
                className={cn('p-1.5 rounded',
                  rows.length === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:bg-red-50')}
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


// ───────────────────────────────────────────────────────────────────
//  Supplier tab
// ───────────────────────────────────────────────────────────────────
function SupplierTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['ph-suppliers'],
    queryFn:  () => pharmSetupApi.listSuppliers().then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r =>
        ['name','phone','contact_person_name','contact_person_phone','drug_license_number','address']
          .some(k => (r[k] || '').toLowerCase().includes(search.toLowerCase())))
    : items

  const del = useMutation({
    mutationFn: (id: number) => pharmSetupApi.deleteSupplier(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['ph-suppliers'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Supplier List</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Supplier
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
              <th className="px-3 py-2">Supplier Name</th>
              <th className="px-3 py-2">Supplier Contact</th>
              <th className="px-3 py-2">Contact Person Name</th>
              <th className="px-3 py-2">Contact Person Phone</th>
              <th className="px-3 py-2">Drug License Number</th>
              <th className="px-3 py-2">Address</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              : filtered.length === 0
                ? <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">No suppliers</td></tr>
                : filtered.map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800">{r.name}</td>
                    <td className="px-3 py-2 text-gray-600">{r.phone || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{r.contact_person_name || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{r.contact_person_phone || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{r.drug_license_number || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{r.address || '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal({ open: true, item: r })}
                          className="p-1 hover:bg-emerald-50 rounded text-emerald-600"><Edit2 size={14}/></button>
                        <button onClick={() => { if (confirm('Delete this supplier?')) del.mutate(r.id) }}
                          className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      <SupplierModal open={modal.open} item={modal.item} onClose={() => setModal({ open: false })} />
    </div>
  )
}


function SupplierModal({ open, onClose, item }: { open: boolean; onClose: () => void; item?: any }) {
  const qc = useQueryClient()
  const editing = !!item?.id
  const [form, setForm] = useState({
    name: '', phone: '', contact_person_name: '', contact_person_phone: '',
    drug_license_number: '', address: '',
  })

  useEffect(() => {
    if (!open) return
    setForm({
      name                 : item?.name ?? '',
      phone                : item?.phone ?? '',
      contact_person_name  : item?.contact_person_name ?? '',
      contact_person_phone : item?.contact_person_phone ?? '',
      drug_license_number  : item?.drug_license_number ?? '',
      address              : item?.address ?? '',
    })
  }, [open, item])

  const save = useMutation({
    mutationFn: (p: any) => editing
      ? pharmSetupApi.updateSupplier(item.id, p)
      : pharmSetupApi.addSupplier(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ph-suppliers'] })
      onClose()
    },
  })

  if (!open) return null

  return (
    <Modal title={editing ? 'Edit Supplier' : 'Add Supplier'} onClose={onClose} wide>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!form.name.trim()) return
        save.mutate({
          name                 : form.name.trim(),
          phone                : form.phone || null,
          contact_person_name  : form.contact_person_name || null,
          contact_person_phone : form.contact_person_phone || null,
          drug_license_number  : form.drug_license_number || null,
          address              : form.address || null,
        })
      }} className="grid grid-cols-2 gap-4">
        <Field label="Supplier Name" required>
          <input required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="input w-full"/>
        </Field>
        <Field label="Supplier Contact">
          <input value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="input w-full"/>
        </Field>
        <Field label="Contact Person Name">
          <input value={form.contact_person_name}
            onChange={e => setForm({ ...form, contact_person_name: e.target.value })}
            className="input w-full"/>
        </Field>
        <Field label="Contact Person Phone">
          <input value={form.contact_person_phone}
            onChange={e => setForm({ ...form, contact_person_phone: e.target.value })}
            className="input w-full"/>
        </Field>
        <Field label="Drug License Number">
          <input value={form.drug_license_number}
            onChange={e => setForm({ ...form, drug_license_number: e.target.value })}
            className="input w-full"/>
        </Field>
        <Field label="Address">
          <input value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            className="input w-full"/>
        </Field>
        <div className="col-span-2"><SaveRow pending={save.isPending} /></div>
      </form>
    </Modal>
  )
}


// ───────────────────────────────────────────────────────────────────
//  Medicine Dosage tab
// ───────────────────────────────────────────────────────────────────
function DosageTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['ph-dosages'],
    queryFn:  () => pharmSetupApi.listDosages().then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r =>
        ['category','dosage','unit'].some(k => (r[k] || '').toLowerCase().includes(search.toLowerCase())))
    : items

  const del = useMutation({
    mutationFn: (id: number) => pharmSetupApi.deleteDosage(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['ph-dosages'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Medicine Dosage List</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Medicine Dosage
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
            <th className="px-3 py-2">Category Name</th>
            <th className="px-3 py-2">Dosage</th>
            <th className="px-3 py-2">Unit</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
            : filtered.length === 0
              ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">No dosages</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-emerald-700">{r.category || '—'}</td>
                  <td className="px-3 py-2 text-emerald-700">{r.dosage}</td>
                  <td className="px-3 py-2 text-gray-700">{r.unit || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal({ open: true, item: r })}
                        className="p-1 hover:bg-emerald-50 rounded text-emerald-600"><Edit2 size={14}/></button>
                      <button onClick={() => { if (confirm('Delete this dosage?')) del.mutate(r.id) }}
                        className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))
          }
        </tbody>
      </table>
      <p className="text-xs text-gray-400 px-5 py-2">Records: 1 to {filtered.length} of {items.length}</p>

      <DosageModal open={modal.open} item={modal.item} onClose={() => setModal({ open: false })} />
    </div>
  )
}


function DosageModal({ open, onClose, item }: { open: boolean; onClose: () => void; item?: any }) {
  const qc = useQueryClient()
  const editing = !!item?.id

  const { data: catsData } = useQuery({
    queryKey: ['ph-setup', 'categories'],
    queryFn:  () => pharmSetupApi.list('categories').then(r => r.data),
    enabled:  open,
  })
  const { data: unitsData } = useQuery({
    queryKey: ['ph-setup', 'units'],
    queryFn:  () => pharmSetupApi.list('units').then(r => r.data),
    enabled:  open,
  })
  const cats:  any[] = catsData?.data ?? []
  const units: any[] = unitsData?.data ?? []

  const [categoryId, setCategoryId] = useState('')
  const [rows, setRows] = useState<Array<{ dosage: string; unit_id: string }>>([
    { dosage: '', unit_id: '' },
  ])

  useEffect(() => {
    if (!open) return
    if (editing) {
      setCategoryId(item.category_id ? String(item.category_id) : '')
      setRows([{
        dosage : item.dosage ?? '',
        unit_id: item.unit_id ? String(item.unit_id) : '',
      }])
    } else {
      setCategoryId('')
      setRows([{ dosage: '', unit_id: '' }])
    }
  }, [open, editing, item])

  const save = useMutation({
    mutationFn: () => {
      if (editing) {
        const r = rows[0]
        return pharmSetupApi.updateDosage(item.id, {
          category_id: categoryId ? Number(categoryId) : null,
          unit_id    : r.unit_id ? Number(r.unit_id) : null,
          dosage     : r.dosage.trim(),
        })
      }
      const cleaned = rows
        .filter(r => r.dosage.trim() && r.unit_id && categoryId)
        .map(r => ({
          category_id: Number(categoryId),
          unit_id    : Number(r.unit_id),
          dosage     : r.dosage.trim(),
        }))
      return pharmSetupApi.addDosages(cleaned)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ph-dosages'] })
      onClose()
    },
  })

  if (!open) return null

  const setRow = (i: number, patch: Partial<{ dosage: string; unit_id: string }>) =>
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  const addRow = () => setRows(rs => [...rs, { dosage: '', unit_id: '' }])
  const removeRow = (i: number) => setRows(rs => rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs)

  return (
    <Modal title={editing ? 'Edit Medicine Dosage' : 'Add Medicine Dosage'} onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!categoryId || !rows.some(r => r.dosage.trim() && r.unit_id)) return
        save.mutate()
      }} className="space-y-4">
        <Field label="Medicine Category" required>
          <select required value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="input w-full">
            <option value="">Select</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-xs font-medium text-gray-600">
          <div>Dosage <span className="text-red-500">*</span></div>
          <div>Unit <span className="text-red-500">*</span></div>
          <div></div>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-start">
            <input required={i === 0} value={r.dosage}
              onChange={e => setRow(i, { dosage: e.target.value })}
              className="input"/>
            <select required={i === 0} value={r.unit_id}
              onChange={e => setRow(i, { unit_id: e.target.value })}
              className="input">
              <option value="">Select</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <button type="button"
              onClick={() => removeRow(i)}
              disabled={rows.length === 1 || editing}
              className={cn('p-1.5 rounded',
                (rows.length === 1 || editing)
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-red-500 hover:bg-red-50')}
              title="Remove">
              <X size={16}/>
            </button>
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
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className={cn('bg-white rounded-lg shadow-xl max-w-[94vw]', wide ? 'w-[720px]' : 'w-[520px]')}>
        <div className="flex items-center justify-between px-5 py-3 bg-emerald-600 text-white rounded-t-lg">
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
