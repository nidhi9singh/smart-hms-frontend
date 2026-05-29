// src/pages/setup/appointment/AppointmentSetupPage.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'
import { apptSetupApi } from '@/api/appointmentSetup'
import { cn } from '@/lib/utils'

type Tab = 'slots' | 'doctor-shift' | 'shift' | 'priority'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'slots',        label: 'Slots' },
  { id: 'doctor-shift', label: 'Doctor Shift' },
  { id: 'shift',        label: 'Shift' },
  { id: 'priority',     label: 'Appointment Priority' },
]


export default function AppointmentSetupPage() {
  const [tab, setTab] = useState<Tab>('slots')

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
          {tab === 'slots'        && <SlotsTab />}
          {tab === 'doctor-shift' && <DoctorShiftTab />}
          {tab === 'shift'        && <ShiftTab />}
          {tab === 'priority'     && <PriorityTab />}
        </section>
      </div>
    </div>
  )
}


// ═════════════════════════════════════════════════════════════════
//  Slots tab
// ═════════════════════════════════════════════════════════════════
function SlotsTab() {
  const qc = useQueryClient()
  const [doctorId, setDoctorId] = useState('')
  const [shiftId, setShiftId]   = useState('')
  const [searched, setSearched] = useState(false)
  const [form, setForm] = useState({
    consultation_duration_minutes: '',
    charge_category_id: '',
    charge_id: '',
    amount: '',
  })

  const { data: doctorsData } = useQuery({
    queryKey: ['appt-doctors'],
    queryFn:  () => apptSetupApi.listDoctors().then(r => r.data),
  })
  const doctors: any[] = doctorsData?.data ?? []

  const { data: shiftsData } = useQuery({
    queryKey: ['appt-shifts'],
    queryFn:  () => apptSetupApi.listShifts().then(r => r.data),
  })
  const shifts: any[] = shiftsData?.data ?? []

  const { data: catsData } = useQuery({
    queryKey: ['appt-charge-cats'],
    queryFn:  () => apptSetupApi.listChargeCategories().then(r => r.data),
  })
  const cats: any[] = catsData?.data ?? []

  const { data: chargesData } = useQuery({
    queryKey: ['appt-charges', form.charge_category_id],
    queryFn:  () => apptSetupApi.listCharges(form.charge_category_id ? Number(form.charge_category_id) : undefined).then(r => r.data),
    enabled:  searched,
  })
  const charges: any[] = chargesData?.data ?? []

  const search = async () => {
    if (!doctorId || !shiftId) return
    setSearched(true)
    const r = await apptSetupApi.getSlot(Number(doctorId), Number(shiftId)).then(x => x.data)
    const d = r.data
    if (d) {
      setForm({
        consultation_duration_minutes: d.consultation_duration_minutes != null ? String(d.consultation_duration_minutes) : '',
        charge_category_id           : d.charge_category_id != null ? String(d.charge_category_id) : '',
        charge_id                    : d.charge_id != null ? String(d.charge_id) : '',
        amount                       : d.amount != null ? String(d.amount) : '',
      })
    } else {
      setForm({ consultation_duration_minutes: '', charge_category_id: '', charge_id: '', amount: '' })
    }
  }

  const save = useMutation({
    mutationFn: (payload: any) => apptSetupApi.saveSlot(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['appt-doctors'] }),
  })

  const onChargeChange = (id: string) => {
    const c = charges.find(x => String(x.id) === id)
    setForm(f => ({ ...f, charge_id: id, amount: c ? String(c.amount) : f.amount }))
  }

  const onSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctorId || !shiftId) return
    save.mutate({
      doctor_id                     : Number(doctorId),
      shift_id                      : Number(shiftId),
      consultation_duration_minutes : form.consultation_duration_minutes ? Number(form.consultation_duration_minutes) : null,
      charge_category_id            : form.charge_category_id ? Number(form.charge_category_id) : null,
      charge_id                     : form.charge_id ? Number(form.charge_id) : null,
      amount                        : form.amount ? Number(form.amount) : 0,
    })
  }

  return (
    <div className="card">
      <div className="px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Slots</h2>
      </div>

      {/* Search row */}
      <form onSubmit={(e) => { e.preventDefault(); search() }}
            className="p-5 border-b grid grid-cols-12 gap-4 items-end">
        <Field className="col-span-4" label="Doctor" required>
          <select required value={doctorId} onChange={e => { setDoctorId(e.target.value); setSearched(false) }}
                  className="input w-full">
            <option value="">Select</option>
            {doctors.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </Field>
        <Field className="col-span-4" label="Shift" required>
          <select required value={shiftId} onChange={e => { setShiftId(e.target.value); setSearched(false) }}
                  className="input w-full">
            <option value="">Select</option>
            {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <div className="col-span-2">
          <button type="submit" className="btn btn-primary w-full">Search</button>
        </div>
      </form>

      {/* Config row (visible after search) */}
      {searched && (
        <form onSubmit={onSave} className="p-5 grid grid-cols-12 gap-4 items-end">
          <Field className="col-span-3" label="Consultation Duration Minutes" required>
            <input type="number" min="1" required value={form.consultation_duration_minutes}
              onChange={e => setForm({ ...form, consultation_duration_minutes: e.target.value })}
              className="input w-full"/>
          </Field>
          <Field className="col-span-3" label="Charge Category">
            <select value={form.charge_category_id}
              onChange={e => setForm({ ...form, charge_category_id: e.target.value, charge_id: '', amount: '' })}
              className="input w-full">
              <option value="">Select</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Charge" required>
            <select required value={form.charge_id}
              onChange={e => onChargeChange(e.target.value)}
              className="input w-full">
              <option value="">Select</option>
              {charges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Amount (₹)">
            <input value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              className="input w-full bg-gray-50" readOnly/>
          </Field>
          <div className="col-span-12 flex justify-end pt-3 border-t">
            <button type="submit" disabled={save.isPending} className="btn btn-primary">
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
          {save.isSuccess && (
            <p className="col-span-12 text-xs text-emerald-700">Slot configuration saved.</p>
          )}
        </form>
      )}
    </div>
  )
}


// ═════════════════════════════════════════════════════════════════
//  Doctor Shift tab — matrix
// ═════════════════════════════════════════════════════════════════
function DoctorShiftTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['appt-doctor-shifts'],
    queryFn:  () => apptSetupApi.listDoctorShifts().then(r => r.data),
  })
  const shifts: any[]  = data?.data?.shifts ?? []
  const doctors: any[] = data?.data?.doctors ?? []
  const filtered = search
    ? doctors.filter(d => (d.label || '').toLowerCase().includes(search.toLowerCase()))
    : doctors

  const save = useMutation({
    mutationFn: ({ doctorId, shiftIds }: { doctorId: number; shiftIds: number[] }) =>
      apptSetupApi.updateDoctorShifts(doctorId, shiftIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appt-doctor-shifts'] }),
  })

  const toggle = (d: any, shiftId: number, checked: boolean) => {
    const current: number[] = Object.entries(d.shifts || {})
      .filter(([, v]) => v).map(([k]) => Number(k))
    const next = checked ? Array.from(new Set([...current, shiftId])) : current.filter(x => x !== shiftId)
    save.mutate({ doctorId: d.id, shiftIds: next })
  }

  return (
    <div className="card">
      <div className="px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Doctor Shift</h2>
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
            <th className="px-3 py-2">Doctor Name</th>
            {shifts.map(s => <th key={s.id} className="px-3 py-2">{s.name}</th>)}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? <tr><td colSpan={1 + shifts.length} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
            : filtered.length === 0
              ? <tr><td colSpan={1 + shifts.length} className="px-3 py-6 text-center text-gray-400">No doctors</td></tr>
              : filtered.map(d => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-emerald-700">{d.label}</td>
                  {shifts.map(s => (
                    <td key={s.id} className="px-3 py-2">
                      <input type="checkbox" className="w-4 h-4 accent-emerald-600 cursor-pointer"
                        checked={!!d.shifts?.[String(s.id)]}
                        onChange={e => toggle(d, s.id, e.target.checked)}/>
                    </td>
                  ))}
                </tr>
              ))
          }
        </tbody>
      </table>
      <p className="text-xs text-gray-400 px-5 py-2">Records: 1 to {filtered.length} of {doctors.length}</p>
    </div>
  )
}


