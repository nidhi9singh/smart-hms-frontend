// src/pages/inventory/InventoryPage.tsx
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Edit2, Trash2, Package, ArrowDownToLine, Send } from 'lucide-react'
import { inventoryApi } from '@/api/inventory'
import AddItemModal       from './AddItemModal'
import AddItemStockModal  from './AddItemStockModal'
import AddIssueItemModal  from './AddIssueItemModal'
import { cn } from '@/lib/utils'

type Tab = 'stocks' | 'issues' | 'items'

export default function InventoryPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('stocks')
  const [search, setSearch] = useState('')
  const [stockModal, setStockModal] = useState(false)
  const [issueModal, setIssueModal] = useState(false)
  const [itemModal, setItemModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: ['inv-stocks', search],
    queryFn:  () => inventoryApi.listStocks({ search, per_page: 200 }).then(r => r.data),
    enabled:  tab === 'stocks',
  })
  const { data: issuesData, isLoading: issuesLoading } = useQuery({
    queryKey: ['inv-issues'],
    queryFn:  () => inventoryApi.listIssues({ per_page: 200 }).then(r => r.data),
    enabled:  tab === 'issues',
  })
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['inv-items', search],
    queryFn:  () => inventoryApi.listItems({ search, per_page: 200 }).then(r => r.data),
    enabled:  tab === 'items',
  })

  const stocks: any[] = stocksData?.data ?? []
  const issues: any[] = issuesData?.data ?? []
  const items: any[]  = itemsData?.data  ?? []

  const filteredIssues = useMemo(() => {
    if (!search) return issues
    const q = search.toLowerCase()
    return issues.filter(i =>
      (i.item_name      || '').toLowerCase().includes(q) ||
      (i.issued_to      || '').toLowerCase().includes(q) ||
      (i.user_type      || '').toLowerCase().includes(q) ||
      (i.staff_name     || '').toLowerCase().includes(q) ||
      (i.department     || '').toLowerCase().includes(q)
    )
  }, [issues, search])

  const delStock = useMutation({
    mutationFn: (id: number) => inventoryApi.deleteStock(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['inv-stocks'] }),
  })
  const delIssue = useMutation({
    mutationFn: (id: number) => inventoryApi.deleteIssue(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['inv-issues'] })
      qc.invalidateQueries({ queryKey: ['inv-stocks'] })
      qc.invalidateQueries({ queryKey: ['inv-items'] })
    },
  })
  const delItem = useMutation({
    mutationFn: (id: number) => inventoryApi.deleteItem(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['inv-items'] }),
  })
  const returnMut = useMutation({
    mutationFn: (id: number) => inventoryApi.returnIssue(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['inv-issues'] })
      qc.invalidateQueries({ queryKey: ['inv-stocks'] })
      qc.invalidateQueries({ queryKey: ['inv-items'] })
    },
  })

  const totalStockQty = stocks.reduce((s, x) => s + Number(x.total_quantity || 0), 0)
  const issuedCount   = issues.filter(i => i.status !== 'Returned').length

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">Item master, stock purchases and issues</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStockModal(true)} className="btn btn-primary flex items-center gap-1.5">
            <Plus size={14}/> Add Item Stock
          </button>
          <button onClick={() => setIssueModal(true)} className="btn btn-outline flex items-center gap-1.5">
            <Send size={14}/> Issue Item
          </button>
          <button onClick={() => setItemModal({ open: true })} className="btn btn-outline flex items-center gap-1.5">
            <Package size={14}/> Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Items',     value: items.length,  color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Stock Entries',   value: stocks.length, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Available Units', value: totalStockQty, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Issued (open)',   value: issuedCount,   color: 'bg-amber-50 text-amber-700' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs', s.color)}>{s.value}</div>
            <span className="text-sm text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-200">
        <div className="flex">
          {[
            { id: 'stocks', label: 'Item Stock List' },
            { id: 'issues', label: 'Issue Item List' },
            { id: 'items',  label: 'Item List' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)}
              className={cn('px-4 py-2.5 text-sm border-b-2 -mb-px',
                tab === t.id ? 'border-emerald-600 text-emerald-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="input pl-8 w-64"
          />
        </div>
      </div>

      {tab === 'stocks' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-600">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Supplier</th>
                <th className="px-3 py-2">Store</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2 text-right">Quantity</th>
                <th className="px-3 py-2 text-right">Price</th>
                <th className="px-3 py-2">Generated By</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {stocksLoading ? (
                <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              ) : stocks.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">No stock entries</td></tr>
              ) : stocks.map(s => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-800">{s.name}</td>
                  <td className="px-3 py-2 text-gray-600">{s.category_name || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{s.supplier_name || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{s.store_name || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{s.date || '—'}</td>
                  <td className="px-3 py-2 text-right">{s.total_quantity}</td>
                  <td className="px-3 py-2 text-right">{Number(s.purchase_price || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-gray-600">{s.generated_by_name || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => { if (confirm('Delete this stock entry?')) delStock.mutate(s.id) }}
                      className="p-1 hover:bg-red-50 rounded text-red-600" title="Delete"
                    ><Trash2 size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'issues' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-600">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">User Type</th>
                <th className="px-3 py-2">Issue To</th>
                <th className="px-3 py-2 text-right">Quantity</th>
                <th className="px-3 py-2">Issue Date</th>
                <th className="px-3 py-2">Return Date</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Issued By</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {issuesLoading ? (
                <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              ) : filteredIssues.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">No issues</td></tr>
              ) : filteredIssues.map(i => {
                const returned = i.status === 'Returned'
                return (
                  <tr key={i.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800">{i.item_name || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{i.user_type || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{i.issued_to || i.staff_name || '—'}</td>
                    <td className="px-3 py-2 text-right">{i.quantity}</td>
                    <td className="px-3 py-2 text-gray-600">{i.issue_date || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{i.return_date || '—'}</td>
                    <td className="px-3 py-2">
                      {returned ? (
                        <span className="inline-block px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700">Returned</span>
                      ) : (
                        <button
                          onClick={() => returnMut.mutate(i.id)}
                          disabled={returnMut.isPending}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-800 hover:bg-amber-200"
                        >
                          <ArrowDownToLine size={11}/> Click To Return
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{i.issued_by_name || '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => { if (confirm('Delete this issue?')) delIssue.mutate(i.id) }}
                        className="p-1 hover:bg-red-50 rounded text-red-600" title="Delete"
                      ><Trash2 size={14}/></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'items' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-600">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2 text-right">Available Qty</th>
                <th className="px-3 py-2">Description</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {itemsLoading ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No items</td></tr>
              ) : items.map(i => (
                <tr key={i.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-800">{i.name}</td>
                  <td className="px-3 py-2 text-gray-600">{i.category_name || '—'}</td>
                  <td className="px-3 py-2 text-gray-600">{i.unit || '—'}</td>
                  <td className="px-3 py-2 text-right">{i.available_qty}</td>
                  <td className="px-3 py-2 text-gray-600 max-w-xs truncate">{i.description || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setItemModal({ open: true, item: i })}
                        className="p-1 hover:bg-emerald-50 rounded text-emerald-600" title="Edit"
                      ><Edit2 size={14}/></button>
                      <button
                        onClick={() => { if (confirm('Delete this item?')) delItem.mutate(i.id) }}
                        className="p-1 hover:bg-red-50 rounded text-red-600" title="Delete"
                      ><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddItemStockModal open={stockModal} onClose={() => setStockModal(false)} />
      <AddIssueItemModal open={issueModal} onClose={() => setIssueModal(false)} />
      <AddItemModal
        open={itemModal.open}
        item={itemModal.item}
        onClose={() => setItemModal({ open: false })}
      />
    </div>
  )
}
