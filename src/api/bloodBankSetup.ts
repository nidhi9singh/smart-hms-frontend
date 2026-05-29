// src/api/bloodBankSetup.ts
import api from '@/lib/axios'

export const bloodBankSetupApi = {
  listProducts:   () => api.get('/blood-bank-setup/products'),
  addProduct:     (d: any) => api.post('/blood-bank-setup/products', d),
  updateProduct:  (id: number, d: any) => api.put(`/blood-bank-setup/products/${id}`, d),
  deleteProduct:  (id: number) => api.delete(`/blood-bank-setup/products/${id}`),
}
