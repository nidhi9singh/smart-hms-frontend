// src/pages/billing/ViewPaymentsModal.tsx
import { useQuery } from '@tanstack/react-query'
import { X, Printer } from 'lucide-react'
import api from '@/lib/axios'

export default function ViewPaymentsModal({ caseId, open, onClose }: {
  caseId: string; open: boolean; onClose: () => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['case-payments', caseId],
    queryFn:  () => api.get(`/billing/case/${encodeURIComponent(caseId)}/payments`).then(r => r.data),
    enabled:  open,
  })
  const items: any[] = data?.data?.items ?? []
  const total = data?.data?.total_paid ?? 0

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-12">
      <div className="bg-white rounded-lg shadow-xl w-[860px] max-w-[95vw] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 bg-emerald-600 text-white rounded-t-lg sticky top-0">
          <h2 className="text-base font-semibold">Payments</h2>
          <button onClick={onClose}><X size={18}/></button>
        </div>
        <div className="p-5">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-600">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Note</th>
                <th className="px-3 py-2">Payment Mode</th>
                <th className="px-3 py-2 text-right">Paid Amount (₹)</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
                : items.length === 0
                  ? <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No payments recorded</td></tr>
                  : items.map((r: any) => (
                    <tr key={r.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">{new Date(r.date).toLocaleString()}</td>
                      <td className="px-3 py-2 text-gray-600">{r.note || '—'}</td>
                      <td className="px-3 py-2">{r.payment_mode}</td>
                      <td className="px-3 py-2 text-right font-semibold">{Number(r.paid_amount).toFixed(2)}</td>
                      <td className="px-3 py-2 text-right">
                        <button title="Print" onClick={() => window.print()} className="icon-btn">
                          <Printer size={11}/>
                        </button>
                      </td>
                    </tr>
                  ))
              }
              {items.length > 0 && (
                <tr className="border-t bg-gray-100 font-semibold">
                  <td colSpan={3} className="px-3 py-2 text-right text-gray-700">Total</td>
                  <td className="px-3 py-2 text-right">₹{Number(total).toFixed(2)}</td>
                  <td/>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
