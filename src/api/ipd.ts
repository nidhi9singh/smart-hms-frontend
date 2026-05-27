// src/api/ipd.ts
import api from '@/lib/axios'

export const ipdApi = {
  list:      (p?: Record<string,any>) => api.get('/ipd', { params: p }),
  discharged:(p?: Record<string,any>) => api.get('/ipd/discharged/list', { params: p }),
  get:       (id: number)             => api.get(`/ipd/${id}`),
  admit:     (d: any)                 => api.post('/ipd', d),
  update:    (id: number, d: any)     => api.put(`/ipd/${id}`, d),
  delete:    (id: number)             => api.delete(`/ipd/${id}`),
  discharge: (id: number, d: any)     => api.patch(`/ipd/${id}/discharge`, d),

  nurseNotes:    (id: number)         => api.get(`/ipd/${id}/nurse-notes`),
  addNurseNote:  (id: number, d: any) => api.post(`/ipd/${id}/nurse-notes`, d),
  deleteNurseNote:(id: number, nid: number) => api.delete(`/ipd/${id}/nurse-notes/${nid}`),

  medications:      (id: number)         => api.get(`/ipd/${id}/medications`),
  addMedication:    (id: number, d: any) => api.post(`/ipd/${id}/medications`, d),
  deleteMedication: (id: number, mid: number) => api.delete(`/ipd/${id}/medications/${mid}`),

  prescriptions:   (id: number)         => api.get(`/ipd/${id}/prescriptions`),
  addPrescription: (id: number, d: any) => api.post(`/ipd/${id}/prescriptions`, d),

  consultantRegister:    (id: number)         => api.get(`/ipd/${id}/consultant-register`),
  addConsultantRegister: (id: number, d: any) => api.post(`/ipd/${id}/consultant-register`, d),

  labInvestigations: (id: number)         => api.get(`/ipd/${id}/lab-investigations`),
  addLab:            (id: number, d: any) => api.post(`/ipd/${id}/lab-investigations`, d),

  operations:   (id: number)         => api.get(`/ipd/${id}/operations`),
  addOperation: (id: number, d: any) => api.post(`/ipd/${id}/operations`, d),

  charges:       (id: number)           => api.get(`/ipd/${id}/charges`),
  addCharge:     (id: number, d: any)   => api.post(`/ipd/${id}/charges`, d),
  deleteCharge:  (id: number, cid: number) => api.delete(`/ipd/${id}/charges/${cid}`),

  payments:   (id: number)         => api.get(`/ipd/${id}/payments`),
  addPayment: (id: number, d: any) => api.post(`/ipd/${id}/payments`, d),

  liveConsultations:   (id: number)         => api.get(`/ipd/${id}/live-consultations`),
  addLiveConsultation: (id: number, d: any) => api.post(`/ipd/${id}/live-consultations`, d),

  bedHistory: (id: number)         => api.get(`/ipd/${id}/bed-history`),
  timeline:   (id: number)         => api.get(`/ipd/${id}/timeline`),
  addTimeline:(id: number, d: any) => api.post(`/ipd/${id}/timeline`, d),
  vitals:     (id: number)         => api.get(`/ipd/${id}/vitals`),
  addVital:   (id: number, d: any) => api.post(`/ipd/${id}/vitals`, d),

  treatmentHistory: (patientId: number) => api.get(`/ipd/patients/${patientId}/treatment-history`),
  listBeds: (params?: any) => api.get('/ipd/beds', { params }),
}
