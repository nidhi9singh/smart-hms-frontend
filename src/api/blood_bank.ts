// src/api/blood_bank.ts
import api from '@/lib/axios'

export const bloodBankApi = {
  status:        ()                          => api.get('/blood-bank/status'),

  // Donors
  listDonors:    (p?: Record<string, any>)   => api.get('/blood-bank/donors', { params: p }),
  addDonor:      (d: any)                    => api.post('/blood-bank/donors', d),

  // Blood stock
  listStock:     (p?: Record<string, any>)   => api.get('/blood-bank/stock', { params: p }),
  addStock:      (d: any)                    => api.post('/blood-bank/stock', d),

  // Components
  listComponents:(p?: Record<string, any>)   => api.get('/blood-bank/components', { params: p }),
  addComponent:  (d: any)                    => api.post('/blood-bank/components', d),
  addComponentsBulk: (d: any)                => api.post('/blood-bank/components/bulk', d),

  // Blood issues
  listIssues:    (p?: Record<string, any>)   => api.get('/blood-bank/issues', { params: p }),
  issueBlood:    (d: any)                    => api.post('/blood-bank/issues', d),

  // Component issues
  listComponentIssues: (p?: Record<string, any>) => api.get('/blood-bank/component-issues', { params: p }),
  issueComponent:      (d: any)                  => api.post('/blood-bank/component-issues', d),
}
