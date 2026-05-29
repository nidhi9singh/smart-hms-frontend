// src/pages/setup/finance/FinanceSetupPage.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'
import { financeSetupApi, type HeadItem } from '@/api/financeSetup'
import { cn } from '@/lib/utils'

type Tab = 'income' | 'expense'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'income',  label: 'Income Head' },
  { id: 'expense', label: 'Expense Head' },
]


export default function FinanceSetupPage() {
  const [tab, setTab] = useState<Tab>('income')

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
          {tab === 'income'  && <IncomeTab />}
          {tab === 'expense' && <ExpenseTab />}
        </section>
      </div>
    </div>
  )
}


function IncomeTab() {
  return <HeadTab
    listTitle="Income Head List"
    singular="Income Head"
    columnHeader="Income Head"
    listFn={() => financeSetupApi.listIncomeHeads().then(r => r.data)}
    addFn={(items) => financeSetupApi.addIncomeHeads(items)}
    updateFn={(id, d) => financeSetupApi.updateIncomeHead(id, d)}
    deleteFn={(id) => financeSetupApi.deleteIncomeHead(id)}
    queryKey={['fin-income-heads']}
  />
}

function ExpenseTab() {
  return <HeadTab
    listTitle="Expense Head List"
    singular="Expense Head"
    columnHeader="Expense Head"
    listFn={() => financeSetupApi.listExpenseHeads().then(r => r.data)}
    addFn={(items) => financeSetupApi.addExpenseHeads(items)}
    updateFn={(id, d) => financeSetupApi.updateExpenseHead(id, d)}
    deleteFn={(id) => financeSetupApi.deleteExpenseHead(id)}
    queryKey={['fin-expense-heads']}
  />
}


function HeadTab({
  listTitle, singular, columnHeader, listFn, addFn, updateFn, deleteFn, queryKey,
}: {
  listTitle: string; singular: string; columnHeader: string
  listFn: () => Promise<any>
  addFn: (items: HeadItem[]) => Promise<any>
  updateFn: (id: number, d: any) => Promise<any>
  deleteFn: (id: number) => Promise<any>
  queryKey: string[]
}) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState<{ open: boolean; item?: any }>({ open: false })

  const { data, isLoading } = useQuery({ queryKey, queryFn: listFn })
  const items: any[] = data?.data ?? []
  const filtered = search
    ? items.filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()))
    : items

  const del = useMutation({
    mutationFn: (id: number) => deleteFn(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">{listTitle}</h2>
        <button onClick={() => setModal({ open: true })}
          className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add {singular}
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
            <th className="px-3 py-2">{columnHeader}</th>
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

      <HeadModal
        open={modal.open}
        item={modal.item}
        singular={singular}
        columnHeader={columnHeader}
        addFn={addFn}
        updateFn={updateFn}
        invalidateKey={queryKey}
        onClose={() => setModal({ open: false })}
      />
    </div>
  )
}


// Batch add modal with TWO columns per row (Name + Description)
function HeadModal({
  open, onClose, item, singular, columnHeader, addFn, updateFn, invalidateKey,
}: {
  open: boolean; onClose: () => void
  item?: any
  singular: string
  columnHeader: string
  addFn: (items: HeadItem[]) => Promise<any>
  updateFn: (id: number, d: any) => Promise<any>
  invalidateKey: string[]
}) {
  const qc = useQueryClient()
  const editing = !!item?.id
  const [rows, setRows] = useState<HeadItem[]>([{ name: '', description: '' }])

  useEffect(() => {
    if (!open) return
    if (editing) setRows([{ name: item.name ?? '', description: item.description ?? '' }])
    else         setRows([{ name: '', description: '' }])
  }, [open, editing, item])

  const save = useMutation({
    mutationFn: () => {
      const cleaned = rows
        .map(r => ({ name: (r.name || '').trim(), description: (r.description || '').trim() || null }))
        .filter(r => r.name)
      if (editing) return updateFn(item.id, cleaned[0] ?? {})
      return addFn(cleaned)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: invalidateKey })
      onClose()
    },
  })

  if (!open) return null

  const setRow = (i: number, patch: Partial<HeadItem>) =>
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  const addRow = () => setRows(rs => [...rs, { name: '', description: '' }])
  const removeRow = (i: number) => setRows(rs => rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs)
  const showBatch = !editing

  return (
    <Modal title={editing ? `Edit ${singular}` : `Add ${singular}`} onClose={onClose}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (!rows.some(r => (r.name || '').trim())) return
        save.mutate()
      }} className="space-y-3">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-xs font-medium text-gray-600">
          <div>{columnHeader} <span className="text-red-500">*</span></div>
          <div>Description</div>
          <div/>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-start">
            <input required={i === 0} value={r.name || ''}
              onChange={e => setRow(i, { name: e.target.value })}
              className="input"/>
            <input value={r.description || ''}
              onChange={e => setRow(i, { description: e.target.value })}
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
        <SaveRow pending={save.isPending} />
      </form>
    </Modal>
  )
}


// ── Shared ──────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-xl w-[640px] max-w-[92vw]">
        <div className="flex items-center justify-between px-5 py-3 bg-emerald-600 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="text-white"><X size={18}/></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
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
