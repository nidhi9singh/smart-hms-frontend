// src/api/duty_roster.ts
import api from '@/lib/axios'

export const dutyRosterApi = {
  // Shifts
  listShifts:    (p?: Record<string, any>) => api.get('/duty-roster/shifts', { params: p }),
  addShift:      (d: any)                  => api.post('/duty-roster/shifts', d),
  updateShift:   (id: number, d: any)      => api.put(`/duty-roster/shifts/${id}`, d),
  deleteShift:   (id: number)              => api.delete(`/duty-roster/shifts/${id}`),

  // Rosters (named templates)
  listRosters:   (p?: Record<string, any>) => api.get('/duty-roster/rosters', { params: p }),
  addRoster:     (d: any)                  => api.post('/duty-roster/rosters', d),
  updateRoster:  (id: number, d: any)      => api.put(`/duty-roster/rosters/${id}`, d),
  deleteRoster:  (id: number)              => api.delete(`/duty-roster/rosters/${id}`),

  // Duty roster (per-day per-staff)
  listEntries:   (p?: Record<string, any>) => api.get('/duty-roster', { params: p }),
  assignShift:   (d: any)                  => api.post('/duty-roster', d),
  bulkAssign:    (d: any)                  => api.post('/duty-roster/bulk-assign', d),
  assignRoster:  (d: any)                  => api.post('/duty-roster/assign-roster', d),
  deleteEntry:   (id: number)              => api.delete(`/duty-roster/${id}`),

  // Assigned rosters grouped view
  listAssigned:  (p?: Record<string, any>) => api.get('/duty-roster/assigned-rosters', { params: p }),
  removeAssigned:(staff_id: number, roster_id: number) =>
                   api.delete(`/duty-roster/assigned-rosters/${staff_id}/${roster_id}`),
}
