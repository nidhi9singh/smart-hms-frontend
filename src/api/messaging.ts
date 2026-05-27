// src/api/messaging.ts
import api from '@/lib/axios'

export const messagingApi = {
  // Notices
  listNotices:    (p?: Record<string, any>) => api.get('/messaging/notices', { params: p }),
  postNotice:     (d: any)                  => api.post('/messaging/notices', d),
  updateNotice:   (id: number, d: any)      => api.put(`/messaging/notices/${id}`, d),
  deleteNotice:   (id: number)              => api.delete(`/messaging/notices/${id}`),

  // SMS
  sendSms:        (d: any) => api.post('/messaging/send-sms', d),
  sendSmsBatch:   (d: any) => api.post('/messaging/send-sms-batch', d),
  smsLogs:        () => api.get('/messaging/sms-logs'),

  // Email
  sendEmail:      (d: any) => api.post('/messaging/send-email', d),
  sendEmailBatch: (d: any) => api.post('/messaging/send-email-batch', d),
  emailLogs:      () => api.get('/messaging/email-logs'),

  // Credentials
  listPatientCredentials: (p?: Record<string, any>) => api.get('/messaging/patient-credentials', { params: p }),
  sendCredentials:        (d: any) => api.post('/messaging/send-credentials', d),
}
