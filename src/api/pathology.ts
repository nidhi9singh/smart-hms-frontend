// src/api/pathology.ts
import api from '@/lib/axios'

export const pathologyApi = {
  // Tests
  listTests:   (p?: Record<string, any>) => api.get('/pathology/tests', { params: p }),
  getTest:     (id: number)              => api.get(`/pathology/tests/${id}`),
  addTest:     (d: any)                  => api.post('/pathology/tests', d),
  updateTest:  (id: number, d: any)      => api.put(`/pathology/tests/${id}`, d),
  deleteTest:  (id: number)              => api.delete(`/pathology/tests/${id}`),

  // Bills
  listBills:   (p?: Record<string, any>) => api.get('/pathology/bills', { params: p }),
  getBill:     (id: number)              => api.get(`/pathology/bills/${id}`),
  generateBill:(d: any)                  => api.post('/pathology/bills', d),
  updateBill:  (id: number, d: any)      => api.put(`/pathology/bills/${id}`, d),
}
