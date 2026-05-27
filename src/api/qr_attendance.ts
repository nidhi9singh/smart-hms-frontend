// src/api/qr_attendance.ts
import api from '@/lib/axios'

export const qrAttendanceApi = {
  getSettings:    ()                          => api.get('/qr-attendance/settings'),
  updateSettings: (d: any)                    => api.put('/qr-attendance/settings', d),
  scan:           (d: any)                    => api.post('/qr-attendance/scan', d),
  listLogs:       (p?: Record<string, any>)   => api.get('/qr-attendance/logs', { params: p }),
}
