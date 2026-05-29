// src/api/inventorySetup.ts
import api from '@/lib/axios'

export const invSetupApi = {
  // Categories (batch add)
  listCategories:   () => api.get('/inventory-setup/categories'),
  addCategories:    (items: Array<{ name: string; description?: string | null }>) =>
    api.post('/inventory-setup/categories', items),
  updateCategory:   (id: number, d: any) => api.put(`/inventory-setup/categories/${id}`, d),
  deleteCategory:   (id: number) => api.delete(`/inventory-setup/categories/${id}`),

  // Stores
  listStores:    () => api.get('/inventory-setup/stores'),
  addStore:      (d: any) => api.post('/inventory-setup/stores', d),
  updateStore:   (id: number, d: any) => api.put(`/inventory-setup/stores/${id}`, d),
  deleteStore:   (id: number) => api.delete(`/inventory-setup/stores/${id}`),

  // Suppliers
  listSuppliers:    () => api.get('/inventory-setup/suppliers'),
  addSupplier:      (d: any) => api.post('/inventory-setup/suppliers', d),
  updateSupplier:   (id: number, d: any) => api.put(`/inventory-setup/suppliers/${id}`, d),
  deleteSupplier:   (id: number) => api.delete(`/inventory-setup/suppliers/${id}`),
}
