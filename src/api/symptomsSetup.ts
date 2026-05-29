// src/api/symptomsSetup.ts
import api from '@/lib/axios'

export const symptomsSetupApi = {
  // Types (batch add)
  listTypes:   () => api.get('/symptoms-setup/types'),
  addTypes:    (items: Array<{ name: string }>) => api.post('/symptoms-setup/types', items),
  updateType:  (id: number, d: any) => api.put(`/symptoms-setup/types/${id}`, d),
  deleteType:  (id: number) => api.delete(`/symptoms-setup/types/${id}`),

  // Heads
  listHeads:   () => api.get('/symptoms-setup/heads'),
  addHead:     (d: any) => api.post('/symptoms-setup/heads', d),
  updateHead:  (id: number, d: any) => api.put(`/symptoms-setup/heads/${id}`, d),
  deleteHead:  (id: number) => api.delete(`/symptoms-setup/heads/${id}`),
}
