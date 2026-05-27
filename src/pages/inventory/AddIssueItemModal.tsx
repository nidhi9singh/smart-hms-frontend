// src/pages/inventory/AddIssueItemModal.tsx
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { inventoryApi } from '@/api/inventory'

type Props = {
  open: boolean
  onClose: () => void
}

const USER_TYPES = ['Doctor', 'Nurse', 'Pharmacist', 'Receptionist', 'Accountant', 'Admin', 'Other']

export default function AddIssueItemModal({ open, onClose }: Props) {
  const qc = useQueryClient()

  const [form, setForm] = useState({
    user_type    : '',
    issued_to    : '',
    item_master_id: '',
    item_id      : '',
    quantity     : 1,
    issue_date   : new Date().toISOString().slice(0, 10),
    return_date  : '',
    department   : '',
    note         : '',
  })

  const { data: itemsData }  = useQuery({ queryKey: ['inv-items-master'], queryFn: () => inventoryApi.listItems({ per_page: 500 }).then(r => r.data), enabled: open })
  const { data: stocksData } = useQuery({ queryKey: ['inv-stocks-all'],   queryFn: () => inventoryApi.listStocks({ per_page: 500 }).then(r => r.data),  enabled: open })

  const items: any[]  = itemsData?.data  ?? []
  const stocks: any[] = stocksData?.data ?? []

  useEffect(() => {
    if (open) {
      setForm({
        user_type    : '',
        issued_to    : '',
        item_master_id: '',
        item_id      : '',
        quantity     : 1,
        issue_date   : new Date().toISOString().slice(0, 10),
        return_date  : '',
        department   : '',
        note         : '',
      })
    }
  }, [open])

  // When item master is picked, auto-pick the most recent matching stock batch
  useEffect(() => {
    if (!form.item_master_id) return
    const matching = stocks.filter(s => String(s.item_id) === form.item_master_id)
    if (matching.length) {
      setForm(f => ({ ...f, item_id: String(matching[0].id) }))
    }
  }, [form.item_master_id, stocks])

  const selectedItem = useMemo(
    () => items.find(i => String(i.id) === form.item_master_id),
    [items, form.item_master_id]
  )
  const availableQty = selectedItem?.available_qty ?? 0

  const save = useMutation({
    mutationFn: (payload: any) => inventoryApi.issueItem(payload),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['inv-issues'] })
      qc.invalidateQueries({ queryKey: ['inv-stocks'] })
      qc.invalidateQueries({ queryKey: ['inv-items'] })
      onClose()
    },
  })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.item_id || !form.quantity) return
    save.mutate({
      item_id       : Number(form.item_id),
      item_master_id: form.item_master_id ? Number(form.item_master_id) : null,
      quantity      : Number(form.quantity),
      user_type     : form.user_type || null,
      issued_to     : form.issued_to || null,
      department    : form.department || null,
      issue_date    : form.issue_date || null,
      return_date   : form.return_date || null,
      note          : form.note || null,
      status        : 'Issued',
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-[680px] max-w-[94vw]">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-base font-semibold text-gray-800">Issue Item</h2>
          <button onClick={onClose}><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">User Type</label>
              <select
                value={form.user_type}
                onChange={e => setForm({ ...form, user_type: e.target.value })}
                className="input w-full"
              >
                <option value="">Select</option>
                {USER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Issue To <span className="text-red-500">*</span>
              </label>
              <input
                type="text" required value={form.issued_to}
                onChange={e => setForm({ ...form, issued_to: e.target.value })}
                className="input w-full" placeholder="Recipient name"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Item <span className="text-red-500">*</span>
              </label>
              <select
                required value={form.item_master_id}
                onChange={e => setForm({ ...form, item_master_id: e.target.value })}
                className="input w-full"
              >
                <option value="">Select</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
              {form.item_master_id && (
                <p className="text-xs text-gray-500 mt-1">
                  Available Quantity: <span className="font-semibold text-gray-700">{availableQty}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number" required min={1}
                value={form.quantity}
                onChange={e => setForm({ ...form, quantity: Number(e.target.value || 0) })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
              <input
                type="text" value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Issue Date</label>
              <input
                type="date" value={form.issue_date}
                onChange={e => setForm({ ...form, issue_date: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Return Date</label>
              <input
                type="date" value={form.return_date}
                onChange={e => setForm({ ...form, return_date: e.target.value })}
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
            <textarea
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              className="input w-full" rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button
              type="submit"
              disabled={save.isPending || !form.item_id || !form.quantity}
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
