// src/pages/setup/charges/HospitalChargesPage.tsx
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { chargesApi } from '@/api/hospitalCharges'
import { cn } from '@/lib/utils'
import AddChargeModal      from './AddChargeModal'
import AddChargeTypeModal  from './AddChargeTypeModal'
import SimpleAddModal      from './SimpleAddModal'

type Tab = 'charges' | 'category' | 'type' | 'tax' | 'unit'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'charges',  label: 'Charges' },
  { id: 'category', label: 'Charge Category' },
  { id: 'type',     label: 'Charge Type' },
  { id: 'tax',      label: 'Tax Category' },
  { id: 'unit',     label: 'Unit Type' },
]


export default function HospitalChargesPage() {
  const [tab, setTab] = useState<Tab>('charges')

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
          {tab === 'charges'  && <ChargesTab />}
          {tab === 'category' && <ChargeCategoryTab />}
          {tab === 'type'     && <ChargeTypeTab />}
          {tab === 'tax'      && <TaxCategoryTab />}
          {tab === 'unit'     && <UnitTypeTab />}
        </section>
      </div>
    </div>
  )
}


// ───────────────────────────────────────────────────────────────────
//  Charges tab (main grid)
// ───────────────────────────────────────────────────────────────────
function ChargesTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [edit, setEdit] = useState<{ open: boolean; charge?: any }>({ open: false })

  const { data, isLoading } = useQuery({
    queryKey: ['ch-charges', search],
    queryFn:  () => chargesApi.listCharges({ search: search || undefined }).then(r => r.data),
  })
  const items: any[] = data?.data ?? []

  const del = useMutation({
    mutationFn: (id: number) => chargesApi.deleteCharge(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['ch-charges'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Charges Details List</h2>
        <button onClick={() => setEdit({ open: true })} className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Charges
        </button>
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
              <th className="px-3 py-2">Charge Category</th>
              <th className="px-3 py-2">Charge Type</th>
              <th className="px-3 py-2">Unit</th>
              <th className="px-3 py-2 text-right">Tax(%)</th>
              <th className="px-3 py-2 text-right">Standard Charge (₹)</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              : items.length === 0
                ? <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">No charges yet</td></tr>
                : items.map(c => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800">{c.name}</td>
                    <td className="px-3 py-2 text-gray-600">{c.charge_category || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{c.charge_type || '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{c.unit || '—'}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{Number(c.tax_percent).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{Number(c.standard_charge).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEdit({ open: true, charge: c })}
                          className="p-1 hover:bg-brand-50 rounded text-brand-600"><Edit2 size={14}/></button>
                        <button onClick={() => { if (confirm('Delete this charge?')) del.mutate(c.id) }}
                          className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 px-5 py-2">Records: {items.length}</p>

      <AddChargeModal
        open={edit.open}
        charge={edit.charge}
        onClose={() => setEdit({ open: false })}
      />
    </div>
  )
}


// ───────────────────────────────────────────────────────────────────
//  Charge Category tab
// ───────────────────────────────────────────────────────────────────
function ChargeCategoryTab() {
  const qc = useQueryClient()
  const [edit, setEdit] = useState<{ open: boolean; entity?: any }>({ open: false })

  const { data } = useQuery({
    queryKey: ['ch-cats-all'],
    queryFn:  () => chargesApi.listCategories().then(r => r.data),
  })
  const { data: typesData } = useQuery({
    queryKey: ['ch-types'],
    queryFn:  () => chargesApi.listTypes().then(r => r.data),
  })
  const items: any[] = data?.data ?? []
  const types: any[] = typesData?.data ?? []

  const del = useMutation({
    mutationFn: (id: number) => chargesApi.deleteCategory(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['ch-cats-all'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Charge Category</h2>
        <button onClick={() => setEdit({ open: true })} className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Charge Category
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Charge Type</th>
            <th className="px-3 py-2">Description</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">No categories</td></tr>
            : items.map(c => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{c.name}</td>
                <td className="px-3 py-2 text-gray-600">{c.charge_type || '—'}</td>
                <td className="px-3 py-2 text-gray-600 max-w-md truncate" title={c.description}>{c.description || '—'}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEdit({ open: true, entity: c })}
                      className="p-1 hover:bg-brand-50 rounded text-brand-600"><Edit2 size={14}/></button>
                    <button onClick={() => { if (confirm('Delete this category?')) del.mutate(c.id) }}
                      className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>

      <SimpleAddModal
        open={edit.open}
        onClose={() => setEdit({ open: false })}
        title="Charge Category"
        entity={edit.entity}
        extraFields={[
          { key: 'charge_type_id', label: 'Charge Type', type: 'select', required: true,
            options: types.map((t: any) => ({ value: t.id, label: t.name })) },
          { key: 'description', label: 'Description', required: true },
        ]}
        onSave={(p) => chargesApi.addCategory(p)}
        onUpdate={(id, p) => chargesApi.updateCategory(id, p)}
        invalidateKey={['ch-cats-all']}
      />
    </div>
  )
}


// ───────────────────────────────────────────────────────────────────
//  Charge Type tab (matrix view: rows = types, columns = modules)
// ───────────────────────────────────────────────────────────────────
function ChargeTypeTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [edit, setEdit] = useState<{ open: boolean; entity?: any }>({ open: false })

  const { data: typesData, isLoading } = useQuery({
    queryKey: ['ch-types'],
    queryFn:  () => chargesApi.listTypes().then(r => r.data),
  })
  const { data: colsData } = useQuery({
    queryKey: ['ch-type-cols'],
    queryFn:  () => chargesApi.typeColumns().then(r => r.data),
  })
  const items: any[]  = typesData?.data ?? []
  const cols:  string[] = colsData?.data ?? []

  const filtered = search
    ? items.filter(t => (t.name || '').toLowerCase().includes(search.toLowerCase()))
    : items

  const toggleModule = useMutation({
    mutationFn: ({ t, col }: { t: any; col: string }) => {
      const modules: string[] = Array.isArray(t.modules) ? [...t.modules] : []
      const i = modules.indexOf(col)
      if (i >= 0) modules.splice(i, 1)
      else modules.push(col)
      return chargesApi.updateType(t.id, { modules })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ch-types'] }),
  })

  const del = useMutation({
    mutationFn: (id: number) => chargesApi.deleteType(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['ch-types'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Charge Type List</h2>
        <button onClick={() => setEdit({ open: true })} className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Charge Type
        </button>
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
              <th className="px-3 py-2 sticky left-0 bg-gray-50">Charge Type</th>
              {cols.map(c => (
                <th key={c} className="px-3 py-2 text-center whitespace-nowrap">{c}</th>
              ))}
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={cols.length + 2} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
              : filtered.length === 0
                ? <tr><td colSpan={cols.length + 2} className="px-3 py-6 text-center text-gray-400">No types</td></tr>
                : filtered.map(t => {
                  const modules = new Set<string>(t.modules ?? [])
                  return (
                    <tr key={t.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium sticky left-0 bg-white">{t.name}</td>
                      {cols.map(c => (
                        <td key={c} className="px-3 py-2 text-center">
                          <input type="checkbox"
                            checked={modules.has(c)}
                            disabled={toggleModule.isPending}
                            onChange={() => toggleModule.mutate({ t, col: c })}
                            className="rounded cursor-pointer"/>
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setEdit({ open: true, entity: t })}
                            className="p-1 hover:bg-brand-50 rounded text-brand-600"><Edit2 size={14}/></button>
                          <button onClick={() => { if (confirm('Delete this type?')) del.mutate(t.id) }}
                            className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 px-5 py-2">Records: 1 to {filtered.length} of {items.length}</p>

      <AddChargeTypeModal
        open={edit.open}
        entity={edit.entity}
        onClose={() => setEdit({ open: false })}
      />
    </div>
  )
}


// ───────────────────────────────────────────────────────────────────
//  Tax Category tab
// ───────────────────────────────────────────────────────────────────
function TaxCategoryTab() {
  const qc = useQueryClient()
  const [edit, setEdit] = useState<{ open: boolean; entity?: any }>({ open: false })

  const { data } = useQuery({
    queryKey: ['ch-taxes'],
    queryFn:  () => chargesApi.listTaxCategories().then(r => r.data),
  })
  const items: any[] = data?.data ?? []

  const del = useMutation({
    mutationFn: (id: number) => chargesApi.deleteTaxCategory(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['ch-taxes'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Tax Category</h2>
        <button onClick={() => setEdit({ open: true })} className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Tax Category
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2 text-right">Percentage (%)</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-400">No tax categories</td></tr>
            : items.map(t => (
              <tr key={t.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{t.name}</td>
                <td className="px-3 py-2 text-right">{Number(t.percentage).toFixed(2)}</td>
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
      <SimpleAddModal
        open={edit.open}
        onClose={() => setEdit({ open: false })}
        title="Tax Category"
        entity={edit.entity}
        extraFields={[
          { key: 'percentage', label: 'Percentage (%)', type: 'number', required: true },
        ]}
        onSave={(p) => chargesApi.addTaxCategory(p)}
        onUpdate={(id, p) => chargesApi.updateTaxCategory(id, p)}
        invalidateKey={['ch-taxes']}
      />
    </div>
  )
}


// ───────────────────────────────────────────────────────────────────
//  Unit Type tab
// ───────────────────────────────────────────────────────────────────
function UnitTypeTab() {
  const qc = useQueryClient()
  const [edit, setEdit] = useState<{ open: boolean; entity?: any }>({ open: false })

  const { data } = useQuery({
    queryKey: ['ch-units'],
    queryFn:  () => chargesApi.listUnitTypes().then(r => r.data),
  })
  const items: any[] = data?.data ?? []

  const del = useMutation({
    mutationFn: (id: number) => chargesApi.deleteUnitType(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['ch-units'] }),
  })

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">Unit Type</h2>
        <button onClick={() => setEdit({ open: true })} className="btn btn-primary flex items-center gap-1.5">
          <Plus size={14}/> Add Unit Type
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={2} className="px-3 py-6 text-center text-gray-400">No units</td></tr>
            : items.map(u => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{u.name}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEdit({ open: true, entity: u })}
                      className="p-1 hover:bg-brand-50 rounded text-brand-600"><Edit2 size={14}/></button>
                    <button onClick={() => { if (confirm('Delete?')) del.mutate(u.id) }}
                      className="p-1 hover:bg-red-50 rounded text-red-600"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
      <SimpleAddModal
        open={edit.open}
        onClose={() => setEdit({ open: false })}
        title="Unit Type"
        entity={edit.entity}
        onSave={(p) => chargesApi.addUnitType(p)}
        onUpdate={(id, p) => chargesApi.updateUnitType(id, p)}
        invalidateKey={['ch-units']}
      />
    </div>
  )
}
