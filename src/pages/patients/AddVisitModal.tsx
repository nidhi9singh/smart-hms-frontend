// src/pages/patients/AddVisitModal.tsx
import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  X, Phone, Mail, MapPin, Heart, Users2, Printer, Save, Loader2, Activity, Droplet,
} from 'lucide-react'
import { toast } from 'sonner'
import { opdApi, type ChargeItem } from '@/api/opd'
import { hrApi } from '@/api/hr'
import { useCreateOPD } from '@/hooks/useOPD'

function nowLocalISO() { return new Date().toISOString().slice(0, 16) }

export default function AddVisitModal({ open, onClose, patient }: {
  open: boolean
  onClose: () => void
  patient: any
}) {
  const qc = useQueryClient()
  const createOPD = useCreateOPD()

  const { data: staffData } = useQuery({
    queryKey: ['staff-all'],
    queryFn:  () => hrApi.listStaff({ per_page: 500 }).then(r => r.data),
    enabled:  open,
  })
  const doctors = ((staffData?.data ?? []) as any[]).filter(s => /doctor/i.test(s.role ?? ''))

  const { data: catData } = useQuery({
    queryKey: ['opd-charge-categories'],
    queryFn:  () => opdApi.chargeCategories().then(r => r.data),
    enabled:  open,
  })
  const categories = (catData?.data ?? []) as { id: number; name: string }[]

  const [form, setForm] = useState({
    appointment_date:       nowLocalISO(),
    casualty:               'No',
    old_patient:            'No',
    reference:              '',
    consultant_id:          '',
    apply_tpa:              false,
    charge_category_id:     '',
    charge_id:              '',
    applied_charge:         '',
    discount:               '0',
    tax:                    '',
    payment_mode:           'Cash',
    paid_amount:            '',
    live_consultation:      'No',
    is_antenatal:           false,
    symptoms_type:          '',
    symptoms_title:         '',
    symptoms_description:   '',
    note:                   '',
    any_known_allergies:    '',
    previous_medical_issue: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: chargesData } = useQuery({
    queryKey: ['opd-charges', form.charge_category_id],
    queryFn:  () => opdApi.charges(Number(form.charge_category_id)).then(r => r.data),
    enabled:  !!form.charge_category_id,
  })
  const chargeItems = (chargesData?.data ?? []) as ChargeItem[]

  const selectedCharge = useMemo(() => {
    if (!form.charge_id) return null
    return chargeItems.find(c => c.id === Number(form.charge_id)) ?? null
  }, [form.charge_id, chargeItems])

  const standardCharge = selectedCharge?.standard_charge ?? 0
  const appliedCharge  = Number(form.applied_charge) || standardCharge
  const discountPct    = Number(form.discount) || 0
  const taxPct         = Number(form.tax) || (selectedCharge?.tax_percent ?? 0)
  const discountAmt    = appliedCharge * (discountPct / 100)
  const afterDiscount  = appliedCharge - discountAmt
  const taxAmt         = afterDiscount * (taxPct / 100)
  const amount         = afterDiscount + taxAmt

  useEffect(() => {
    if (selectedCharge) {
      setForm(p => ({
        ...p,
        applied_charge: String(selectedCharge.standard_charge),
        tax:            String(selectedCharge.tax_percent ?? 0),
      }))
    }
  }, [selectedCharge])

  // Auto-mirror Paid Amount to Amount as charge/discount/tax change
  useEffect(() => {
    if (!amount) return
    setForm(p => ({ ...p, paid_amount: amount.toFixed(2) }))
  }, [amount])

  useEffect(() => {
    if (!open) return
    setForm({
      appointment_date:       nowLocalISO(),
      casualty:               'No',
      old_patient:            'Yes',
      reference:              '',
      consultant_id:          '',
      apply_tpa:              false,
      charge_category_id:     '',
      charge_id:              '',
      applied_charge:         '',
      discount:               '0',
      tax:                    '',
      payment_mode:           'Cash',
      paid_amount:            '',
      live_consultation:      'No',
      is_antenatal:           false,
      symptoms_type:          '',
      symptoms_title:         '',
      symptoms_description:   '',
      note:                   '',
      any_known_allergies:    patient?.known_allergies ?? '',
      previous_medical_issue: patient?.previous_medical_issue ?? '',
    })
    setErrors({})
  }, [open, patient])

  const setField = (k: string, v: any) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.appointment_date) e.appointment_date = 'Required'
    if (!form.consultant_id)    e.consultant_id    = 'Required'
    if (!form.applied_charge)   e.applied_charge   = 'Required'
    if (!form.paid_amount)      e.paid_amount      = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (printAfter: boolean) => {
    if (!validate()) return
    try {
      const payload: any = {
        patient_id:             Number(patient.id),
        consultant_id:          Number(form.consultant_id),
        appointment_date:       form.appointment_date,
        reference:              form.reference || undefined,
        symptoms_type:          form.symptoms_type || undefined,
        symptoms_title:         form.symptoms_title || undefined,
        symptoms_description:   form.symptoms_description || undefined,
        note:                   form.note || undefined,
        known_allergies:        form.any_known_allergies || undefined,
        previous_medical_issue: form.previous_medical_issue || undefined,
        is_antenatal:           form.is_antenatal,
        is_casualty:            form.casualty === 'Yes',
        is_old_patient:         form.old_patient === 'Yes',
        apply_tpa:              form.apply_tpa,
        live_consultation:      form.live_consultation === 'Yes',
        charge_category:        form.charge_category_id
          ? categories.find(c => c.id === Number(form.charge_category_id))?.name ?? ''
          : undefined,
        charge_name:            form.charge_id && chargeItems.length > 0
          ? chargeItems.find(c => c.id === Number(form.charge_id))?.name ?? form.charge_id
          : form.charge_id || undefined,
        standard_charge:        standardCharge || 0,
        applied_charge:         appliedCharge || 0,
        discount:               discountAmt || 0,
        discount_percent:       discountPct || 0,
        tax:                    taxAmt || 0,
        tax_percent:            taxPct || 0,
        amount:                 amount || 0,
        payment_mode:           form.payment_mode,
        paid_amount:            Number(form.paid_amount) || 0,
      }
      await createOPD.mutateAsync(payload)
      toast.success('Visit created')
      qc.invalidateQueries({ queryKey: ['patient-visit', patient.id] })
      qc.invalidateQueries({ queryKey: ['opd'] })
      onClose()
      if (printAfter) setTimeout(() => window.print(), 250)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? err?.response?.data?.message ?? 'Failed to save')
    }
  }

  if (!open || !patient) return null

  const age = [
    patient.age_years   ? `${patient.age_years} Year`   : null,
    patient.age_months  ? `${patient.age_months} Month` : null,
    patient.age_days    ? `${patient.age_days} Day`     : null,
  ].filter(Boolean).join(', ') || '—'

  const caseId = patient.case_id ?? patient.id

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-6">
      <div className="bg-white rounded-lg shadow-xl w-[1280px] max-w-[97vw] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#34ace0] text-white rounded-t-lg sticky top-0 z-10">
          <h2 className="text-base font-semibold">Patient Details</h2>
          <button onClick={onClose}><X size={18}/></button>
        </div>

        {/* Body — 2 columns: patient summary | visit form */}
        <div className="grid grid-cols-12 gap-0">
          {/* ═══════════ LEFT ═══════════ */}
          <div className="col-span-7 p-5">
            <div className="flex items-start gap-5 mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {patient.name} <span className="text-gray-500 font-normal">({caseId})</span>
                </h3>
                <PatientIcon icon={Activity}    text={patient.gender}/>
                <PatientIcon icon={Droplet}     text={patient.blood_group}/>
                <PatientIcon icon={Heart}       text={patient.marital_status}/>
                <PatientIcon icon={Users2}      text={age}/>
                <PatientIcon icon={Phone}       text={patient.phone}/>
                <PatientIcon icon={Mail}        text={patient.email}/>
                <PatientIcon icon={MapPin}      text={patient.address}/>
              </div>
              {patient.photo_path
                ? <img src={patient.photo_path} alt={patient.name} className="w-24 h-24 rounded object-cover border"/>
                : <div className="w-24 h-24 rounded bg-gray-100 border flex flex-col items-center justify-center text-gray-400 text-[10px]">
                    <Users2 size={26}/>
                    <span className="mt-0.5">NO IMAGE</span>
                    <span>AVAILABLE</span>
                  </div>}
            </div>

            <div className="space-y-1.5 text-sm mb-5">
              <LabelLine label="Any Known Allergies"          value={patient.known_allergies}/>
              <LabelLine label="Remarks"                      value={patient.remarks}/>
              <LabelLine label="TPA"                          value={patient.tpa?.name}/>
              <LabelLine label="TPA ID"                       value={patient.tpa_member_id}/>
              <LabelLine label="TPA Validity"                 value={patient.tpa_validity}/>
              <LabelLine label="National Identification Number" value={patient.national_id}/>
            </div>

            {/* Symptoms */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Field label="Symptoms Type">
                <select value={form.symptoms_type} onChange={e => setField('symptoms_type', e.target.value)} className="input w-full">
                  <option value=""></option>
                  <option>Fever</option>
                  <option>Cough</option>
                  <option>Headache</option>
                  <option>Stomach Pain</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Symptoms Title">
                <input value={form.symptoms_title} onChange={e => setField('symptoms_title', e.target.value)} className="input w-full"/>
              </Field>
              <Field label="Symptoms Description">
                <input value={form.symptoms_description} onChange={e => setField('symptoms_description', e.target.value)} className="input w-full"/>
              </Field>
            </div>

            {/* Allergies + Note */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Field label="Any Known Allergies">
                <input value={form.any_known_allergies} onChange={e => setField('any_known_allergies', e.target.value)} className="input w-full"/>
              </Field>
              <Field label="Note">
                <input value={form.note} onChange={e => setField('note', e.target.value)} className="input w-full"/>
              </Field>
            </div>

            {/* Previous Medical Issue */}
            <Field label="Previous Medical Issue">
              <input value={form.previous_medical_issue} onChange={e => setField('previous_medical_issue', e.target.value)} className="input w-full"/>
            </Field>
          </div>

          {/* ═══════════ RIGHT — visit/billing form (gray panel) ═══════════ */}
          <div className="col-span-5 bg-gray-50 p-5 border-l border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Visit Date" required error={errors.appointment_date}>
                <input type="datetime-local" value={form.appointment_date}
                  onChange={e => setField('appointment_date', e.target.value)}
                  className={`input w-full ${errors.appointment_date ? 'border-rose-400' : ''}`}/>
              </Field>
              <Field label="Case">
                <input readOnly placeholder="Auto" className="input w-full bg-gray-100"/>
              </Field>

              <Field label="Casualty">
                <select value={form.casualty} onChange={e => setField('casualty', e.target.value)} className="input w-full">
                  <option>No</option><option>Yes</option>
                </select>
              </Field>
              <Field label="Old Patient">
                <select value={form.old_patient} onChange={e => setField('old_patient', e.target.value)} className="input w-full">
                  <option>No</option><option>Yes</option>
                </select>
              </Field>

              <Field label="Reference">
                <input value={form.reference} onChange={e => setField('reference', e.target.value)} className="input w-full"/>
              </Field>
              <Field label="Consultant Doctor" required error={errors.consultant_id}>
                <select value={form.consultant_id} onChange={e => setField('consultant_id', e.target.value)}
                  className={`input w-full ${errors.consultant_id ? 'border-rose-400' : ''}`}>
                  <option value="">Select</option>
                  {doctors.map((d: any) => {
                    const n = d.full_name || [d.first_name, d.last_name].filter(Boolean).join(' ') || d.name || `Staff #${d.id}`
                    return <option key={d.id} value={d.id}>{n} ({d.staff_code})</option>
                  })}
                </select>
              </Field>
            </div>

            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input type="checkbox" checked={form.apply_tpa} onChange={e => setField('apply_tpa', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-500"/>
              <span className="text-sm text-gray-700">Apply TPA</span>
            </label>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Charge Category">
                <select value={form.charge_category_id} onChange={e => setField('charge_category_id', e.target.value)} className="input w-full">
                  <option value="">Select</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Standard Charge (₹)">
                <input readOnly value={standardCharge ? String(standardCharge) : ''} className="input w-full bg-gray-100"/>
              </Field>

              <Field label="Charge" required>
                {chargeItems.length > 0 ? (
                  <select value={form.charge_id} onChange={e => setField('charge_id', e.target.value)} className="input w-full">
                    <option value="">Select</option>
                    {chargeItems.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <input value={form.charge_id} onChange={e => setField('charge_id', e.target.value)} className="input w-full" placeholder="Charge"/>
                )}
              </Field>
              <Field label="Discount">
                <div className="flex items-center">
                  <input type="number" value={form.discount} onChange={e => setField('discount', e.target.value)}
                    className="input w-full rounded-r-none"/>
                  <span className="px-2 h-10 flex items-center bg-gray-100 border border-l-0 border-gray-300 rounded-r text-gray-500 text-sm">%</span>
                </div>
              </Field>

              <Field label="Applied Charge (₹)" required error={errors.applied_charge}>
                <input type="number" value={form.applied_charge} onChange={e => setField('applied_charge', e.target.value)}
                  className={`input w-full ${errors.applied_charge ? 'border-rose-400' : ''}`}/>
              </Field>
              <Field label="Amount (₹)" required>
                <input readOnly value={amount ? amount.toFixed(2) : ''} className="input w-full bg-gray-100 font-semibold"/>
              </Field>

              <Field label="Tax">
                <div className="flex items-center">
                  <input type="number" value={form.tax} onChange={e => setField('tax', e.target.value)}
                    className="input w-full rounded-r-none"/>
                  <span className="px-2 h-10 flex items-center bg-gray-100 border border-l-0 border-gray-300 rounded-r text-gray-500 text-sm">%</span>
                </div>
              </Field>
              <Field label="Paid Amount" required error={errors.paid_amount}>
                <input type="number" value={form.paid_amount} onChange={e => setField('paid_amount', e.target.value)}
                  className={`input w-full ${errors.paid_amount ? 'border-rose-400' : ''}`}/>
              </Field>

              <Field label="Payment Mode">
                <select value={form.payment_mode} onChange={e => setField('payment_mode', e.target.value)} className="input w-full">
                  {['Cash', 'Card', 'UPI', 'Cheque', 'Online'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <div/>

              <Field label="Live Consultation">
                <select value={form.live_consultation} onChange={e => setField('live_consultation', e.target.value)} className="input w-full">
                  <option>No</option><option>Yes</option>
                </select>
              </Field>
              <label className="flex items-end pb-1 gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_antenatal} onChange={e => setField('is_antenatal', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-500"/>
                <span className="text-sm text-gray-700">Is Antenatal</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 bg-gray-100 border-t border-gray-200 rounded-b-lg sticky bottom-0">
          <button onClick={() => submit(true)} disabled={createOPD.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#00a8e8] hover:bg-[#0090c7] text-white text-sm font-medium rounded">
            <Printer size={14}/> Save & Print
          </button>
          <button onClick={() => submit(false)} disabled={createOPD.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#00a8e8] hover:bg-[#0090c7] text-white text-sm font-medium rounded">
            {createOPD.isPending ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save
          </button>
        </div>
      </div>
    </div>
  )
}

function PatientIcon({ icon: Icon, text }: { icon: any; text?: string }) {
  if (!text) return null
  return (
    <div className="flex items-center gap-2 py-0.5 text-sm text-gray-700">
      <Icon size={13} className="text-gray-400"/> {text}
    </div>
  )
}

function LabelLine({ label, value }: { label: string; value?: any }) {
  return (
    <div className="flex items-baseline gap-2 py-0.5 border-b border-gray-100">
      <span className="text-gray-700 text-xs font-semibold">{label}</span>
      <span className="text-gray-700 flex-1">{value || ''}</span>
    </div>
  )
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-0.5 text-[11px] text-rose-600">{error}</p>}
    </div>
  )
}
