// src/api/patients.ts
import api from '@/lib/axios'

export interface Patient {
  id: number
  name: string
  guardian_name?: string
  guardian_relation?: string
  guardian_phone?: string
  gender?: string
  date_of_birth?: string
  age_years?: number
  age_months?: number
  age_days?: number
  blood_group?: string
  marital_status?: string
  phone?: string
  alternate_phone?: string
  email?: string
  address?: string
  known_allergies?: string
  remarks?: string
  previous_medical_issue?: string
  tpa_id?: number
  tpa_member_id?: string
  tpa_validity?: string
  national_id?: string
  registration_no?: string
  photo_path?: string
  is_dead?: boolean
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface PatientCreate {
  name: string
  guardian_name?: string
  guardian_relation?: string
  guardian_phone?: string
  gender?: string
  date_of_birth?: string
  age_years?: number
  age_months?: number
  age_days?: number
  blood_group?: string
  marital_status?: string
  phone?: string
  alternate_phone?: string
  email?: string
  address?: string
  known_allergies?: string
  remarks?: string
  previous_medical_issue?: string
  tpa_id?: number
  tpa_member_id?: string
  tpa_validity?: string
  national_id?: string
}

export const patientsApi = {
  list:   (p?: Record<string,string>) => api.get('/opd/patients', { params: p }),
  get:    (id: number)                => api.get(`/opd/patients/${id}`),
  create: (d: PatientCreate)          => api.post('/opd/patients', d),
  update: (id: number, d: Partial<PatientCreate>) => api.put(`/opd/patients/${id}`, d),
  photo:  (id: number, f: File) => {
    const fd = new FormData()
    fd.append('file', f)
    return api.post(`/opd/patients/${id}/photo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}