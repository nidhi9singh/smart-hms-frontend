// src/pages/pathology/PathologyPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Eye, Edit2, Trash2, Printer, FlaskConical } from 'lucide-react'
import { pathologyApi } from '@/api/pathology'
import AddPathologyTestModal from './AddPathologyTestModal'
import GeneratePathologyBillModal from './GeneratePathologyBillModal'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

type Tab = 'bills' | 'tests'

export default function PathologyPage() {
  const qc = useQueryClient()
  const role = useAuthStore(s => s.user?.role)
  // Doctors view results only — billing + test catalog edits stay with the lab team.
  const canManagePathology = !['doctor', 'nurse'].includes(role ?? '')
  const [tab, setTab] = useState<Tab>('bills')
  const [search, setSearch] = useState('')
  const [billModal, setBillModal] = useState(false)
  const [testModal, setTestModal] = useState<{ open: boolean; test?: any }>({ open: false })

  const { data: billsData, isLoading: billsLoading } = useQuery({
    queryKey: ['pathology-bills', search],
    queryFn:  () => pathologyApi.listBills({ search }).then(r => r.data),
    enabled:  tab === 'bills',
  })

  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ['pathology-tests', search],
    queryFn:  () => pathologyApi.listTests({ search }).then(r => r.data),
    enabled:  tab === 'tests',
  })

  const bills: any[] = billsData?.data ?? []
  const tests: any[] = testsData?.data ?? []

  const delTest = useMutation({
    mutationFn: (id: number) => pathologyApi.deleteTest(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['pathology-tests'] }),
  })

  const totalRevenue = bills.reduce((s, b) => s + Number(b.net_amount || 0), 0)
  const totalBalance = bills.reduce((s, b) => s + Number(b.balance    || 0), 0)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Pathology</h1>
          <p className="text-sm text-gray-500 mt-0.5">Lab tests, parameters and bills</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('tests')} className="btn btn-outline flex items-center gap-1.5">
            <FlaskConical size={14}/> Pathology Test
          </button>
          {canManagePathology && (
            <button onClick={() => setBillModal(true)} className="btn btn-primary flex items-center gap-1.5">
              <Plus size={14}/> Generate Bill
            </button>
          )}
        </div>
      </div>

      <div className={cn('grid gap-3', canManagePathology ? 'grid-cols-4' : 'grid-cols-2')}>
        {[
          { label: 'Total Bills',     value: bills.length,                                  color: 'bg-brand-50 text-brand-700', financial: false },
          { label: 'Total Revenue',   value: `₹${totalRevenue.toFixed(2)}`,                 color: 'bg-brand-50 text-brand-700', financial: true  },
          { label: 'Pending Balance', value: `₹${totalBalance.toFixed(2)}`,                 color: 'bg-red-50 text-red-700',         financial: true  },
          { label: 'Tests',           value: tests.length,                                  color: 'bg-amber-50 text-amber-700',     financial: false },
        ].filter(s => canManagePathology || !s.financial).map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs', s.color)}>{s.value}</div>
            <span className="text-sm text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-200">
        <div className="flex">
          {[{ id: 'bills', label: 'Pathology Bill' }, { id: 'tests', label: 'Pathology Test' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)}
              className={cn('px-4 py-2.5 text-sm border-b-2 -mb-px',
                tab === t.id ? 'border-brand-600 text-brand-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}>{t.label}</button>
          ))}
        </div>
      </div>

      {tab === 'bills' && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input className="input pl-8 h-9 text-sm" placeholder="Search bills..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Bill No','Case ID','Bill Date','Patient Name','Generated By','Reference Doctor','Previous Report Value','Amount (₹)','Discount','Tax (₹)','Net (₹)','Paid (₹)','Balance (₹)','Action'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {billsLoading ? <tr><td colSpan={14} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                : bills.length === 0 ? <tr><td colSpan={14} className="px-4 py-8 text-center text-gray-400">No bills found</td></tr>
                : bills.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-3"><span className="text-brand-600 font-medium text-xs">{b.bill_no}</span></td>
                    <td className="px-3 py-3 text-xs text-gray-500">{b.case_id || '—'}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{b.created_at ? new Date(b.created_at).toLocaleString() : '—'}</td>
                    <td className="px-3 py-3">{b.patient_name || (b.patient_id ? `#${b.patient_id}` : '—')}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{b.generated_by_name || '—'}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{b.reference_doctor_name || b.doctor_name_text || '—'}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{b.previous_report_value || '—'}</td>
                    <td className="px-3 py-3">₹{Number(b.amount || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">₹{Number(b.discount || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">₹{Number(b.tax_amount || 0).toFixed(2)} ({Number(b.tax_percent || 0).toFixed(0)}%)</td>
                    <td className="px-3 py-3 font-medium">₹{Number(b.net_amount || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-brand-600">₹{Number(b.paid || 0).toFixed(2)}</td>
                    <td className="px-3 py-3">
                      {Number(b.balance || 0) > 0
                        ? <span className="text-red-500 font-medium">₹{Number(b.balance).toFixed(2)}</span>
                        : <span className="text-brand-500">₹0.00</span>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button className="icon-btn" title="Print"><Printer size={11}/></button>
                        <button className="icon-btn" title="View"><Eye size={11}/></button>
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

      {tab === 'tests' && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input className="input pl-8 h-9 text-sm" placeholder="Search tests..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex-1" />
            {canManagePathology && (
              <button onClick={() => setTestModal({ open: true })} className="btn btn-primary text-sm flex items-center gap-1.5">
                <Plus size={13}/> Add Pathology Test
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Test Name','Short Name','Test Type','Category','Sub Category','Method','Report Days','Tax (%)','Charge (₹)','Amount (₹)','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {testsLoading ? <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                : tests.length === 0 ? <tr><td colSpan={11} className="px-4 py-8 text-center text-gray-400">No tests</td></tr>
                : tests.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-gray-500">{t.short_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{t.test_type || '—'}</td>
                    <td className="px-4 py-3"><span className="badge badge-blue">{t.category || '—'}</span></td>
                    <td className="px-4 py-3 text-gray-500">{t.sub_category || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{t.method || '—'}</td>
                    <td className="px-4 py-3 text-rose-600">{t.report_days || 0}</td>
                    <td className="px-4 py-3 text-gray-500">{Number(t.tax_percent || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-500">₹{Number(t.standard_charge || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 font-medium">₹{Number(t.amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {canManagePathology && (
                          <>
                            <button className="icon-btn" onClick={() => setTestModal({ open: true, test: t })}><Edit2 size={12}/></button>
                            <button className="icon-btn text-red-400" onClick={() => confirm(`Delete ${t.name}?`) && delTest.mutate(t.id)}><Trash2 size={12}/></button>
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

      <GeneratePathologyBillModal
        open={billModal}
        onClose={() => setBillModal(false)}
        onSuccess={() => { setBillModal(false); qc.invalidateQueries({ queryKey: ['pathology-bills'] }) }}
      />
      <AddPathologyTestModal
        open={testModal.open}
        test={testModal.test}
        onClose={() => setTestModal({ open: false })}
        onSuccess={() => { setTestModal({ open: false }); qc.invalidateQueries({ queryKey: ['pathology-tests'] }) }}
      />
    </div>
  )
}
