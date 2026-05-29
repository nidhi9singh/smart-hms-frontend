// src/api/pharmacySetup.ts
import api from '@/lib/axios'

export type NameKey =
  | 'categories' | 'companies' | 'groups' | 'units' | 'intervals' | 'durations'


export const pharmSetupApi = {
  // Generic name-only resources
  list:   (key: NameKey) => api.get(`/pharmacy-setup/${key}`),
  add:    (key: NameKey, items: Array<{ name: string }>) =>
    api.post(`/pharmacy-setup/${key}`, items),
  update: (key: NameKey, id: number, d: any) =>
    api.put(`/pharmacy-setup/${key}/${id}`, d),
  delete: (key: NameKey, id: number) =>
    api.delete(`/pharmacy-setup/${key}/${id}`),

  // Suppliers (full fields, single-row)
  listSuppliers:  () => api.get('/pharmacy-setup/suppliers'),
  addSupplier:    (d: any) => api.post('/pharmacy-setup/suppliers', d),
  updateSupplier: (id: number, d: any) => api.put(`/pharmacy-setup/suppliers/${id}`, d),
  deleteSupplier: (id: number) => api.delete(`/pharmacy-setup/suppliers/${id}`),

  // Dosages
  listDosages:    () => api.get('/pharmacy-setup/dosages'),
  addDosages:     (items: Array<{ category_id: number; unit_id: number; dosage: string }>) =>
    api.post('/pharmacy-setup/dosages', items),
  updateDosage:   (id: number, d: any) => api.put(`/pharmacy-setup/dosages/${id}`, d),
  deleteDosage:   (id: number) => api.delete(`/pharmacy-setup/dosages/${id}`),
}
