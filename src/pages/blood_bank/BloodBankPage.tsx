// src/pages/blood_bank/BloodBankPage.tsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Users, Droplet, Layers, Activity } from 'lucide-react'
import { bloodBankApi } from '@/api/blood_bank'
import AddBloodDonorModal from './AddBloodDonorModal'
import AddBloodStockModal from './AddBloodStockModal'
import AddComponentsModal from './AddComponentsModal'
import IssueBloodModal from './IssueBloodModal'
import IssueComponentModal from './IssueComponentModal'
import { cn } from '@/lib/utils'

type Tab = 'status' | 'donors' | 'issues' | 'component_issues' | 'components'

const BLOOD_GROUPS = ['B+', 'A+', 'AB-', 'AB+', 'O-', 'A-', 'B-', 'O+']

export default function BloodBankPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('status')
  const [bg, setBg]   = useState<string>('B+')
  const [search, setSearch] = useState('')

  const [donorModal, setDonorModal]       = useState(false)
  const [stockModal, setStockModal]       = useState(false)
  const [compModal,  setCompModal]        = useState(false)
  const [issueModal, setIssueModal]       = useState(false)
  const [cIssueModal, setCIssueModal]     = useState(false)

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['bb-stock', bg],
    queryFn:  () => bloodBankApi.listStock({ blood_group: bg, available_only: false }).then(r => r.data),
    enabled:  tab === 'status',
  })
  const { data: compsData, isLoading: compsLoading } = useQuery({
    queryKey: ['bb-comps', bg],
    queryFn:  () => bloodBankApi.listComponents({ blood_group: bg, available_only: false }).then(r => r.data),
    enabled:  tab === 'status' || tab === 'components',
  })
  const { data: donorsData, isLoading: donorsLoading } = useQuery({
    queryKey: ['bb-donors', search],
    queryFn:  () => bloodBankApi.listDonors({ search }).then(r => r.data),
    enabled:  tab === 'donors',
  })
  const { data: issuesData, isLoading: issuesLoading } = useQuery({
    queryKey: ['bb-issues', search],
    queryFn:  () => bloodBankApi.listIssues({ search }).then(r => r.data),
    enabled:  tab === 'issues',
  })
  const { data: cIssuesData, isLoading: cIssuesLoading } = useQuery({
    queryKey: ['bb-comp-issues', search],
    queryFn:  () => bloodBankApi.listComponentIssues({ search }).then(r => r.data),
    enabled:  tab === 'component_issues',
  })

  const stock: any[]    = stockData?.data ?? []
  const comps: any[]    = compsData?.data ?? []
  const donors: any[]   = donorsData?.data ?? []
  const issues: any[]   = issuesData?.data ?? []
  const cIssues: any[]  = cIssuesData?.data ?? []

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Blood Bank</h1>
          <p className="text-sm text-gray-500 mt-0.5">Donors, stock, components and issues</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('donors')} className="btn btn-outline flex items-center gap-1.5">
            <Users size={14}/> Donor Details
          </button>
          <button onClick={() => setTab('issues')} className="btn btn-outline flex items-center gap-1.5">
            <Droplet size={14}/> Blood Issue Details
          </button>
          <button onClick={() => setTab('component_issues')} className="btn btn-outline flex items-center gap-1.5">
            <Activity size={14}/> Component Issue
          </button>
          <button onClick={() => setTab('components')} className="btn btn-outline flex items-center gap-1.5">
            <Layers size={14}/> Components
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex">
          {[
            { id: 'status', label: 'Blood Bank Status' },
            { id: 'donors', label: 'Donor Details' },
            { id: 'issues', label: 'Blood Issue Details' },
            { id: 'component_issues', label: 'Components Issue Details' },
            { id: 'components', label: 'Components List' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)}
              className={cn('px-4 py-2.5 text-sm border-b-2 -mb-px',
                tab === t.id ? 'border-emerald-600 text-emerald-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* STATUS TAB */}
      {tab === 'status' && (
        <div className="grid grid-cols-[100px_1fr_1.4fr] gap-4">
          <aside className="space-y-1">
            {BLOOD_GROUPS.map(g => (
              <button key={g} onClick={() => setBg(g)}
                className={cn('w-full text-left px-3 py-2 text-sm rounded-sm',
                  bg === g ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100')}
              >{g}</button>
            ))}
          </aside>

          <div className="card overflow-hidden p-0">
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50">
              <div>
                <span className="text-sm font-semibold text-gray-800">Blood</span>
                <span className="ml-3 text-xs text-gray-500">{stock.filter(s => !s.is_issued).length} Bags</span>
              </div>
              <button onClick={() => setStockModal(true)} className="px-2 py-1 rounded bg-emerald-500 text-white text-xs hover:bg-emerald-600">
                <Plus size={12}/>
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 text-xs text-gray-500">
                  <th className="px-3 py-2 text-left font-medium">Bags</th>
                  <th className="px-3 py-2 text-left font-medium">Lot</th>
                  <th className="px-3 py-2 text-left font-medium">Institution</th>
                  <th className="px-3 py-2 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stockLoading ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400 text-xs">Loading…</td></tr>
                : stock.length === 0 ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400 text-xs">No bags</td></tr>
                : stock.map(s => (
                  <tr key={s.id} className={cn('text-xs', s.is_issued && 'opacity-50')}>
                    <td className="px-3 py-2">{s.bag_no} ({s.volume_ml} {s.volume_unit})</td>
                    <td className="px-3 py-2 text-gray-500">{s.lot_no || ''}</td>
                    <td className="px-3 py-2 text-gray-500">{s.institution || ''}</td>
                    <td className="px-3 py-2">
                      <button disabled={s.is_issued} onClick={() => setIssueModal(true)}
                              className="px-3 py-1 bg-emerald-500 text-white rounded text-xs hover:bg-emerald-600 disabled:opacity-40">
                        {s.is_issued ? 'Issued' : 'Issue'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card overflow-hidden p-0">
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-50">
              <div>
                <span className="text-sm font-semibold text-gray-800">Components</span>
                <span className="ml-3 text-xs text-gray-500">{comps.filter(c => !c.is_issued).length} Bags</span>
              </div>
              <button onClick={() => setCompModal(true)} className="px-2 py-1 rounded bg-emerald-500 text-white text-xs hover:bg-emerald-600">
                <Plus size={12}/>
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 text-xs text-gray-500">
                  <th className="px-3 py-2 text-left font-medium">Bags</th>
                  <th className="px-3 py-2 text-left font-medium">Lot</th>
                  <th className="px-3 py-2 text-left font-medium">Components</th>
                  <th className="px-3 py-2 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {compsLoading ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400 text-xs">Loading…</td></tr>
                : comps.length === 0 ? <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400 text-xs">No components</td></tr>
                : comps.map(c => (
                  <tr key={c.id} className={cn('text-xs', c.is_issued && 'opacity-50')}>
                    <td className="px-3 py-2">{c.bag_no} ({c.volume_ml} {c.volume_unit})</td>
                    <td className="px-3 py-2 text-gray-500">{c.lot_no || ''}</td>
                    <td className="px-3 py-2 text-gray-500">{c.component_type}</td>
                    <td className="px-3 py-2">
                      <button disabled={c.is_issued} onClick={() => setCIssueModal(true)}
                              className="px-3 py-1 bg-emerald-500 text-white rounded text-xs hover:bg-emerald-600 disabled:opacity-40">
                        {c.is_issued ? 'Issued' : 'Issue'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DONORS TAB */}
      {tab === 'donors' && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input className="input pl-8 h-9 text-sm" placeholder="Search donors..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex-1" />
            <button onClick={() => setDonorModal(true)} className="btn btn-primary text-sm flex items-center gap-1.5">
              <Plus size={13}/> Add Blood Donor
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Donor Name','Date Of Birth','Blood Group','Gender','Contact No','Father Name','Address'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {donorsLoading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              : donors.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No donors</td></tr>
              : donors.map(d => (
                <tr key={d.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-emerald-600 font-medium">{d.name}</td>
                  <td className="px-4 py-3 text-gray-500">{d.date_of_birth || '—'}</td>
                  <td className="px-4 py-3"><span className="badge badge-blue">{d.blood_group}</span></td>
                  <td className="px-4 py-3 text-gray-500">{d.gender || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{d.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{d.father_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{d.address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* BLOOD ISSUES TAB */}
      {tab === 'issues' && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input className="input pl-8 h-9 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex-1" />
            <button onClick={() => setIssueModal(true)} className="btn btn-primary text-sm flex items-center gap-1.5">
              <Plus size={13}/> Issue Blood
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Bill No','Case ID','Issue Date','Received To','Blood Group','Gender','Donor Name','Bags','Created By','Blood Qty','Amount (₹)','Discount','Tax','Net Amount (₹)','Paid (₹)','Balance (₹)'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {issuesLoading ? <tr><td colSpan={16} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
                : issues.length === 0 ? <tr><td colSpan={16} className="px-4 py-8 text-center text-gray-400">No issues</td></tr>
                : issues.map(i => (
                  <tr key={i.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-3 text-emerald-600 text-xs font-medium">{i.issue_no}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{i.case_id || '—'}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{i.issue_date ? new Date(i.issue_date).toLocaleString() : '—'}</td>
                    <td className="px-3 py-3 text-xs">{i.patient_name || (i.patient_id ? `#${i.patient_id}` : '—')}</td>
                    <td className="px-3 py-3 text-xs">{i.blood_group || '—'}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">—</td>
                    <td className="px-3 py-3 text-xs">{i.donor_name || '—'}</td>
                    <td className="px-3 py-3 text-xs">{i.bag_no || '—'}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{i.issued_by_name || '—'}</td>
                    <td className="px-3 py-3 text-xs">{i.blood_qty || '—'}</td>
                    <td className="px-3 py-3 text-xs">₹{Number(i.amount || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">₹{Number(i.discount || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">₹{Number(i.tax_amount || 0).toFixed(2)}({Number(i.tax_percent || 0).toFixed(0)}%)</td>
                    <td className="px-3 py-3 text-xs font-medium">₹{Number(i.net_amount || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-xs text-emerald-600">₹{Number(i.paid || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-xs">
                      {Number(i.balance || 0) > 0
                        ? <span className="text-red-500 font-medium">₹{Number(i.balance).toFixed(2)}</span>
                        : <span className="text-emerald-500">₹0.00</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPONENT ISSUES TAB */}
      {tab === 'component_issues' && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input className="input pl-8 h-9 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex-1" />
            <button onClick={() => setCIssueModal(true)} className="btn btn-primary text-sm flex items-center gap-1.5">
              <Plus size={13}/> Issue Component
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Bill No','Case ID','Issue Date','Generated By','Received To','Blood Group','Component','Gender','Donor Name','Bags','Amount (₹)','Discount','Tax','Net Amount (₹)','Paid (₹)','Balance (₹)'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cIssuesLoading ? <tr><td colSpan={16} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
                : cIssues.length === 0 ? <tr><td colSpan={16} className="px-4 py-8 text-center text-gray-400">No issues</td></tr>
                : cIssues.map(i => (
                  <tr key={i.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-3 text-emerald-600 text-xs font-medium">{i.issue_no}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{i.case_id || '—'}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{i.issue_date ? new Date(i.issue_date).toLocaleString() : '—'}</td>
                    <td className="px-3 py-3 text-xs">{i.issued_by_name || '—'}</td>
                    <td className="px-3 py-3 text-xs">{i.patient_name || (i.patient_id ? `#${i.patient_id}` : '—')}</td>
                    <td className="px-3 py-3 text-xs">{i.blood_group || '—'}</td>
                    <td className="px-3 py-3 text-xs">{i.component_type || '—'}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">—</td>
                    <td className="px-3 py-3 text-xs">{i.donor_name || '—'}</td>
                    <td className="px-3 py-3 text-xs">{i.bag_no || '—'}</td>
                    <td className="px-3 py-3 text-xs">₹{Number(i.amount || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">₹{Number(i.discount || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">₹{Number(i.tax_amount || 0).toFixed(2)}({Number(i.tax_percent || 0).toFixed(0)}%)</td>
                    <td className="px-3 py-3 text-xs font-medium">₹{Number(i.net_amount || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-xs text-emerald-600">₹{Number(i.paid || 0).toFixed(2)}</td>
                    <td className="px-3 py-3 text-xs">
                      {Number(i.balance || 0) > 0
                        ? <span className="text-red-500 font-medium">₹{Number(i.balance).toFixed(2)}</span>
                        : <span className="text-emerald-500">₹0.00</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPONENTS LIST TAB */}
      {tab === 'components' && (
        <div className="card overflow-hidden p-0">
          <div className="flex items-center gap-3 p-3 border-b border-gray-100">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              <input className="input pl-8 h-9 text-sm" placeholder="Search..." />
            </div>
            <div className="flex-1" />
            <button onClick={() => setCompModal(true)} className="btn btn-primary text-sm flex items-center gap-1.5">
              <Plus size={13}/> Add Components
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Name','Blood Group','Bags','Lot','Institution'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {compsLoading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              : comps.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No components</td></tr>
              : comps.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">{c.component_type}</td>
                  <td className="px-4 py-3"><span className="badge badge-blue">{c.blood_group}</span></td>
                  <td className="px-4 py-3 text-emerald-600">{c.bag_no} ({c.volume_ml} {c.volume_unit})</td>
                  <td className="px-4 py-3 text-rose-600">{c.lot_no || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.institution || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}
      <AddBloodDonorModal
        open={donorModal}
        onClose={() => setDonorModal(false)}
        onSuccess={() => { setDonorModal(false); qc.invalidateQueries({ queryKey: ['bb-donors'] }) }}
      />
      <AddBloodStockModal
        open={stockModal}
        defaultBloodGroup={bg}
        onClose={() => setStockModal(false)}
        onSuccess={() => { setStockModal(false); qc.invalidateQueries({ queryKey: ['bb-stock'] }) }}
      />
      <AddComponentsModal
        open={compModal}
        onClose={() => setCompModal(false)}
        onSuccess={() => { setCompModal(false); qc.invalidateQueries({ queryKey: ['bb-comps'] }) }}
      />
      <IssueBloodModal
        open={issueModal}
        onClose={() => setIssueModal(false)}
        onSuccess={() => {
          setIssueModal(false)
          qc.invalidateQueries({ queryKey: ['bb-issues'] })
          qc.invalidateQueries({ queryKey: ['bb-stock'] })
        }}
      />
      <IssueComponentModal
        open={cIssueModal}
        onClose={() => setCIssueModal(false)}
        onSuccess={() => {
          setCIssueModal(false)
          qc.invalidateQueries({ queryKey: ['bb-comp-issues'] })
          qc.invalidateQueries({ queryKey: ['bb-comps'] })
        }}
      />
    </div>
  )
}
