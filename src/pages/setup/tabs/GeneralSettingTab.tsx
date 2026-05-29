// src/pages/setup/tabs/GeneralSettingTab.tsx
import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { setupApi } from '@/api/setup'
import api from '@/lib/axios'

function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  const base = (api.defaults?.baseURL || '').replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '')
  return `${base}/${path.replace(/\\/g, '/').replace(/^\/+/, '')}`
}

const TIMEZONES = [
  'Asia/Kolkata','Asia/Dubai','Asia/Singapore','Europe/London','Europe/Berlin',
  'America/New_York','America/Los_Angeles','UTC',
]

const CURRENCIES = ['INR','USD','EUR','GBP','AED','SGD','AUD']

const THEMES = ['default','red','blue','gray']


function LogoField({
  label, value, onChange, uploadLabel,
}: { label: string; value: string | null; onChange: (path: string | null) => void; uploadLabel: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const upload = useMutation({
    mutationFn: async (f: File) => {
      const fd = new FormData(); fd.append('file', f)
      const r = await setupApi.uploadLogo(fd, uploadLabel)
      return r.data?.data?.path as string
    },
    onSuccess: (p) => onChange(p),
  })
  return (
    <div className="flex items-center gap-3">
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
             onChange={e => { const f = e.target.files?.[0]; if (f) upload.mutate(f) }}/>
      <div className="w-32 h-16 border rounded bg-gray-50 flex items-center justify-center overflow-hidden">
        {value
          ? <img src={assetUrl(value) ?? ''} alt={label} className="max-h-full max-w-full object-contain"/>
          : <span className="text-[10px] text-gray-400">No image</span>}
      </div>
      <button type="button" onClick={() => fileRef.current?.click()}
              className="btn btn-primary text-xs">
        {upload.isPending ? 'Uploading…' : value ? 'Change' : 'Upload'} {label}
      </button>
    </div>
  )
}


export default function GeneralSettingTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['setup-general'],
    queryFn: () => setupApi.getGeneral().then(r => r.data),
  })
  const setting = data?.data ?? {}

  const [form, setForm] = useState<any>({})

  useEffect(() => {
    if (setting && Object.keys(setting).length) setForm({ ...setting })
  }, [setting])

  const save = useMutation({
    mutationFn: (payload: any) => setupApi.updateGeneral(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['setup-general'] }),
  })

  if (isLoading) return <div className="p-6 text-gray-400">Loading…</div>

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // strip out non-mutable fields
    const { id, created_at, updated_at, ...payload } = form
    save.mutate(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-base font-semibold text-gray-800 border-b pb-2">General Setting</h2>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Hospital Name" required>
          <input required value={form.hospital_name ?? ''} onChange={e => set('hospital_name', e.target.value)} className="input w-full"/>
        </Field>
        <Field label="Hospital Code">
          <input value={form.hospital_code ?? ''} onChange={e => set('hospital_code', e.target.value)} className="input w-full"/>
        </Field>
        <Field label="Address" required>
          <input required value={form.address ?? ''} onChange={e => set('address', e.target.value)} className="input w-full"/>
        </Field>
        <Field label="Phone" required>
          <input required value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} className="input w-full"/>
        </Field>
        <Field label="Email" required>
          <input required type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} className="input w-full"/>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
        <Field label="Hospital Logo" required>
          <LogoField label="Logo" uploadLabel="hospital_logo"
            value={form.hospital_logo}
            onChange={p => set('hospital_logo', p)}/>
        </Field>
        <Field label="Hospital Small Logo" required>
          <LogoField label="Small Logo" uploadLabel="hospital_small_logo"
            value={form.hospital_small_logo}
            onChange={p => set('hospital_small_logo', p)}/>
        </Field>
      </div>

      <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Language</h3>
      <Field label="Language" required>
        <input value={form.language ?? ''} onChange={e => set('language', e.target.value)} className="input w-full"/>
      </Field>

      <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Date Time</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date Format" required>
          <select value={form.date_format ?? ''} onChange={e => set('date_format', e.target.value)} className="input w-full">
            <option value="dd-mm-yyyy">dd-mm-yyyy</option>
            <option value="mm/dd/yyyy">mm/dd/yyyy</option>
            <option value="yyyy-mm-dd">yyyy-mm-dd</option>
          </select>
        </Field>
        <Field label="Time Zone" required>
          <select value={form.timezone ?? ''} onChange={e => set('timezone', e.target.value)} className="input w-full">
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </Field>
      </div>

      <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Currency</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Currency" required>
          <select value={form.currency ?? ''} onChange={e => set('currency', e.target.value)} className="input w-full">
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Currency Symbol">
          <input value={form.currency_symbol ?? ''} onChange={e => set('currency_symbol', e.target.value)} className="input w-full"/>
        </Field>
        <Field label="Credit Limit" required>
          <input type="number" step="0.01" value={form.credit_limit ?? 0} onChange={e => set('credit_limit', Number(e.target.value))} className="input w-full"/>
        </Field>
        <Field label="Time Format">
          <select value={form.time_format ?? '12'} onChange={e => set('time_format', e.target.value)} className="input w-full">
            <option value="12">12 Hour</option>
            <option value="24">24 Hour</option>
          </select>
        </Field>
      </div>

      <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Mobile App</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Mobile App API URL">
          <input value={form.mobile_api_url ?? ''} onChange={e => set('mobile_api_url', e.target.value)} className="input w-full"/>
        </Field>
        <div/>
        <Field label="Primary Color">
          <input type="color" value={form.mobile_app_primary_color || '#424242'} onChange={e => set('mobile_app_primary_color', e.target.value)} className="h-9 w-16 border rounded"/>
        </Field>
        <Field label="Secondary Color">
          <input type="color" value={form.mobile_app_secondary_color || '#eeeeee'} onChange={e => set('mobile_app_secondary_color', e.target.value)} className="h-9 w-16 border rounded"/>
        </Field>
        <Field label="Mobile App Logo">
          <LogoField label="App Logo" uploadLabel="mobile_app_logo"
            value={form.mobile_app_logo}
            onChange={p => set('mobile_app_logo', p)}/>
        </Field>
      </div>

      <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Miscellaneous</h3>
      <div className="grid grid-cols-2 gap-4">
        <RadioPair label="Doctor Restriction Mode" value={!!form.doctor_restriction_mode}
          onChange={v => set('doctor_restriction_mode', v)}/>
        <RadioPair label="Superadmin Visibility" value={!!form.superadmin_visibility}
          onChange={v => set('superadmin_visibility', v)}/>
        <RadioPair label="Patient Panel" value={!!form.patient_panel}
          onChange={v => set('patient_panel', v)}/>
        <Field label="Scan Type">
          <div className="flex gap-4 text-sm">
            <label><input type="radio" name="scan_type" value="Barcode" checked={form.scan_type === 'Barcode'} onChange={() => set('scan_type', 'Barcode')}/> Barcode</label>
            <label><input type="radio" name="scan_type" value="QR Code" checked={form.scan_type === 'QR Code'} onChange={() => set('scan_type', 'QR Code')}/> QR Code</label>
          </div>
        </Field>
      </div>

      <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">File Upload Path</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Base URL" required>
          <input value={form.base_url ?? ''} onChange={e => set('base_url', e.target.value)} className="input w-full"/>
        </Field>
        <Field label="File Upload Path" required>
          <input value={form.file_upload_path ?? ''} onChange={e => set('file_upload_path', e.target.value)} className="input w-full"/>
        </Field>
      </div>

      <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Current Theme</h3>
      <div className="grid grid-cols-4 gap-3">
        {THEMES.map(t => (
          <button type="button" key={t}
            onClick={() => set('theme', t)}
            className={'border rounded p-4 text-sm capitalize ' + (form.theme === t ? 'bg-emerald-50 border-emerald-400' : 'hover:bg-gray-50')}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex justify-end pt-3 border-t">
        <button type="submit" disabled={save.isPending} className="btn btn-primary">
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, required, children }: any) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function RadioPair({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Field label={label}>
      <div className="flex gap-4 text-sm">
        <label><input type="radio" checked={!value} onChange={() => onChange(false)}/> Disabled</label>
        <label><input type="radio" checked={value} onChange={() => onChange(true)}/> Enabled</label>
      </div>
    </Field>
  )
}
