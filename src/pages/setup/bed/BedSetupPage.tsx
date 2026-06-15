// src/pages/setup/bed/BedSetupPage.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, Check, X } from 'lucide-react'
import { bedSetupApi } from '@/api/bedSetup'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

type Tab = 'status' | 'bed' | 'type' | 'group' | 'floor'

const ALL_TABS: Array<{ id: Tab; label: string }> = [
  { id: 'status', label: 'Bed Status' },
  { id: 'bed',    label: 'Bed' },
  { id: 'type',   label: 'Bed Type' },
  { id: 'group',  label: 'Bed Group' },
  { id: 'floor',  label: 'Floor' },
]


export default function BedSetupPage() {
  const role = useAuthStore(s => s.user?.role)
  // Nurses get a read-only Bed Status + Bed view only.
  const TABS = role === 'nurse'
    ? ALL_TABS.filter(t => t.id === 'status' || t.id === 'bed')
    : ALL_TABS
  const [tab, setTab] = useState<Tab>('status')
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
          {tab === 'status' && <BedStatusTab />}
          {tab === 'bed'    && <BedTab />}
          {tab === 'type'   && <BedTypeTab />}
          {tab === 'group'  && <BedGroupTab />}
          {tab === 'floor'  && <FloorTab />}
        </section>
      </div>
    </div>
  )
}


