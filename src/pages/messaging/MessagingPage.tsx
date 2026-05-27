// src/pages/messaging/MessagingPage.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Edit2, Trash2, Send, MessageSquare, Mail, KeyRound,
} from 'lucide-react'
import { messagingApi } from '@/api/messaging'
import { cn } from '@/lib/utils'

type Tab = 'notices' | 'sms' | 'email' | 'credentials'

const ROLES_FULL = [
  'Admin', 'Accountant', 'Doctor', 'Pharmacist', 'Pathologist',
  'Radiologist', 'Super Admin', 'Receptionist', 'Nurse',
]
const ROLES_WITH_PATIENT = ['Patient', ...ROLES_FULL]

const CRED_TYPES = [
  { value: 'login',  label: 'Login Credential' },
  { value: 'forgot', label: 'Forgot Password'  },
  { value: 'both',   label: 'Both'             },
]

export default function MessagingPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('notices')

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Messaging</h1>
          <p className="text-sm text-gray-500 mt-0.5">Notices, SMS, Email and patient credentials</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('notices')}
            className={cn('btn flex items-center gap-1.5', tab === 'notices' ? 'btn-primary' : 'btn-outline')}>
            <Plus size={14}/> Post New Message
          </button>
          <button onClick={() => setTab('sms')}
            className={cn('btn flex items-center gap-1.5', tab === 'sms' ? 'btn-primary' : 'btn-outline')}>
            <MessageSquare size={14}/> Send SMS
          </button>
          <button onClick={() => setTab('email')}
            className={cn('btn flex items-center gap-1.5', tab === 'email' ? 'btn-primary' : 'btn-outline')}>
            <Mail size={14}/> Send Email
          </button>
          <button onClick={() => setTab('credentials')}
            className={cn('btn flex items-center gap-1.5', tab === 'credentials' ? 'btn-primary' : 'btn-outline')}>
            <KeyRound size={14}/> Send Credential
          </button>
        </div>
      </div>

      {tab === 'notices'      && <NoticeBoard onSent={() => qc.invalidateQueries({ queryKey: ['notices'] })} />}
      {tab === 'sms'          && <SendSMSPanel />}
      {tab === 'email'        && <SendEmailPanel />}
      {tab === 'credentials'  && <CredentialPanel />}
    </div>
  )
}


