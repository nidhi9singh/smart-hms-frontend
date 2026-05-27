// src/pages/inventory/AddItemStockModal.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Minus, Plus } from 'lucide-react'
import { inventoryApi } from '@/api/inventory'

type Props = {
  open: boolean
  onClose: () => void
}

export default function AddItemStockModal({ open, onClose }: Props) {
  const qc = useQueryClient()

  const [form, setForm] = useState({
    item_id       : '',
    category_id   : '',
    supplier_id   : '',
    store_id      : '',
    date          : new Date().toISOString().slice(0, 10),
    description   : '',
    total_quantity: 1,
    purchase_price: '',
  })

  const { data: itemsData }    = useQuery({ queryKey: ['inv-items-master'], queryFn: () => inventoryApi.listItems({ per_page: 500 }).then(r => r.data), enabled: open })
  const { data: catsData }     = useQuery({ queryKey: ['inv-categories'], queryFn: () => inventoryApi.listCategories().then(r => r.data), enabled: open })
  const { data: supsData }     = useQuery({ queryKey: ['inv-suppliers'], queryFn: () => inventoryApi.listSuppliers().then(r => r.data), enabled: open })
  const { data: storesData }   = useQuery({ queryKey: ['inv-stores'], queryFn: () => inventoryApi.listStores().then(r => r.data), enabled: open })

  const items: any[]   = itemsData?.data  ?? []
  const cats: any[]    = catsData?.data   ?? []
  const sups: any[]    = supsData?.data   ?? []
  const stores: any[]  = storesData?.data ?? []

  useEffect(() => {
    if (open) {
      setForm({
        item_id       : '',
        category_id   : '',
        supplier_id   : '',
        store_id      : '',
        date          : new Date().toISOString().slice(0, 10),
        description   : '',
        total_quantity: 1,
        purchase_price: '',
      })
    }
  }, [open])

  // Auto-fill category when item is picked
  useEffect(() => {
    if (!form.item_id) return
    const it = items.find(i => String(i.id) === form.item_id)
    if (it && it.category_id) {
      setForm(f => ({ ...f, category_id: String(it.category_id) }))
    }
  }, [form.item_id, items])

  const save = useMutation({
    mutationFn: (payload: any) => inventoryApi.addStock(payload),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['inv-stocks'] })
      qc.invalidateQueries({ queryKey: ['inv-items'] })
      onClose()
    },
  })

  if (!open) return null

  const adjQty = (delta: number) =>
    setForm(f => ({ ...f, total_quantity: Math.max(0, (f.total_quantity || 0) + delta) }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const it = items.find(i => String(i.id) === form.item_id)
    if (!it) return
    save.mutate({
      item_id       : Number(form.item_id),
      name          : it.name,
      category_id   : form.category_id ? Number(form.category_id) : null,
      supplier_id   : form.supplier_id ? Number(form.supplier_id) : null,
      store_id      : form.store_id ? Number(form.store_id) : null,
      date          : form.date || null,
      description   : form.description || null,
      total_quantity: Number(form.total_quantity || 0),
      purchase_price: form.purchase_price === '' ? 0 : Number(form.purchase_price),
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-[680px] max-w-[94vw]">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-base font-semibold text-gray-800">Add Item Stock</h2>
          <button onClick={onClose}><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Item <span className="text-red-500">*</span>
              </label>
              <select
                required value={form.item_id}
                onChange={e => setForm({ ...form, item_id: e.target.value })}
                className="input w-full"
              >
                <option value="">Select</option>
                {items
                  .filter(i => !form.category_id || String(i.category_id) === form.category_id)
                  .map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Supplier</label>
              <select
                value={form.supplier_id}
                onChange={e => setForm({ ...form, supplier_id: e.target.value })}
                className="input w-full"
              >
                <option value="">Select</option>
                {sups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Store</label>
              <select
                value={form.store_id}
                onChange={e => setForm({ ...form, store_id: e.target.value })}
                className="input w-full"
              >
                <option value="">Select</option>
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input
                type="date" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <button
                  type="button" onClick={() => adjQty(-1)}
                  className="px-2 py-1.5 border rounded-l hover:bg-gray-50"
                >
                  <Minus size={14}/>
                </button>
                <input
                  type="number" min={0} value={form.total_quantity}
                  onChange={e => setForm({ ...form, total_quantity: Number(e.target.value || 0) })}
                  className="input rounded-none w-full text-center" required
                />
                <button
                  type="button" onClick={() => adjQty(1)}
                  className="px-2 py-1.5 border rounded-r hover:bg-gray-50"
                >
                  <Plus size={14}/>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Purchase Price
              </label>
              <input
                type="number" step="0.01" value={form.purchase_price}
                onChange={e => setForm({ ...form, purchase_price: e.target.value })}
                className="input w-full" placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input w-full" rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button
              type="submit" disabled={save.isPending || !form.item_id}
              className="btn btn-primary"
            >
              {save.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
