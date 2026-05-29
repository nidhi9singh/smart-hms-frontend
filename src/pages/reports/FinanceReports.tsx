// src/pages/reports/FinanceReports.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Search } from 'lucide-react'
import { finReportsApi } from '@/api/financeReports'
import { cn } from '@/lib/utils'

type ReportKey =
  | 'daily-transaction' | 'all-transaction' | 'income' | 'income-group'
  | 'expense' | 'expense-group' | 'patient-bill' | 'referral'
  | 'processing' | 'balance'

const REPORTS: Array<{ key: ReportKey; label: string }> = [
  { key: 'daily-transaction', label: 'Daily Transaction Report' },
  { key: 'all-transaction',   label: 'All Transaction Report' },
  { key: 'income',            label: 'Income Report' },
  { key: 'income-group',      label: 'Income Group Report' },
  { key: 'expense',           label: 'Expense Report' },
  { key: 'expense-group',     label: 'Expense Group Report' },
  { key: 'patient-bill',      label: 'Patient Bill Report' },
  { key: 'referral',          label: 'Referral Report' },
  { key: 'processing',        label: 'Processing Transaction Report' },
  { key: 'balance',           label: 'Balance Amount Report' },
]

const TIME_OPTIONS = [
  { value: '',             label: 'Select' },
  { value: 'today',        label: 'Today' },
  { value: 'yesterday',    label: 'Yesterday' },
  { value: 'last_7_days',  label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'this_month',   label: 'This Month' },
  { value: 'last_month',   label: 'Last Month' },
  { value: 'this_year',    label: 'This Year' },
]


export default function FinanceReports() {
  const [active, setActive] = useState<ReportKey>('daily-transaction')

  return (
    <>
      <div className="card">
        <div className="px-5 py-3 border-b">
          <h2 className="text-base font-semibold text-gray-800">Finance</h2>
        </div>
        <div className="p-5 grid grid-cols-3 gap-y-3 gap-x-6">
          {REPORTS.map(r => (
            <button key={r.key} onClick={() => setActive(r.key)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded text-sm text-left',
                active === r.key
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              )}>
              <FileText size={14} className="text-gray-400 shrink-0"/>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ReportPanel reportKey={active} />
    </>
  )
}


function ReportPanel({ reportKey }: { reportKey: ReportKey }) {
  switch (reportKey) {
    case 'daily-transaction': return <DailyTransaction />
    case 'all-transaction':   return <AllTransaction />
    case 'income':            return <IncomeReport />
    case 'income-group':      return <IncomeGroupReport />
    case 'expense':           return <ExpenseReport />
    case 'expense-group':     return <ExpenseGroupReport />
    case 'patient-bill':      return <PatientBillReport />
    case 'referral':          return <ReferralReport />
    case 'processing':        return <ProcessingTransactions />
    case 'balance':           return <BalanceAmountReport />
  }
}


// ── 1. Daily Transaction Report ─────────────────────────────
function DailyTransaction() {
  const today = new Date().toISOString().slice(0, 10)
  const [from, setFrom] = useState(today)
  const [to, setTo]     = useState(today)
  const [params, setParams] = useState<{ date_from: string; date_to: string } | null>(null)

  const { data } = useQuery({
    queryKey: ['rep-daily', params],
    queryFn:  () => finReportsApi.dailyTransaction(params!).then(r => r.data),
    enabled:  !!params,
  })
  const items: any[] = data?.data?.items ?? []

  return (
    <Panel title="Daily Transaction Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Date From" required>
            <input type="date" required value={from} onChange={e => setFrom(e.target.value)} className="input w-full"/>
          </Field>
          <Field className="col-span-3" label="Date To" required>
            <input type="date" required value={to} onChange={e => setTo(e.target.value)} className="input w-full"/>
          </Field>
          <div className="col-span-2"><SearchBtn onClick={() => setParams({ date_from: from, date_to: to })}/></div>
        </div>
      )}>
      {params && <TxnTable items={items} total={data?.data?.total}/>}
    </Panel>
  )
}


