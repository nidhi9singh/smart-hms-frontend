// src/pages/setup/charges/SimpleAddModal.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'

type ExtraField = {
  key: string
  label: string
  type?: 'text' | 'number' | 'select'
  required?: boolean
  options?: { value: any; label: string }[]
}

type Props = {
  open: boolean
  onClose: () => void
  title: string
  /** Field for the primary name input. */
  nameLabel?: string
  /** Optional extra fields like percentage, charge_type_id, description. */
  extraFields?: ExtraField[]
  /** Existing entity to edit (id required). */
  entity?: any
  /** API funcs */
  onSave: (payload: any) => Promise<any>
  onUpdate?: (id: number, payload: any) => Promise<any>
  invalidateKey: string[]
}


export default function SimpleAddModal({
  open, onClose, title, nameLabel = 'Name',
  extraFields = [], entity, onSave, onUpdate, invalidateKey,
}: Props) {
  const qc = useQueryClient()
  const editing = !!entity?.id
  const [form, setForm] = useState<Record<string, any>>({ name: '' })

  useEffect(() => {
    if (!open) return
    if (editing) {
      const initial: Record<string, any> = { name: entity.name ?? '' }
      extraFields.forEach(f => { initial[f.key] = entity[f.key] ?? '' })
      setForm(initial)
    } else {
      const initial: Record<string, any> = { name: '' }
      extraFields.forEach(f => { initial[f.key] = '' })
      setForm(initial)
    }
  }, [open, editing, entity, extraFields])

  const save = useMutation({
    mutationFn: (payload: any) =>
      editing && onUpdate ? onUpdate(entity.id, payload) : onSave(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey })
      onClose()
    },
  })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload: any = { name: form.name.trim() }
    extraFields.forEach(f => {
      const v = form[f.key]
      if (v === '' || v == null) return
      if (f.type === 'number') payload[f.key] = Number(v)
      else if (f.type === 'select') payload[f.key] = isNaN(Number(v)) ? v : Number(v)
      else payload[f.key] = v
    })
    save.mutate(payload)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-w-[92vw]">
        <div className="flex items-center justify-between px-5 py-3 bg-brand-600 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">{editing ? `Edit ${title}` : `Add ${title}`}</h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {nameLabel} <span className="text-red-500">*</span>
            </label>
            <input required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="input w-full"/>
          </div>
          {extraFields.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {f.label}{f.required && <span className="text-red-500"> *</span>}
              </label>
              {f.type === 'select' ? (
                <select value={form[f.key] ?? ''}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="input w-full" required={f.required}>
                  <option value="">Select</option>
                  {(f.options ?? []).map(o => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input type={f.type === 'number' ? 'number' : 'text'}
                  step={f.type === 'number' ? '0.01' : undefined}
                  value={form[f.key] ?? ''}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="input w-full" required={f.required}/>
              )}
            </div>
          ))}
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
