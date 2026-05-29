// src/api/referralSetup.ts
import api from '@/lib/axios'

export const referralSetupApi = {
  // Categories (batch add)
  listCategories:    () => api.get('/referral-setup/categories'),
  addCategories:     (items: Array<{ name: string }>) => api.post('/referral-setup/categories', items),
  updateCategory:    (id: number, d: any) => api.put(`/referral-setup/categories/${id}`, d),
  deleteCategory:    (id: number) => api.delete(`/referral-setup/categories/${id}`),

  // Commissions
  listCommissions:   () => api.get('/referral-setup/commissions'),
  addCommission:     (d: any) => api.post('/referral-setup/commissions', d),
  updateCommission:  (id: number, d: any) => api.put(`/referral-setup/commissions/${id}`, d),
  deleteCommission:  (id: number) => api.delete(`/referral-setup/commissions/${id}`),
}
