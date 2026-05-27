import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  hrApi,
  type StaffCreate,
  type AttendanceCreate,
  type LeaveCreate,
  type LeaveStatusUpdate,
  type PayrollCreate,
} from '@/api/hr'

/* ═══════════════════════════════════════════
   STAFF
   ═══════════════════════════════════════════ */
export function useStaff(params?: { search?: string; role?: string; is_active?: boolean; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['staff', params],
    queryFn:  () => hrApi.listStaff(params),
  })
}

export function useCreateStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StaffCreate) => hrApi.createStaff(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Staff added')
    },
  })
}

export function useUpdateStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StaffCreate> }) => hrApi.updateStaff(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Staff updated')
    },
  })
}

export function useDeleteStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => hrApi.deleteStaff(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Staff deleted')
    },
  })
}

/* ═══════════════════════════════════════════
   ATTENDANCE
   ═══════════════════════════════════════════ */
export function useAttendance(params?: { staff_id?: number; date?: string; role?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn:  () => hrApi.listAttendance(params),
  })
}

export function useMarkAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AttendanceCreate) => hrApi.markAttendance(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance marked')
    },
  })
}

/* ═══════════════════════════════════════════
   LEAVE TYPES
   ═══════════════════════════════════════════ */
export function useLeaveTypes() {
  return useQuery({
    queryKey: ['leave-types'],
    queryFn:  () => hrApi.listLeaveTypes(),
  })
}

export function useCreateLeaveType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string }) => hrApi.createLeaveType(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-types'] })
      toast.success('Leave type added')
    },
  })
}

/* ═══════════════════════════════════════════
   LEAVES
   ═══════════════════════════════════════════ */
export function useLeaves(params?: {
  staff_id?: number
  status?: string
  role?: string
  leave_type_id?: number
  search?: string
  page?: number
  per_page?: number
}) {
  return useQuery({
    queryKey: ['leaves', params],
    queryFn:  () => hrApi.listLeaves(params),
  })
}

export function useApplyLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: LeaveCreate) => hrApi.applyLeave(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] })
      toast.success('Leave application submitted')
    },
  })
}

export function useUpdateLeaveStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LeaveStatusUpdate }) => hrApi.updateLeaveStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] })
      toast.success('Leave status updated')
    },
  })
}

export function useDeleteLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => hrApi.deleteLeave(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] })
      toast.success('Leave request deleted')
    },
  })
}

export function useUploadLeaveDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) => hrApi.uploadLeaveDocument(id, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] })
      toast.success('Document uploaded')
    },
  })
}

// backward compat alias
export function useApproveLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => hrApi.updateLeaveStatus(id, { status: 'Approved' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves'] })
      toast.success('Leave approved')
    },
  })
}

/* ═══════════════════════════════════════════
   PAYROLL
   ═══════════════════════════════════════════ */
export function usePayroll(params?: { staff_id?: number; month?: number; year?: number; role?: string; page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ['payroll', params],
    queryFn:  () => hrApi.listPayroll(params),
  })
}

export function useGeneratePayroll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PayrollCreate) => hrApi.generatePayroll(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll'] })
      toast.success('Payroll generated')
    },
  })
}

export function useMarkPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => hrApi.markPaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll'] })
      toast.success('Salary marked as paid')
    },
  })
}

// backward compat alias
export function useMarkSalaryPaid() {
  return useMarkPaid()
}
