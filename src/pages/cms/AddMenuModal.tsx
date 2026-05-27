// src/pages/cms/AddMenuModal.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { cmsApi } from '@/api/cms'

type Props = {
  open: boolean
  onClose: () => void
  group?: any
}


export default function AddMenuModal({ open, onClose, group }: Props) {
  const qc = useQueryClient()
  const editing = !!group?.id

  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => {
    if (open) {
      setForm({
        name       : group?.name ?? '',
        description: group?.description ?? '',
      })
    }
  }, [open, group])

  const save = useMutation({
    mutationFn: (payload: any) =>
      editing ? cmsApi.updateMenu(group.id, payload) : cmsApi.addMenu(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-menus'] })
      onClose()
    },
  })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    save.mutate({
      name       : form.name.trim(),
      description: form.description || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-20 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-[480px] max-w-[92vw]">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-slate-700 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">{editing ? 'Edit Menu' : 'Add Menu'}</h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Menu <span className="text-red-500">*</span>
            </label>
            <input
              type="text" required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input w-full" rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button type="submit" disabled={save.isPending} className="btn btn-primary">
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
