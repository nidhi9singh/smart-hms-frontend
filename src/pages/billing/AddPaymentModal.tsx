// src/pages/billing/AddPaymentModal.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/axios'

const MODES = ['Cash', 'Card', 'Online', 'Stripe', 'UPI', 'Cheque', 'Bank Transfer']

export default function AddPaymentModal({ caseId, open, onClose }: {
  caseId: string; open: boolean; onClose: () => void
}) {
  const qc = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({ date: today, amount: '', payment_mode: 'Cash', note: '' })

  useEffect(() => { if (open) setForm({ date: today, amount: '', payment_mode: 'Cash', note: '' }) }, [open])

  // Live "remaining due" — pull the current bill summary so we can clamp / warn.
  const { data: billData } = useQuery({
    queryKey: ['case-bill', caseId],
    queryFn:  () => api.get(`/billing/case/${encodeURIComponent(caseId)}/bill`).then(r => r.data),
    enabled:  open,
  })
  const due = Number(billData?.data?.due ?? 0)
  const total = Number(billData?.data?.total ?? 0)
  const paid = Number(billData?.data?.paid ?? 0)

  const enteredAmount = Number(form.amount) || 0
  const willOverpay = enteredAmount > due && due >= 0

  const save = useMutation({
    mutationFn: () => api.post(`/billing/case/${encodeURIComponent(caseId)}/payment`, {
      date         : form.date,
      amount       : Number(form.amount) || 0,
      payment_mode : form.payment_mode,
      note         : form.note || null,
    }),
    onSuccess: () => {
      toast.success('Payment recorded')
      qc.invalidateQueries({ queryKey: ['case-payments', caseId] })
      qc.invalidateQueries({ queryKey: ['case-bill', caseId] })
      qc.invalidateQueries({ queryKey: ['case-summary', caseId] })
      onClose()
    },
    onError: (e: any) => toast.error(e.response?.data?.detail ?? 'Failed to record payment'),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-xl w-[520px] max-w-[92vw]">
        <div className="flex items-center justify-between px-5 py-3 bg-emerald-600 text-white rounded-t-lg">
          <h2 className="text-base font-semibold">Add Payment</h2>
          <button onClick={onClose}><X size={18}/></button>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault()
          if (!form.amount) return
          if (willOverpay) {
            const ok = window.confirm(
              `Amount ₹${enteredAmount.toFixed(2)} exceeds remaining due of ₹${due.toFixed(2)}. ` +
              `The extra ₹${(enteredAmount - due).toFixed(2)} will be recorded as a credit balance. Proceed?`
            )
            if (!ok) return
          }
          save.mutate()
        }} className="p-5 space-y-4">
          {/* Due summary */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <Tile label="Total"    value={`₹${total.toFixed(2)}`} bg="bg-gray-50"   tone="text-gray-700"/>
            <Tile label="Paid"     value={`₹${paid.toFixed(2)}`}  bg="bg-emerald-50" tone="text-emerald-700"/>
            <Tile label="Due"      value={`₹${due.toFixed(2)}`}   bg="bg-rose-50"    tone="text-rose-700"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" required>
              <input type="date" required value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })} className="input w-full"/>
            </Field>
            <Field label="Amount (₹)" required>
              <input type="number" step="0.01" min="0.01" max={due > 0 ? due : undefined} required value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className={`input w-full ${willOverpay ? 'border-amber-400 focus:ring-amber-400' : ''}`}/>
              {willOverpay && (
                <p className="mt-1 text-xs text-amber-700 flex items-center gap-1">
                  <AlertTriangle size={11}/> Exceeds due — extra ₹{(enteredAmount - due).toFixed(2)} will be a credit.
                </p>
              )}
              {due === 0 && enteredAmount > 0 && (
                <p className="mt-1 text-xs text-amber-700 flex items-center gap-1">
                  <AlertTriangle size={11}/> Case is fully paid — this becomes a credit balance.
                </p>
              )}
            </Field>
          </div>
          <Field label="Payment Mode">
            <select value={form.payment_mode}
              onChange={e => setForm({ ...form, payment_mode: e.target.value })}
              className="input w-full">
              {MODES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Note">
            <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
              className="input w-full"/>
          </Field>
          <div className="flex justify-end pt-2 border-t">
            <button type="submit" disabled={save.isPending} className="btn btn-primary">
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function Tile({ label, value, bg, tone }: { label: string; value: string; bg: string; tone: string }) {
  return (
    <div className={`${bg} rounded p-2 text-center`}>
      <div className="text-gray-500 text-[10px] uppercase tracking-wide">{label}</div>
      <div className={`font-semibold ${tone}`}>{value}</div>
    </div>
  )
}