// ═════════════════════════════════════════════════════════════════
//  Shift tab
// ═════════════════════════════════════════════════════════════════
function ShiftTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['appt-shifts'],
    queryFn:  () => apptSetupApi.listShifts().then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()))
    : items

  const del = useMutation({
    mutationFn: (id: number) => apptSetupApi.deleteShift(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['appt-shifts'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Shift</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Shift
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
            <th className="px-3 py-2">Time From</th>
            <th className="px-3 py-2">Time To</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
            : filtered.length === 0
              ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">No shifts</td></tr>
              : filtered.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-emerald-700">{r.name}</td>
                  <td className="px-3 py-2 text-gray-700">{r.time_from}</td>
                  <td className="px-3 py-2 text-gray-700">{r.time_to}</td>
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

      <ShiftModal open={modal.open} item={modal.item} onClose={() => setModal({ open: false })} />
    </div>
  )
}


function ShiftModal({ open, onClose, item }: { open: boolean; onClose: () => void; item?: any }) {
  const qc = useQueryClient()
  const editing = !!item?.id
  const [form, setForm] = useState({ name: '', time_from: '', time_to: '' })

  useEffect(() => {
    if (!open) return
    setForm({
      name      : item?.name ?? '',
      time_from : item?.time_from ?? '',
      time_to   : item?.time_to ?? '',
    })
  }, [open, item])

  const save = useMutation({
    mutationFn: (payload: any) => editing
      ? apptSetupApi.updateShift(item.id, payload)
      : apptSetupApi.addShift(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appt-shifts'] })
      onClose()
    },
  })

  if (!open) return null

  return (
    <Modal title={editing ? 'Edit Shift' : 'Add Shift'} onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!form.name.trim() || !form.time_from || !form.time_to) return
        save.mutate({
          name      : form.name.trim(),
          time_from : form.time_from,
          time_to   : form.time_to,
        })
      }} className="space-y-4">
        <Field label="Name" required>
          <input required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="input w-full"/>
        </Field>
        <Field label="Time From" required>
          <input required placeholder="10:00 AM" value={form.time_from}
            onChange={e => setForm({ ...form, time_from: e.target.value })}
            className="input w-full"/>
        </Field>
        <Field label="Time To" required>
          <input required placeholder="12:30 PM" value={form.time_to}
            onChange={e => setForm({ ...form, time_to: e.target.value })}
            className="input w-full"/>
        </Field>
        <div className="flex justify-end pt-2 border-t">
          <button type="submit" disabled={save.isPending} className="btn btn-primary">
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}


