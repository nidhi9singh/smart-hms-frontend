// src/pages/billing/GenerateBillModal.tsx
import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Printer } from 'lucide-react'
import api from '@/lib/axios'

export default function GenerateBillModal({ caseId, open, onClose }: {
  caseId: string; open: boolean; onClose: () => void
}) {
  const printRef = useRef<HTMLDivElement>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['case-bill', caseId],
    queryFn:  () => api.get(`/billing/case/${encodeURIComponent(caseId)}/bill`).then(r => r.data),
    enabled:  open,
  })
  const bill: any = data?.data
  const print = () => {
    if (!printRef.current) return
    const w = window.open('', '_blank', 'width=800,height=900')
    if (!w) return
    w.document.write(`
      <html><head><title>Bill — Case ${caseId}</title>
      <style>
        body{font-family:Inter,Arial,sans-serif;color:#1f2937;padding:20px;}
        .hdr{background:#1e88e5;color:#fff;padding:10px;text-align:center;font-size:14px;font-weight:600;}
        table{width:100%;border-collapse:collapse;font-size:12px;}
        th,td{padding:6px 8px;text-align:left;border-bottom:1px solid #e5e7eb;}
        .r{text-align:right;}
        h1{margin:0 0 4px 0;font-size:22px;}
        .small{font-size:11px;color:#4b5563;}
      </style></head><body>${printRef.current.innerHTML}</body></html>`)
    w.document.close(); w.focus(); w.print()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-8 print:hidden">
      <div className="bg-white rounded-lg shadow-xl w-[900px] max-w-[95vw] max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 bg-brand-600 text-white rounded-t-lg sticky top-0">
          <h2 className="text-base font-semibold">Bill</h2>
          <div className="flex items-center gap-3">
            <button onClick={print} disabled={!bill} title="Print" className="hover:opacity-80"><Printer size={16}/></button>
            <button onClick={onClose}><X size={18}/></button>
          </div>
        </div>

        {isLoading || !bill
          ? <div className="p-10 text-center text-gray-400">Loading bill…</div>
          : (
            <div ref={printRef} className="p-6">
              {/* Hospital header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <img src="/cognate.jpg" alt="" className="h-10"/>
                  <h1 className="text-2xl font-bold text-gray-900">{bill.hospital?.name}</h1>
                </div>
                <div className="text-right text-xs text-gray-700 leading-tight">
                  {bill.hospital?.address && <div><strong>Address:</strong> {bill.hospital.address}</div>}
                  {bill.hospital?.phone   && <div><strong>Phone No.:</strong> {bill.hospital.phone}</div>}
                  {bill.hospital?.email   && <div><strong>Email:</strong> {bill.hospital.email}</div>}
                  {bill.hospital?.website && <div><strong>Website:</strong> {bill.hospital.website}</div>}
                </div>
              </div>

              {/* Receipt banner */}
              <div className="bg-gray-900 text-white text-center py-1.5 text-sm font-semibold mb-3">
                Payment Receipt
              </div>

              {/* Patient block */}
              <div className="flex justify-between text-xs mb-4">
                <div>
                  <div><strong>Patient:</strong> {bill.patient?.name} {bill.patient?.case_id ? `(${bill.patient.case_id})` : ''}</div>
                  <div><strong>Case ID:</strong> {bill.case_id}</div>
                </div>
                <div className="text-right">
                  {bill.appointment_date && <div><strong>Admission Date:</strong> {new Date(bill.appointment_date).toLocaleDateString()}</div>}
                </div>
              </div>

              {/* Line items */}
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr className="text-gray-600">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Description</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Discount</th>
                    <th className="px-3 py-2 text-right">Tax</th>
                    <th className="px-3 py-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.lines.length === 0
                    ? <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-400">No charges</td></tr>
                    : bill.lines.map((l: any) => (
                      <tr key={l.no} className="border-t">
                        <td className="px-3 py-2">{l.no}</td>
                        <td className="px-3 py-2">{l.description}</td>
                        <td className="px-3 py-2 text-right">{l.qty}</td>
                        <td className="px-3 py-2 text-right">{l.discount.toFixed(2)} ({l.discount_pct.toFixed(2)}%)</td>
                        <td className="px-3 py-2 text-right">{l.tax.toFixed(2)} ({l.tax_pct.toFixed(2)}%)</td>
                        <td className="px-3 py-2 text-right font-semibold">{l.amount.toFixed(2)}</td>
                      </tr>
                    ))
                  }
                  {/* Totals */}
                  <tr className="border-t-2"><td colSpan={4}/><td className="px-3 py-1.5 text-right text-gray-600">Net Amount</td><td className="px-3 py-1.5 text-right font-semibold">₹{bill.net_amount.toFixed(2)}</td></tr>
                  <tr><td colSpan={4}/><td className="px-3 py-1.5 text-right text-gray-600">Discount</td><td className="px-3 py-1.5 text-right">₹{bill.discount.toFixed(2)} ({bill.discount_pct.toFixed(2)}%)</td></tr>
                  <tr><td colSpan={4}/><td className="px-3 py-1.5 text-right text-gray-600">Tax</td><td className="px-3 py-1.5 text-right">₹{bill.tax.toFixed(2)} ({bill.tax_pct.toFixed(2)}%)</td></tr>
                  <tr className="border-t"><td colSpan={4}/><td className="px-3 py-2 text-right font-semibold text-gray-800">Total</td><td className="px-3 py-2 text-right font-bold text-base">₹{bill.total.toFixed(2)}</td></tr>
                  <tr><td colSpan={4}/><td className="px-3 py-1.5 text-right text-brand-700">Paid</td><td className="px-3 py-1.5 text-right text-brand-700 font-semibold">₹{bill.paid.toFixed(2)}</td></tr>
                  <tr><td colSpan={4}/><td className="px-3 py-1.5 text-right text-rose-700">Due</td><td className="px-3 py-1.5 text-right text-rose-700 font-semibold">₹{bill.due.toFixed(2)}</td></tr>
                  {Number(bill.credit_balance) > 0 && (
                    <tr><td colSpan={4}/>
                      <td className="px-3 py-1.5 text-right text-amber-700">Credit Balance / Refund Due</td>
                      <td className="px-3 py-1.5 text-right text-amber-700 font-semibold">₹{bill.credit_balance.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  )
}
