// src/pages/patients/AddVitalModal.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Save, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { opdApi } from '@/api/opd'

type Row = { vital: string; value: string; date: string }

const VITAL_OPTIONS: { label: string; field: string; numeric: boolean }[] = [
  { label: 'Blood Pressure',    field: 'blood_pressure',    numeric: false },
  { label: 'Temperature (°F)',  field: 'temperature',       numeric: true  },
  { label: 'Pulse (bpm)',       field: 'pulse',             numeric: true  },
  { label: 'Weight (kg)',       field: 'weight',            numeric: true  },
  { label: 'Height (cm)',       field: 'height',            numeric: true  },
  { label: 'Oxygen Saturation', field: 'oxygen_saturation', numeric: true  },
  { label: 'Respiratory Rate',  field: 'respiratory_rate',  numeric: true  },
]

function today() { return new Date().toISOString().slice(0, 10) }
function emptyRow(): Row { return { vital: '', value: '', date: today() } }

export default function AddVitalModal({ open, onClose, patientId }: {
  open: boolean
  onClose: () => void
  patientId: number
}) {
  const qc = useQueryClient()
  const [rows, setRows] = useState<Row[]>([emptyRow()])

  useEffect(() => { if (open) setRows([emptyRow()]) }, [open])

  const setRow = (idx: number, patch: Partial<Row>) =>
    setRows(rs => rs.map((r, i) => i === idx ? { ...r, ...patch } : r))
  const addRow    = () => setRows(rs => [...rs, emptyRow()])
  const removeRow = (idx: number) => setRows(rs => rs.length === 1 ? rs : rs.filter((_, i) => i !== idx))

  const save = useMutation({
    mutationFn: async () => {
      const groups = new Map<string, any>()
      for (const r of rows) {
        if (!r.vital || !r.value || !r.date) continue
        const opt = VITAL_OPTIONS.find(o => o.label === r.vital)
        if (!opt) continue
        const key = r.date
        const payload = groups.get(key) ?? { date: r.date }
        payload[opt.field] = opt.numeric ? Number(r.value) : r.value
        groups.set(key, payload)
      }
      const payloads = Array.from(groups.values())
      if (payloads.length === 0) throw new Error('Fill in at least one complete row')
      await Promise.all(payloads.map(p => opdApi.addVital(patientId, p)))
    },
    onSuccess: () => {
      toast.success('Vitals saved')
      qc.invalidateQueries({ queryKey: ['patient-vitals', patientId] })
      onClose()
    },
    onError: (e: any) => toast.error(e.message ?? e.response?.data?.detail ?? 'Failed to save vitals'),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-xl w-[920px] max-w-[97vw]">
        <div className="flex items-center justify-between px-5 py-3 bg-[#059669] text-white rounded-t-lg">
          <h2 className="text-base font-semibold">Add Vital</h2>
          <button onClick={onClose}><X size={18}/></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="p-5">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 mb-1 text-sm font-medium text-gray-700">
            <div>Vital Name <span className="text-red-500">*</span></div>
            <div>Vital Value <span className="text-red-500">*</span></div>
            <div>Date <span className="text-red-500">*</span></div>
            <div className="w-6"/>
          </div>

          {rows.map((r, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 mb-2 items-center">
              <select required value={r.vital} onChange={e => setRow(idx, { vital: e.target.value })}
                className="input w-full">
                <option value="">Select</option>
                {VITAL_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
              </select>
              <input required value={r.value} onChange={e => setRow(idx, { value: e.target.value })}
                className="input w-full"/>
              <input required type="date" value={r.date} onChange={e => setRow(idx, { date: e.target.value })}
                className="input w-full"/>
              <button type="button" onClick={() => removeRow(idx)}
                className={`p-1 ${rows.length === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-rose-500 hover:bg-rose-50'} rounded`}
                disabled={rows.length === 1} title="Remove">
                <Trash2 size={16}/>
              </button>
            </div>
          ))}

          <button type="button" onClick={addRow}
            className="flex items-center gap-1 mt-1 px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-medium rounded">
            <Plus size={12}/> Add
          </button>

          <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
            <button type="submit" disabled={save.isPending}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white text-sm font-medium rounded">
              {save.isPending ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
