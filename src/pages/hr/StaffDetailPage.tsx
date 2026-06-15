// src/pages/hr/StaffDetailPage.tsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Lock, User } from 'lucide-react'
import { hrApi } from '@/api/hr'
import { useAuthStore } from '@/store/authStore'
import { cn, fmtDate } from '@/lib/utils'

type TabKey = 'profile' | 'leaves' | 'documents' | 'timeline'

const TABS: { id: TabKey; label: string }[] = [
  { id: 'profile',   label: 'Profile'   },
  { id: 'leaves',    label: 'Leaves'    },
  { id: 'documents', label: 'Documents' },
  { id: 'timeline',  label: 'Timeline'  },
]

export default function StaffDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const nav     = useNavigate()
  const sid     = Number(id)
  const user    = useAuthStore(st => st.user)
  const role    = user?.role
  const [tab, setTab] = useState<TabKey>('profile')

  const { data: staffData, isLoading } = useQuery({
    queryKey: ['staff', sid],
    queryFn:  () => hrApi.getStaff(sid).then(r => r.data),
    enabled:  !!sid,
  })
  const s = staffData?.data ?? null

  // Doctors (and other clinical-leave-only roles) can only see their own profile.
  const canManageHR = !['pathologist', 'radiologist', 'pharmacist', 'doctor', 'nurse'].includes(role ?? '')
  const isSelf = s && Number(s.staff_code) === Number(user?.staff_code)
  const isBlocked = !canManageHR && !!s && !isSelf

  const { data: leavesData } = useQuery({
    queryKey: ['staff-leaves', sid],
    queryFn:  () => hrApi.listLeaves().then(r => r.data),
    enabled:  !!sid && tab === 'leaves',
  })
  const myLeaves = ((leavesData?.data ?? []) as any[]).filter((l: any) => l.staff_id === sid)

  if (isLoading) return <div className="p-8 text-center text-gray-400">Loading staff…</div>
  if (!s) return (
    <div className="p-8 text-center">
      <p className="text-rose-500 mb-3">Staff not found</p>
      <button onClick={() => nav(-1)} className="btn btn-outline">Back</button>
    </div>
  )
  if (isBlocked) return (
    <div className="p-12 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
        <Lock size={22}/>
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Profile is private</h2>
      <p className="text-sm text-gray-500 mb-4">
        You can only view your own staff profile.
      </p>
      <button onClick={() => nav('/hr')} className="btn btn-outline">Back to Staff Directory</button>
    </div>
  )

  const fullName = [s.first_name, s.last_name].filter(Boolean).join(' ') || s.full_name || `Staff #${s.id}`
  const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${s.staff_code}&code=Code128&dpi=96&imagetype=Png`
  const qrUrl      = `https://api.qrserver.com/v1/create-qr-code/?data=${s.staff_code}&size=80x80&margin=0`

  return (
    <div className="p-6 space-y-4">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => nav(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-700">
          <ArrowLeft size={14}/> Back to Staff Directory
        </button>
      </div>

      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-start gap-5">
          {s.photo_path
            ? <img src={s.photo_path} alt={fullName} className="w-20 h-20 rounded-full object-cover border"/>
            : <div className="w-20 h-20 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-semibold">
                {fullName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>}

          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">{fullName}</h1>
          </div>

          <div className="grid grid-cols-5 gap-6 text-sm">
            <Stat label="Staff ID"    v={s.staff_code}/>
            <Stat label="Role"        v={s.role}      cap/>
            <Stat label="Designation" v={s.designation}/>
            <div>
              <div className="text-xs font-semibold text-gray-700">Barcode</div>
              <img src={barcodeUrl} alt="barcode" className="h-9 mt-1"/>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-700">QR Code</div>
              <img src={qrUrl} alt="qr" className="h-16 w-16 mt-1"/>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-x-6 gap-y-4 mt-5 pt-5 border-t border-gray-100 text-sm">
          <Stat label="Department"    v={s.department}/>
          <Stat label="Specialist"    v={s.specialization}/>
          <Stat label="EPF No"        v={s.epf_no}/>
          <Stat label="Basic Salary"  v={s.basic_salary ? `${Number(s.basic_salary).toLocaleString()}` : ''}/>
          <Stat label="Contract Type" v={s.contract_type}/>
          <Stat label="Work Shift"    v={s.work_shift}/>
          <Stat label="Work Location" v={s.work_location}/>
          <Stat label="Date Of Joining" v={s.date_of_joining ? fmtDate(s.date_of_joining) : ''}/>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="flex border-b border-gray-200 px-4">
          {TABS.map(t => {
            const active = t.id === tab
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn(
                  'px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px',
                  active
                    ? 'border-[#47C0BD] text-[#47C0BD]'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                )}>
                {t.label}
              </button>
            )
          })}
        </div>

        <div className="p-5">
          {tab === 'profile'   && <ProfileTab s={s}/>}
          {tab === 'leaves'    && <LeavesTab rows={myLeaves}/>}
          {tab === 'documents' && <PlaceholderTab title="Documents"/>}
          {tab === 'timeline'  && <PlaceholderTab title="Timeline"/>}
        </div>
      </div>
    </div>
  )
}

