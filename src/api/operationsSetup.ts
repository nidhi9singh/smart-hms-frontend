// src/api/operationsSetup.ts
import api from '@/lib/axios'

export const opsSetupApi = {
  // Operation Categories
  listCategories:   () => api.get('/operations-setup/categories'),
  addCategories:    (items: Array<{ name: string }>) =>
    api.post('/operations-setup/categories', items),
  updateCategory:   (id: number, d: any) =>
    api.put(`/operations-setup/categories/${id}`, d),
  deleteCategory:   (id: number) =>
    api.delete(`/operations-setup/categories/${id}`),

  // Operations
  listOperations:   () => api.get('/operations-setup/operations'),
  addOperations:    (items: Array<{ name: string; category_id?: number | null }>) =>
    api.post('/operations-setup/operations', items),
  updateOperation:  (id: number, d: any) =>
    api.put(`/operations-setup/operations/${id}`, d),
  deleteOperation:  (id: number) =>
    api.delete(`/operations-setup/operations/${id}`),
}
