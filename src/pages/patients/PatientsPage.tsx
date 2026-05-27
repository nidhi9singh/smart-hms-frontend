// src/pages/patients/PatientsPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Upload, Eye, Edit2, Trash2, User, Users, Printer, Copy, FileDown } from 'lucide-react'
import { patientsApi } from '@/api/patients'
import PatientFormModal from './PatientFormModal'
import { cn } from '@/lib/utils'

export default function PatientsPage() {
  const qc = useQueryClient()
  const [search, setSearch]             = useState('')
  const [modal, setModal]               = useState<{ open: boolean; patient?: any }>({ open: false })
  const [page, setPage]                 = useState(1)
  const [showDisabled, setShowDisabled] = useState(false)
  const [selected, setSelected]         = useState<number[]>([])
  const perPage = 100

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, page, showDisabled],
    queryFn:  () => patientsApi.list({
      search, page: String(page), per_page: String(perPage),
      is_active: showDisabled ? 'false' : 'true',
    }).then(r => r.data),
  })

  const patients   = data?.data ?? []
  const total      = data?.pagination?.total ?? 0
  const totalPages = data?.pagination?.total_pages ?? 1

  const disableMut = useMutation({
    mutationFn: (id: number) => patientsApi.update(id, { is_active: false } as any),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['patients'] }); setSelected([]) },
  })

  const bulkDisableMut = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) await patientsApi.update(id, { is_active: false } as any)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patients'] }); setSelected([]) },
  })

  const toggleSelect = (id: number) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  const toggleAll = () =>
    setSelected(selected.length === patients.length ? [] : patients.map((p: any) => p.id))

  // Fix: use != null so age_years=0 still shows
  const ageLabel = (p: any) => {
    const y = p.age_years ?? 0
    const m = p.age_months ?? 0
    const d = p.age_days ?? 0
    if (y || m || d) return `${y} Year, ${m} Month, ${d} Day`
    if (p.date_of_birth) {
      const dob = new Date(p.date_of_birth)
      const today = new Date()
      let yr = today.getFullYear() - dob.getFullYear()
      let mo = today.getMonth() - dob.getMonth()
      let da = today.getDate() - dob.getDate()
      if (da < 0) { mo--; da += new Date(today.getFullYear(), today.getMonth(), 0).getDate() }
      if (mo < 0) { yr--; mo += 12 }
      return `${yr} Year, ${mo} Month, ${da} Day`
    }
    return '—'
  }

  const stats = [
    { label: 'Total Patients', value: total,                                                      color: 'bg-teal-50 text-teal-700'   },
    { label: 'Male',           value: patients.filter((p:any) => p.gender === 'Male').length,     color: 'bg-blue-50 text-blue-700'   },
    { label: 'Female',         value: patients.filter((p:any) => p.gender === 'Female').length,   color: 'bg-pink-50 text-pink-700'   },
    { label: 'Active',         value: patients.filter((p:any) => p.is_active).length,             color: 'bg-green-50 text-green-700' },
  ]

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Patient List</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all registered patients</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal({ open: true })} className="btn btn-primary flex items-center gap-1.5">
            <Plus size={14}/> Add New Patient
          </button>
          <button className="btn btn-primary flex items-center gap-1.5">
            <Upload size={14}/> Import Patient
          </button>
          <button
            onClick={() => { setShowDisabled(v => !v); setSelected([]); setPage(1) }}
            className="btn btn-primary flex items-center gap-1.5"
          >
            <Users size={14}/> {showDisabled ? 'Active Patient List' : 'Disabled Patient List'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="card flex items-center gap-3 p-4">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', s.color)}>
              <User size={18}/>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 border-b border-gray-100 flex-wrap">
          <div className="relative max-w-xs flex-1">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400"/>
            <input className="input pl-8 text-sm h-9" placeholder="Search..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}/>
          </div>
          <div className="flex-1"/>
          {selected.length > 0 && (
            <button
              onClick={() => bulkDisableMut.mutate(selected)}
              disabled={bulkDisableMut.isPending}
              className="btn btn-danger flex items-center gap-1.5 text-sm"
            >
              <Trash2 size={13}/> Delete Selected ({selected.length})
            </button>
          )}
          <select className="input h-8 text-xs w-16">
            <option>100</option><option>50</option><option>20</option>
          </select>
          <div className="flex gap-1">
            <button className="icon-btn" title="Copy"><Copy size={13}/></button>
            <button className="icon-btn" title="Excel"><FileDown size={13}/></button>
            <button className="icon-btn" title="CSV"><FileDown size={13}/></button>
            <button className="icon-btn" title="Print"><Printer size={13}/></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-3 py-3 w-8">
                  <input type="checkbox"
                    checked={selected.length === patients.length && patients.length > 0}
                    onChange={toggleAll}/>
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500">#</th>
                {['Patient Name','Age','Gender','Phone','Guardian Name','Address','Dead','Action'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                  {showDisabled ? 'No disabled patients' : 'No patients found'}
                </td></tr>
              ) : patients.map((p: any, i: number) => (
                <tr key={p.id} className={cn('hover:bg-gray-50/50 transition-colors', selected.includes(p.id) && 'bg-teal-50/30')}>
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)}/>
                  </td>
                  <td className="px-3 py-2 text-gray-400 text-xs">{(page-1)*perPage + i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {p.photo_path
                        ? <img src={p.photo_path} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0"/>
                        : <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {p.name?.split(' ').map((w:string) => w[0]).join('').toUpperCase().slice(0,2)}
                          </div>
                      }
                      <span className="font-medium text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{ageLabel(p)}</td>
                  <td className="px-3 py-2">
                    <span className={cn('badge', p.gender === 'Male' ? 'badge-blue' : p.gender === 'Female' ? 'badge-pink' : 'badge-gray')}>
                      {p.gender || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{p.phone || '—'}</td>
                  <td className="px-3 py-2 text-gray-500">{p.guardian_name || '—'}</td>
                  <td className="px-3 py-2 text-gray-400 text-xs max-w-[130px] truncate">{p.address || '—'}</td>
                  <td className="px-3 py-2">
                    {p.is_dead
                      ? <span className="badge badge-red">Yes</span>
                      : <span className="badge badge-gray">No</span>
                    }
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button className="icon-btn" title="View"><Eye size={12}/></button>
                      <button className="icon-btn" title="Edit" onClick={() => setModal({ open: true, patient: p })}><Edit2 size={12}/></button>
                      <button className="icon-btn text-red-400 hover:text-red-600" title="Disable"
                        onClick={() => disableMut.mutate(p.id)}><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
          <span>Showing {patients.length} of {total} records</span>
          <div className="flex gap-1 items-center">
            <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40">←</button>
            <span className="px-3">{page} / {totalPages||1}</span>
            <button disabled={page>=totalPages} onClick={() => setPage(p=>p+1)} className="px-2 py-1 rounded border border-gray-200 disabled:opacity-40">→</button>
          </div>
        </div>
      </div>

      <PatientFormModal
        open={modal.open}
        patient={modal.patient}
        onClose={() => setModal({ open: false })}
        onSuccess={() => { setModal({ open: false }); qc.invalidateQueries({ queryKey: ['patients'] }) }}
      />
    </div>
  )
}
