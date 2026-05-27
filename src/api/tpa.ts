// src/api/tpa.ts
import api from '@/lib/axios'

export const tpaApi = {
  list:    (p?: Record<string, any>) => api.get('/tpa', { params: p }),
  get:     (id: number)              => api.get(`/tpa/${id}`),
  add:     (d: any)                  => api.post('/tpa', d),
  update:  (id: number, d: any)      => api.put(`/tpa/${id}`, d),
  delete:  (id: number)              => api.delete(`/tpa/${id}`),

  // Claims
  listClaims:  (p?: Record<string, any>) => api.get('/tpa/claims/list', { params: p }),
  submitClaim: (d: any)                  => api.post('/tpa/claims', d),
  updateClaim: (id: number, d: any)      => api.patch(`/tpa/claims/${id}`, d),
}
