// src/pages/billing/BillingPage.tsx
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Search, CalendarCheck, Stethoscope, FlaskConical,
  Activity, Droplet, Layers,
} from 'lucide-react'
import api from '@/lib/axios'
import { cn } from '@/lib/utils'

interface UnifiedBill {
  module: string
  bill_no: string
  id: number
  date: string | null
  amount: number
  discount: number
  tax_amount: number
  net_amount: number
  paid: number
  balance: number
}

interface UnifiedSummary {
  case_id: string
  patient_id: number | null
  patient_name: string | null
  total_bills: number
  total_amount: number
  total_net: number
  total_paid: number
  total_balance: number
  by_module: Record<string, number>
  bills: UnifiedBill[]
}

const MODULE_LABEL: Record<string, string> = {
  opd:             'OPD',
  ipd:             'IPD',
  pathology:       'Pathology',
  radiology:       'Radiology',
  pharmacy:        'Pharmacy',
  blood_issue:     'Blood Issue',
  component_issue: 'Component Issue',
}

const MODULE_COLOR: Record<string, string> = {
  opd:             'bg-blue-50 text-blue-700',
  ipd:             'bg-indigo-50 text-indigo-700',
  pathology:       'bg-teal-50 text-teal-700',
  radiology:       'bg-cyan-50 text-cyan-700',
  pharmacy:        'bg-amber-50 text-amber-700',
  blood_issue:     'bg-rose-50 text-rose-700',
  component_issue: 'bg-pink-50 text-pink-700',
}

export default function BillingPage() {
  const navigate = useNavigate()
  const [caseInput, setCaseInput] = useState('')
  const [summary, setSummary] = useState<UnifiedSummary | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  const lookup = useMutation({
    mutationFn: (caseId: string) =>
      api.get(`/billing/case/${encodeURIComponent(caseId)}/unified`).then(r => r.data),
    onSuccess: (res: { data: UnifiedSummary }) => {
      setSummary(res.data)
      setError(null)
    },
    onError: (e: any) => {
      setSummary(null)
      setError(e.response?.data?.message ?? 'Failed to look up case')
    },
  })

  const tiles = [
    { label: 'Appointment',           icon: CalendarCheck, to: '/appointments' },
    { label: 'OPD',                   icon: Stethoscope,   to: '/opd'          },
    { label: 'Pathology',             icon: FlaskConical,  to: '/pathology'    },
    { label: 'Radiology',             icon: Activity,      to: '/radiology'    },
    { label: 'Blood Issue',           icon: Droplet,       to: '/blood-bank'   },
    { label: 'Blood Component Issue', icon: Layers,        to: '/blood-bank'   },
  ]

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pick a module to generate a bill, or look up an existing case by ID</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Single Module Billing ────────────────────────────── */}
        <section className="card p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Single Module Billing</h2>
          <div className="grid grid-cols-3 gap-3">
            {tiles.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.label}
                  onClick={() => navigate(t.to)}
                  className="flex flex-col items-center justify-center gap-2 py-8 border border-gray-200 rounded-lg hover:border-teal-400 hover:bg-teal-50/30 transition"
                >
                  <Icon size={28} className="text-gray-600" />
                  <span className="text-sm text-gray-700">{t.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Case ID lookup ──────────────────────────────────── */}
        <section className="card p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">OPD/IPD Billing Through Case Id</h2>

          <form
            onSubmit={e => { e.preventDefault(); if (caseInput.trim()) lookup.mutate(caseInput.trim()) }}
            className="flex items-end gap-3"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Case ID<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                className="input"
                placeholder="Enter Case ID"
                value={caseInput}
                onChange={e => setCaseInput(e.target.value)}
              />
            </div>
            <button type="submit" disabled={lookup.isPending || !caseInput.trim()}
              className="btn btn-primary flex items-center gap-1.5">
              <Search size={13}/>{lookup.isPending ? 'Searching…' : 'Search'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded">{error}</div>
          )}

          {summary && (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-gray-50 rounded">
                  <span className="text-xs text-gray-500">Patient</span>
                  <div className="font-medium">{summary.patient_name || (summary.patient_id ? `#${summary.patient_id}` : 'Unknown')}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <span className="text-xs text-gray-500">Total Bills</span>
                  <div className="font-medium">{summary.total_bills}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-blue-50 rounded text-center">
                  <div className="text-gray-500">Amount</div>
                  <div className="font-semibold text-blue-700">${summary.total_amount.toFixed(2)}</div>
                </div>
                <div className="p-2 bg-teal-50 rounded text-center">
                  <div className="text-gray-500">Net</div>
                  <div className="font-semibold text-teal-700">${summary.total_net.toFixed(2)}</div>
                </div>
                <div className="p-2 bg-green-50 rounded text-center">
                  <div className="text-gray-500">Paid</div>
                  <div className="font-semibold text-green-700">${summary.total_paid.toFixed(2)}</div>
                </div>
                <div className="p-2 bg-red-50 rounded text-center">
                  <div className="text-gray-500">Balance</div>
                  <div className="font-semibold text-red-700">${summary.total_balance.toFixed(2)}</div>
                </div>
              </div>

              {summary.bills.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400">No bills found for case <span className="font-mono">{summary.case_id}</span></div>
              ) : (
                <div className="border border-gray-100 rounded overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500">
                        <th className="px-3 py-2 text-left font-medium">Module</th>
                        <th className="px-3 py-2 text-left font-medium">Bill / No</th>
                        <th className="px-3 py-2 text-left font-medium">Date</th>
                        <th className="px-3 py-2 text-right font-medium">Amount</th>
                        <th className="px-3 py-2 text-right font-medium">Net</th>
                        <th className="px-3 py-2 text-right font-medium">Paid</th>
                        <th className="px-3 py-2 text-right font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {summary.bills.map(b => (
                        <tr key={`${b.module}-${b.id}`}>
                          <td className="px-3 py-2">
                            <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', MODULE_COLOR[b.module] ?? 'bg-gray-100 text-gray-600')}>
                              {MODULE_LABEL[b.module] ?? b.module}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-teal-600">{b.bill_no}</td>
                          <td className="px-3 py-2 text-gray-500">{b.date ? new Date(b.date).toLocaleDateString() : '—'}</td>
                          <td className="px-3 py-2 text-right">${b.amount.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-medium">${b.net_amount.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right text-green-600">${b.paid.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">
                            {b.balance > 0
                              ? <span className="text-red-500 font-medium">${b.balance.toFixed(2)}</span>
                              : <span className="text-green-500">$0.00</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
