import api from '@/lib/axios'
export const appointmentsApi = {
  list:   (p?: any) => api.get('/appointments', { params: p }),
  get:    (id: number) => api.get(`/appointments/${id}`),
  create: (d: any)  => api.post('/appointments', d),
  update: (id: number, d: any) => api.put(`/appointments/${id}`, d),
  delete: (id: number) => api.delete(`/appointments/${id}`),
}
