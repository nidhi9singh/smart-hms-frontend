// src/pages/pharmacy/PharmacyPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Upload, Eye, Edit2, Trash2, Printer, ShoppingCart } from 'lucide-react'
import { pharmacyApi } from '@/api/pharmacy'
import GenerateBillModal from './GenerateBillModal'
import AddMedicineModal from './AddMedicineModal'
import PurchaseMedicineModal from './PurchaseMedicineModal'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

type PharmTab = 'bills' | 'medicines' | 'purchases'

export default function PharmacyPage() {
  const qc = useQueryClient()
  const role = (useAuthStore(s => s.user?.role) ?? '').toLowerCase()
  // Accountant views pharmacy data only — no bill generation, no stock writes.
  const canManagePharmacy = !['accountant', 'doctor', 'nurse'].includes(role)
  const [tab, setTab]     = useState<PharmTab>('bills')
  const [search, setSearch] = useState('')
  const [billModal, setBillModal]       = useState(false)
  const [medModal, setMedModal]         = useState<{ open: boolean; medicine?: any }>({ open: false })
  const [purchaseModal, setPurchaseModal] = useState(false)

  const { data: billsData, isLoading: billsLoading } = useQuery({
    queryKey: ['pharmacy-bills', search],
    queryFn:  () => pharmacyApi.listBills({ search }).then(r => r.data),
    enabled:  tab === 'bills',
  })

  const { data: medsData, isLoading: medsLoading } = useQuery({
    queryKey: ['medicines', search],
    queryFn:  () => pharmacyApi.listMedicines({ search }).then(r => r.data),
    enabled:  tab === 'medicines',
  })

  const { data: purchasesData } = useQuery({
    queryKey: ['pharmacy-purchases'],
    queryFn:  () => pharmacyApi.listPurchases().then(r => r.data),
    enabled:  tab === 'purchases',
  })

  const bills     = billsData?.data     ?? []
  const medicines = medsData?.data      ?? []
  const purchases = purchasesData?.data ?? []

  const delBill = useMutation({ mutationFn: (id: number) => pharmacyApi.deleteBill(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['pharmacy-bills'] }) })
  const delMed  = useMutation({ mutationFn: (id: number) => pharmacyApi.deleteMedicine(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['medicines'] }) })

  const totalRevenue = bills.reduce((s: number, b: any) => s + Number(b.net_amount || 0), 0)
  const totalBalance = bills.reduce((s: number, b: any) => s + Number(b.balance_amount || 0), 0)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pharmacy</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bills, medicines stock and purchases</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('medicines')} className="btn btn-outline flex items-center gap-1.5">
            💊 Medicines
          </button>
          {canManagePharmacy && (
            <button onClick={() => setBillModal(true)} className="btn btn-primary flex items-center gap-1.5">
              <Plus size={14}/> Generate Bill
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Bills',     value: bills.length,                                  color: 'bg-emerald-50 text-emerald-700'   },
          { label: 'Total Revenue',   value: `₹${totalRevenue.toFixed(2)}`,                 color: 'bg-emerald-50 text-emerald-700'   },
          { label: 'Pending Balance', value: `₹${totalBalance.toFixed(2)}`,                 color: 'bg-red-50 text-red-700'     },
          { label: 'Medicines',       value: medicines.length,                              color: 'bg-amber-50 text-amber-700' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs', s.color)}>{s.value}</div>
            <span className="text-sm text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {[{ id:'bills', label:'Pharmacy Bills' }, { id:'medicines', label:'Medicines Stock' }, { id:'purchases', label:'Medicine Purchase List' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as PharmTab)}
              className={cn('px-4 py-2.5 text-sm border-b-2 -mb-px',
                tab===t.id ? 'border-emerald-600 text-emerald-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Bills Tab */}
      {tab === 'bills' && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input className="input pl-8 h-9 text-sm" placeholder="Search bills..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex-1" />
            <button className="btn btn-outline text-sm">Export</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Bill No','Case ID','Date','Patient Name','Generated By','Doctor Name','Amount (₹)','Discount (₹)','Tax (₹)','Net Amount (₹)','Paid Amount (₹)','Refund Amount (₹)','Balance Amount (₹)','Action'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {billsLoading ? <tr><td colSpan={14} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                : bills.length === 0 ? <tr><td colSpan={14} className="px-4 py-8 text-center text-gray-400">No bills found</td></tr>
                : bills.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-3"><span className="text-emerald-600 font-medium cursor-pointer text-xs">{b.bill_no}</span></td>
                    <td className="px-3 py-3 text-xs text-gray-500">{b.case_id ?? '—'}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{b.date ? new Date(b.date).toLocaleString() : '—'}</td>
                    <td className="px-3 py-3 text-sm">{b.patient_name || (b.patient_id ? `#${b.patient_id}` : '—')}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{b.generated_by_name || (b.generated_by ? `#${b.generated_by}` : '—')}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{b.doctor_name || '—'}</td>
                    <td className="px-3 py-3">₹{Number(b.amount||0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">₹{Number(b.discount||0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">₹{Number(b.tax||0).toFixed(2)}</td>
                    <td className="px-3 py-3 font-medium">₹{Number(b.net_amount||0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-emerald-600">₹{Number(b.paid_amount||0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-gray-500">₹{Number(b.refund_amount||0).toFixed(2)}</td>
                    <td className="px-3 py-3">
                      {Number(b.balance_amount||0) > 0
                        ? <span className="text-red-500 font-medium">₹{Number(b.balance_amount).toFixed(2)}</span>
                        : <span className="text-emerald-500">₹0.00</span>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button className="icon-btn" title="Print"><Printer size={11}/></button>
                        <button className="icon-btn" title="View"><Eye size={11}/></button>
                        {canManagePharmacy && (
                          <button className="icon-btn text-red-400" onClick={() => delBill.mutate(b.id)}><Trash2 size={11}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">Records: {bills.length}</div>
        </div>
      )}

      {/* Medicines Tab */}
      {tab === 'medicines' && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input className="input pl-8 h-9 text-sm" placeholder="Search medicines..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex-1" />
            {canManagePharmacy && (
              <button className="btn btn-outline text-sm flex items-center gap-1.5"><Upload size={13}/> Import</button>
            )}
            <button onClick={() => setTab('purchases')} className="btn btn-outline text-sm flex items-center gap-1.5"><ShoppingCart size={13}/> Purchase</button>
            {canManagePharmacy && (
              <button onClick={() => setMedModal({ open: true })} className="btn btn-primary text-sm flex items-center gap-1.5"><Plus size={13}/> Add Medicine</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 w-8"><input type="checkbox" /></th>
                  {['Medicine Name','Company','Composition','Category','Group','Unit','Available Qty','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {medsLoading ? <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                : medicines.length === 0 ? <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No medicines in stock</td></tr>
                : medicines.map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3"><input type="checkbox" /></td>
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-gray-500">{m.company_id || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{m.composition || '—'}</td>
                    <td className="px-4 py-3"><span className="badge badge-blue">{m.category_id || '—'}</span></td>
                    <td className="px-4 py-3 text-gray-500">{m.group_id || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{m.unit_id || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('font-semibold', m.available_qty < 100 ? 'text-red-500' : 'text-emerald-600')}>{m.available_qty}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {canManagePharmacy && (
                          <>
                            <button className="icon-btn" onClick={() => setMedModal({ open: true, medicine: m })}><Edit2 size={12}/></button>
                            <button className="icon-btn text-red-400" onClick={() => delMed.mutate(m.id)}><Trash2 size={12}/></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Purchases Tab */}
      {tab === 'purchases' && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Medicine Purchase List</h2>
            {canManagePharmacy && (
              <button onClick={() => setPurchaseModal(true)} className="btn btn-primary text-sm flex items-center gap-1.5"><Plus size={13}/> Add Purchase</button>
            )}
          </div>
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input className="input pl-8 h-9 text-sm" placeholder="Search purchases..." />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Pharmacy Purchase No','Purchase Date','Bill No','Supplier Name','Total (₹)','Discount (₹)','Tax (₹)','Net Amount (₹)','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {purchases.length === 0 ? <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No purchases found</td></tr>
                : purchases.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3"><span className="text-emerald-600 font-medium text-xs">{p.purchase_no}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.purchase_date ? new Date(p.purchase_date).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{p.bill_no || '—'}</td>
                    <td className="px-4 py-3">{p.supplier_name || '—'}</td>
                    <td className="px-4 py-3">₹{Number(p.total||0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-400">₹0.00 (0.00%)</td>
                    <td className="px-4 py-3 text-gray-400">₹{Number(p.tax||0).toFixed(2)}</td>
                    <td className="px-4 py-3 font-semibold">₹{Number(p.net_amount||0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="icon-btn"><Eye size={12}/></button>
                        {canManagePharmacy && (
                          <button className="icon-btn text-red-400"><Trash2 size={12}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <GenerateBillModal open={billModal} onClose={() => setBillModal(false)}
        onSuccess={() => { setBillModal(false); qc.invalidateQueries({ queryKey: ['pharmacy-bills'] }) }} />
      <AddMedicineModal open={medModal.open} medicine={medModal.medicine}
        onClose={() => setMedModal({ open: false })}
        onSuccess={() => { setMedModal({ open: false }); qc.invalidateQueries({ queryKey: ['medicines'] }) }} />
      <PurchaseMedicineModal open={purchaseModal} onClose={() => setPurchaseModal(false)}
        onSuccess={() => { setPurchaseModal(false); qc.invalidateQueries({ queryKey: ['pharmacy-purchases'] }) }} />
    </div>
  )
}
