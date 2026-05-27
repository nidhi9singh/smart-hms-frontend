// src/api/front_office.ts
import api from '@/lib/axios'

export const frontOfficeApi = {
  // Visitors
  listVisitors:   (p?: Record<string, any>) => api.get('/front-office/visitors', { params: p }),
  addVisitor:     (d: any)                  => api.post('/front-office/visitors', d),
  updateVisitor:  (id: number, d: any)      => api.put(`/front-office/visitors/${id}`, d),
  deleteVisitor:  (id: number)              => api.delete(`/front-office/visitors/${id}`),

  // Phone call logs
  listCallLogs:   (p?: Record<string, any>) => api.get('/front-office/call-logs', { params: p }),
  addCallLog:     (d: any)                  => api.post('/front-office/call-logs', d),
  updateCallLog:  (id: number, d: any)      => api.put(`/front-office/call-logs/${id}`, d),
  deleteCallLog:  (id: number)              => api.delete(`/front-office/call-logs/${id}`),

  // Complaints
  listComplaints: (p?: Record<string, any>) => api.get('/front-office/complaints', { params: p }),
  addComplaint:   (d: any)                  => api.post('/front-office/complaints', d),
  updateComplaint:(id: number, d: any)      => api.put(`/front-office/complaints/${id}`, d),
  deleteComplaint:(id: number)              => api.delete(`/front-office/complaints/${id}`),

  // Postal Receive
  listReceives:   (p?: Record<string, any>) => api.get('/front-office/postal/receive', { params: p }),
  addReceive:     (d: any)                  => api.post('/front-office/postal/receive', d),
  updateReceive:  (id: number, d: any)      => api.put(`/front-office/postal/receive/${id}`, d),
  deleteReceive:  (id: number)              => api.delete(`/front-office/postal/receive/${id}`),

  // Postal Dispatch
  listDispatches: (p?: Record<string, any>) => api.get('/front-office/postal/dispatch', { params: p }),
  addDispatch:    (d: any)                  => api.post('/front-office/postal/dispatch', d),
  updateDispatch: (id: number, d: any)      => api.put(`/front-office/postal/dispatch/${id}`, d),
  deleteDispatch: (id: number)              => api.delete(`/front-office/postal/dispatch/${id}`),
}
