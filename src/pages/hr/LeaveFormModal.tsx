// src/pages/hr/LeaveFormModal.tsx
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { hrApi } from '@/api/hr'
import { useAuthStore } from '@/store/authStore'
import Modal from '@/components/ui/Modal'
import FormField from '@/components/ui/FormField'

export default function LeaveFormModal({ open, onClose, onSuccess }: any) {
  const user = useAuthStore(s => s.user)
  // Admin / receptionist can apply leave on behalf of any staff; everyone else is locked to themselves.
  const canPickStaff = ['super_admin', 'admin', 'receptionist'].includes(user?.role ?? '')
  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: { apply_date: new Date().toISOString().split('T')[0] }
  })
  const [docFile, setDocFile]       = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: staffData } = useQuery({
    queryKey: ['staff-all-for-leave'],
    queryFn:  () => hrApi.listStaff({ per_page: 500 }).then(r => r.data),
  })
  const { data: ltData } = useQuery({
    queryKey: ['leave-types'],
    queryFn:  () => hrApi.listLeaveTypes().then(r => r.data)
  })

  const staff      = staffData?.data ?? []
  const leaveTypes = ltData?.data    ?? []

  // Auto-select the current user's staff record for non-admin applicants.
  const mySelf = !canPickStaff
    ? staff.find((s: any) => s.staff_code === user?.staff_code)
    : undefined
  useEffect(() => {
    if (mySelf?.id) setValue('staff_id', mySelf.id)
  }, [mySelf?.id, setValue])

  const mut = useMutation({
    mutationFn: async (d: any) => {
      // For non-admin applicants we let the backend resolve staff_id from
      // the JWT (it walks users.staff_code -> hr_staff.id). That avoids any
      // dependence on what's persisted in localStorage.
      let staffId = canPickStaff
        ? (d.staff_id ? Number(d.staff_id) : 0)
        : (mySelf?.id ?? 0)

      const payload: any = {
        leave_type_id : Number(d.leave_type_id) || 0,
        apply_date    : d.apply_date,
        from_date     : d.from_date,
        to_date       : d.to_date,
        reason        : d.reason || undefined,
      }
      if (staffId) payload.staff_id = staffId

      const res = await hrApi.applyLeave(payload)
      if (docFile && res.data?.data?.id) {
        try { await hrApi.uploadLeaveDoc(res.data.data.id, docFile) } catch {}
      }
      return res
    },
    onSuccess: () => {
      toast.success('Leave applied')
      reset(); setDocFile(null); onSuccess()
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.detail ?? e?.response?.data?.message ?? e?.message ?? 'Failed to apply leave'
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    },
  })

  const today = new Date().toLocaleDateString('en-US', { month:'2-digit', day:'2-digit', year:'numeric' })

  return (
    <Modal open={open} onClose={onClose} title="Add Details" size="lg"
      footer={
        <div className="flex justify-end">
          <button form="leave-form" type="submit" className="btn btn-primary px-6" disabled={mut.isPending}>
            ✓ {mut.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      }
    >
      <form id="leave-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-4">

        {/* Apply Date | Leave Type */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Apply Date *">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </span>
              <input type="date" className="input pl-9"
                {...register('apply_date', { required: true })} />
            </div>
          </FormField>
          <FormField label="Leave Type *">
            <select className="input" {...register('leave_type_id', { required: true, valueAsNumber: true })}>
              <option value="">Select</option>
              {leaveTypes.map((lt: any) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}{lt.max_days ? ` (${lt.max_days})` : ''}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Staff (admin / receptionist apply on behalf of someone else;
             everyone else has staff_id auto-locked to their own record). */}
        {canPickStaff ? (
          <FormField label="Staff *">
            <select className="input" {...register('staff_id', { required: true, valueAsNumber: true })}>
              <option value="">Select Staff</option>
              {staff.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} (#{s.staff_code})
                </option>
              ))}
            </select>
          </FormField>
        ) : (
          <input type="hidden" {...register('staff_id', { valueAsNumber: true })} />
        )}

        {/* Leave From Date | Leave To Date */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Leave From Date *">
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </span>
              <input type="date" className="input pl-9 bg-gray-50"
                {...register('from_date', { required: true })} />
            </div>
          </FormField>
          <FormField label="Leave To Date *">
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </span>
              <input type="date" className="input pl-9 bg-gray-50"
                {...register('to_date', { required: true })} />
            </div>
          </FormField>
        </div>

        {/* Reason */}
        <FormField label="Reason">
          <textarea className="input resize-none" rows={4}
            {...register('reason')} />
        </FormField>

        {/* Attach Document */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Attach Document</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 w-full h-10 border border-gray-200 rounded-lg bg-white cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition text-sm text-gray-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {docFile ? docFile.name : 'Drop a file here or click'}
          </div>
          <input ref={fileRef} type="file" className="hidden"
            onChange={e => setDocFile(e.target.files?.[0] ?? null)} />
        </div>

        {mut.isError && (
          <p className="text-red-500 text-sm">
            {(mut.error as any)?.response?.data?.detail
              ?? (mut.error as any)?.response?.data?.message
              ?? (mut.error as any)?.message
              ?? 'Failed to submit leave. Please try again.'}
          </p>
        )}
      </form>
    </Modal>
  )
}
