// src/api/certificates.ts
import api from '@/lib/axios'

export const certificatesApi = {
  // Templates
  listTemplates: (p?: Record<string, any>) => api.get('/certificates/templates', { params: p }),
  getTemplate:   (id: number)               => api.get(`/certificates/templates/${id}`),
  addTemplate:   (d: any)                   => api.post('/certificates/templates', d),
  updateTemplate:(id: number, d: any)       => api.put(`/certificates/templates/${id}`, d),
  deleteTemplate:(id: number)               => api.delete(`/certificates/templates/${id}`),
  uploadAsset:   (formData: FormData, label: string) =>
    api.post(`/certificates/templates/upload-asset?label=${encodeURIComponent(label)}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Lookups
  listPatients: (p?: Record<string, any>) => api.get('/certificates/patients', { params: p }),
  listStaff:    (p?: Record<string, any>) => api.get('/certificates/staff', { params: p }),

  // Generate
  generatePatientCertificate: (d: any) => api.post('/certificates/generate/patient-certificate', d),
  generatePatientIdCard:      (d: any) => api.post('/certificates/generate/patient-id-card', d),
  generateStaffIdCard:        (d: any) => api.post('/certificates/generate/staff-id-card', d),

  // History
  listGenerated: (p?: Record<string, any>) => api.get('/certificates/generated', { params: p }),
}
