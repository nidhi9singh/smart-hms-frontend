// src/pages/referral/ReferralPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Search, Users } from 'lucide-react'
import { referralApi } from '@/api/referral'
import AddReferralPaymentModal from './AddReferralPaymentModal'
import AddReferralPersonModal from './AddReferralPersonModal'
import { cn } from '@/lib/utils'

type Tab = 'payments' | 'persons'

export default function ReferralPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('payments')
  const [search, setSearch] = useState('')
  const [payModal, setPayModal] = useState<{ open: boolean; payment?: any }>({ open: false })
  const [perModal, setPerModal] = useState<{ open: boolean; person?: any }>({ open: false })

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['ref-payments', search],
    queryFn:  () => referralApi.listPayments({ search }).then(r => r.data),
    enabled:  tab === 'payments',
  })
  const payments: any[] = paymentsData?.data ?? []

  const { data: personsData, isLoading: personsLoading } = useQuery({
    queryKey: ['ref-persons-list', search],
    queryFn:  () => referralApi.listPersons({ search }).then(r => r.data),
    enabled:  tab === 'persons',
  })
  const persons: any[] = personsData?.data ?? []

  const delPay = useMutation({ mutationFn: (id: number) => referralApi.deletePayment(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['ref-payments'] }) })
  const delPer = useMutation({ mutationFn: (id: number) => referralApi.deletePerson(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['ref-persons-list'] }) })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Referral</h1>
          <p className="text-sm text-gray-500 mt-0.5">Referral payments and referrer persons</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPayModal({ open: true })} className="btn btn-primary flex items-center gap-1.5">
            <Plus size={14}/> Add Referral Payment
          </button>
          <button onClick={() => setTab('persons')} className="btn btn-outline flex items-center gap-1.5">
            <Users size={14}/> Referral Person
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex">
          {[
            { id: 'payments', label: 'Referral Payment List' },
            { id: 'persons',  label: 'Referral Person List'  },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id as Tab); setSearch('') }}
              className={cn('px-4 py-2.5 text-sm border-b-2 -mb-px',
                tab === t.id ? 'border-teal-600 text-teal-700 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'
              )}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex items-center gap-3 p-3 border-b border-gray-100">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input className="input pl-8 h-9 text-sm" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex-1" />
          {tab === 'payments' && (
            <button onClick={() => setPayModal({ open: true })} className="btn btn-primary text-sm flex items-center gap-1.5">
              <Plus size={13}/> Add Referral Payment
            </button>
          )}
          {tab === 'persons' && (
            <button onClick={() => setPerModal({ open: true })} className="btn btn-primary text-sm flex items-center gap-1.5">
              <Plus size={13}/> Add Referral Person
            </button>
          )}
        </div>

        {tab === 'payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Payee','Patient Name','Bill No','Bill Amount ($)','Commission Percentage (%)','Commission Amount ($)','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paymentsLoading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
                : payments.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No referral payments</td></tr>
                : payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-teal-600 font-medium">{p.payee || `#${p.referral_person_id}`}</td>
                    <td className="px-4 py-3">{p.patient_name || (p.patient_id ? `#${p.patient_id}` : '—')}</td>
                    <td className="px-4 py-3 text-teal-600">{p.bill_no || '—'}</td>
                    <td className="px-4 py-3 text-right">{Number(p.bill_amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{Number(p.commission_percent || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">{Number(p.commission_amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="icon-btn" onClick={() => setPayModal({ open: true, payment: p })}><Edit2 size={12}/></button>
                        <button className="icon-btn text-red-400" onClick={() => confirm('Delete payment?') && delPay.mutate(p.id)}><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'persons' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Referrer Name','Category','Commission','Referrer Contact','Contact Person Name','Contact Person Phone','Address','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {personsLoading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
                : persons.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No referral persons</td></tr>
                : persons.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 align-top">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.category || '—'}</td>
                    <td className="px-4 py-3 text-teal-600 text-xs whitespace-pre-line">
                      {p.commissions
                        ? Object.entries(p.commissions)
                            .filter(([, v]) => Number(v) > 0)
                            .map(([k, v]) => `${k} - ${Number(v).toFixed(2)}%`)
                            .join('\n')
                          || '—'
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.phone || '—'}</td>
                    <td className="px-4 py-3">{p.contact_person_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.contact_person_phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{p.address || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="icon-btn" onClick={() => setPerModal({ open: true, person: p })}><Edit2 size={12}/></button>
                        <button className="icon-btn text-red-400" onClick={() => confirm('Delete person?') && delPer.mutate(p.id)}><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddReferralPaymentModal
        open={payModal.open} payment={payModal.payment}
        onClose={() => setPayModal({ open: false })}
        onSuccess={() => { setPayModal({ open: false }); qc.invalidateQueries({ queryKey: ['ref-payments'] }) }}
      />
      <AddReferralPersonModal
        open={perModal.open} person={perModal.person}
        onClose={() => setPerModal({ open: false })}
        onSuccess={() => { setPerModal({ open: false }); qc.invalidateQueries({ queryKey: ['ref-persons-list'] }) }}
      />
    </div>
  )
}
