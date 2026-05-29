// src/api/frontOfficeSetup.ts
import api from '@/lib/axios'

export type FOLookupKey = 'purposes' | 'complaint-types' | 'sources'

export const foSetupApi = {
  list:   (key: FOLookupKey) => api.get(`/front-office/lookups/${key}`),
  add:    (key: FOLookupKey, items: Array<{ name: string; description?: string }>) =>
    api.post(`/front-office/lookups/${key}`, items),
  update: (key: FOLookupKey, id: number, d: any) =>
    api.put(`/front-office/lookups/${key}/${id}`, d),
  delete: (key: FOLookupKey, id: number) =>
    api.delete(`/front-office/lookups/${key}/${id}`),
}
