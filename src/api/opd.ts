// src/api/opd.ts
import api from '@/lib/axios'
import type { ApiResponse, PaginatedResponse } from '@/types'

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */
export interface OPDCreate {
  patient_id:              number
  appointment_date:        string
  consultant_id:           number
  // Medical
  symptoms_type?:          string
  symptoms_title?:         string
  symptoms_description?:   string
  note?:                   string
  any_known_allergies?:    string
  previous_medical_issue?: string
  is_antenatal?:           boolean
  // Appointment
  casualty?:               boolean
  old_patient?:            boolean
  reference?:              string
  // TPA
  apply_tpa?:              boolean
  tpa_id?:                 number
  // Charges
  charge_category_id?:     number
  charge_id?:              number
  standard_charge?:        number
  applied_charge?:         number
  discount?:               number
  tax?:                    number
  amount?:                 number
  // Payment
  payment_mode?:           string
  paid_amount?:            number
  // Consultation
  live_consultation?:      boolean
}

export interface OPDRecord {
  id:                      number
  opd_no:                  string
  case_id:                 string
  patient_id:              number
  patient_name?:           string
  appointment_date:        string
  generated_by?:           string
  generated_by_id?:        number
  consultant_id?:          number
  consultant_name?:        string
  consultant_code?:        number
  reference?:              string
  symptoms?:               string
  symptoms_type?:          string
  symptoms_title?:         string
  symptoms_description?:   string
  note?:                   string
  any_known_allergies?:    string
  previous_medical_issue?: string
  is_antenatal:            boolean
  casualty?:               boolean
  // Patient info (for detail view)
  gender?:                 string
  age?:                    string
  phone?:                  string
  guardian_name?:           string
  photo_path?:             string
  // TPA
  tpa?:                    string
  tpa_id_str?:             string
  tpa_validity?:           string
  // Billing summary
  opd_billing?:            { percent: number; paid: number; total: number }
  pharmacy_billing?:       { percent: number; paid: number; total: number }
  pathology_billing?:      { percent: number; paid: number; total: number }
  radiology_billing?:      { percent: number; paid: number; total: number }
  blood_bank_billing?:     { percent: number; paid: number; total: number }
  ambulance_billing?:      { percent: number; paid: number; total: number }
  // Charges
  charges?:                OPDCharge[]
  payments?:               OPDPayment[]
  medications?:            OPDMedication[]
  lab_investigations?:     OPDLabInvestigation[]
  operations?:             OPDOperation[]
  live_consultations?:     OPDLiveConsultation[]
  // Status
  status?:                 string
  created_at?:             string
}

export interface OPDCharge {
  id:               number
  name:             string
  charge_type:      string
  standard_charge:  number
  discount:         number
  tax:              number
  applied_charge:   number
  amount:           number
}

export interface OPDPayment {
  id:              number
  transaction_id:  string
  date:            string
  note?:           string
  payment_mode:    string
  paid_amount:     number
}

export interface OPDMedication {
  id:           number
  date:         string
  medicine_name: string
  dose:         string
  time:         string
  remark?:      string
}

export interface OPDLabInvestigation {
  id:              number
  test_name:       string
  lab:             string
  sample_collected: string
  expected_date:   string
  approved_by?:    string
}

export interface OPDOperation {
  id:                  number
  reference_no:        string
  operation_date:      string
  operation_name:      string
  operation_category:  string
  ot_technician?:      string
}

export interface OPDLiveConsultation {
  id:                 number
  consultation_title: string
  date:               string
  created_by:         string
  created_for:        string
  patient:            string
}

export interface ChargeCategory {
  id:   number
  name: string
}

export interface ChargeItem {
  id:              number
  name:            string
  category_id:     number
  standard_charge: number
  tax_percent:     number
}

/* ═══════════════════════════════════════════
   API
   ═══════════════════════════════════════════ */
export const opdApi = {
  list: (params?: {
    filter_type?:   'today' | 'upcoming' | 'old'
    consultant_id?: number
    search?:        string
    page?:          number
    per_page?:      number
  }) => api.get<PaginatedResponse<OPDRecord[]>>('/opd', { params }),

  get: (id: number) =>
    api.get<ApiResponse<OPDRecord>>(`/opd/${id}`),

  getByCase: (case_id: string) =>
    api.get<ApiResponse<OPDRecord>>(`/opd/case/${case_id}`),

  create: (data: Partial<OPDCreate> & Record<string, any>) =>
    api.post<ApiResponse<{ id: number; opd_no: string; case_id: string }>>('/opd', data),

  update: (id: number, data: Partial<OPDCreate>) =>
    api.put<ApiResponse<null>>(`/opd/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/opd/${id}`),

  // Charge categories
  chargeCategories: () =>
    api.get<ApiResponse<ChargeCategory[]>>('/opd/charge-categories'),

  // Charges by category
  charges: (categoryId?: number) =>
    api.get<ApiResponse<ChargeItem[]>>('/opd/charges', { params: { category_id: categoryId } }),

  // Patient visits
  patientVisits: (patientId: number) =>
    api.get<PaginatedResponse<OPDRecord[]>>(`/opd/patients/${patientId}/visits`),

  // Vitals
  vitals: (patientId: number) =>
    api.get<ApiResponse<any[]>>(`/opd/patients/${patientId}/vitals`),

  addVital: (patientId: number, data: any) =>
    api.post<ApiResponse<any>>(`/opd/patients/${patientId}/vitals`, data),

  // Timeline
  timeline: (opdId: number) =>
    api.get<ApiResponse<any[]>>(`/opd/${opdId}/timeline`),

  addTimeline: (opdId: number, data: { title: string; description?: string }) =>
    api.post<ApiResponse<any>>(`/opd/${opdId}/timeline`, data),

  // Treatment history
  treatmentHistory: (patientId: number) =>
    api.get<ApiResponse<any[]>>(`/opd/patients/${patientId}/treatment-history`),
}