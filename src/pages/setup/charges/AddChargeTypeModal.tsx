// src/pages/setup/charges/AddChargeTypeModal.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { chargesApi } from '@/api/hospitalCharges'

type Props = {
  open: boolean
  onClose: () => void
  entity?: any
}


export default function AddChargeTypeModal({ open, onClose, entity }: Props) {
  const qc = useQueryClient()
  const editing = !!entity?.id

  const [name, setName] = useState('')
  const [modules, setModules] = useState<string[]>([])

  const { data: colsData } = useQuery({
    queryKey: ['ch-type-cols'],
    queryFn:  () => chargesApi.typeColumns().then(r => r.data),
    enabled:  open,
  })
  const cols: string[] = colsData?.data ?? []

  useEffect(() => {
    if (!open) return
    if (editing) {
      setName(entity.name ?? '')
      setModules(Array.isArray(entity.modules) ? entity.modules : [])
    } else {
      setName('')
      setModules([])
    }
  }, [open, editing, entity])

  const save = useMutation({
    mutationFn: (payload: any) =>
      editing ? chargesApi.updateType(entity.id, payload) : chargesApi.addType(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ch-types'] })
      onClose()
    },
  })

  if (!open) return null

  const toggle = (m: string) =>
    setModules(s => s.includes(m) ? s.filter(x => x !== m) : [...s, m])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    save.mutate({ name: name.trim(), modules })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-xl w-[520px] max-w-[92vw]">
        <div className="flex items-center justify-between px-5 py-3 bg-emerald-600 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">{editing ? 'Edit Charge Type' : 'Add Charge Type'}</h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Charge Type <span className="text-red-500">*</span>
            </label>
            <input required value={name} onChange={e => setName(e.target.value)}
              className="input w-full"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Module <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1 border rounded p-2 bg-gray-50">
              {cols.length === 0
                ? <p className="text-xs text-gray-400">Loading…</p>
                : cols.map(c => (
                  <label key={c} className="flex items-center gap-2 px-2 py-1 hover:bg-white rounded text-sm cursor-pointer">
                    <input type="checkbox"
                      checked={modules.includes(c)}
                      onChange={() => toggle(c)}
                      className="rounded"/>
                    <span>{c}</span>
                  </label>
                ))}
            </div>
          </div>
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
