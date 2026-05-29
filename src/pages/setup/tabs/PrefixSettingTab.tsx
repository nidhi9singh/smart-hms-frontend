// src/pages/setup/tabs/PrefixSettingTab.tsx
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { setupApi } from '@/api/setup'

const FIELDS: Array<[string, string]> = [
  ['ipd_no',                    'IPD No'],
  ['opd_no',                    'OPD No'],
  ['ipd_prescription',          'IPD Prescription'],
  ['opd_prescription',          'OPD Prescription'],
  ['appointment',               'Appointment'],
  ['pharmacy_bill',             'Pharmacy Bill'],
  ['operation_reference_no',    'Operation Reference No'],
  ['blood_bank_bill',           'Blood Bank Bill'],
  ['ambulance_call_bill',       'Ambulance Call Bill'],
  ['radiology_bill',            'Radiology Bill'],
  ['pathology_bill',            'Pathology Bill'],
  ['opd_checkup_id',            'OPD Checkup Id'],
  ['pharmacy_purchase_no',      'Pharmacy Purchase No'],
  ['transaction_id',            'Transaction ID'],
  ['birth_record_reference_no', 'Birth Record Reference No'],
  ['death_record_reference_no', 'Death Record Reference No'],
]


export default function PrefixSettingTab() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['setup-prefix'],
    queryFn: () => setupApi.getPrefix().then(r => r.data),
  })
  const setting = data?.data ?? {}
  const [form, setForm] = useState<any>({})

  useEffect(() => { if (Object.keys(setting).length) setForm({ ...setting }) }, [setting])

  const save = useMutation({
    mutationFn: (p: any) => setupApi.updatePrefix(p),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['setup-prefix'] }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = {}
    FIELDS.forEach(([k]) => { payload[k] = form[k] ?? '' })
    save.mutate(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800 border-b pb-2">Prefix Setting</h2>
      <div className="space-y-3 max-w-2xl">
        {FIELDS.map(([k, label]) => (
          <div key={k} className="grid grid-cols-2 gap-3 items-center">
            <label className="text-sm text-gray-700 text-right">{label}</label>
            <input value={form[k] ?? ''}
              onChange={e => setForm((f: any) => ({ ...f, [k]: e.target.value }))}
              className="input"/>
          </div>
        ))}
      </div>
      <div className="flex justify-end pt-3 border-t">
        <button type="submit" disabled={save.isPending} className="btn btn-primary">
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
