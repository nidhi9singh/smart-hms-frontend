// src/pages/hr/ApproveLeaveTab.tsx
// "Approve Leave Request" — Super Admin / Admin only tab
import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Plus, Trash2, Menu, Loader2, Calendar, Upload,
  Copy, FileSpreadsheet, FileText, Printer, CheckCircle, XCircle, Eye,
} from 'lucide-react'
import {
  useLeaves,
  useApplyLeave,
  useUpdateLeaveStatus,
  useDeleteLeave,
  useUploadLeaveDocument,
  useLeaveTypes,
  useStaff,
} from '@/hooks/useHR'
import type { LeaveRecord, LeaveStatusUpdate } from '@/api/hr'
import { PageLoader } from '@/components/ui/Spinner'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import Modal from '@/components/ui/Modal'
import { FormField, InputField, SelectField, TextareaField } from '@/components/ui/FormField'
import { cn, fmtDate } from '@/lib/utils'

/* ─── Constants ────────────────────────────────────────── */
const LEAVE_TYPES_FALLBACK = [
  'Sick Leave', 'Casual Leave', 'Annual Leave', 'Emergency Leave',
  'Maternity Leave', 'Paternity Leave', 'Privilege Leave',
]

const ROLES = [
  'Super Admin', 'Admin', 'Doctor', 'Nurse', 'Pharmacist',
  'Pathologist', 'Radiologist', 'Accountant', 'Receptionist',
]

const STATUS_OPTIONS = ['Pending', 'Approved', 'Disapprove'] as const

/* ─── Helpers ──────────────────────────────────────────── */
function statusBadgeClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'approve':
      return 'bg-emerald-500 text-white'
    case 'disapprove':
    case 'disapproved':
    case 'rejected':
      return 'bg-red-500 text-white'
    default:
      return 'bg-orange-400 text-white'
  }
}

function statusLabel(leave: LeaveRecord) {
  const name = leave.staff_name ?? 'Staff'
  const code = leave.staff_code ?? leave.staff_id
  if (leave.status === 'Pending')  return `Pending By ${name} (${code})`
  if (leave.status === 'Approved') return `Approve By ${name} (${code})`
  return leave.status
}

function formatDateRange(from: string, to: string) {
  return `${fmtDate(from)} - ${fmtDate(to)}`
}

function calcDays(from: string, to: string): number {
  if (!from || !to) return 0
  const diff = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1
  return diff > 0 ? diff : 0
}

