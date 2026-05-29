// src/api/liveConsultation.ts
import api from '@/lib/axios'

export const liveApi = {
  // Consultations
  listConsultations: (p?: Record<string, any>) => api.get('/live-consultation', { params: p }),
  getConsultation:   (id: number) => api.get(`/live-consultation/${id}`),
  addConsultation:   (d: any) => api.post('/live-consultation', d),
  updateConsultation:(id: number, d: any) => api.patch(`/live-consultation/${id}`, d),
  deleteConsultation:(id: number) => api.delete(`/live-consultation/${id}`),

  // Meetings
  listMeetings:  (p?: Record<string, any>) => api.get('/live-consultation/meetings', { params: p }),
  getMeeting:    (id: number) => api.get(`/live-consultation/meetings/${id}`),
  addMeeting:    (d: any) => api.post('/live-consultation/meetings', d),
  updateMeeting: (id: number, d: any) => api.patch(`/live-consultation/meetings/${id}`, d),
  deleteMeeting: (id: number) => api.delete(`/live-consultation/meetings/${id}`),

  // Lookups (reuse certificate endpoints which expose simplified lists)
  listPatients:  (p?: Record<string, any>) => api.get('/certificates/patients', { params: p }),
  listStaff:     (p?: Record<string, any>) => api.get('/certificates/staff', { params: p }),
}
