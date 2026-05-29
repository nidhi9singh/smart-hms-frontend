// src/api/customFields.ts
import api from '@/lib/axios'

export const customFieldsApi = {
  listEntities:   () => api.get('/custom-fields/entities'),
  listFieldTypes: () => api.get('/custom-fields/field-types'),

  listGrouped:    () => api.get('/custom-fields/grouped'),
  list:           (belongsTo?: string) =>
    api.get('/custom-fields', { params: belongsTo ? { belongs_to: belongsTo } : {} }),

  add:    (d: any) => api.post('/custom-fields', d),
  update: (id: number, d: any) => api.put(`/custom-fields/${id}`, d),
  delete: (id: number) => api.delete(`/custom-fields/${id}`),
}
