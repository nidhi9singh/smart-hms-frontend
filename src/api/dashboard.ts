import api from '@/lib/axios'
export const dashboardApi = {
  incomeSummary:    () => api.get('/dashboard/income-summary'),
  yearlyChart:      () => api.get('/dashboard/yearly-income-expense'),
  monthlyOverview:  () => api.get('/dashboard/monthly-income-overview'),
  staffCount:       () => api.get('/dashboard/staff-count'),
  calendarEvents:   (p?: any) => api.get('/dashboard/calendar-events', { params: p }),
  addEvent:         (d: any) => api.post('/dashboard/calendar-events', d),
  deleteEvent:      (id: number) => api.delete(`/dashboard/calendar-events/${id}`),
}
