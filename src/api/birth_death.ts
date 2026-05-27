// src/api/birth_death.ts
import api from '@/lib/axios'

export const birthDeathApi = {
  // Birth
  listBirths:  (p?: Record<string, any>) => api.get('/birth-death/birth', { params: p }),
  getBirth:    (id: number)              => api.get(`/birth-death/birth/${id}`),
  addBirth:    (d: any)                  => api.post('/birth-death/birth', d),
  updateBirth: (id: number, d: any)      => api.put(`/birth-death/birth/${id}`, d),
  deleteBirth: (id: number)              => api.delete(`/birth-death/birth/${id}`),

  // Death
  listDeaths:  (p?: Record<string, any>) => api.get('/birth-death/death', { params: p }),
  getDeath:    (id: number)              => api.get(`/birth-death/death/${id}`),
  addDeath:    (d: any)                  => api.post('/birth-death/death', d),
  updateDeath: (id: number, d: any)      => api.put(`/birth-death/death/${id}`, d),
  deleteDeath: (id: number)              => api.delete(`/birth-death/death/${id}`),
}
