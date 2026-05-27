// src/api/calendar.ts
import api from '@/lib/axios'

export const calendarApi = {
  listEvents:   (p?: Record<string, any>) => api.get('/calendar', { params: p }),
  getEvent:     (id: number)              => api.get(`/calendar/${id}`),
  addEvent:     (d: any)                  => api.post('/calendar', d),
  updateEvent:  (id: number, d: any)      => api.put(`/calendar/${id}`, d),
  deleteEvent:  (id: number)              => api.delete(`/calendar/${id}`),
}