// ── 2. All Transaction Report ───────────────────────────────
function AllTransaction() {
  const [time, setTime]       = useState('')
  const [collector, setColl]  = useState('')
  const [head, setHead]       = useState('all')
  const [submitted, setSub]   = useState(false)

  const { data: usersData } = useQuery({ queryKey: ['rep-users'], queryFn: () => finReportsApi.users().then(r => r.data) })
  const { data: headsData } = useQuery({ queryKey: ['rep-heads'], queryFn: () => finReportsApi.heads().then(r => r.data) })

  const { data } = useQuery({
    queryKey: ['rep-all-txn', time, collector, head, submitted],
    queryFn:  () => finReportsApi.transactions({
      time_duration: time || undefined,
      collected_by:  collector || undefined,
      head:          head,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []

  return (
    <Panel title="Transaction Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Time Duration" required>
            <select required value={time} onChange={e => setTime(e.target.value)} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Collected By">
            <select value={collector} onChange={e => setColl(e.target.value)} className="input w-full">
              <option value="">Select</option>
              {(usersData?.data ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Select Head">
            <select value={head} onChange={e => setHead(e.target.value)} className="input w-full">
              <option value="all">All</option>
              {(headsData?.data ?? []).map((h: any) => <option key={h.key} value={h.key}>{h.label}</option>)}
            </select>
          </Field>
          <div className="col-span-3"><SearchBtn onClick={() => { setSub(true) }}/></div>
        </div>
      )}>
      <TxnTable items={items} total={data?.data?.total}/>
    </Panel>
  )
}


// Shared transaction table
function TxnTable({ items, total }: { items: any[]; total?: number }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-left text-xs text-gray-600">
        <tr>
          <th className="px-3 py-2">Transaction ID</th>
          <th className="px-3 py-2">Date</th>
          <th className="px-3 py-2">Patient Name</th>
          <th className="px-3 py-2">Reference</th>
          <th className="px-3 py-2">Category</th>
          <th className="px-3 py-2">Collected By</th>
          <th className="px-3 py-2">Payment Type</th>
          <th className="px-3 py-2">Payment Mode</th>
          <th className="px-3 py-2 text-right">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0
          ? <tr><td colSpan={9} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
          : items.map(r => (
            <tr key={r.transaction_id} className="border-t hover:bg-gray-50">
              <td className="px-3 py-2 text-emerald-700">{r.transaction_id}</td>
              <td className="px-3 py-2">{(r.date || '').slice(0, 10)}</td>
              <td className="px-3 py-2">{r.patient_name || '—'}</td>
              <td className="px-3 py-2">{r.reference || '—'}</td>
              <td className="px-3 py-2">{r.category || '—'}</td>
              <td className="px-3 py-2">{r.collected_by || '—'}</td>
              <td className="px-3 py-2">{r.payment_type || '—'}</td>
              <td className="px-3 py-2">{r.payment_mode || '—'}</td>
              <td className="px-3 py-2 text-right">{Number(r.amount || 0).toFixed(2)}</td>
            </tr>
          ))
        }
        {items.length > 0 && total != null && (
          <tr className="border-t bg-gray-50 font-semibold">
            <td colSpan={8} className="px-3 py-2 text-right">Total</td>
            <td className="px-3 py-2 text-right">{Number(total).toFixed(2)}</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}


// ── 3. Income Report ────────────────────────────────────────
function IncomeReport() {
  const [time, setTime]   = useState('')
  const [submitted, setS] = useState(false)
  const { data } = useQuery({
    queryKey: ['rep-income', time, submitted],
    queryFn:  () => finReportsApi.income({ time_duration: time || undefined }).then(r => r.data),
    enabled:  submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Income Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-4" label="Time Duration" required>
            <select required value={time} onChange={e => setTime(e.target.value)} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <div className="col-span-2"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Invoice Number</th>
            <th className="px-3 py-2">Income Head</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2 text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={5} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map(r => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-emerald-700">{r.name}</td>
                <td className="px-3 py-2">{r.invoice_number || '—'}</td>
                <td className="px-3 py-2">{r.income_head || '—'}</td>
                <td className="px-3 py-2">{(r.date || '').slice(0, 10)}</td>
                <td className="px-3 py-2 text-right">{Number(r.amount || 0).toFixed(2)}</td>
              </tr>
            ))
          }
          {items.length > 0 && (
            <tr className="border-t bg-gray-50 font-semibold">
              <td colSpan={4} className="px-3 py-2 text-right">Total</td>
              <td className="px-3 py-2 text-right">{Number(data?.data?.total || 0).toFixed(2)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </Panel>
  )
}


// ── 4. Income Group Report ──────────────────────────────────
function IncomeGroupReport() {
  const [time, setTime]   = useState('')
  const [headId, setH]    = useState('')
  const [submitted, setS] = useState(false)
  const { data: heads } = useQuery({ queryKey: ['rep-income-heads'], queryFn: () => finReportsApi.incomeHeads().then(r => r.data) })
  const { data } = useQuery({
    queryKey: ['rep-income-group', time, headId, submitted],
    queryFn:  () => finReportsApi.incomeGroup({
      time_duration: time || undefined,
      income_head_id: headId || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const groups: any[] = data?.data?.groups ?? []
  return (
    <Panel title="Income Group Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Time Duration">
            <select value={time} onChange={e => setTime(e.target.value)} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Search Income Head">
            <select value={headId} onChange={e => setH(e.target.value)} className="input w-full">
              <option value="">Select</option>
              {(heads?.data ?? []).map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </Field>
          <div className="col-span-2"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Income Head</th>
            <th className="px-3 py-2">Income Id</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Invoice Number</th>
            <th className="px-3 py-2 text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {groups.length === 0
            ? <tr><td colSpan={6} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : groups.flatMap(g => [
              ...g.items.map((r: any, i: number) => (
                <tr key={`${g.head}-${r.income_id}`} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-emerald-700">{i === 0 ? g.head : ''}</td>
                  <td className="px-3 py-2">{r.income_id}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{(r.date || '').slice(0, 10)}</td>
                  <td className="px-3 py-2">{r.invoice_number || '—'}</td>
                  <td className="px-3 py-2 text-right">{Number(r.amount || 0).toFixed(2)}</td>
                </tr>
              )),
              <tr key={`${g.head}-st`} className="border-t bg-gray-50">
                <td colSpan={5} className="px-3 py-1 text-right text-xs text-gray-500">Subtotal:</td>
                <td className="px-3 py-1 text-right text-xs font-semibold">₹{Number(g.subtotal).toFixed(2)}</td>
              </tr>,
            ])
          }
        </tbody>
      </table>
    </Panel>
  )
}


// ── 5. Expense Report ───────────────────────────────────────
function ExpenseReport() {
  const [time, setTime]   = useState('this_month')
  const [submitted, setS] = useState(true)   // auto-run with default
  const { data } = useQuery({
    queryKey: ['rep-expense', time, submitted],
    queryFn:  () => finReportsApi.expense({ time_duration: time || undefined }).then(r => r.data),
    enabled:  submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Expense Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-4" label="Time Duration">
            <select value={time} onChange={e => setTime(e.target.value)} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <div className="col-span-2"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Invoice Number</th>
            <th className="px-3 py-2">Expense Head</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2 text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={5} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map(r => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-emerald-700">{r.name}</td>
                <td className="px-3 py-2">{r.invoice_number || '—'}</td>
                <td className="px-3 py-2">{r.expense_head || '—'}</td>
                <td className="px-3 py-2">{(r.date || '').slice(0, 10)}</td>
                <td className="px-3 py-2 text-right">{Number(r.amount || 0).toFixed(2)}</td>
              </tr>
            ))
          }
          {items.length > 0 && (
            <tr className="border-t bg-gray-50 font-semibold">
              <td colSpan={4} className="px-3 py-2 text-right">Total</td>
              <td className="px-3 py-2 text-right">{Number(data?.data?.total || 0).toFixed(2)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </Panel>
  )
}


// ── 6. Expense Group Report ─────────────────────────────────
function ExpenseGroupReport() {
  const [time, setTime]   = useState('')
  const [headId, setH]    = useState('')
  const [submitted, setS] = useState(false)
  const { data: heads } = useQuery({ queryKey: ['rep-expense-heads'], queryFn: () => finReportsApi.expenseHeads().then(r => r.data) })
  const { data } = useQuery({
    queryKey: ['rep-expense-group', time, headId, submitted],
    queryFn:  () => finReportsApi.expenseGroup({
      time_duration: time || undefined,
      expense_head_id: headId || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const groups: any[] = data?.data?.groups ?? []
  const [search, setSearch] = useState('')
  return (
    <Panel title="Expense Group Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Time Duration">
            <select value={time} onChange={e => setTime(e.target.value)} className="input w-full">
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Search Expense Head">
            <select value={headId} onChange={e => setH(e.target.value)} className="input w-full">
              <option value="">Select</option>
              {(heads?.data ?? []).map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </Field>
          <div className="col-span-2"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      {groups.length > 0 && (
        <div className="px-5 pt-3 pb-1">
          <div className="relative max-w-xs">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…" className="input pl-8 w-full"/>
          </div>
        </div>
      )}
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Expense Head</th>
            <th className="px-3 py-2">Expense Id</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Invoice Number</th>
            <th className="px-3 py-2 text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {groups.length === 0
            ? <tr><td colSpan={6} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : groups
                .map(g => ({ ...g, items: g.items.filter((r: any) =>
                  !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase())) }))
                .filter(g => g.items.length > 0)
                .flatMap(g => [
                  ...g.items.map((r: any, i: number) => (
                    <tr key={`${g.head}-${r.expense_id}`} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 text-emerald-700">{i === 0 ? g.head : ''}</td>
                      <td className="px-3 py-2">{r.expense_id}</td>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">{(r.date || '').slice(0, 10)}</td>
                      <td className="px-3 py-2">{r.invoice_number || '—'}</td>
                      <td className="px-3 py-2 text-right">{Number(r.amount || 0).toFixed(2)}</td>
                    </tr>
                  )),
                  <tr key={`${g.head}-st`} className="border-t bg-gray-50">
                    <td colSpan={5} className="px-3 py-1 text-right text-xs text-gray-500">Subtotal:</td>
                    <td className="px-3 py-1 text-right text-xs font-semibold">₹{Number(g.subtotal).toFixed(2)}</td>
                  </tr>,
                ])
          }
        </tbody>
      </table>
    </Panel>
  )
}


// ── 7. Patient Bill Report ──────────────────────────────────
function PatientBillReport() {
  const [caseId, setCaseId] = useState('')
  const [submitted, setS]   = useState(false)
  const { data } = useQuery({
    queryKey: ['rep-patient-bill', caseId, submitted],
    queryFn:  () => finReportsApi.patientBill(caseId).then(r => r.data),
    enabled:  submitted && !!caseId,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Patient Bill Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-5" label="Case ID" required>
            <input required placeholder="Case ID" value={caseId}
              onChange={e => setCaseId(e.target.value)} className="input w-full"/>
          </Field>
          <div className="col-span-2"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Module</th>
            <th className="px-3 py-2">OPD No</th>
            <th className="px-3 py-2">IPD No</th>
            <th className="px-3 py-2">Bill No</th>
            <th className="px-3 py-2">Payment Mode</th>
            <th className="px-3 py-2">Payment Date</th>
            <th className="px-3 py-2 text-right">Payment Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={7} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{r.module}</td>
                <td className="px-3 py-2">{r.opd_no || '—'}</td>
                <td className="px-3 py-2">{r.ipd_no || '—'}</td>
                <td className="px-3 py-2 text-emerald-700">{r.bill_no}</td>
                <td className="px-3 py-2">{r.payment_mode}</td>
                <td className="px-3 py-2">{(r.payment_date || '').slice(0, 10)}</td>
                <td className="px-3 py-2 text-right">{Number(r.payment_amount || 0).toFixed(2)}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}


// ── 8. Referral Report ──────────────────────────────────────
function ReferralReport() {
  const [date, setDate]       = useState('')
  const [payee, setPayee]     = useState('')
  const [ptype, setPType]     = useState('')
  const [patient, setPatient] = useState('')
  const [submitted, setS]     = useState(false)
  const { data: payees } = useQuery({ queryKey: ['rep-payees'], queryFn: () => finReportsApi.payees().then(r => r.data) })
  const { data } = useQuery({
    queryKey: ['rep-referral', date, payee, ptype, patient, submitted],
    queryFn:  () => finReportsApi.referral({
      date_from: date || undefined, date_to: date || undefined,
      payee_id: payee || undefined, patient_type: ptype || undefined, patient_id: patient || undefined,
    }).then(r => r.data),
    enabled: submitted,
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Referral Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Date">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input w-full"/>
          </Field>
          <Field className="col-span-3" label="Payee">
            <select value={payee} onChange={e => setPayee(e.target.value)} className="input w-full">
              <option value="">Select</option>
              {(payees?.data ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field className="col-span-2" label="Patient Type">
            <select value={ptype} onChange={e => setPType(e.target.value)} className="input w-full">
              <option value="">Select</option>
              <option value="OPD">OPD</option>
              <option value="IPD">IPD</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Pathology">Pathology</option>
              <option value="Radiology">Radiology</option>
            </select>
          </Field>
          <Field className="col-span-2" label="Patient">
            <input value={patient} onChange={e => setPatient(e.target.value)}
              placeholder="Patient ID" className="input w-full"/>
          </Field>
          <div className="col-span-2"><SearchBtn onClick={() => setS(true)}/></div>
        </div>
      )}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            <th className="px-3 py-2">Payee</th>
            <th className="px-3 py-2">Patient Name</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Bill No</th>
            <th className="px-3 py-2 text-right">Commission %</th>
            <th className="px-3 py-2 text-right">Bill Amount (₹)</th>
            <th className="px-3 py-2 text-right">Commission Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0
            ? <tr><td colSpan={7} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
            : items.map((r, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2 text-emerald-700">{r.payee || '—'}</td>
                <td className="px-3 py-2">{r.patient_name || '—'}</td>
                <td className="px-3 py-2">{(r.date || '').slice(0, 10)}</td>
                <td className="px-3 py-2">{r.bill_no || '—'}</td>
                <td className="px-3 py-2 text-right">{Number(r.commission_percentage || 0).toFixed(2)}%</td>
                <td className="px-3 py-2 text-right">{Number(r.bill_amount || 0).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{Number(r.commission_amount || 0).toFixed(2)}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </Panel>
  )
}


// ── 9. Processing Transaction Report ─────────────────────────
function ProcessingTransactions() {
  const [search, setSearch] = useState('')
  const { data } = useQuery({
    queryKey: ['rep-processing', search],
    queryFn:  () => finReportsApi.processing({ search: search || undefined }).then(r => r.data),
  })
  const items: any[] = data?.data?.items ?? []
  return (
    <Panel title="Processing Transaction Report" filters={null}>
      <div className="px-5 pt-3 pb-1">
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
              <th className="px-3 py-2">Patient Name</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Case Reference No</th>
              <th className="px-3 py-2">OPD No</th>
              <th className="px-3 py-2">IPD No</th>
              <th className="px-3 py-2">Pharmacy Bill No</th>
              <th className="px-3 py-2">Pathology Bill No</th>
              <th className="px-3 py-2">Radiology Bill No</th>
              <th className="px-3 py-2">Blood Donor Cycle No</th>
              <th className="px-3 py-2">Blood Issue No</th>
              <th className="px-3 py-2">Ambulance Call No</th>
              <th className="px-3 py-2">Appointment No</th>
              <th className="px-3 py-2 text-right">Amount (₹)</th>
              <th className="px-3 py-2">Payment Mode</th>
              <th className="px-3 py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={15} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : items.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-emerald-700">{r.patient_name || '—'}</td>
                  <td className="px-3 py-2">{r.date}</td>
                  <td className="px-3 py-2">{r.case_reference_no || ''}</td>
                  <td className="px-3 py-2">{r.opd_no || ''}</td>
                  <td className="px-3 py-2">{r.ipd_no || ''}</td>
                  <td className="px-3 py-2">{r.pharmacy_bill_no || ''}</td>
                  <td className="px-3 py-2">{r.pathology_bill_no || ''}</td>
                  <td className="px-3 py-2">{r.radiology_bill_no || ''}</td>
                  <td className="px-3 py-2">{r.blood_donor_cycle_no || ''}</td>
                  <td className="px-3 py-2">{r.blood_issue_no || ''}</td>
                  <td className="px-3 py-2">{r.ambulance_call_no || ''}</td>
                  <td className="px-3 py-2">{r.appointment_no || ''}</td>
                  <td className="px-3 py-2 text-right">{Number(r.amount || 0).toFixed(2)}</td>
                  <td className="px-3 py-2">{r.payment_mode}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{r.note || ''}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </Panel>
  )
}


// ── 10. Balance Amount Report ───────────────────────────────
function BalanceAmountReport() {
  const [head, setHead]       = useState('all')
  const [patient, setPatient] = useState('')
  const { data: heads } = useQuery({ queryKey: ['rep-heads'], queryFn: () => finReportsApi.heads().then(r => r.data) })
  const { data } = useQuery({
    queryKey: ['rep-balance', head, patient],
    queryFn:  () => finReportsApi.balance({
      head, patient_id: patient || undefined,
    }).then(r => r.data),
  })
  const items: any[] = data?.data?.items ?? []
  const [search, setSearch] = useState('')
  const filtered = search ? items.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase())) : items

  return (
    <Panel title="Balance Amount Report"
      filters={(
        <div className="grid grid-cols-12 gap-3 items-end">
          <Field className="col-span-3" label="Select Head">
            <select value={head} onChange={e => setHead(e.target.value)} className="input w-full">
              <option value="all">All</option>
              {(heads?.data ?? []).map((h: any) => <option key={h.key} value={h.key}>{h.label}</option>)}
            </select>
          </Field>
          <Field className="col-span-3" label="Patient Name">
            <input value={patient} onChange={e => setPatient(e.target.value)}
              placeholder="Patient ID" className="input w-full"/>
          </Field>
          <div className="col-span-2"><SearchBtn onClick={() => { /* react-query auto-fetches on key change */ }}/></div>
        </div>
      )}>
      <div className="px-5 pt-3 pb-1">
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
              <th className="px-3 py-2">Bill No</th>
              <th className="px-3 py-2">Case ID</th>
              <th className="px-3 py-2">Patient Name</th>
              <th className="px-3 py-2">Generated By</th>
              <th className="px-3 py-2">Reference Doctor</th>
              <th className="px-3 py-2 text-right">Amount (₹)</th>
              <th className="px-3 py-2 text-right">Discount (₹)</th>
              <th className="px-3 py-2 text-right">Tax (₹)</th>
              <th className="px-3 py-2 text-right">Net Amount (₹)</th>
              <th className="px-3 py-2 text-right">Paid Amount (₹)</th>
              <th className="px-3 py-2 text-right">Balance Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={11} className="px-3 py-6 text-center text-rose-500">No data available in table</td></tr>
              : filtered.map((r, i) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-emerald-700">{r.bill_no}</td>
                  <td className="px-3 py-2">{r.case_id || '—'}</td>
                  <td className="px-3 py-2">{r.patient_name || '—'}</td>
                  <td className="px-3 py-2">{r.generated_by || '—'}</td>
                  <td className="px-3 py-2">{r.reference_doctor || '—'}</td>
                  <td className="px-3 py-2 text-right">{Number(r.amount || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.discount || 0).toFixed(2)} ({r.discount_percent}%)</td>
                  <td className="px-3 py-2 text-right">{Number(r.tax || 0).toFixed(2)} ({r.tax_percent}%)</td>
                  <td className="px-3 py-2 text-right">{Number(r.net_amount || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{Number(r.paid_amount || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{Number(r.balance_amount || 0).toFixed(2)}</td>
                </tr>
              ))
            }
            {filtered.length > 0 && (
              <tr className="border-t bg-gray-50 font-semibold">
                <td colSpan={10} className="px-3 py-2 text-right">Total Outstanding</td>
                <td className="px-3 py-2 text-right">
                  {Number(data?.data?.total_balance || 0).toFixed(2)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}


// ── Shared primitives ──────────────────────────────────────
function Panel({ title, filters, children }: {
  title: string; filters: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="card">
      <div className="px-5 py-3 border-b">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      {filters && <div className="px-5 py-4 border-b">{filters}</div>}
      <div>{children}</div>
    </div>
  )
}

function Field({ label, required, children, className }: {
  label: string; required?: boolean; children: React.ReactNode; className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function SearchBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="btn btn-primary w-full flex items-center justify-center gap-1.5">
      <Search size={14}/> Search
    </button>
  )
}
