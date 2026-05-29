// src/api/findingsSetup.ts
import api from '@/lib/axios'

export const findingsSetupApi = {
  // Categories (batch add)
  listCategories:   () => api.get('/findings-setup/categories'),
  addCategories:    (items: Array<{ name: string }>) => api.post('/findings-setup/categories', items),
  updateCategory:   (id: number, d: any) => api.put(`/findings-setup/categories/${id}`, d),
  deleteCategory:   (id: number) => api.delete(`/findings-setup/categories/${id}`),

  // Findings
  listFindings:     () => api.get('/findings-setup/findings'),
  addFinding:       (d: any) => api.post('/findings-setup/findings', d),
  updateFinding:    (id: number, d: any) => api.put(`/findings-setup/findings/${id}`, d),
  deleteFinding:    (id: number) => api.delete(`/findings-setup/findings/${id}`),
}
