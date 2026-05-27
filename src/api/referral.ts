// src/api/referral.ts
import api from '@/lib/axios'

export const referralApi = {
  // Persons
  listPersons:   (p?: Record<string, any>) => api.get('/referral/persons', { params: p }),
  getPerson:     (id: number)              => api.get(`/referral/persons/${id}`),
  addPerson:     (d: any)                  => api.post('/referral/persons', d),
  updatePerson:  (id: number, d: any)      => api.put(`/referral/persons/${id}`, d),
  deletePerson:  (id: number)              => api.delete(`/referral/persons/${id}`),

  // Payments
  listPayments:  (p?: Record<string, any>) => api.get('/referral/payments', { params: p }),
  addPayment:    (d: any)                  => api.post('/referral/payments', d),
  updatePayment: (id: number, d: any)      => api.put(`/referral/payments/${id}`, d),
  deletePayment: (id: number)              => api.delete(`/referral/payments/${id}`),
  markPaid:      (id: number)              => api.patch(`/referral/payments/${id}/pay`),
}