function todayFormatted() {
  const d = new Date()
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

/* ─── Form State ───────────────────────────────────────── */
interface FormData {
  role:          string
  staff_id:      string
  apply_date:    string
  leave_type_id: string
  from_date:     string
  to_date:       string
  reason:        string
  note:          string
  status:        string
}

const EMPTY_FORM: FormData = {
  role: '', staff_id: '', apply_date: todayISO(), leave_type_id: '',
  from_date: '', to_date: '', reason: '', note: '', status: 'Pending',
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function ApproveLeaveTab() {
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [perPage, setPerPage] = useState(100)
  const [modalOpen, setModalOpen]     = useState(false)
  const [editLeave, setEditLeave]     = useState<LeaveRecord | null>(null)
  const [actionMenuId, setActionMenuId] = useState<number | null>(null)
  const [form, setForm]       = useState<FormData>({ ...EMPTY_FORM })
  const [file, setFile]       = useState<File | null>(null)
  const [errors, setErrors]   = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // ── Queries ──────────────────────────────
  const { data, isLoading }      = useLeaves({ search: search || undefined, page, per_page: perPage })
  const { data: leaveTypesData } = useLeaveTypes()
  const { data: staffData }      = useStaff({ role: form.role || undefined, per_page: 500 })

  const applyLeave        = useApplyLeave()
  const updateLeaveStatus = useUpdateLeaveStatus()
  const deleteLeave       = useDeleteLeave()
  const uploadDoc         = useUploadLeaveDocument()

  // ── Derived ──────────────────────────────
  const leaves     = (data?.data?.data ?? []) as LeaveRecord[]
  const pagination = data?.data?.pagination
  const leaveTypes = (leaveTypesData?.data?.data ?? LEAVE_TYPES_FALLBACK.map((n, i) => ({ id: i + 1, name: n }))) as { id: number; name: string }[]
  const staffList  = (staffData?.data?.data ?? []) as { id: number; staff_code: number; name: string; role: string }[]

  // ── Close menu on outside click ──────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setActionMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Form helpers ─────────────────────────
  const setField = useCallback((key: keyof FormData, val: string) => {
    setForm(prev => ({ ...prev, [key]: val, ...(key === 'role' ? { staff_id: '' } : {}) }))
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }, [])

  const openAdd = useCallback(() => {
    setEditLeave(null)
    setForm({ ...EMPTY_FORM })
    setFile(null)
    setErrors({})
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((l: LeaveRecord) => {
    setEditLeave(l)
    setForm({
      role: l.staff_role ?? '', staff_id: String(l.staff_id),
      apply_date: l.apply_date, leave_type_id: String(l.leave_type_id),
      from_date: l.from_date, to_date: l.to_date,
      reason: l.reason ?? '', note: l.note ?? '', status: l.status,
    })
    setFile(null); setErrors({}); setModalOpen(true); setActionMenuId(null)
  }, [])

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.staff_id)      e.staff_id      = 'Name is required'
    if (!form.leave_type_id) e.leave_type_id = 'Leave Type is required'
    if (!form.from_date)     e.from_date     = 'Required'
    if (!form.to_date)       e.to_date       = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    try {
      if (editLeave) {
        await updateLeaveStatus.mutateAsync({
          id: editLeave.id,
          data: { status: form.status, note: form.note || undefined } as LeaveStatusUpdate,
        })
      } else {
        const res = await applyLeave.mutateAsync({
          staff_id: Number(form.staff_id), leave_type_id: Number(form.leave_type_id),
          apply_date: form.apply_date, from_date: form.from_date, to_date: form.to_date,
          reason: form.reason || undefined, note: form.note || undefined,
          status: form.status, applied_by_role: form.role || undefined,
        })
        if (file && res?.data?.data?.id) {
          const fd = new FormData(); fd.append('file', file)
          await uploadDoc.mutateAsync({ id: res.data.data.id, formData: fd })
        }
      }
      setModalOpen(false)
    } catch { /* global handler */ }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this leave request?')) return
    setActionMenuId(null)
    await deleteLeave.mutateAsync(id)
  }

  const quickApprove = async (id: number) => {
    await updateLeaveStatus.mutateAsync({ id, data: { status: 'Approved' } })
  }
  const quickDisapprove = async (id: number) => {
    await updateLeaveStatus.mutateAsync({ id, data: { status: 'Disapprove' } })
  }

  const isBusy = applyLeave.isPending || updateLeaveStatus.isPending || uploadDoc.isPending

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">

      {/* ── Header ─────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Approve Leave Request</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1a2332] hover:bg-[#243044] text-white text-sm font-medium rounded transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Leave Request
        </button>
      </div>

      {/* ── Toolbar ────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-48 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
        />
        <div className="flex items-center gap-2">
          <select
            value={perPage}
            onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
            className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-600"
          >
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <div className="flex items-center gap-1 ml-1">
            {[
              { icon: Copy,            title: 'Copy'  },
              { icon: FileSpreadsheet, title: 'Excel' },
              { icon: FileText,        title: 'CSV'   },
              { icon: FileText,        title: 'PDF'   },
              { icon: Printer,         title: 'Print' },
            ].map(({ icon: Icon, title }) => (
              <button key={title} title={title} className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 rounded">
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────── */}
      <div className="overflow-x-auto">
        {isLoading ? <PageLoader /> : leaves.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-8 h-8 text-gray-400" />}
            title="No leave records found"
            action={
              <button onClick={openAdd} className="px-4 py-2 bg-[#1a2332] text-white text-sm rounded hover:bg-[#243044]">
                + Add Leave Request
              </button>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                {['Staff', 'Leave Type', 'Leave Date', 'Days', 'Apply Date', 'Status', 'Status Date', 'Action'].map(h => (
                  <th key={h} className={cn(
                    'px-4 py-3 font-semibold text-gray-700 whitespace-nowrap',
                    h === 'Action' ? 'text-right' : 'text-left',
                  )}>
                    {h} {h !== 'Action' && <span className="text-gray-400 text-[10px] ml-0.5">▼</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaves.map(l => (
                <tr key={l.id} className="hover:bg-gray-50/50 group">
                  <td className="px-4 py-3 text-gray-900">
                    {l.staff_name ? `${l.staff_name} (${l.staff_code ?? l.staff_id})` : `Staff #${l.staff_id}`}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{l.leave_type ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{formatDateRange(l.from_date, l.to_date)}</td>
                  <td className="px-4 py-3 text-gray-700">{l.days ?? calcDays(l.from_date, l.to_date)}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmtDate(l.apply_date)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-block px-3 py-1 rounded text-xs font-medium whitespace-nowrap', statusBadgeClass(l.status))}>
                      {statusLabel(l)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{l.status_date ? fmtDate(l.status_date) : ''}</td>
                  <td className="px-4 py-3 text-right relative">
                    <div className="flex items-center justify-end gap-1">
                      {/* Quick actions for pending */}
                      {l.status === 'Pending' && (
                        <>
                          <button onClick={() => quickApprove(l.id)} title="Approve"
                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded border border-gray-200">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => quickDisapprove(l.id)} title="Disapprove"
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded border border-gray-200">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {/* View / Edit */}
                      <button onClick={() => openEdit(l)} title="View / Edit"
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded border border-gray-200 hover:bg-gray-50">
                        <Eye className="w-4 h-4" />
                      </button>
                      {/* Delete */}
                      <button onClick={() => handleDelete(l.id)} title="Delete"
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded border border-gray-200 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination && (
        <div className="px-4 py-3 border-t border-gray-200">
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      {/* ═══════════════════════════════════════
         ADD / EDIT MODAL  — "Add Details"
         ═══════════════════════════════════════ */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Details"
        size="lg"
        headerClassName="bg-[#059669] text-white"
        footer={
          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={isBusy}
              className="flex items-center gap-2 px-5 py-2 bg-[#f0ad4e] hover:bg-[#ec971f] text-white text-sm font-medium rounded transition-colors">
              {isBusy && <Loader2 className="w-4 h-4 animate-spin" />} ✔ Save
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-1">

          {/* Role + Name */}
          <FormField label="Role" required error={errors.role}>
            <SelectField value={form.role} onChange={e => setField('role', e.target.value)}>
              <option value="">Select</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </SelectField>
          </FormField>

          <FormField label="Name" required error={errors.staff_id}>
            <SelectField value={form.staff_id} onChange={e => setField('staff_id', e.target.value)}>
              <option value="">Select</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.staff_code})</option>)}
            </SelectField>
          </FormField>

          {/* Apply Date + Leave Type */}
          <FormField label="Apply Date" required>
            <InputField type="text" value={editLeave ? fmtDate(form.apply_date) : todayFormatted()} readOnly className="bg-white cursor-default" />
          </FormField>

          <FormField label="Leave Type" required error={errors.leave_type_id}>
            <SelectField value={form.leave_type_id} onChange={e => setField('leave_type_id', e.target.value)}>
              <option value="">Select</option>
              {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </SelectField>
          </FormField>

          {/* From / To with calendar icon */}
          <FormField label="Leave From Date" required error={errors.from_date}>
            <div className="flex items-center">
              <span className="flex items-center justify-center w-10 h-10 bg-gray-100 border border-r-0 border-gray-300 rounded-l text-gray-500">
                <Calendar className="w-4 h-4" />
              </span>
              <InputField type="date" value={form.from_date} onChange={e => setField('from_date', e.target.value)} className="rounded-l-none border-l-0" />
            </div>
          </FormField>

          <FormField label="Leave To Date" required error={errors.to_date}>
            <div className="flex items-center">
              <span className="flex items-center justify-center w-10 h-10 bg-gray-100 border border-r-0 border-gray-300 rounded-l text-gray-500">
                <Calendar className="w-4 h-4" />
              </span>
              <InputField type="date" value={form.to_date} onChange={e => setField('to_date', e.target.value)} className="rounded-l-none border-l-0" />
            </div>
          </FormField>

          {/* Reason + Note */}
          <FormField label="Reason">
            <TextareaField value={form.reason} onChange={e => setField('reason', e.target.value)} rows={4} />
          </FormField>

          <FormField label="Note">
            <TextareaField value={form.note} onChange={e => setField('note', e.target.value)} rows={4} />
          </FormField>

          {/* Attach Document + Status */}
          <FormField label="Attach Document">
            <div onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded px-4 py-3 text-sm text-gray-500 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4" />
              {file ? file.name : 'Drop a file here or click'}
            </div>
            <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </FormField>

          <FormField label="Status">
            <div className="flex items-center gap-5 pt-2">
              {STATUS_OPTIONS.map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="leave_status" value={s} checked={form.status === s}
                    onChange={() => setField('status', s)} className="w-4 h-4 text-emerald-500 border-gray-300 focus:ring-emerald-400" />
                  <span className="text-sm text-gray-700">{s}</span>
                </label>
              ))}
            </div>
          </FormField>

        </div>
      </Modal>
    </div>
  )
}
