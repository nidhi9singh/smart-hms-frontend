// src/pages/inventory/AddItemModal.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { inventoryApi } from '@/api/inventory'

type Props = {
  open: boolean
  onClose: () => void
  item?: any
}

export default function AddItemModal({ open, onClose, item }: Props) {
  const qc = useQueryClient()
  const editing = !!item?.id

  const [form, setForm] = useState({
    name: '', category_id: '', unit: '', description: '',
  })

  const { data: catsData } = useQuery({
    queryKey: ['inv-categories'],
    queryFn:  () => inventoryApi.listCategories().then(r => r.data),
    enabled:  open,
  })
  const cats: any[] = catsData?.data ?? []

  useEffect(() => {
    if (open) {
      setForm({
        name       : item?.name ?? '',
        category_id: item?.category_id ? String(item.category_id) : '',
        unit       : item?.unit ?? '',
        description: item?.description ?? '',
      })
    }
  }, [open, item])

  const save = useMutation({
    mutationFn: (payload: any) =>
      editing ? inventoryApi.updateItem(item.id, payload) : inventoryApi.addItem(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inv-items'] })
      onClose()
    },
  })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    save.mutate({
      name       : form.name.trim(),
      category_id: form.category_id ? Number(form.category_id) : null,
      unit       : form.unit || null,
      description: form.description || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-[520px] max-w-[92vw]">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-base font-semibold text-gray-800">
            {editing ? 'Edit Item' : 'Add Item'}
          </h2>
          <button onClick={onClose}><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Item <span className="text-red-500">*</span>
            </label>
            <input
              type="text" required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Item Category
              </label>
              <select
                value={form.category_id}
                onChange={e => setForm({ ...form, category_id: e.target.value })}
                className="input w-full"
              >
                <option value="">Select</option>
                {cats.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
              <input
                type="text" value={form.unit}
                onChange={e => setForm({ ...form, unit: e.target.value })}
                className="input w-full" placeholder="e.g. pcs, box"
              />
            </div>
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
              {save.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