// ───────────────────────────────────────────────────────────────────
//  Bed Status (read-only)
// ───────────────────────────────────────────────────────────────────
function BedStatusTab() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['bed-status', search],
    queryFn:  () => bedSetupApi.bedStatus(search ? { search } : undefined).then(r => r.data),
  })
  const items: any[] = data?.data ?? []

  return (
    <div className="card">
      <div className="px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Bed Status</h2>
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
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Bed Type</th>
              <th className="px-3 py-2">Bed Group</th>
              <th className="px-3 py-2">Floor</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              : items.length === 0
                ? <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No beds</td></tr>
                : items.map(r => {
                  const free = r.status === 'Available'
                  return (
                    <tr key={r.id}
                      className={cn('border-t', free ? 'bg-brand-50' : 'bg-rose-50')}>
                      <td className={cn('px-3 py-2 font-medium', free ? 'text-brand-800' : 'text-rose-800')}>{r.name}</td>
                      <td className="px-3 py-2 text-gray-700">{r.bed_type || '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{r.bed_group || '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{r.floor || '—'}</td>
                      <td className={cn('px-3 py-2 font-medium', free ? 'text-brand-700' : 'text-rose-700')}>
                        {r.status}{r.patient_name ? ` (${r.patient_name})` : ''}
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}


// ───────────────────────────────────────────────────────────────────
//  Bed
// ───────────────────────────────────────────────────────────────────
function BedTab() {
  const qc = useQueryClient()
  const role = useAuthStore(s => s.user?.role)
  const canManageBeds = role !== 'nurse'
  const [search, setSearch] = useState('')
  const [edit, setEdit] = useState<{ open: boolean; bed?: any }>({ open: false })

  const { data } = useQuery({
    queryKey: ['beds-list', search],
    queryFn:  () => bedSetupApi.listBeds(search ? { search } : undefined).then(r => r.data),
  })
  const items: any[] = data?.data ?? []

  const del = useMutation({
    mutationFn: (id: number) => bedSetupApi.deleteBed(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beds-list'] })
      qc.invalidateQueries({ queryKey: ['bed-status'] })
    },
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Bed List</h2>
        {canManageBeds && (
          <button onClick={() => setEdit({ open: true })} className="btn btn-primary flex items-center gap-1.5">
            <Plus size={14}/> Add Bed
          </button>
        )}
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
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Bed Type</th>
              <th className="px-3 py-2">Bed Group</th>
              <th className="px-3 py-2 text-center">Used</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No beds</td></tr>
              : items.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-brand-700">{r.bed_no}</td>
                  <td className="px-3 py-2 text-gray-700">{r.bed_type || '—'}</td>
                  <td className="px-3 py-2 text-gray-700">{r.bed_group}{r.floor ? ` - ${r.floor}` : ''}</td>
                  <td className="px-3 py-2 text-center">
                    {!r.not_available ? <Check size={14} className="inline text-brand-600"/> : <X size={14} className="inline text-gray-400"/>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canManageBeds && (
                        <>
                          <button onClick={() => setEdit({ open: true, bed: r })}
                            className="p-1 hover:bg-brand-50 rounded text-brand-600"><Edit2 size={14}/></button>
                          <button onClick={() => { if (confirm('Delete this bed?')) del.mutate(r.id) }}
                            className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
      <AddBedModal
        open={edit.open}
        bed={edit.bed}
        onClose={() => setEdit({ open: false })}
      />
    </div>
  )
}


function AddBedModal({ open, onClose, bed }: { open: boolean; onClose: () => void; bed?: any }) {
  const qc = useQueryClient()
  const editing = !!bed?.id

  const [form, setForm] = useState({
    bed_no: '', bed_type_id: '', bed_group_id: '', not_available: false,
  })

  const { data: typesData } = useQuery({
    queryKey: ['bs-types'], queryFn: () => bedSetupApi.listBedTypes().then(r => r.data), enabled: open,
  })
  const { data: groupsData } = useQuery({
    queryKey: ['bs-groups'], queryFn: () => bedSetupApi.listBedGroups().then(r => r.data), enabled: open,
  })
  const types: any[]  = typesData?.data ?? []
  const groups: any[] = groupsData?.data ?? []

  useEffect(() => {
    if (open) {
      setForm({
        bed_no       : bed?.bed_no ?? '',
        bed_type_id  : bed?.bed_type_id ? String(bed.bed_type_id) : '',
        bed_group_id : bed?.bed_group_id ? String(bed.bed_group_id) : '',
        not_available: !!bed?.not_available,
      })
    }
  }, [open, bed])

  const save = useMutation({
    mutationFn: (p: any) => editing
      ? bedSetupApi.updateBed(bed.id, p)
      : bedSetupApi.addBed(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beds-list'] })
      qc.invalidateQueries({ queryKey: ['bed-status'] })
      onClose()
    },
  })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.bed_no.trim() || !form.bed_type_id || !form.bed_group_id) return
    save.mutate({
      bed_no       : form.bed_no.trim(),
      bed_type_id  : Number(form.bed_type_id),
      bed_group_id : Number(form.bed_group_id),
      not_available: form.not_available,
    })
  }

  return (
    <Modal title={editing ? 'Edit Bed' : 'Add Bed'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" required>
          <input required value={form.bed_no}
            onChange={e => setForm({ ...form, bed_no: e.target.value })}
            className="input w-full"/>
        </Field>
        <Field label="Bed Type" required>
          <select required value={form.bed_type_id}
            onChange={e => setForm({ ...form, bed_type_id: e.target.value })}
            className="input w-full">
            <option value="">Select</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Bed Group" required>
          <select required value={form.bed_group_id}
            onChange={e => setForm({ ...form, bed_group_id: e.target.value })}
            className="input w-full">
            <option value="">Select</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}{g.floor ? ` - ${g.floor}` : ''}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.not_available}
            onChange={e => setForm({ ...form, not_available: e.target.checked })}
            className="rounded"/>
          Not available for use
        </label>
        <SaveRow pending={save.isPending} />
      </form>
    </Modal>
  )
}


// ───────────────────────────────────────────────────────────────────
//  Bed Type
// ───────────────────────────────────────────────────────────────────
function BedTypeTab() {
  const qc = useQueryClient()
  const [edit, setEdit] = useState<{ open: boolean; entity?: any }>({ open: false })
  const { data } = useQuery({
    queryKey: ['bs-types'],
    queryFn: () => bedSetupApi.listBedTypes().then(r => r.data),
  })
  const items: any[] = data?.data ?? []

  const del = useMutation({
    mutationFn: (id: number) => bedSetupApi.deleteBedType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bs-types'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Bed Type List</h2>
        <button onClick={() => setEdit({ open: true })} className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Bed Type
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Purpose</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={2} className="px-3 py-6 text-center text-gray-400">No types</td></tr>
            : items.map(t => (
              <tr key={t.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-brand-700">{t.name}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEdit({ open: true, entity: t })}
                      className="p-1 hover:bg-brand-50 rounded text-brand-600"><Edit2 size={14}/></button>
                    <button onClick={() => { if (confirm('Delete?')) del.mutate(t.id) }}
                      className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
      <p className="text-xs text-gray-400 px-5 py-2">Records: 1 to {items.length} of {items.length}</p>

      <NameOnlyModal
        open={edit.open}
        title="Bed Type"
        entity={edit.entity}
        onClose={() => setEdit({ open: false })}
        onSave={(p) => bedSetupApi.addBedType(p)}
        onUpdate={(id, p) => bedSetupApi.updateBedType(id, p)}
        invalidateKey={['bs-types']}
      />
    </div>
  )
}


// ───────────────────────────────────────────────────────────────────
//  Bed Group
// ───────────────────────────────────────────────────────────────────
function BedGroupTab() {
  const qc = useQueryClient()
  const [edit, setEdit] = useState<{ open: boolean; entity?: any }>({ open: false })
  const { data } = useQuery({
    queryKey: ['bs-groups'],
    queryFn: () => bedSetupApi.listBedGroups().then(r => r.data),
  })
  const items: any[] = data?.data ?? []

  const del = useMutation({
    mutationFn: (id: number) => bedSetupApi.deleteBedGroup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bs-groups'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Bed Group List</h2>
        <button onClick={() => setEdit({ open: true })} className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Bed Group
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Floor</th>
            <th className="px-3 py-2">Description</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">No groups</td></tr>
            : items.map(g => (
              <tr key={g.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-brand-700">{g.name}</td>
                <td className="px-3 py-2 text-gray-700">{g.floor || '—'}</td>
                <td className="px-3 py-2 text-gray-600 max-w-2xl truncate" title={g.description}>{g.description || '—'}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEdit({ open: true, entity: g })}
                      className="p-1 hover:bg-brand-50 rounded text-brand-600"><Edit2 size={14}/></button>
                    <button onClick={() => { if (confirm('Delete?')) del.mutate(g.id) }}
                      className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>

      <BedGroupModal
        open={edit.open}
        entity={edit.entity}
        onClose={() => setEdit({ open: false })}
      />
    </div>
  )
}


function BedGroupModal({ open, onClose, entity }: { open: boolean; onClose: () => void; entity?: any }) {
  const qc = useQueryClient()
  const editing = !!entity?.id
  const [form, setForm] = useState({ name: '', floor_id: '', color: '#cccccc', description: '' })

  const { data: floorsData } = useQuery({
    queryKey: ['bs-floors'], queryFn: () => bedSetupApi.listFloors().then(r => r.data), enabled: open,
  })
  const floors: any[] = floorsData?.data ?? []

  useEffect(() => {
    if (open) {
      setForm({
        name        : entity?.name ?? '',
        floor_id    : entity?.floor_id ? String(entity.floor_id) : '',
        color       : entity?.color ?? '#cccccc',
        description : entity?.description ?? '',
      })
    }
  }, [open, entity])

  const save = useMutation({
    mutationFn: (p: any) => editing
      ? bedSetupApi.updateBedGroup(entity.id, p)
      : bedSetupApi.addBedGroup(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bs-groups'] })
      onClose()
    },
  })

  if (!open) return null

  return (
    <Modal title={editing ? 'Edit Bed Group' : 'Add Bed Group'} onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!form.name.trim() || !form.floor_id) return
        save.mutate({
          name: form.name.trim(),
          floor_id: Number(form.floor_id),
          color: form.color || null,
          description: form.description || null,
        })
      }} className="space-y-4">
        <Field label="Name" required>
          <input required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="input w-full"/>
        </Field>
        <Field label="Floor" required>
          <select required value={form.floor_id}
            onChange={e => setForm({ ...form, floor_id: e.target.value })}
            className="input w-full">
            <option value="">Select</option>
            {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </Field>
        <Field label="Color">
          <input type="color" value={form.color}
            onChange={e => setForm({ ...form, color: e.target.value })}
            className="h-9 w-full border rounded cursor-pointer"/>
        </Field>
        <Field label="Description">
          <textarea value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="input w-full" rows={3}/>
        </Field>
        <SaveRow pending={save.isPending} />
      </form>
    </Modal>
  )
}


// ───────────────────────────────────────────────────────────────────
//  Floor
// ───────────────────────────────────────────────────────────────────
function FloorTab() {
  const qc = useQueryClient()
  const [edit, setEdit] = useState<{ open: boolean; entity?: any }>({ open: false })
  const { data } = useQuery({
    queryKey: ['bs-floors'],
    queryFn: () => bedSetupApi.listFloors().then(r => r.data),
  })
  const items: any[] = data?.data ?? []

  const del = useMutation({
    mutationFn: (id: number) => bedSetupApi.deleteFloor(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bs-floors'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Floor List</h2>
        <button onClick={() => setEdit({ open: true })} className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Floor
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Description</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">No floors</td></tr>
            : items.map(f => (
              <tr key={f.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-brand-700">{f.name}</td>
                <td className="px-3 py-2 text-gray-600 max-w-3xl truncate" title={f.description}>{f.description || '—'}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEdit({ open: true, entity: f })}
                      className="p-1 hover:bg-brand-50 rounded text-brand-600"><Edit2 size={14}/></button>
                    <button onClick={() => { if (confirm('Delete?')) del.mutate(f.id) }}
                      className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>

      <NameOnlyModal
        open={edit.open}
        title="Floor"
        entity={edit.entity}
        onClose={() => setEdit({ open: false })}
        onSave={(p) => bedSetupApi.addFloor(p)}
        onUpdate={(id, p) => bedSetupApi.updateFloor(id, p)}
        invalidateKey={['bs-floors']}
        withDescription
      />
    </div>
  )
}


// ───────────────────────────────────────────────────────────────────
//  Shared helpers / modals
// ───────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-xl w-[440px] max-w-[92vw]">
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


function NameOnlyModal({
  open, onClose, title, entity, onSave, onUpdate, invalidateKey, withDescription,
}: {
  open: boolean; onClose: () => void; title: string
  entity?: any
  onSave: (p: any) => Promise<any>
  onUpdate: (id: number, p: any) => Promise<any>
  invalidateKey: string[]
  withDescription?: boolean
}) {
  const qc = useQueryClient()
  const editing = !!entity?.id
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open) {
      setName(entity?.name ?? '')
      setDescription(entity?.description ?? '')
    }
  }, [open, entity])

  const save = useMutation({
    mutationFn: (p: any) => editing ? onUpdate(entity.id, p) : onSave(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey })
      onClose()
    },
  })

  if (!open) return null

  return (
    <Modal title={editing ? `Edit ${title}` : `Add ${title}`} onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        const payload: any = { name: name.trim() }
        if (withDescription) payload.description = description || null
        save.mutate(payload)
      }} className="space-y-4">
        <Field label="Name" required>
          <input required value={name}
            onChange={e => setName(e.target.value)}
            className="input w-full"/>
        </Field>
        {withDescription && (
          <Field label="Description">
            <textarea value={description}
              onChange={e => setDescription(e.target.value)}
              className="input w-full" rows={3}/>
          </Field>
        )}
        <SaveRow pending={save.isPending} />
      </form>
    </Modal>
  )
}
