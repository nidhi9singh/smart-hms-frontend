// src/pages/setup/referral/ReferralSetupPage.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'
import { referralSetupApi } from '@/api/referralSetup'
import { cn } from '@/lib/utils'

type Tab = 'commission' | 'category'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'commission', label: 'Referral Commission' },
  { id: 'category',   label: 'Referral Category' },
]

const MODULES = [
  { key: 'opd',        label: 'OPD' },
  { key: 'ipd',        label: 'IPD' },
  { key: 'pharmacy',   label: 'Pharmacy' },
  { key: 'pathology',  label: 'Pathology' },
  { key: 'radiology',  label: 'Radiology' },
  { key: 'blood_bank', label: 'Blood Bank' },
  { key: 'ambulance',  label: 'Ambulance' },
]


export default function ReferralSetupPage() {
  const [tab, setTab] = useState<Tab>('commission')

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
          {tab === 'commission' && <CommissionTab />}
          {tab === 'category'   && <CategoryTab />}
        </section>
      </div>
    </div>
  )
}


// ── Referral Commission ──────────────────────────────────
function CommissionTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['ref-comms'],
    queryFn:  () => referralSetupApi.listCommissions().then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r => (r.category || '').toLowerCase().includes(search.toLowerCase()))
    : items

  const del = useMutation({
    mutationFn: (id: number) => referralSetupApi.deleteCommission(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['ref-comms'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Referral Commission List</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Referral Commission
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
            <th className="px-3 py-2 w-1/3">Category</th>
            <th className="px-3 py-2">Module - Commission</th>
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
                  <td className="px-3 py-3 text-emerald-700 align-top">{r.category || '—'}</td>
                  <td className="px-3 py-3 align-top">
                    <ul className="text-emerald-700 space-y-0.5 leading-tight">
                      {(r.modules ?? MODULES.map(m => ({
                        label: m.label, value: r[`commission_${m.key}`] ?? 0,
                      }))).map((m: any) => (
                        <li key={m.label}>{m.label} - {m.value ?? 0}%</li>
                      ))}
                    </ul>
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

      <CommissionModal open={modal.open} item={modal.item} onClose={() => setModal({ open: false })} />
    </div>
  )
}


function CommissionModal({ open, onClose, item }: { open: boolean; onClose: () => void; item?: any }) {
  const qc = useQueryClient()
  const editing = !!item?.id

  const [form, setForm] = useState({
    category_id         : '',
    standard_commission : '',
    commission_opd        : '',
    commission_ipd        : '',
    commission_pharmacy   : '',
    commission_pathology  : '',
    commission_radiology  : '',
    commission_blood_bank : '',
    commission_ambulance  : '',
  })

  const { data: catsData } = useQuery({
    queryKey: ['ref-cats'],
    queryFn:  () => referralSetupApi.listCategories().then(r => r.data),
    enabled:  open,
  })
  const cats: any[] = catsData?.data ?? []

  useEffect(() => {
    if (!open) return
    setForm({
      category_id           : item?.category_id ? String(item.category_id) : '',
      standard_commission   : item?.standard_commission != null ? String(item.standard_commission) : '',
      commission_opd        : item?.commission_opd        != null ? String(item.commission_opd) : '',
      commission_ipd        : item?.commission_ipd        != null ? String(item.commission_ipd) : '',
      commission_pharmacy   : item?.commission_pharmacy   != null ? String(item.commission_pharmacy) : '',
      commission_pathology  : item?.commission_pathology  != null ? String(item.commission_pathology) : '',
      commission_radiology  : item?.commission_radiology  != null ? String(item.commission_radiology) : '',
      commission_blood_bank : item?.commission_blood_bank != null ? String(item.commission_blood_bank) : '',
      commission_ambulance  : item?.commission_ambulance  != null ? String(item.commission_ambulance) : '',
    })
  }, [open, item])

  const save = useMutation({
    mutationFn: (payload: any) => editing
      ? referralSetupApi.updateCommission(item.id, payload)
      : referralSetupApi.addCommission(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ref-comms'] })
      onClose()
    },
  })

  const applyToAll = () => {
    const std = form.standard_commission.trim()
    if (!std) return
    setForm(f => ({
      ...f,
      commission_opd        : std,
      commission_ipd        : std,
      commission_pharmacy   : std,
      commission_pathology  : std,
      commission_radiology  : std,
      commission_blood_bank : std,
      commission_ambulance  : std,
    }))
  }

  const toNum = (s: string) => {
    const n = parseFloat(s)
    return isNaN(n) ? 0 : n
  }

  if (!open) return null

  return (
    <Modal title={editing ? 'Edit Commission' : 'Add Commission'} onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!form.category_id) return
        save.mutate({
          category_id           : Number(form.category_id),
          standard_commission   : toNum(form.standard_commission),
          commission_opd        : toNum(form.commission_opd),
          commission_ipd        : toNum(form.commission_ipd),
          commission_pharmacy   : toNum(form.commission_pharmacy),
          commission_pathology  : toNum(form.commission_pathology),
          commission_radiology  : toNum(form.commission_radiology),
          commission_blood_bank : toNum(form.commission_blood_bank),
          commission_ambulance  : toNum(form.commission_ambulance),
        })
      }} className="space-y-4">
        <Field label="Category" required>
          <select required value={form.category_id}
            disabled={editing}
            onChange={e => setForm({ ...form, category_id: e.target.value })}
            className="input w-full">
            <option value="">Select Category</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Standard Commission (%)">
          <input type="number" step="0.01" min="0" max="100"
            value={form.standard_commission}
            onChange={e => setForm({ ...form, standard_commission: e.target.value })}
            className="input w-full"/>
        </Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-600">
              Commission for Modules <span className="text-red-500">*</span>
            </label>
            <button type="button" onClick={applyToAll}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-800 text-white text-xs rounded">
              Apply To All
            </button>
          </div>
          <div className="space-y-1.5">
            {MODULES.map(m => {
              const fieldKey = `commission_${m.key}` as keyof typeof form
              return (
                <div key={m.key} className="grid grid-cols-[140px_1fr] items-center gap-3 border-b border-gray-100 pb-1.5">
                  <span className="text-sm text-gray-700">{m.label}</span>
                  <input type="number" step="0.01" min="0" max="100"
                    value={form[fieldKey]}
                    onChange={e => setForm({ ...form, [fieldKey]: e.target.value })}
                    className="border-0 border-b border-gray-200 px-1 py-1 text-sm w-full focus:outline-none focus:border-emerald-500"/>
                </div>
              )
            })}
          </div>
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


// ── Referral Category (batch-add) ────────────────────────
function CategoryTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['ref-cats'],
    queryFn:  () => referralSetupApi.listCategories().then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()))
    : items

  const del = useMutation({
    mutationFn: (id: number) => referralSetupApi.deleteCategory(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['ref-cats'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Referral Category List</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Referral Category
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
  const [rows, setRows] = useState<Array<{ name: string }>>([{ name: '' }])

  useEffect(() => {
    if (!open) return
    if (editing) setRows([{ name: item.name ?? '' }])
    else         setRows([{ name: '' }])
  }, [open, editing, item])

  const save = useMutation({
    mutationFn: () => {
      const cleaned = rows.map(r => ({ name: r.name.trim() })).filter(r => r.name)
      if (editing) return referralSetupApi.updateCategory(item.id, cleaned[0] ?? {})
      return referralSetupApi.addCategories(cleaned)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ref-cats'] })
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
    <Modal title={editing ? 'Edit Category' : 'Add Category'} onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!rows.some(r => r.name.trim())) return
        save.mutate()
      }} className="space-y-3">
        <div className="text-xs font-medium text-gray-600">
          Name <span className="text-red-500">*</span>
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
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm flex items-center gap-1.5">
            <Plus size={14}/> Add
          </button>
        )}
        <div className="flex justify-end pt-2 border-t">
          <button type="submit" disabled={save.isPending} className="btn btn-primary">
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}


// ── Shared ──────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-w-[92vw] max-h-[90vh] overflow-y-auto">
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
