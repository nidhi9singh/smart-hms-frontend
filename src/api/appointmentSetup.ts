// src/api/appointmentSetup.ts
import api from '@/lib/axios'

export const apptSetupApi = {
  // Shifts
  listShifts:    () => api.get('/appointment-setup/shifts'),
  addShift:      (d: any) => api.post('/appointment-setup/shifts', d),
  updateShift:   (id: number, d: any) => api.put(`/appointment-setup/shifts/${id}`, d),
  deleteShift:   (id: number) => api.delete(`/appointment-setup/shifts/${id}`),

  // Priorities (batch add)
  listPriorities: () => api.get('/appointment-setup/priorities'),
  addPriorities:  (items: Array<{ name: string }>) => api.post('/appointment-setup/priorities', items),
  updatePriority: (id: number, d: any) => api.put(`/appointment-setup/priorities/${id}`, d),
  deletePriority: (id: number) => api.delete(`/appointment-setup/priorities/${id}`),

  // Doctor Shift matrix
  listDoctorShifts:   () => api.get('/appointment-setup/doctor-shifts'),
  updateDoctorShifts: (doctorId: number, shiftIds: number[]) =>
    api.put(`/appointment-setup/doctor-shifts/${doctorId}`, { shift_ids: shiftIds }),

  // Slot config
  getSlot:   (doctorId: number, shiftId: number) =>
    api.get('/appointment-setup/slots', { params: { doctor_id: doctorId, shift_id: shiftId } }),
  saveSlot:  (d: any) => api.put('/appointment-setup/slots', d),

  // Lookups
  listDoctors:          () => api.get('/appointment-setup/doctors'),
  listChargeCategories: () => api.get('/appointment-setup/charge-categories'),
  listCharges:          (chargeCategoryId?: number) =>
    api.get('/appointment-setup/charges', { params: chargeCategoryId ? { charge_category_id: chargeCategoryId } : {} }),
}
