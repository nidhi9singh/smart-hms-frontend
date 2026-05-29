// src/api/pathologySetup.ts
import api from '@/lib/axios'

export const pathSetupApi = {
  // Categories
  listCategories:  () => api.get('/pathology-setup/categories'),
  addCategory:     (d: any) => api.post('/pathology-setup/categories', d),
  updateCategory:  (id: number, d: any) => api.put(`/pathology-setup/categories/${id}`, d),
  deleteCategory:  (id: number) => api.delete(`/pathology-setup/categories/${id}`),

  // Units
  listUnits:       () => api.get('/pathology-setup/units'),
  addUnit:         (d: any) => api.post('/pathology-setup/units', d),
  updateUnit:      (id: number, d: any) => api.put(`/pathology-setup/units/${id}`, d),
  deleteUnit:      (id: number) => api.delete(`/pathology-setup/units/${id}`),

  // Parameters
  listParameters:  () => api.get('/pathology-setup/parameters'),
  addParameter:    (d: any) => api.post('/pathology-setup/parameters', d),
  updateParameter: (id: number, d: any) => api.put(`/pathology-setup/parameters/${id}`, d),
  deleteParameter: (id: number) => api.delete(`/pathology-setup/parameters/${id}`),
}
