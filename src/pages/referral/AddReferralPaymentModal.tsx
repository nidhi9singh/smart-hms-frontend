// src/pages/referral/AddReferralPaymentModal.tsx
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { referralApi } from '@/api/referral'
import { patientsApi } from '@/api/patients'
import api from '@/lib/axios'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

interface Props {
  open: boolean
  payment?: any
  onClose: () => void
  onSuccess: () => void
}

const PATIENT_TYPES = ['OPD', 'IPD', 'Pharmacy', 'Pathology', 'Radiology', 'Blood Bank', 'Ambulance']

interface FormShape {
  patient_id        : number | ''
  patient_type      : string
  bill_id           : string   // value is "{bill_id}|{bill_no}|{amount}"
  patient_bill_amount: number
  payee_id          : number | ''
  commission_percent: number
  commission_amount : number
}

export default function AddReferralPaymentModal({ open, payment, onClose, onSuccess }: Props) {
  const [patientId, setPatientId] = useState<number | null>(null)

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormShape>({
    defaultValues: {
      patient_id: '', patient_type: '', bill_id: '',
      patient_bill_amount: 0, payee_id: '',
      commission_percent: 0, commission_amount: 0,
    },
  })

  useEffect(() => {
    if (!open) return
    reset({
      patient_id        : payment?.patient_id ?? '',
      patient_type      : payment?.patient_type ?? '',
      bill_id           : payment?.bill_id ? `${payment.bill_id}|${payment.bill_no || ''}|${payment.bill_amount || 0}` : '',
      patient_bill_amount: payment?.bill_amount ?? 0,
      payee_id          : payment?.referral_person_id ?? '',
      commission_percent: payment?.commission_percent ?? 0,
      commission_amount : payment?.commission_amount ?? 0,
    })
    setPatientId(payment?.patient_id ?? null)
  }, [open, payment, reset])

  const { data: patientsData } = useQuery({
    queryKey: ['ref-patients'], queryFn: () => patientsApi.list().then(r => r.data), enabled: open,
  })
  const patients: any[] = patientsData?.data ?? []

  const { data: peopleData } = useQuery({
    queryKey: ['ref-persons'],
    queryFn: () => referralApi.listPersons({ per_page: 500 }).then(r => r.data),
    enabled: open,
  })
  const people: any[] = peopleData?.data ?? []

  const patientType = watch('patient_type')

  // Bill lookup — pulls the patient's bills for the picked module
  const { data: billsData } = useQuery({
    queryKey: ['ref-bills', patientId, patientType],
    queryFn: async () => {
      if (!patientId || !patientType) return { data: [] }
      const mapping: Record<string, { url: string; idField: string; noField: string; amtField: string }> = {
        OPD:        { url: '/opd',                  idField: 'id', noField: 'opd_no',  amtField: 'amount' },
        IPD:        { url: '/ipd',                  idField: 'id', noField: 'ipd_no',  amtField: 'discharge_net_amount' },
        Pharmacy:   { url: '/pharmacy/bills',       idField: 'id', noField: 'bill_no', amtField: 'amount' },
        Pathology:  { url: '/pathology/bills',      idField: 'id', noField: 'bill_no', amtField: 'amount' },
        Radiology:  { url: '/radiology/bills',      idField: 'id', noField: 'bill_no', amtField: 'amount' },
        'Blood Bank': { url: '/blood-bank/issues',  idField: 'id', noField: 'issue_no', amtField: 'amount' },
        Ambulance:  { url: '/ambulance/bills',      idField: 'id', noField: 'bill_no', amtField: 'amount' },
      }
      const cfg = mapping[patientType]
      if (!cfg) return { data: [] }
      const res = await api.get(cfg.url, { params: { patient_id: patientId, per_page: 100 } })
      const rows: any[] = res.data?.data ?? []
      return {
        data: rows.map(r => ({
          id    : r[cfg.idField],
          bill_no: r[cfg.noField],
          amount: Number(r[cfg.amtField] ?? 0),
        })),
      }
    },
    enabled: open && !!patientId && !!patientType,
  })
  const bills: { id: number; bill_no: string; amount: number }[] = billsData?.data ?? []

  // When a bill is picked, fill bill_amount from the selected option
  const billChoice = watch('bill_id')
  useEffect(() => {
    if (!billChoice) return
    const parts = String(billChoice).split('|')
    const amt = Number(parts[2] || 0)
    if (amt) setValue('patient_bill_amount', amt)
  }, [billChoice, setValue])

  // When payee or patient_type changes, auto-pull the referral_person's commission for that module
  const payeeId = watch('payee_id')
  useEffect(() => {
    if (!payeeId || !patientType) return
    const p = people.find((x: any) => x.id === Number(payeeId))
    if (!p) return
    const rate = p.commissions?.[patientType] ?? p.standard_commission ?? 0
    setValue('commission_percent', rate)
  }, [payeeId, patientType, people, setValue])

  // Auto-compute commission amount = bill_amount × commission_percent / 100
  const billAmt = Number(watch('patient_bill_amount')) || 0
  const pct     = Number(watch('commission_percent')) || 0
  const commAmt = useMemo(() => Number((billAmt * pct / 100).toFixed(2)), [billAmt, pct])
  useEffect(() => { setValue('commission_amount', commAmt) }, [commAmt, setValue])

  const mut = useMutation({
    mutationFn: (raw: FormShape) => {
      const parts = String(raw.bill_id).split('|')
      const payload = {
        referral_person_id: Number(raw.payee_id),
        patient_id        : raw.patient_id ? Number(raw.patient_id) : undefined,
        patient_type      : raw.patient_type || undefined,
        bill_id           : Number(parts[0]) || undefined,
        bill_no           : parts[1] || undefined,
        bill_amount       : Number(raw.patient_bill_amount) || 0,
        commission_percent: Number(raw.commission_percent) || 0,
      }
      return payment
        ? referralApi.updatePayment(payment.id, payload)
        : referralApi.addPayment(payload)
    },
    onSuccess,
  })

  return (
    <Modal open={open} onClose={onClose} size="xl" title={payment ? 'Edit Referral Payment' : 'Add Referral Payment'}
      footer={
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
          <button form="ref-pay-form" type="submit" className="btn btn-primary" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      }>
      <form id="ref-pay-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="grid grid-cols-2 gap-6">
        <div>
          <FormField label="Select Patient">
            <select className="input"
                    value={patientId ?? ''}
                    onChange={e => {
                      const id = e.target.value ? Number(e.target.value) : null
                      setPatientId(id)
                      setValue('patient_id', (id ?? '') as any)
                    }}>
              <option value="">Select Patient</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.phone ? `· ${p.phone}` : ''}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="space-y-3">
          <FormField label="Patient Type" required>
            <select className="input" {...register('patient_type', { required: true })}>
              <option value="">Select Type</option>
              {PATIENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Bill No/Case Id" required>
            <select className="input" {...register('bill_id', { required: true })} disabled={!patientId || !patientType}>
              <option value="">{!patientId ? 'Pick a patient first' : !patientType ? 'Pick a patient type' : 'Select'}</option>
              {bills.map(b => (
                <option key={b.id} value={`${b.id}|${b.bill_no}|${b.amount}`}>
                  {b.bill_no} · ${b.amount.toFixed(2)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Patient Bill Amount ($)" required>
            <input type="number" step="0.01" className="input bg-gray-50"
                   {...register('patient_bill_amount', { required: true, valueAsNumber: true })} readOnly />
          </FormField>
          <FormField label="Payee" required>
            <select className="input" {...register('payee_id', { required: true })}>
              <option value="">Select Payee</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </FormField>
          <FormField label="Commission Percentage (%)" required>
            <input type="number" step="0.01" className="input" placeholder="Percentage"
                   {...register('commission_percent', { required: true, valueAsNumber: true })} />
          </FormField>
          <FormField label="Commission Amount ($)" required>
            <input type="number" step="0.01" className="input bg-gray-50"
                   {...register('commission_amount', { valueAsNumber: true })} readOnly />
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
