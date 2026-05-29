// src/pages/front_office/FrontOfficePage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Edit2, Trash2, Phone, Inbox, Send, MessageSquare, Users } from 'lucide-react'
import { frontOfficeApi } from '@/api/front_office'
import AddVisitorModal from './AddVisitorModal'
import AddCallLogModal from './AddCallLogModal'
import AddPostalModal from './AddPostalModal'
import AddComplaintModal from './AddComplaintModal'
import { cn } from '@/lib/utils'

type Tab = 'visitors' | 'calls' | 'receives' | 'dispatches' | 'complaints'

export default function FrontOfficePage() {
  const qc = useQueryClient()
  const [tab, setTab]       = useState<Tab>('visitors')
  const [search, setSearch] = useState('')

  const [visitorModal,    setVisitorModal]    = useState<{ open: boolean; item?: any }>({ open: false })
  const [callModal,       setCallModal]       = useState<{ open: boolean; item?: any }>({ open: false })
  const [receiveModal,    setReceiveModal]    = useState<{ open: boolean; item?: any }>({ open: false })
  const [dispatchModal,   setDispatchModal]   = useState<{ open: boolean; item?: any }>({ open: false })
  const [complaintModal,  setComplaintModal]  = useState<{ open: boolean; item?: any }>({ open: false })

  const { data: visData, isLoading: visLoading } = useQuery({
    queryKey: ['fo-visitors', search],
    queryFn:  () => frontOfficeApi.listVisitors({ search }).then(r => r.data),
    enabled:  tab === 'visitors',
  })
  const { data: callData, isLoading: callLoading } = useQuery({
    queryKey: ['fo-calls', search],
    queryFn:  () => frontOfficeApi.listCallLogs({ search }).then(r => r.data),
    enabled:  tab === 'calls',
  })
  const { data: recData, isLoading: recLoading } = useQuery({
    queryKey: ['fo-receives', search],
    queryFn:  () => frontOfficeApi.listReceives({ search }).then(r => r.data),
    enabled:  tab === 'receives',
  })
  const { data: dispData, isLoading: dispLoading } = useQuery({
    queryKey: ['fo-dispatches', search],
    queryFn:  () => frontOfficeApi.listDispatches({ search }).then(r => r.data),
    enabled:  tab === 'dispatches',
  })
  const { data: cmpData, isLoading: cmpLoading } = useQuery({
    queryKey: ['fo-complaints', search],
    queryFn:  () => frontOfficeApi.listComplaints({ search }).then(r => r.data),
    enabled:  tab === 'complaints',
  })

  const visitors:   any[] = visData?.data  ?? []
  const calls:      any[] = callData?.data ?? []
  const receives:   any[] = recData?.data  ?? []
  const dispatches: any[] = dispData?.data ?? []
  const complaints: any[] = cmpData?.data  ?? []

  const delVisitor   = useMutation({ mutationFn: (id: number) => frontOfficeApi.deleteVisitor(id),  onSuccess: () => qc.invalidateQueries({ queryKey: ['fo-visitors'] }) })
  const delCall      = useMutation({ mutationFn: (id: number) => frontOfficeApi.deleteCallLog(id),  onSuccess: () => qc.invalidateQueries({ queryKey: ['fo-calls'] }) })
  const delReceive   = useMutation({ mutationFn: (id: number) => frontOfficeApi.deleteReceive(id),  onSuccess: () => qc.invalidateQueries({ queryKey: ['fo-receives'] }) })
  const delDispatch  = useMutation({ mutationFn: (id: number) => frontOfficeApi.deleteDispatch(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['fo-dispatches'] }) })
  const delComplaint = useMutation({ mutationFn: (id: number) => frontOfficeApi.deleteComplaint(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['fo-complaints'] }) })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Front Office</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visitors, calls, postal, and complaints</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCallModal({ open: true })} className="btn btn-outline flex items-center gap-1.5">
            <Phone size={14}/> Phone Call Log
          </button>
          <button onClick={() => { setTab('receives'); setReceiveModal({ open: true }) }} className="btn btn-outline flex items-center gap-1.5">
            <Inbox size={14}/> Postal
          </button>
          <button onClick={() => setComplaintModal({ open: true })} className="btn btn-outline flex items-center gap-1.5">
            <MessageSquare size={14}/> Complain
          </button>
          <button onClick={() => setVisitorModal({ open: true })} className="btn btn-primary flex items-center gap-1.5">
            <Plus size={14}/> Add Visitor
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex">
          {[
            { id: 'visitors',   label: 'Visitor List',        icon: Users         },
            { id: 'calls',      label: 'Phone Call Log List', icon: Phone         },
            { id: 'receives',   label: 'Postal Receive',      icon: Inbox         },
            { id: 'dispatches', label: 'Postal Dispatch List',icon: Send          },
            { id: 'complaints', label: 'Complain List',       icon: MessageSquare },
          ].map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => { setTab(t.id as Tab); setSearch('') }}
                className={cn('flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px',
                  tab === t.id ? 'border-emerald-600 text-emerald-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
                )}><Icon size={13}/>{t.label}</button>
            )
          })}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="flex items-center gap-3 p-3 border-b border-gray-100">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input className="input pl-8 h-9 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex-1" />
          {tab === 'visitors'   && <button onClick={() => setVisitorModal({ open: true })}  className="btn btn-primary text-sm flex items-center gap-1.5"><Plus size={13}/> Add Visitor</button>}
          {tab === 'calls'      && <button onClick={() => setCallModal({ open: true })}     className="btn btn-primary text-sm flex items-center gap-1.5"><Plus size={13}/> Add Call Log</button>}
          {tab === 'receives'   && <button onClick={() => setReceiveModal({ open: true })}  className="btn btn-primary text-sm flex items-center gap-1.5"><Plus size={13}/> Add Receive</button>}
          {tab === 'dispatches' && <button onClick={() => setDispatchModal({ open: true })} className="btn btn-primary text-sm flex items-center gap-1.5"><Plus size={13}/> Add Dispatch</button>}
          {tab === 'complaints' && <button onClick={() => setComplaintModal({ open: true })} className="btn btn-primary text-sm flex items-center gap-1.5"><Plus size={13}/> Add Complain</button>}
        </div>

        {/* VISITORS */}
        {tab === 'visitors' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Purpose','Name','Visit To','IPD/OPD/Staff','Phone','Date','In Time','Out Time','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {visLoading ? <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              : visitors.length === 0 ? <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No visitors</td></tr>
              : visitors.map(v => (
                <tr key={v.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3"><span className="badge badge-blue">{v.purpose}</span></td>
                  <td className="px-4 py-3 font-medium">{v.name}</td>
                  <td className="px-4 py-3 text-emerald-600">{v.visit_to || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{v.visit_type || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{v.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{v.visit_date ? new Date(v.visit_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{v.in_time || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{v.out_time || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="icon-btn" onClick={() => setVisitorModal({ open: true, item: v })}><Edit2 size={12}/></button>
                      <button className="icon-btn text-red-400" onClick={() => confirm('Delete?') && delVisitor.mutate(v.id)}><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* CALLS */}
        {tab === 'calls' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Name','Phone','Date','Next Follow Up Date','Call Type','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {callLoading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              : calls.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No call logs</td></tr>
              : calls.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium">{c.caller_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.call_date ? new Date(c.call_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.next_follow_up_date ? new Date(c.next_follow_up_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-emerald-600">{c.call_type || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="icon-btn" onClick={() => setCallModal({ open: true, item: c })}><Edit2 size={12}/></button>
                      <button className="icon-btn text-red-400" onClick={() => confirm('Delete?') && delCall.mutate(c.id)}><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* POSTAL RECEIVES */}
        {tab === 'receives' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['From Title','Reference No','To Title','Address','Note','Date','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recLoading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              : receives.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No receives</td></tr>
              : receives.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-emerald-600 font-medium">{r.from_title}</td>
                  <td className="px-4 py-3 text-emerald-600">{r.reference_no || '—'}</td>
                  <td className="px-4 py-3 text-emerald-600">{r.to_title || '—'}</td>
                  <td className="px-4 py-3 text-emerald-600">{r.address || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{r.note || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="icon-btn" onClick={() => setReceiveModal({ open: true, item: r })}><Edit2 size={12}/></button>
                      <button className="icon-btn text-red-400" onClick={() => confirm('Delete?') && delReceive.mutate(r.id)}><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* POSTAL DISPATCHES */}
        {tab === 'dispatches' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['To Title','Reference No','From Title','Date','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dispLoading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              : dispatches.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No dispatches</td></tr>
              : dispatches.map(d => (
                <tr key={d.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-emerald-600 font-medium">{d.to_title}</td>
                  <td className="px-4 py-3 text-emerald-600">{d.reference_no || '—'}</td>
                  <td className="px-4 py-3 text-emerald-600">{d.from_title || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{d.date ? new Date(d.date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="icon-btn" onClick={() => setDispatchModal({ open: true, item: d })}><Edit2 size={12}/></button>
                      <button className="icon-btn text-red-400" onClick={() => confirm('Delete?') && delDispatch.mutate(d.id)}><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* COMPLAINTS */}
        {tab === 'complaints' && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Complain','Complain Type','Source','Name','Phone','Date','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cmpLoading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              : complaints.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No complaints</td></tr>
              : complaints.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-emerald-600">#{c.id}</td>
                  <td className="px-4 py-3 text-emerald-600">{c.complain_type || '—'}</td>
                  <td className="px-4 py-3 text-emerald-600">{c.source || '—'}</td>
                  <td className="px-4 py-3 text-emerald-600">{c.complainant}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="icon-btn" onClick={() => setComplaintModal({ open: true, item: c })}><Edit2 size={12}/></button>
                      <button className="icon-btn text-red-400" onClick={() => confirm('Delete?') && delComplaint.mutate(c.id)}><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODALS */}
      <AddVisitorModal
        open={visitorModal.open} visitor={visitorModal.item}
        onClose={() => setVisitorModal({ open: false })}
        onSuccess={() => { setVisitorModal({ open: false }); qc.invalidateQueries({ queryKey: ['fo-visitors'] }) }}
      />
      <AddCallLogModal
        open={callModal.open} log={callModal.item}
        onClose={() => setCallModal({ open: false })}
        onSuccess={() => { setCallModal({ open: false }); qc.invalidateQueries({ queryKey: ['fo-calls'] }) }}
      />
      <AddPostalModal
        open={receiveModal.open} kind="receive" item={receiveModal.item}
        onClose={() => setReceiveModal({ open: false })}
        onSuccess={() => { setReceiveModal({ open: false }); qc.invalidateQueries({ queryKey: ['fo-receives'] }) }}
      />
      <AddPostalModal
        open={dispatchModal.open} kind="dispatch" item={dispatchModal.item}
        onClose={() => setDispatchModal({ open: false })}
        onSuccess={() => { setDispatchModal({ open: false }); qc.invalidateQueries({ queryKey: ['fo-dispatches'] }) }}
      />
      <AddComplaintModal
        open={complaintModal.open} complaint={complaintModal.item}
        onClose={() => setComplaintModal({ open: false })}
        onSuccess={() => { setComplaintModal({ open: false }); qc.invalidateQueries({ queryKey: ['fo-complaints'] }) }}
      />
    </div>
  )
}
