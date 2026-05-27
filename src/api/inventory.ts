// src/api/inventory.ts
import api from '@/lib/axios'

export const inventoryApi = {
  // Lookups
  listCategories: () => api.get('/inventory/categories'),
  addCategory:    (d: any) => api.post('/inventory/categories', d),
  listSuppliers:  () => api.get('/inventory/suppliers'),
  addSupplier:    (d: any) => api.post('/inventory/suppliers', d),
  listStores:     () => api.get('/inventory/stores'),
  addStore:       (d: any) => api.post('/inventory/stores', d),

  // Item master
  listItems:      (p?: Record<string, any>) => api.get('/inventory/item-masters', { params: p }),
  addItem:        (d: any) => api.post('/inventory/item-masters', d),
  updateItem:     (id: number, d: any) => api.put(`/inventory/item-masters/${id}`, d),
  deleteItem:     (id: number) => api.delete(`/inventory/item-masters/${id}`),
  itemAvailable:  (id: number) => api.get(`/inventory/item-masters/${id}/available`),

  // Item Stock (purchase batches)
  listStocks:     (p?: Record<string, any>) => api.get('/inventory/stocks', { params: p }),
  addStock:       (d: any) => api.post('/inventory/stocks', d),
  updateStock:    (id: number, d: any) => api.put(`/inventory/stocks/${id}`, d),
  deleteStock:    (id: number) => api.delete(`/inventory/stocks/${id}`),

  // Item Issue
  listIssues:     (p?: Record<string, any>) => api.get('/inventory/issues', { params: p }),
  issueItem:      (d: any) => api.post('/inventory/issues', d),
  returnIssue:    (id: number) => api.put(`/inventory/issues/${id}/return`, {}),
  deleteIssue:    (id: number) => api.delete(`/inventory/issues/${id}`),
}
