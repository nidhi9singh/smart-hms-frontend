// src/api/radiologySetup.ts
import api from '@/lib/axios'

export const radSetupApi = {
  // Categories
  listCategories:  () => api.get('/radiology-setup/categories'),
  addCategory:     (d: any) => api.post('/radiology-setup/categories', d),
  updateCategory:  (id: number, d: any) => api.put(`/radiology-setup/categories/${id}`, d),
  deleteCategory:  (id: number) => api.delete(`/radiology-setup/categories/${id}`),

  // Units
  listUnits:       () => api.get('/radiology-setup/units'),
  addUnit:         (d: any) => api.post('/radiology-setup/units', d),
  updateUnit:      (id: number, d: any) => api.put(`/radiology-setup/units/${id}`, d),
  deleteUnit:      (id: number) => api.delete(`/radiology-setup/units/${id}`),

  // Parameters
  listParameters:  () => api.get('/radiology-setup/parameters'),
  addParameter:    (d: any) => api.post('/radiology-setup/parameters', d),
  updateParameter: (id: number, d: any) => api.put(`/radiology-setup/parameters/${id}`, d),
  deleteParameter: (id: number) => api.delete(`/radiology-setup/parameters/${id}`),
}
