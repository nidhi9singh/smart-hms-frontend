// src/api/ambulance.ts
import api from '@/lib/axios'

export const ambulanceApi = {
  // Vehicles (combined vehicle+driver info)
  listVehicles:  (p?: Record<string, any>) => api.get('/ambulance/vehicles', { params: p }),
  addVehicle:    (d: any)                  => api.post('/ambulance/vehicles', d),
  updateVehicle: (id: number, d: any)      => api.put(`/ambulance/vehicles/${id}`, d),
  deleteVehicle: (id: number)              => api.delete(`/ambulance/vehicles/${id}`),

  // Calls / Bills
  listBills:     (p?: Record<string, any>) => api.get('/ambulance/bills', { params: p }),
  getBill:       (id: number)              => api.get(`/ambulance/bills/${id}`),
  createBill:    (d: any)                  => api.post('/ambulance/bills', d),
  updateBill:    (id: number, d: any)      => api.put(`/ambulance/bills/${id}`, d),
}
