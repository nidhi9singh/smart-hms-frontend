// src/api/radiology.ts
import api from '@/lib/axios'

export const radiologyApi = {
  // Tests
  listTests:   (p?: Record<string, any>) => api.get('/radiology/tests', { params: p }),
  getTest:     (id: number)              => api.get(`/radiology/tests/${id}`),
  addTest:     (d: any)                  => api.post('/radiology/tests', d),
  updateTest:  (id: number, d: any)      => api.put(`/radiology/tests/${id}`, d),
  deleteTest:  (id: number)              => api.delete(`/radiology/tests/${id}`),

  // Bills
  listBills:   (p?: Record<string, any>) => api.get('/radiology/bills', { params: p }),
  getBill:     (id: number)              => api.get(`/radiology/bills/${id}`),
  generateBill:(d: any)                  => api.post('/radiology/bills', d),
  updateBill:  (id: number, d: any)      => api.put(`/radiology/bills/${id}`, d),
}
