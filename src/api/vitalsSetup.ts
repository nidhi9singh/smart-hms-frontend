// src/api/vitalsSetup.ts
import api from '@/lib/axios'

export const vitalsSetupApi = {
  listVitals:   () => api.get('/vitals-setup/vitals'),
  addVital:     (d: any) => api.post('/vitals-setup/vitals', d),
  updateVital:  (id: number, d: any) => api.put(`/vitals-setup/vitals/${id}`, d),
  deleteVital:  (id: number) => api.delete(`/vitals-setup/vitals/${id}`),
}
