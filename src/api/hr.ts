// src/api/hr.ts
import api from '@/lib/axios'

export const hrApi = {
  // Staff
  listStaff:   (p?: Record<string,string>) => api.get('/hr/staff', { params: p }),
  getStaff:    (id: number)                => api.get(`/hr/staff/${id}`),
  createStaff: (d: any)                    => api.post('/hr/staff', d),
  updateStaff: (id: number, d: any)        => api.put(`/hr/staff/${id}`, d),
  deleteStaff: (id: number)                => api.delete(`/hr/staff/${id}`),
  uploadPhoto: (id: number, f: File) => {
    const fd = new FormData(); fd.append('file', f)
    return api.post(`/hr/staff/${id}/photo`, fd)
  },
  importStaff: (role: string, f: File, designation?: string, department?: string) => {
    const fd = new FormData()
    fd.append('file', f); fd.append('role', role)
    if (designation) fd.append('designation', designation)
    if (department) fd.append('department', department)
    return api.post('/hr/staff/import', fd)
  },
  sampleCsv: () => api.get('/hr/staff/import/sample', { responseType: 'blob' }),

  // Attendance
  listAttendance: (p?: Record<string,string>) => api.get('/hr/attendance', { params: p }),
  markAttendance: (d: any)                    => api.post('/hr/attendance', d),
  updateAttendance: (id: number, d: any)      => api.put(`/hr/attendance/${id}`, d),
  deleteAttendance: (id: number)              => api.delete(`/hr/attendance/${id}`),

  // Leave Types
  listLeaveTypes: () => api.get('/hr/leave-types'),
  createLeaveType: (d: any) => api.post('/hr/leave-types', d),
  updateLeaveType: (id: number, d: any) => api.put(`/hr/leave-types/${id}`, d),
  deleteLeaveType: (id: number) => api.delete(`/hr/leave-types/${id}`),

  // Leaves
  listLeaves:    (p?: Record<string,string>) => api.get('/hr/leaves', { params: p }),
  getLeave:      (id: number)                => api.get(`/hr/leaves/${id}`),
  applyLeave:    (d: any)                    => api.post('/hr/leaves', d),
  updateStatus:  (id: number, d: { status: string; note?: string; approved_by?: number }) =>
                   api.patch(`/hr/leaves/${id}/status`, d),
  deleteLeave:   (id: number)                => api.delete(`/hr/leaves/${id}`),
  uploadDoc:     (id: number, f: File) => {
    const fd = new FormData(); fd.append('file', f)
    return api.post(`/hr/leaves/${id}/document`, fd)
  },
  uploadLeaveDoc: (id: number, f: File) => {
    const fd = new FormData(); fd.append('file', f)
    return api.post(`/hr/leaves/${id}/document`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  // Payroll
  listPayroll:    (p?: Record<string,string>) => api.get('/hr/payroll', { params: p }),
  getPayroll:     (id: number)                => api.get(`/hr/payroll/${id}`),
  createPayroll:  (d: any)                    => api.post('/hr/payroll', d),
  updatePayroll:  (id: number, d: any)        => api.put(`/hr/payroll/${id}`, d),
  markPaid:       (id: number, paid_date?: string) =>
                    api.patch(`/hr/payroll/${id}/pay`, null, { params: { paid_date } }),
  deletePayroll:  (id: number)                => api.delete(`/hr/payroll/${id}`),
}
