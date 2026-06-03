// src/pages/billing/BillingPage.tsx
import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Search, CalendarCheck, Stethoscope, FlaskConical,
  Activity, Droplet, Layers,
} from 'lucide-react'
import api from '@/lib/axios'
import { cn } from '@/lib/utils'
import CaseBillDetail from './CaseBillDetail'

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
  opd:             'bg-emerald-50 text-emerald-700',
  ipd:             'bg-indigo-50 text-indigo-700',
  pathology:       'bg-emerald-50 text-emerald-700',
  radiology:       'bg-cyan-50 text-cyan-700',
  pharmacy:        'bg-amber-50 text-amber-700',
  blood_issue:     'bg-rose-50 text-rose-700',
  component_issue: 'bg-pink-50 text-pink-700',
}

export default function BillingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [caseInput, setCaseInput] = useState(searchParams.get('case_id') ?? '')
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

  // Auto-run search when ?case_id=N is in the URL (e.g. arrived from Patient List).
  useEffect(() => {
    const param = searchParams.get('case_id')
    if (param && param.trim()) lookup.mutate(param.trim())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const tiles = [
    { label: 'Appointment',           icon: CalendarCheck, to: '/appointments' },
    { label: 'OPD',                   icon: Stethoscope,   to: '/opd'          },
    { label: 'Pathology',             icon: FlaskConical,  to: '/pathology'    },
    { label: 'Radiology',             icon: Activity,      to: '/radiology'    },
    { label: 'Blood Issue',           icon: Droplet,       to: '/blood-bank'   },
    { label: 'Blood Component Issue', icon: Layers,        to: '/blood-bank'   },
  ]

  // Once a case is loaded, switch to the full-detail view.
  if (summary) {
    return (
      <div className="p-6 space-y-4">
        <div className="card p-4 flex items-end gap-3">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Case ID<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input className="input" value={caseInput}
              onChange={e => setCaseInput(e.target.value)}
              placeholder="Enter Case ID"/>
          </div>
          <button onClick={() => caseInput.trim() && lookup.mutate(caseInput.trim())}
            disabled={lookup.isPending || !caseInput.trim()}
            className="btn btn-primary flex items-center gap-1.5">
            <Search size={13}/>{lookup.isPending ? 'Searching…' : 'Search'}
          </button>
          <button onClick={() => { setSummary(null); setError(null); setCaseInput('') }}
            className="btn btn-outline">Clear</button>
        </div>
        {error && <div className="card p-3 bg-red-50 text-red-600 text-sm">{error}</div>}
        <CaseBillDetail data={summary as any}/>
      </div>
    )
  }

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
                  className="flex flex-col items-center justify-center gap-2 py-8 border border-gray-200 rounded-lg hover:border-emerald-400 hover:bg-emerald-50/30 transition"
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
        </section>
      </div>
    </div>
  )
}
