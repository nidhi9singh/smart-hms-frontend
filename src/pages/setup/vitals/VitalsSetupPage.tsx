// src/pages/setup/vitals/VitalsSetupPage.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, X } from 'lucide-react'
import { vitalsSetupApi } from '@/api/vitalsSetup'


export default function VitalsSetupPage() {
  return (
    <div className="p-6">
      <VitalsTab />
    </div>
  )
}


function VitalsTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['vitals'],
    queryFn:  () => vitalsSetupApi.listVitals().then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r =>
        ['name','reference_range','unit'].some(k => (r[k] || '').toLowerCase().includes(search.toLowerCase())))
    : items

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Vital List</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Vital
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
            <th className="px-3 py-2 w-1/4">Name</th>
            <th className="px-3 py-2 w-1/4">Reference Range</th>
            <th className="px-3 py-2">Unit</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
            : filtered.length === 0
              ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">No vitals</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-brand-700">{r.name}</td>
                  <td className="px-3 py-2 text-brand-700">{r.reference_range}</td>
                  <td className="px-3 py-2 text-brand-700">{r.unit || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => setModal({ open: true, item: r })}
                      className="p-1 hover:bg-brand-50 rounded text-brand-600"><Edit2 size={14}/></button>
                  </td>
                </tr>
              ))
          }
        </tbody>
      </table>
      <p className="text-xs text-gray-400 px-5 py-2">Records: 1 to {filtered.length} of {items.length}</p>

      <VitalModal open={modal.open} item={modal.item} onClose={() => setModal({ open: false })} />
    </div>
  )
}


function VitalModal({ open, onClose, item }: { open: boolean; onClose: () => void; item?: any }) {
  const qc = useQueryClient()
  const editing = !!item?.id

  const [form, setForm] = useState({
    name: '', reference_range_from: '', reference_range_to: '', unit: '',
  })

  useEffect(() => {
    if (!open) return
    setForm({
      name                 : item?.name ?? '',
      reference_range_from : item?.reference_range_from ?? '',
      reference_range_to   : item?.reference_range_to ?? '',
      unit                 : item?.unit ?? '',
    })
  }, [open, item])

  const save = useMutation({
    mutationFn: (payload: any) => editing
      ? vitalsSetupApi.updateVital(item.id, payload)
      : vitalsSetupApi.addVital(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vitals'] })
      onClose()
    },
  })

  if (!open) return null

  return (
    <Modal title={editing ? 'Edit Vital' : 'Add Vital'} onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!form.name.trim()) return
        save.mutate({
          name                 : form.name.trim(),
          reference_range_from : form.reference_range_from.trim() || null,
          reference_range_to   : form.reference_range_to.trim() || null,
          unit                 : form.unit.trim() || null,
        })
      }} className="space-y-4">
        <Field label="Vital Name" required>
          <input required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="input w-full"/>
        </Field>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Reference Range <span className="text-gray-400 font-normal">(IF vital is having single value rather than range then enter only from textbox value)</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="From" value={form.reference_range_from}
              onChange={e => setForm({ ...form, reference_range_from: e.target.value })}
              className="input w-full"/>
            <input placeholder="To" value={form.reference_range_to}
              onChange={e => setForm({ ...form, reference_range_to: e.target.value })}
              className="input w-full"/>
          </div>
        </div>
        <Field label="Unit">
          <input value={form.unit}
            onChange={e => setForm({ ...form, unit: e.target.value })}
            className="input w-full"/>
        </Field>
        <SaveRow pending={save.isPending} />
      </form>
    </Modal>
  )
}


// ── Shared ────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-xl w-[560px] max-w-[92vw]">
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
