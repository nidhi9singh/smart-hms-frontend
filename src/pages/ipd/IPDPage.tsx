// src/pages/ipd/IPDPage.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Eye, Edit2, Trash2, LogOut } from 'lucide-react'
import { ipdApi } from '@/api/ipd'
import AdmitPatientModal from './AdmitPatientModal'
import { cn } from '@/lib/utils'

type IpdTab = 'active' | 'discharged'

export default function IPDPage() {
  const qc = useQueryClient()
  const nav = useNavigate()
  const [tab, setTab]   = useState<IpdTab>('active')
  const [search, setSearch] = useState('')
  const [modal, setModal]   = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['ipd', tab, search],
    queryFn:  () => (tab === 'active'
      ? ipdApi.list({ search })
      : ipdApi.discharged({ search })
    ).then(r => r.data),
  })
  const admissions = data?.data ?? []
  const total      = data?.pagination?.total ?? 0

  const delMut = useMutation({
    mutationFn: (id: number) => ipdApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['ipd'] }),
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">IPD – In Patient</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage admitted patients, beds and discharges</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab(tab === 'active' ? 'discharged' : 'active')} className="btn btn-outline flex items-center gap-1.5">
            <LogOut size={14}/> {tab === 'active' ? 'Discharged Patients' : 'Active Patients'}
          </button>
          <button onClick={() => setModal(true)} className="btn btn-primary flex items-center gap-1.5">
            <Plus size={14}/> Add Patient
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active Admissions', value: total, color: 'bg-emerald-50 text-emerald-700'   },
          { label: 'VIP Ward',          value: 3,     color: 'bg-emerald-50 text-emerald-700'   },
          { label: 'General Ward',      value: 1,     color: 'bg-amber-50 text-amber-700' },
          { label: 'Discharged Today',  value: 1,     color: 'bg-red-50 text-red-700'     },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm', s.color)}>{s.value}</div>
            <span className="text-sm text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {[{ id: 'active', label: 'Active Patients' }, { id: 'discharged', label: 'Discharged Patients' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as IpdTab)}
              className={cn('px-4 py-2.5 text-sm border-b-2 -mb-px',
                tab===t.id ? 'border-emerald-600 text-emerald-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="flex items-center gap-3 p-3 border-b border-gray-100">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input className="input pl-8 h-9 text-sm" placeholder="Search IPD records..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex-1" />
          <button className="btn btn-outline text-sm">Export</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {(tab === 'active'
                  ? ['IPD No','Case ID','Name','Gender','Phone','Consultant','Bed','Antenatal','Credit','Action']
                  : ['Name','Patient ID','Case ID','Gender','Phone','Consultant','Admission','Discharged','Tax','Net','Total','Action']
                ).map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              : admissions.length === 0 ? <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">No records found</td></tr>
              : admissions.map((a: any) => (
                <tr key={a.id} className="hover:bg-gray-50/50">
                  {tab === 'active' ? <>
                    <td className="px-4 py-3"><Link to={`/ipd/${a.id}`} className="text-emerald-600 font-medium hover:underline cursor-pointer">{a.ipd_no}</Link></td>
                    <td className="px-4 py-3 text-gray-500">{a.case_id || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-medium">
                          {a.patient_name?.[0]}
                        </div>
                        <span className="font-medium max-w-[120px] truncate">{a.patient_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={cn('badge', a.gender==='Male' ? 'badge-blue' : 'badge-pink')}>{a.gender||'—'}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{a.phone||'—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{a.consultant_id||'—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                        🛏 {a.bed_number || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><span className={cn('badge', a.is_antenatal ? 'badge-teal' : 'badge-gray')}>{a.is_antenatal ? 'Yes' : 'No'}</span></td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500 mb-1">₹{Number(a.used_credit||0).toFixed(0)} / ₹{Number(a.credit_limit||0)/1000}k</div>
                      <div className="h-1 bg-gray-100 rounded-full w-20 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (a.used_credit/a.credit_limit)*100)||0}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="icon-btn" title="View" onClick={() => nav(`/ipd/${a.id}`)}><Eye size={12}/></button>
                        <button className="icon-btn"><Edit2 size={12}/></button>
                        <button className="icon-btn text-emerald-600" title="Discharge"><LogOut size={12}/></button>
                        <button className="icon-btn text-red-400" onClick={() => delMut.mutate(a.id)}><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </> : <>
                    <td className="px-4 py-3 font-medium">{a.patient_name}</td>
                    <td className="px-4 py-3 text-gray-500">{a.patient_id}</td>
                    <td className="px-4 py-3 text-gray-500">{a.case_id}</td>
                    <td className="px-4 py-3"><span className={cn('badge', a.gender==='Male' ? 'badge-blue' : 'badge-pink')}>{a.gender||'—'}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{a.phone||'—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{a.consultant_id||'—'}</td>
                    <td className="px-4 py-3 text-xs">{a.admission_date ? new Date(a.admission_date).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-xs">{a.discharge_date ? new Date(a.discharge_date).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3">₹{Number(a.discharge_tax||0).toFixed(2)}</td>
                    <td className="px-4 py-3">₹{Number(a.discharge_net_amount||0).toFixed(2)}</td>
                    <td className="px-4 py-3 font-semibold">₹{Number(a.discharge_total||0).toFixed(2)}</td>
                    <td className="px-4 py-3"><button className="icon-btn" onClick={() => nav(`/ipd/${a.id}`)}><Eye size={12}/></button></td>
                  </>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">Records: {admissions.length}</div>
      </div>

      <AdmitPatientModal open={modal} onClose={() => setModal(false)}
        onSuccess={() => { setModal(false); qc.invalidateQueries({ queryKey: ['ipd'] }) }} />
    </div>
  )
}