// ═════════════════════════════════════════════════════════════════
//  Appointment Priority tab (batch-add)
// ═════════════════════════════════════════════════════════════════
function PriorityTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['appt-priorities'],
    queryFn:  () => apptSetupApi.listPriorities().then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()))
    : items

  const del = useMutation({
    mutationFn: (id: number) => apptSetupApi.deletePriority(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['appt-priorities'] }),
    onError:    (e: any) => alert(e?.response?.data?.detail || 'Cannot delete'),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Appointment Priority List</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Priority
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
            <th className="px-3 py-2">Priority</th>
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
                      {!r.is_system && (
                        <button onClick={() => { if (confirm('Delete?')) del.mutate(r.id) }}
                          className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
          }
        </tbody>
      </table>
      <p className="text-xs text-gray-400 px-5 py-2">Records: 1 to {filtered.length} of {items.length}</p>

      <PriorityModal open={modal.open} item={modal.item} onClose={() => setModal({ open: false })} />
    </div>
  )
}


function PriorityModal({ open, onClose, item }: { open: boolean; onClose: () => void; item?: any }) {
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
      if (editing) return apptSetupApi.updatePriority(item.id, cleaned[0] ?? {})
      return apptSetupApi.addPriorities(cleaned)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appt-priorities'] })
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
    <Modal title={editing ? 'Edit Priority' : 'Add Priority'} onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!rows.some(r => r.name.trim())) return
        save.mutate()
      }} className="space-y-3">
        <div className="text-xs font-medium text-gray-600">
          Priority <span className="text-red-500">*</span>
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

function Field({ label, required, children, className }: {
  label: string; required?: boolean; children: React.ReactNode; className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}
