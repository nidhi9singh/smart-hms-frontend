// src/api/hrSetup.ts
import api from '@/lib/axios'

export type HRKey = 'leave-types' | 'departments' | 'designations' | 'specialists'

export const hrSetupApi = {
  list:   (k: HRKey) => api.get(`/hr-setup/${k}`),
  add:    (k: HRKey, d: { name: string }) => api.post(`/hr-setup/${k}`, d),
  update: (k: HRKey, id: number, d: any)   => api.put(`/hr-setup/${k}/${id}`, d),
  delete: (k: HRKey, id: number)           => api.delete(`/hr-setup/${k}/${id}`),
}
