// src/pages/opd/AddOPDModal.tsx
import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { opdApi, type ChargeItem } from '@/api/opd'
import { hrApi } from '@/api/hr'
import { patientsApi } from '@/api/patients'
import { useCreateOPD } from '@/hooks/useOPD'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

// Inline input components (avoids missing export issues)
function InputField(props: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const { error, className = '', ...rest } = props
  return <input className={`w-full h-10 px-3 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 ${error ? 'border-red-400' : 'border-gray-300'} ${className}`} {...rest} />
}

function SelectField({ children, error, className = '', ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean; children: React.ReactNode }) {
  return <select className={`w-full h-10 px-3 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white ${error ? 'border-red-400' : 'border-gray-300'} ${className}`} {...rest}>{children}</select>
}

function TextareaField(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props
  return <textarea className={`w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 ${className}`} {...rest} />
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function todayISO() { return new Date().toISOString().slice(0, 16) }

export default function AddOPDModal({ open, onClose, onSuccess }: Props) {
  const createOPD = useCreateOPD()

  // ── Lookups ──────────────────────────
  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'], queryFn: () => patientsApi.list({ per_page: 500 }).then(r => r.data),
    enabled: open,
  })
  const patients = (patientsData?.data ?? patientsData ?? []) as any[]
  const patientList = Array.isArray(patients) ? patients : []

  const { data: staffData } = useQuery({
    queryKey: ['staff-all'], queryFn: () => hrApi.listStaff({ per_page: 500 }).then(r => r.data),
    enabled: open,
  })
  const allStaff = (staffData?.data ?? staffData ?? []) as any[]
  const doctors = Array.isArray(allStaff)
    ? allStaff.filter((s: any) => /doctor/i.test(s.role ?? ''))
    : []

  const { data: catData } = useQuery({
    queryKey: ['opd-charge-categories'], queryFn: () => opdApi.chargeCategories().then(r => r.data),
    enabled: open,
  })
  const categories = (catData?.data ?? []) as { id: number; name: string }[]

  // ── Form state ───────────────────────
  const [form, setForm] = useState({
    patient_id:            '',
    appointment_date:      todayISO(),
    case_id:               '',
    casualty:              'No',
    old_patient:           'No',
    reference:             '',
    consultant_id:         '',
    apply_tpa:             false,
    charge_category_id:    '',
    charge_id:             '',
    applied_charge:        '',
    discount:              '0',
    tax:                   '',
    payment_mode:          'Cash',
    paid_amount:           '',
    live_consultation:     'No',
    // Medical
    symptoms_type:         '',
    symptoms_title:        '',
    symptoms_description:  '',
    note:                  '',
    any_known_allergies:   '',
    previous_medical_issue: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // ── Charge items lookup ──────────────
  const { data: chargesData } = useQuery({
    queryKey: ['opd-charges', form.charge_category_id],
    queryFn: () => opdApi.charges(Number(form.charge_category_id)).then(r => r.data),
    enabled: !!form.charge_category_id,
  })
  const chargeItems = (chargesData?.data ?? []) as ChargeItem[]

  // ── Selected charge detail ───────────
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

  // Auto-fill applied charge when charge selected
  useEffect(() => {
    if (selectedCharge) {
      setForm(p => ({
        ...p,
        applied_charge: String(selectedCharge.standard_charge),
        tax: String(selectedCharge.tax_percent ?? 0),
      }))
    }
  }, [selectedCharge])

  // ── Reset on open ────────────────────
  useEffect(() => {
    if (open) {
      setForm(f => ({ ...f, appointment_date: todayISO(), case_id: '' }))
      setErrors({})
    }
  }, [open])

  const setField = (k: string, v: string | boolean) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => { const n = { ...p }; delete n[k]; return n })
  }

  // ── Validate + Submit ────────────────
  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.patient_id)       e.patient_id       = 'Required'
    if (!form.appointment_date) e.appointment_date  = 'Required'
    if (!form.consultant_id)    e.consultant_id     = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    try {
      const payload: any = {
        patient_id:              Number(form.patient_id),
        consultant_id:           Number(form.consultant_id),
        appointment_date:        form.appointment_date || undefined,
        reference:               form.reference || undefined,
        // Clinical — individual fields matching backend OpdVisitCreate
        symptoms_type:           form.symptoms_type || undefined,
        symptoms_title:          form.symptoms_title || undefined,
        symptoms_description:    form.symptoms_description || undefined,
        note:                    form.note || undefined,
        known_allergies:         form.any_known_allergies || undefined,
        previous_medical_issue:  form.previous_medical_issue || undefined,
        // Flags — backend uses is_ prefix
        is_antenatal:            false,
        is_casualty:             form.casualty === 'Yes',
        is_old_patient:          form.old_patient === 'Yes',
        apply_tpa:               form.apply_tpa || false,
        live_consultation:       form.live_consultation === 'Yes',
        // Charge — backend uses string names, not IDs
        charge_category:         form.charge_category_id
          ? categories.find(c => c.id === Number(form.charge_category_id))?.name ?? ''
          : undefined,
        charge_name:             form.charge_id && chargeItems.length > 0
          ? chargeItems.find(c => c.id === Number(form.charge_id))?.name ?? form.charge_id
          : form.charge_id || undefined,
        standard_charge:         standardCharge || 0,
        applied_charge:          appliedCharge || 0,
        // Backend has both flat amount + percentage
        discount:                discountAmt || 0,
        discount_percent:        discountPct || 0,
        tax:                     taxAmt || 0,
        tax_percent:             taxPct || 0,
        amount:                  amount || 0,
        // Payment — backend uses paid_amount, not paid
        payment_mode:            form.payment_mode || 'Cash',
        paid_amount:             form.paid_amount ? Number(form.paid_amount) : 0,
      }

      await createOPD.mutateAsync(payload)
      onSuccess()
    } catch (err: any) {
      console.error('OPD create error:', err?.response?.data ?? err)
      alert(err?.response?.data?.message ?? err?.response?.data?.detail ?? 'Failed to save. Check console for details.')
    }
  }

  const isBusy = createOPD.isPending

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Patient — OPD"
      size="xl"
      headerClassName="bg-[#34ace0] text-white"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={isBusy}
            className="flex items-center gap-2 px-5 py-2 bg-[#00a8e8] hover:bg-[#0090c7] text-white text-sm font-medium rounded transition-colors">
            {isBusy && <Loader2 className="w-4 h-4 animate-spin" />} Save
          </button>
        </div>
      }
    >
      {/* Patient selector at top */}
      <div className="mb-4">
        <FormField label="Patient" required error={errors.patient_id}>
          <SelectField value={form.patient_id} onChange={e => setField('patient_id', e.target.value)} error={!!errors.patient_id}>
            <option value="">Select Patient</option>
            {patientList.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
          </SelectField>
        </FormField>
      </div>

      {/* ── Two-column layout ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0">

        {/* ═══ LEFT COLUMN — Medical Info ═══ */}
        <div className="space-y-4 border-r border-gray-100 pr-6">
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Symptoms Type">
              <InputField value={form.symptoms_type} onChange={e => setField('symptoms_type', e.target.value)} />
            </FormField>
            <FormField label="Symptoms Title">
              <InputField value={form.symptoms_title} onChange={e => setField('symptoms_title', e.target.value)} />
            </FormField>
            <FormField label="Symptoms Description" className="col-span-1">
              <TextareaField value={form.symptoms_description} onChange={e => setField('symptoms_description', e.target.value)} rows={2} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Note">
              <TextareaField value={form.note} onChange={e => setField('note', e.target.value)} rows={3} />
            </FormField>
            <FormField label="Any Known Allergies">
              <TextareaField value={form.any_known_allergies} onChange={e => setField('any_known_allergies', e.target.value)} rows={3} />
            </FormField>
          </div>

          <FormField label="Previous Medical Issue">
            <TextareaField value={form.previous_medical_issue} onChange={e => setField('previous_medical_issue', e.target.value)} rows={2} />
          </FormField>
        </div>

        {/* ═══ RIGHT COLUMN — Appointment + Billing ═══ */}
        <div className="space-y-4 pl-2">

          {/* Row: Appointment Date + Case */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Appointment Date" required error={errors.appointment_date}>
              <InputField type="datetime-local" value={form.appointment_date} onChange={e => setField('appointment_date', e.target.value)} error={!!errors.appointment_date} />
            </FormField>
            <FormField label="Case">
              <InputField value={form.case_id} readOnly placeholder="Auto-generated" className="bg-gray-50" />
            </FormField>
          </div>

          {/* Row: Casualty + Old Patient */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Casualty">
              <SelectField value={form.casualty} onChange={e => setField('casualty', e.target.value)}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </SelectField>
            </FormField>
            <FormField label="Old Patient">
              <SelectField value={form.old_patient} onChange={e => setField('old_patient', e.target.value)}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </SelectField>
            </FormField>
          </div>

          {/* Row: Reference + Consultant Doctor */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Reference">
              <InputField value={form.reference} onChange={e => setField('reference', e.target.value)} />
            </FormField>
            <FormField label="Consultant Doctor" required error={errors.consultant_id}>
              <SelectField value={form.consultant_id} onChange={e => setField('consultant_id', e.target.value)} error={!!errors.consultant_id}>
                <option value="">Select</option>
                {doctors.map((d: any) => <option key={d.id} value={d.id}>{d.name} ({d.staff_code})</option>)}
              </SelectField>
            </FormField>
          </div>

          {/* Apply TPA checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.apply_tpa} onChange={e => setField('apply_tpa', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-500" />
            <span className="text-sm text-gray-700 font-medium">Apply TPA</span>
          </label>

          {/* Row: Charge Category + Charge */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Charge Category">
              <SelectField value={form.charge_category_id} onChange={e => setField('charge_category_id', e.target.value)}>
                <option value="">Select</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectField>
            </FormField>
            <FormField label="Charge">
              {chargeItems.length > 0 ? (
                <SelectField value={form.charge_id} onChange={e => setField('charge_id', e.target.value)}>
                  <option value="">Select</option>
                  {chargeItems.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </SelectField>
              ) : (
                <InputField placeholder="e.g. Consultation Fee" value={form.charge_id} onChange={e => setField('charge_id', e.target.value)} />
              )}
            </FormField>
          </div>

          {/* Row: Standard Charge + Applied Charge */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Standard Charge (₹)">
              <InputField type="number" value={standardCharge ? String(standardCharge) : ''} onChange={e => setField('standard_charge_manual', e.target.value)} placeholder="0" />
            </FormField>
            <FormField label="Applied Charge (₹)">
              <InputField type="number" value={form.applied_charge} onChange={e => setField('applied_charge', e.target.value)} />
            </FormField>
          </div>

          {/* Row: Discount + Tax */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Discount">
              <div className="flex items-center">
                <InputField type="number" value={form.discount} onChange={e => setField('discount', e.target.value)} className="rounded-r-none" />
                <span className="flex items-center justify-center w-10 h-10 bg-gray-100 border border-l-0 border-gray-300 rounded-r text-gray-500 text-sm">%</span>
              </div>
            </FormField>
            <FormField label="Tax">
              <div className="flex items-center">
                <InputField type="number" value={form.tax} onChange={e => setField('tax', e.target.value)} className="rounded-r-none" />
                <span className="flex items-center justify-center w-10 h-10 bg-gray-100 border border-l-0 border-gray-300 rounded-r text-gray-500 text-sm">%</span>
              </div>
            </FormField>
          </div>

          {/* Row: Amount + Paid Amount */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Amount (₹)">
              <InputField value={amount ? amount.toFixed(2) : ''} readOnly className="bg-gray-50 font-semibold" />
            </FormField>
            <FormField label="Paid Amount (₹)">
              <InputField type="number" value={form.paid_amount} onChange={e => setField('paid_amount', e.target.value)} />
            </FormField>
          </div>

          {/* Row: Payment Mode + Live Consultation */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Payment Mode">
              <SelectField value={form.payment_mode} onChange={e => setField('payment_mode', e.target.value)}>
                {['Cash', 'Card', 'UPI', 'Cheque', 'Online'].map(m => <option key={m} value={m}>{m}</option>)}
              </SelectField>
            </FormField>
            <FormField label="Live Consultation">
              <SelectField value={form.live_consultation} onChange={e => setField('live_consultation', e.target.value)}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </SelectField>
            </FormField>
          </div>
        </div>
      </div>
    </Modal>
  )
}
