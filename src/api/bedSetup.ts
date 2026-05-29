// src/api/bedSetup.ts
import api from '@/lib/axios'

export const bedSetupApi = {
  // Floors
  listFloors:  () => api.get('/bed-setup/floors'),
  addFloor:    (d: any) => api.post('/bed-setup/floors', d),
  updateFloor: (id: number, d: any) => api.put(`/bed-setup/floors/${id}`, d),
  deleteFloor: (id: number) => api.delete(`/bed-setup/floors/${id}`),

  // Bed Types
  listBedTypes:  () => api.get('/bed-setup/bed-types'),
  addBedType:    (d: any) => api.post('/bed-setup/bed-types', d),
  updateBedType: (id: number, d: any) => api.put(`/bed-setup/bed-types/${id}`, d),
  deleteBedType: (id: number) => api.delete(`/bed-setup/bed-types/${id}`),

  // Bed Groups
  listBedGroups:  () => api.get('/bed-setup/bed-groups'),
  addBedGroup:    (d: any) => api.post('/bed-setup/bed-groups', d),
  updateBedGroup: (id: number, d: any) => api.put(`/bed-setup/bed-groups/${id}`, d),
  deleteBedGroup: (id: number) => api.delete(`/bed-setup/bed-groups/${id}`),

  // Beds
  listBeds:  (p?: Record<string, any>) => api.get('/bed-setup/beds', { params: p }),
  addBed:    (d: any) => api.post('/bed-setup/beds', d),
  updateBed: (id: number, d: any) => api.put(`/bed-setup/beds/${id}`, d),
  deleteBed: (id: number) => api.delete(`/bed-setup/beds/${id}`),

  // Bed Status
  bedStatus: (p?: Record<string, any>) => api.get('/bed-setup/bed-status', { params: p }),
}
