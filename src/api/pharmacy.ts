// src/api/pharmacy.ts
import api from '@/lib/axios'

export const pharmacyApi = {
  // Masters
  categories:       ()            => api.get('/pharmacy/categories'),
  addCategory:      (d: any)      => api.post('/pharmacy/categories', d),
  updateCategory:   (id:number,d:any) => api.put(`/pharmacy/categories/${id}`,d),
  deleteCategory:   (id:number)   => api.delete(`/pharmacy/categories/${id}`),

  companies:        ()            => api.get('/pharmacy/companies'),
  addCompany:       (d: any)      => api.post('/pharmacy/companies', d),

  groups:           ()            => api.get('/pharmacy/groups'),
  addGroup:         (d: any)      => api.post('/pharmacy/groups', d),

  units:            ()            => api.get('/pharmacy/units'),
  addUnit:          (d: any)      => api.post('/pharmacy/units', d),

  suppliers:        ()            => api.get('/pharmacy/suppliers'),
  addSupplier:      (d: any)      => api.post('/pharmacy/suppliers', d),

  // Medicines
  listMedicines:    (p?: Record<string,any>) => api.get('/pharmacy/medicines', { params: p }),
  getMedicine:      (id: number)             => api.get(`/pharmacy/medicines/${id}`),
  addMedicine:      (d: any)                 => api.post('/pharmacy/medicines', d),
  updateMedicine:   (id: number, d: any)     => api.put(`/pharmacy/medicines/${id}`, d),
  deleteMedicine:   (id: number)             => api.delete(`/pharmacy/medicines/${id}`),
  bulkDelete:       (ids: number[])          => api.delete('/pharmacy/medicines/bulk-delete', { data: { ids } }),
  uploadPhoto:      (id: number, f: File) => {
    const fd = new FormData(); fd.append('file', f)
    return api.post(`/pharmacy/medicines/${id}/photo`, fd)
  },
  importMedicines:  (categoryId: number, f: File) => {
    const fd = new FormData()
    fd.append('file', f); fd.append('category_id', String(categoryId))
    return api.post('/pharmacy/medicines/import', fd)
  },
  sampleCsv:        () => api.get('/pharmacy/medicines/import/sample', { responseType: 'blob' }),
  batches:          (id: number) => api.get(`/pharmacy/medicines/${id}/batches`),

  // Bills
  listBills:     (p?: Record<string,any>) => api.get('/pharmacy/bills', { params: p }),
  getBill:       (id: number)             => api.get(`/pharmacy/bills/${id}`),
  generateBill:  (d: any)                 => api.post('/pharmacy/bills', d),
  updateBill:    (id: number, d: any)     => api.put(`/pharmacy/bills/${id}`, d),
  deleteBill:    (id: number)             => api.delete(`/pharmacy/bills/${id}`),
  addBillItem:   (id: number, d: any)     => api.post(`/pharmacy/bills/${id}/items`, d),
  removeBillItem:(id: number, iid: number)=> api.delete(`/pharmacy/bills/${id}/items/${iid}`),

  // Purchases
  listPurchases:   (p?: Record<string,any>) => api.get('/pharmacy/purchases', { params: p }),
  getPurchase:     (id: number)             => api.get(`/pharmacy/purchases/${id}`),
  createPurchase:  (d: any)                 => api.post('/pharmacy/purchases', d),
  deletePurchase:  (id: number)             => api.delete(`/pharmacy/purchases/${id}`),
  uploadPurchaseDoc:(id: number, f: File) => {
    const fd = new FormData(); fd.append('file', f)
    return api.post(`/pharmacy/purchases/${id}/document`, fd)
  },
}