function ProfileTab({ s }: { s: any }) {
  return (
    <div className="space-y-6">
      {/* Basic info table */}
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-100">
          <Row label="Phone"                       v={s.phone}/>
          <Row label="Emergency Contact Number"    v={s.emergency_contact}/>
          <Row label="Email"                       v={s.email}/>
          <Row label="Gender"                      v={s.gender}/>
          <Row label="Blood Group"                 v={s.blood_group}/>
          <Row label="Date Of Birth"               v={s.date_of_birth ? fmtDate(s.date_of_birth) : ''}/>
          <Row label="Marital Status"              v={s.marital_status}/>
          <Row label="Father Name"                 v={s.father_name}/>
          <Row label="Mother Name"                 v={s.mother_name}/>
          <Row label="Qualification"               v={s.qualification}/>
          <Row label="Work Experience"             v={s.work_experience}/>
          <Row label="Specialization"              v={s.specialization}/>
          <Row label="Note"                        v={s.note}/>
          <Row label="Pan Number"                  v={s.pan_no}/>
          <Row label="National Identification Number" v={s.national_id}/>
          <Row label="Local Identification Number" v={s.local_id}/>
          <Row label="Reference Contact"           v={s.reference_contact}/>
        </tbody>
      </table>

      {/* Address */}
      <Section title="Address">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            <Row label="Current Address"   v={s.current_address}/>
            <Row label="Permanent Address" v={s.permanent_address}/>
          </tbody>
        </table>
      </Section>

      {/* Bank */}
      <Section title="Bank Account Details">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            <Row label="Account Title"     v={s.bank_account_title || ([s.first_name, s.last_name].filter(Boolean).join(' '))}/>
            <Row label="Bank Name"         v={s.bank_name}/>
            <Row label="Bank Branch Name"  v={s.bank_branch}/>
            <Row label="Bank Account Number" v={s.bank_account_no}/>
            <Row label="IFSC Code"         v={s.ifsc_code}/>
          </tbody>
        </table>
      </Section>

      {/* Social */}
      <Section title="Social Media Link">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            <Row label="Facebook URL"  v={s.facebook_url}  link/>
            <Row label="Twitter URL"   v={s.twitter_url}   link/>
            <Row label="Linkedin URL"  v={s.linkedin_url}  link/>
            <Row label="Instagram URL" v={s.instagram_url} link/>
          </tbody>
        </table>
      </Section>
    </div>
  )
}

function LeavesTab({ rows }: { rows: any[] }) {
  return (
    <div className="border border-gray-200 rounded overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['Leave Type', 'From', 'To', 'Days', 'Applied On', 'Status'].map(h => (
              <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-700">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0
            ? <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No leave records</td></tr>
            : rows.map((l: any) => (
              <tr key={l.id}>
                <td className="px-4 py-2 text-gray-700">{l.leave_type_rel?.name || l.leave_type || '—'}</td>
                <td className="px-4 py-2 text-gray-700">{fmtDate(l.from_date)}</td>
                <td className="px-4 py-2 text-gray-700">{fmtDate(l.to_date)}</td>
                <td className="px-4 py-2 text-gray-700">{l.days}</td>
                <td className="px-4 py-2 text-gray-700">{fmtDate(l.apply_date)}</td>
                <td className="px-4 py-2">
                  <span className={cn('badge', l.status === 'Approved' ? 'badge-green' : l.status === 'Pending' ? 'badge-amber' : 'badge-red')}>
                    {l.status}
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="text-center py-12 text-sm text-gray-400">
      <User size={32} className="mx-auto mb-2 text-gray-300"/>
      No {title.toLowerCase()} on record yet.
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-t text-sm font-semibold text-gray-800">{title}</div>
      <div className="border border-t-0 border-gray-200 rounded-b">{children}</div>
    </div>
  )
}

function Stat({ label, v, cap }: { label: string; v?: any; cap?: boolean }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-700">{label}</div>
      <div className={cn('text-sm text-gray-600 mt-1', cap && 'capitalize')}>{v || '—'}</div>
    </div>
  )
}

function Row({ label, v, link }: { label: string; v?: any; link?: boolean }) {
  return (
    <tr>
      <td className="px-4 py-2 text-gray-700 w-1/3">{label}</td>
      <td className="px-4 py-2 text-gray-800">
        {!v ? <span className="text-gray-300">—</span>
          : link
            ? <a href={String(v)} target="_blank" rel="noreferrer" className="text-[#47C0BD] hover:underline">{v}</a>
            : v}
      </td>
    </tr>
  )
}
