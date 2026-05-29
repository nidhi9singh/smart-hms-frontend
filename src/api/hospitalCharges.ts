// src/api/hospitalCharges.ts
import api from '@/lib/axios'

export const chargesApi = {
  // Charge Types
  listTypes:    () => api.get('/hospital-charges/charge-types'),
  typeColumns:  () => api.get('/hospital-charges/charge-types/matrix-columns'),
  addType:      (d: any) => api.post('/hospital-charges/charge-types', d),
  updateType:   (id: number, d: any) => api.put(`/hospital-charges/charge-types/${id}`, d),
  deleteType:   (id: number) => api.delete(`/hospital-charges/charge-types/${id}`),

  // Charge Categories
  listCategories:   (p?: Record<string, any>) => api.get('/hospital-charges/charge-categories', { params: p }),
  addCategory:      (d: any) => api.post('/hospital-charges/charge-categories', d),
  updateCategory:   (id: number, d: any) => api.put(`/hospital-charges/charge-categories/${id}`, d),
  deleteCategory:   (id: number) => api.delete(`/hospital-charges/charge-categories/${id}`),

  // Tax Categories
  listTaxCategories:  () => api.get('/hospital-charges/tax-categories'),
  addTaxCategory:     (d: any) => api.post('/hospital-charges/tax-categories', d),
  updateTaxCategory:  (id: number, d: any) => api.put(`/hospital-charges/tax-categories/${id}`, d),
  deleteTaxCategory:  (id: number) => api.delete(`/hospital-charges/tax-categories/${id}`),

  // Unit Types
  listUnitTypes:  () => api.get('/hospital-charges/unit-types'),
  addUnitType:    (d: any) => api.post('/hospital-charges/unit-types', d),
  updateUnitType: (id: number, d: any) => api.put(`/hospital-charges/unit-types/${id}`, d),
  deleteUnitType: (id: number) => api.delete(`/hospital-charges/unit-types/${id}`),

  // TPA list
  listTPA: () => api.get('/hospital-charges/tpa-list'),

  // Charges (main)
  listCharges:  (p?: Record<string, any>) => api.get('/hospital-charges', { params: p }),
  addCharge:    (d: any) => api.post('/hospital-charges', d),
  updateCharge: (id: number, d: any) => api.put(`/hospital-charges/${id}`, d),
  deleteCharge: (id: number) => api.delete(`/hospital-charges/${id}`),
}