/* ─────────────────────────────────────────────────────────────────
   NOTICE BOARD
───────────────────────────────────────────────────────────────── */
function NoticeBoard({ onSent }: { onSent: () => void }) {
  const qc = useQueryClient()
  const [composing, setComposing] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn:  () => messagingApi.listNotices({ per_page: 200 }).then(r => r.data),
  })
  const notices: any[] = data?.data ?? []

  const delMut = useMutation({
    mutationFn: (id: number) => messagingApi.deleteNotice(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notices'] }),
  })

  if (composing || editing) {
    return (
      <ComposeNotice
        notice={editing}
        onCancel={() => { setComposing(false); setEditing(null) }}
        onDone={() => { setComposing(false); setEditing(null); onSent() }}
      />
    )
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800">Notice Board</h2>
        <button onClick={() => setComposing(true)} className="btn btn-primary flex items-center gap-1.5">
          <Plus size={13}/> Post New Message
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {isLoading ? <div className="px-4 py-8 text-center text-gray-400">Loading…</div>
        : notices.length === 0 ? <div className="px-4 py-8 text-center text-gray-400">No notices</div>
        : notices.map(n => (
          <div key={n.id} className="flex items-start justify-between px-4 py-3 hover:bg-gray-50/50">
            <div className="flex-1 min-w-0">
              <div className="text-teal-700 font-medium">{n.title}</div>
              {n.message && (
                <div className="text-xs text-gray-500 mt-1 line-clamp-2"
                     dangerouslySetInnerHTML={{ __html: n.message }} />
              )}
            </div>
            <div className="flex gap-1 ml-3">
              <button className="icon-btn" onClick={() => setEditing(n)}><Edit2 size={12}/></button>
              <button className="icon-btn text-red-400" onClick={() => confirm(`Delete "${n.title}"?`) && delMut.mutate(n.id)}>
                <Trash2 size={12}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComposeNotice({ notice, onCancel, onDone }: { notice?: any; onCancel: () => void; onDone: () => void }) {
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      title       : notice?.title       ?? '',
      message     : notice?.message     ?? '',
      notice_date : notice?.notice_date ?? new Date().toISOString().slice(0, 10),
      publish_on  : notice?.publish_on  ?? new Date().toISOString().slice(0, 10),
      roles       : (notice?.message_to as string[] | undefined) ?? ['Super Admin'],
    },
  })
  const roles = watch('roles') as string[]
  const toggleRole = (r: string) =>
    setValue('roles', roles.includes(r) ? roles.filter(x => x !== r) : [...roles, r])

  const mut = useMutation({
    mutationFn: (raw: any) => {
      const payload = {
        title       : raw.title,
        message     : raw.message,
        notice_date : raw.notice_date,
        publish_on  : raw.publish_on,
        message_to  : raw.roles,
      }
      return notice
        ? messagingApi.updateNotice(notice.id, payload)
        : messagingApi.postNotice(payload)
    },
    onSuccess: onDone,
  })

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800">Compose New Message</h2>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn btn-outline text-sm">Cancel</button>
          <button form="msg-notice-form" type="submit" className="btn btn-primary text-sm flex items-center gap-1.5" disabled={mut.isPending}>
            <Send size={13}/> {mut.isPending ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
      <form id="msg-notice-form" onSubmit={handleSubmit(d => mut.mutate(d))} className="grid grid-cols-[1fr_280px] gap-6 p-5">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Title<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input className="input" {...register('title', { required: true })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Message<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea className="input min-h-[200px] resize-y" {...register('message', { required: true })} />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Notice Date<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input type="date" className="input" {...register('notice_date', { required: true })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Publish On<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input type="date" className="input" {...register('publish_on', { required: true })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Message To</label>
            <div className="space-y-1.5">
              {ROLES_FULL.map(r => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={roles.includes(r)} onChange={() => toggleRole(r)} />
                  <span className="font-medium text-gray-700">{r}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}


/* ─────────────────────────────────────────────────────────────────
   SEND SMS
───────────────────────────────────────────────────────────────── */
function SendSMSPanel() {
  const [mode, setMode] = useState<'group' | 'individual'>('group')
  return <SendMessagePanel kind="sms" mode={mode} setMode={setMode} />
}


/* ─────────────────────────────────────────────────────────────────
   SEND EMAIL
───────────────────────────────────────────────────────────────── */
function SendEmailPanel() {
  const [mode, setMode] = useState<'group' | 'individual'>('group')
  return <SendMessagePanel kind="email" mode={mode} setMode={setMode} />
}

function SendMessagePanel({ kind, mode, setMode }: { kind: 'sms' | 'email'; mode: 'group' | 'individual'; setMode: (m: 'group' | 'individual') => void }) {
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      title: '', message: '',
      send_sms: false, send_app: false,
      template_id: '',
      roles: [] as string[],
      recipient_kind: 'patient' as 'patient',
      recipient_ids : [] as number[],
    },
  })

  const roles = watch('roles')
  const toggleRole = (r: string) =>
    setValue('roles', roles.includes(r) ? roles.filter(x => x !== r) : [...roles, r])

  const mut = useMutation({
    mutationFn: (raw: any) => {
      if (kind === 'sms') {
        return messagingApi.sendSmsBatch({
          title        : raw.title,
          message      : raw.message,
          template_id  : raw.template_id || undefined,
          send_through : [
            ...(raw.send_sms ? ['SMS'] : []),
            ...(raw.send_app ? ['Mobile App'] : []),
          ],
          roles        : mode === 'group'      ? raw.roles : undefined,
          recipient_ids: mode === 'individual' ? raw.recipient_ids : undefined,
          recipient_kind: mode === 'individual' ? raw.recipient_kind : undefined,
        })
      } else {
        return messagingApi.sendEmailBatch({
          title         : raw.title,
          body          : raw.message,
          roles         : mode === 'group'      ? raw.roles : undefined,
          recipient_ids : mode === 'individual' ? raw.recipient_ids : undefined,
          recipient_kind: mode === 'individual' ? raw.recipient_kind : undefined,
        })
      }
    },
    onSuccess: () => { reset(); alert('Sent successfully.') },
  })

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800">
          {kind === 'sms' ? 'Send SMS' : 'Send Email'}
        </h2>
        <div className="flex gap-2 text-sm">
          <button onClick={() => setMode('group')}
            className={cn('px-3 py-1 border-b-2', mode === 'group' ? 'border-teal-500 text-teal-700 font-medium' : 'border-transparent text-gray-400')}>
            Group
          </button>
          <button onClick={() => setMode('individual')}
            className={cn('px-3 py-1 border-b-2', mode === 'individual' ? 'border-teal-500 text-teal-700 font-medium' : 'border-transparent text-gray-400')}>
            Individual
          </button>
        </div>
      </div>
      <form id={`msg-${kind}-form`} onSubmit={handleSubmit(d => mut.mutate(d))} className="grid grid-cols-[1fr_320px] gap-6 p-5">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Title<span className="text-red-500 ml-0.5">*</span>
            </label>
            <input className="input" {...register('title', { required: true })} />
          </div>

          {kind === 'sms' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Template Id
                  <span className="text-xs text-rose-500 ml-2">(only for Indian SMS Gateway)</span>
                </label>
                <input className="input" {...register('template_id')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Send Through<span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('send_sms')} /> SMS
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" {...register('send_app')} /> Mobile App
                  </label>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Message<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea className="input min-h-[220px] resize-y" {...register('message', { required: true })} />
            <div className="text-right text-[10px] text-gray-400 mt-1">
              Character Count: {(watch('message') || '').length}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">
            Message To<span className="text-red-500 ml-0.5">*</span>
          </label>
          {mode === 'group' ? (
            <div className="bg-gray-50 p-3 rounded space-y-1.5">
              {ROLES_WITH_PATIENT.map(r => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={roles.includes(r)} onChange={() => toggleRole(r)} />
                  <span className="font-medium text-gray-700">{r}</span>
                </label>
              ))}
            </div>
          ) : (
            <IndividualRecipients
              kind={kind}
              setValue={(ids) => setValue('recipient_ids', ids)}
            />
          )}

          <div className="mt-4 flex justify-end">
            <button type="submit" className="btn btn-primary flex items-center gap-1.5" disabled={mut.isPending}>
              <Send size={13}/> {mut.isPending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function IndividualRecipients({ kind, setValue }: { kind: 'sms' | 'email'; setValue: (ids: number[]) => void }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<number[]>([])

  const { data } = useQuery({
    queryKey: ['msg-patients', search],
    queryFn:  () => messagingApi.listPatientCredentials({ search }).then(r => r.data),
  })
  const patients: any[] = data?.data ?? []

  const toggle = (id: number) => {
    const next = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]
    setSelected(next); setValue(next)
  }

  return (
    <div className="bg-gray-50 p-3 rounded space-y-2 max-h-[280px] overflow-y-auto">
      <input className="input h-8 text-sm" placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} />
      {patients.length === 0
        ? <div className="text-xs text-gray-400 text-center py-4">No patients</div>
        : patients.map(p => (
          <label key={p.id} className="flex items-center gap-2 text-xs bg-white px-2 py-1 rounded">
            <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
            <span className="font-medium">{p.name}</span>
            <span className="text-gray-400 ml-auto">
              {kind === 'sms' ? p.phone : p.email}
            </span>
          </label>
        ))}
    </div>
  )
}


/* ─────────────────────────────────────────────────────────────────
   SEND PATIENT CREDENTIAL
───────────────────────────────────────────────────────────────── */
function CredentialPanel() {
  const [credType, setCredType] = useState<'login' | 'forgot' | 'both'>('login')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState<number[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['credential-patients', search],
    queryFn:  () => messagingApi.listPatientCredentials({ search }).then(r => r.data),
  })
  const patients: any[] = data?.data ?? []

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? patients.map(p => p.id) : [])

  const toggleOne = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const mut = useMutation({
    mutationFn: () => messagingApi.sendCredentials({
      patient_ids     : selected,
      credential_type : credType,
      send_sms        : true,
      send_email      : true,
    }),
    onSuccess: (res) => {
      const d = res.data?.data
      alert(`Sent credentials — ${d?.sms_sent ?? 0} SMS · ${d?.email_sent ?? 0} email · ${d?.patients ?? 0} patient(s)`)
      setSelected([])
    },
  })

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800">Send Patient Credential</h2>
        <button onClick={() => mut.mutate()} className="btn btn-primary flex items-center gap-1.5" disabled={mut.isPending || selected.length === 0}>
          <Send size={13}/>{mut.isPending ? 'Sending…' : `Send (${selected.length})`}
        </button>
      </div>
      <div className="p-4 grid grid-cols-[160px_1fr] gap-4 items-end border-b border-gray-100">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Select All</label>
          <input type="checkbox"
                 checked={selected.length === patients.length && patients.length > 0}
                 onChange={e => toggleAll(e.target.checked)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Credential Type<span className="text-red-500 ml-0.5">*</span>
          </label>
          <select className="input max-w-md" value={credType} onChange={e => setCredType(e.target.value as any)}>
            {CRED_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <div className="px-4 py-2 border-b border-gray-100">
        <input className="input h-9 text-sm max-w-xs" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 w-10"></th>
              {['#','Patient Id','Patient Name','Email','Mobile Number','Username','Password'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            : patients.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No patients</td></tr>
            : patients.map((p, i) => (
              <tr key={p.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleOne(p.id)} />
                </td>
                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                <td className="px-4 py-3">{p.patient_id}</td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-teal-600">{p.email || ''}</td>
                <td className="px-4 py-3 text-gray-500">{p.phone || ''}</td>
                <td className="px-4 py-3 text-teal-600 font-mono">{p.username}</td>
                <td className="px-4 py-3 text-gray-500 text-right font-mono">{p.password}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

